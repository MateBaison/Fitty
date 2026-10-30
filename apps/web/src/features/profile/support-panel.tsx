"use client";

import { useEffect, useRef, useState } from "react";
import { CircleCheck, Headset, Paperclip, X } from "lucide-react";
import { AppDialog } from "@/components/ui/app-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MAX_SUPPORT_BYTES, validSupportFile } from "@/lib/support/validation";
import { translate } from "@fitty/core/data/translations";

export function SupportPanel({ language = "es" }: { language?: string }) {
  const t = (es: string, en: string) => translate(language, es, en);
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState(false);
  const successClose = useRef<HTMLButtonElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const requestId = useRef<string | undefined>(undefined);
  const inFlight = useRef(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [sent, setSent] = useState(false);
  useEffect(() => {
    requestId.current = undefined;
  }, [category, subject, message, files]);
  useEffect(() => {
    if (sent && open) successClose.current?.focus();
  }, [sent, open]);
  const submit = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setFeedback("");
    setSent(false);
    requestId.current ??= crypto.randomUUID();
    const form = new FormData();
    form.set("requestId", requestId.current);
    form.set("category", category);
    form.set("subject", subject);
    form.set("message", message);
    for (const file of files) form.append("files", file);
    try {
      const response = await fetch("/api/support", {
        method: "POST",
        body: form,
      });
      const data = (await response.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
      } | null;
      if (response.ok && data?.ok === true) {
        setCategory("");
        setSubject("");
        setMessage("");
        setFiles([]);
        requestId.current = undefined;
        setSent(true);
        setFeedback(
          t(
            "Consulta enviada. Te responderemos por correo.",
            "Inquiry sent. We will reply by email.",
          ),
        );
      } else {
        setFeedback(
          response.status === 429
            ? t(
                "Esperá unos minutos antes de enviar otra consulta.",
                "Wait a few minutes before sending another inquiry.",
              )
            : response.status === 401
              ? t(
                  "Volvé a iniciar sesión para enviar la consulta.",
                  "Sign in again to send your inquiry.",
                )
              : t(
                  "No se pudo confirmar el envío. Conservamos tu borrador para que reintentes.",
                  "We could not confirm delivery. Your draft is preserved so you can retry.",
                ),
        );
      }
    } catch {
      setFeedback(
        t(
          "No se pudo confirmar el envío. Conservamos tu borrador para que reintentes.",
          "We could not confirm delivery. Your draft is preserved so you can retry.",
        ),
      );
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  return (
    <>
      <Button
        variant="secondary"
        size="icon-xl"
        aria-label={t("Soporte", "Support")}
        onClick={() => {
          setSent(false);
          setFeedback("");
          setOpen(true);
        }}
      >
        <Headset aria-hidden="true" />
      </Button>
      <AppDialog
        open={open}
        onClose={() => {
          if (!busy) setOpen(false);
        }}
        disablePointerDismissal={sent || busy}
        overlayClassName={
          sent
            ? "bg-black/30 backdrop-blur-md supports-backdrop-filter:backdrop-blur-md"
            : undefined
        }
        title={
          sent ? t("Consulta enviada", "Inquiry sent") : t("Soporte", "Support")
        }
        description={
          sent
            ? t("Te responderemos por correo.", "We will reply by email.")
            : t("Contanos cómo podemos ayudarte.", "Tell us how we can help.")
        }
      >
        {sent ? (
          <div className="flex flex-col items-center gap-6 py-4">
            <CircleCheck aria-hidden="true" className="size-16 text-primary" />
            <Button
              ref={successClose}
              className="w-full"
              onClick={() => setOpen(false)}
            >
              {t("Cerrar", "Close")}
            </Button>
          </div>
        ) : (
          <form
            className="flex max-h-[70dvh] flex-col gap-4 overflow-y-auto"
            onChange={() => {
              setFeedback("");
              setSent(false);
            }}
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
          >
            <fieldset disabled={busy} className="flex min-w-0 flex-col gap-4">
              <p role="status" className="text-sm text-muted-foreground">
                {t(
                  "Tu consulta, adjuntos y correo de cuenta se enviarán a soporte@fitty.uy a través de Resend. Te responderemos por correo.",
                  "Your inquiry, attachments and account email will be sent to soporte@fitty.uy through Resend. We will reply by email.",
                )}
              </p>
              <label className="flex flex-col gap-2" htmlFor="support-category">
                {t("Tipo de consulta", "Inquiry type")}
                <select
                  id="support-category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  required
                >
                  <option value="">
                    {t("Seleccioná una opción", "Select an option")}
                  </option>
                  <option value="account">
                    {t("Cuenta y acceso", "Account and sign-in")}
                  </option>
                  <option value="technical">
                    {t("Problema técnico", "Technical issue")}
                  </option>
                  <option value="exercises">
                    {t("Ejercicios y rutinas", "Exercises and routines")}
                  </option>
                  <option value="suggestion">
                    {t("Sugerencia", "Suggestion")}
                  </option>
                  <option value="privacy">
                    {t("Privacidad y datos", "Privacy and data")}
                  </option>
                  <option value="other">
                    {t("Otra consulta", "Other inquiry")}
                  </option>
                </select>
              </label>
              <label className="flex flex-col gap-2" htmlFor="support-subject">
                {t("Título", "Subject")}
                <Input
                  id="support-subject"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  maxLength={150}
                  required
                />
              </label>
              <label className="flex flex-col gap-2" htmlFor="support-message">
                {t("Mensaje", "Message")}
                <textarea
                  id="support-message"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={5}
                  maxLength={5000}
                  required
                />
              </label>
              <div className="flex flex-col gap-2">
                <label htmlFor="support-files">
                  {t("Archivos adjuntos (opcional)", "Attachments (optional)")}
                </label>
                <p
                  id="support-file-help"
                  className="text-sm text-muted-foreground"
                >
                  {t(
                    "Hasta 5 archivos y 3 MB en total: imágenes, PDF, TXT o videos MP4, WebM y MOV.",
                    "Up to 5 files and 3 MB total: images, PDF, TXT or MP4, WebM and MOV videos.",
                  )}
                </p>
                <input
                  ref={fileInput}
                  id="support-files"
                  type="file"
                  multiple
                  accept=".png,.jpg,.jpeg,.webp,.heic,.heif,.pdf,.txt,.mp4,.webm,.mov"
                  className="sr-only"
                  aria-describedby="support-file-help"
                  onChange={(event) => {
                    const next = [
                      ...files,
                      ...Array.from(event.target.files ?? []),
                    ];
                    if (
                      next.length > 5 ||
                      next.reduce((sum, file) => sum + file.size, 0) >
                        MAX_SUPPORT_BYTES ||
                      next.some((file) => !validSupportFile(file))
                    )
                      setError(true);
                    else {
                      setFiles(next);
                      setError(false);
                    }
                    event.target.value = "";
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => fileInput.current?.click()}
                >
                  <Paperclip aria-hidden="true" data-icon="inline-start" />
                  {t("Agregar archivos", "Add files")}
                </Button>
                {error && (
                  <p role="alert">
                    {t(
                      "Revisá el formato, la cantidad y el tamaño de los archivos.",
                      "Check the file format, count and size.",
                    )}
                  </p>
                )}
                {files.length > 0 && (
                  <ul className="flex flex-col gap-2">
                    {files.map((file, index) => (
                      <li
                        key={`${file.name}-${file.lastModified}-${index}`}
                        className="flex items-center justify-between gap-2"
                      >
                        <span className="min-w-0 truncate">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          aria-label={`${t("Quitar archivo", "Remove file")}: ${file.name}`}
                          onClick={() => {
                            setFiles(
                              files.filter((_, position) => position !== index),
                            );
                            setError(false);
                          }}
                        >
                          <X aria-hidden="true" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {t(
                  "El borrador se conserva mientras permanezcas en esta página. No compartas contraseñas.",
                  "Your draft stays while you remain on this page. Do not share passwords.",
                )}
              </p>
              <Button type="submit" disabled={busy}>
                {busy
                  ? t("Enviando…", "Sending…")
                  : t("Enviar consulta", "Send inquiry")}
              </Button>
            </fieldset>
            {feedback && <p role="alert">{feedback}</p>}
          </form>
        )}
      </AppDialog>
    </>
  );
}
