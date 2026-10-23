import type { IncomingMessage, ServerResponse } from "node:http";
import { handleEnquiry } from "../server/enquiryApi";

/** Vercel function for the enquiry form; the dev and preview servers use the same handler via the Vite plugin. */
export default function handler(req: IncomingMessage & { body?: unknown }, res: ServerResponse) {
  return handleEnquiry(req, res, req.body);
}
