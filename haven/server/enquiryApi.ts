import fs from "node:fs";
import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";
import { enquirySchema } from "../src/lib/enquirySchema";

const DATA_FILE = path.resolve(process.cwd(), "data", "enquiries.json");

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 64_000) reject(new Error("Body too large"));
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function send(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

export async function handleEnquiry(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "POST") return send(res, 405, { ok: false, error: "Method not allowed" });
  let json: unknown;
  try {
    json = JSON.parse(await readBody(req));
  } catch {
    return send(res, 400, { ok: false, error: "Invalid JSON" });
  }
  const parsed = enquirySchema.safeParse(json);
  if (!parsed.success) {
    return send(res, 422, { ok: false, error: "Validation failed", issues: parsed.error.flatten().fieldErrors });
  }
  const { website, ...data } = parsed.data;
  // Honeypot filled: pretend success, store nothing.
  if (website) return send(res, 200, { ok: true });

  const record = {
    name: data.name,
    email: data.email,
    phone: data.phone || null,
    preferredTime: data.preferredTime,
    message: data.message || null,
    createdAt: new Date().toISOString(),
  };
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  const existing: unknown[] = fs.existsSync(DATA_FILE) ? JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) : [];
  existing.push(record);
  fs.writeFileSync(DATA_FILE, JSON.stringify(existing, null, 2));
  return send(res, 200, { ok: true });
}

/** Dev-only: lets the /studio route write rendered stills of the model into public/images. */
async function handleSaveRender(req: IncomingMessage, res: ServerResponse) {
  const { name, dataUrl } = JSON.parse(await readBody2(req));
  if (!/^[a-z0-9-]+$/.test(name)) return send(res, 400, { ok: false });
  const b64 = String(dataUrl).split(",")[1];
  const out = path.resolve(process.cwd(), "public", "images", `${name}.webp`);
  fs.writeFileSync(out, Buffer.from(b64, "base64"));
  return send(res, 200, { ok: true, bytes: fs.statSync(out).size });
}

function readRaw(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

const readBody2 = async (req: IncomingMessage) => (await readRaw(req)).toString("utf8");

/** Dev-only: lets the /studio route hand the model, cameras and lamps to the Blender scripts in blender/. */
async function handleSaveFile(req: IncomingMessage, res: ServerResponse) {
  const name = new URL(req.url ?? "", "http://x").searchParams.get("name") ?? "";
  if (!/^[a-z0-9-]+\.(glb|json)$/.test(name)) return send(res, 400, { ok: false });
  const dir = path.resolve(process.cwd(), "blender", "export");
  fs.mkdirSync(dir, { recursive: true });
  const out = path.join(dir, name);
  fs.writeFileSync(out, await readRaw(req));
  return send(res, 200, { ok: true, bytes: fs.statSync(out).size });
}

export function enquiryApiPlugin(): Plugin {
  return {
    name: "haven-enquiry-api",
    configureServer(server) {
      server.middlewares.use("/api/enquiry", (req, res) => void handleEnquiry(req, res));
      server.middlewares.use("/api/__save-render", (req, res) => void handleSaveRender(req, res));
      server.middlewares.use("/api/__save-file", (req, res) => void handleSaveFile(req, res));
    },
    configurePreviewServer(server) {
      server.middlewares.use("/api/enquiry", (req, res) => void handleEnquiry(req, res));
    },
  };
}
