import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2 } from "lucide-react";
import { PREFERRED_TIMES, enquirySchema, type EnquiryInput } from "../../lib/enquirySchema";
import styles from "./Enquiry.module.css";

const STEPS = [
  { n: "01", t: "We read every request ourselves", d: "No call centre, no automated follow-ups." },
  { n: "02", t: "A personal reply within one working day", d: "By email, or by phone if you prefer." },
  { n: "03", t: "A private walk-through, at your pace", d: "In person, or together inside the 3D model." },
];

export function Enquiry() {
  const [status, setStatus] = useState<"idle" | "done" | "error">("idle");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EnquiryInput>({
    resolver: zodResolver(enquirySchema),
    defaultValues: { preferredTime: "I'm flexible", name: "", email: "", phone: "", message: "", website: "" },
  });

  const onSubmit = async (data: EnquiryInput) => {
    setStatus("idle");
    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) throw new Error(json.error || "Request failed");
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  const err = (name: keyof EnquiryInput) =>
    errors[name] ? (
      <p id={`${name}-error`} className={styles.error} role="alert">{errors[name]?.message as string}</p>
    ) : null;
  const a11y = (name: keyof EnquiryInput) => ({
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
  });

  return (
    <section id="enquire" className={styles.section} aria-labelledby="enquire-title">
      <div className={styles.grid}>
        <div className={`${styles.intro} reveal`}>
          <p className="eyebrow">Viewing enquiry</p>
          <h2 id="enquire-title" className={styles.title}>Arrange a private viewing.</h2>
          <p className={styles.sub}>Leave your details and a preferred time. Requests are stored securely and answered personally.</p>
          <ol className={styles.steps}>
            {STEPS.map((s) => (
              <li key={s.n}>
                <span className="mono">{s.n}</span>
                <div>
                  <strong>{s.t}</strong>
                  <p>{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className={`${styles.card} reveal`}>
          {status === "done" ? (
            <div className={styles.success} role="status">
              <span className={styles.tick}><Check size={22} strokeWidth={1.6} /></span>
              <h3>Thank you — we&rsquo;ll be in touch personally within one working day.</h3>
              <p>Your request has been received. In the meantime, you are welcome to walk the house in 3D.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className={styles.form}>
              <div className={styles.row2}>
                <div className={styles.field}>
                  <label htmlFor="name">Full name <span aria-hidden="true">*</span></label>
                  <input id="name" autoComplete="name" {...register("name")} {...a11y("name")} />
                  {err("name")}
                </div>
                <div className={styles.field}>
                  <label htmlFor="email">Email <span aria-hidden="true">*</span></label>
                  <input id="email" type="email" autoComplete="email" {...register("email")} {...a11y("email")} />
                  {err("email")}
                </div>
              </div>
              <div className={styles.row2}>
                <div className={styles.field}>
                  <label htmlFor="phone">Phone <span className={styles.opt}>(optional)</span></label>
                  <input id="phone" type="tel" autoComplete="tel" {...register("phone")} {...a11y("phone")} />
                  {err("phone")}
                </div>
                <div className={styles.field}>
                  <label htmlFor="preferredTime">Preferred time</label>
                  <select id="preferredTime" {...register("preferredTime")}>
                    {PREFERRED_TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className={styles.field}>
                <label htmlFor="message">Message <span className={styles.opt}>(optional)</span></label>
                <textarea id="message" rows={4} {...register("message")} {...a11y("message")} />
                {err("message")}
              </div>
              <div className={styles.honeypot} aria-hidden="true">
                <label htmlFor="website">Website</label>
                <input id="website" tabIndex={-1} autoComplete="off" {...register("website")} />
              </div>
              <div className={styles.actions}>
                <button type="submit" className={styles.submit} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 size={16} className={styles.spin} aria-hidden="true" />}
                  {isSubmitting ? "Sending…" : "Request a viewing"}
                </button>
                <p className={styles.fine}>Fields marked * are required.</p>
              </div>
              {status === "error" && (
                <p className={styles.error} role="alert">Something went wrong sending your request. Please try again.</p>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
