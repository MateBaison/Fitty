"use client";

import { useRef, useState } from "react";
import { Headset, Paperclip, X } from "lucide-react";
import { AppDialog } from "@/components/ui/app-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApp } from "@/state/app-provider";

export function SupportPanel() {
  const { t } = useApp();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  return (
    <>
      <Button
        variant="secondary"
        aria-label={t("Soporte", "Support")}
        onClick={() => setOpen(true)}
      >
        <Headset aria-hidden="true" />
      </Button>
      <AppDialog
        open={open}
        onClose={() => setOpen(false)}
        title={t("Soporte", "Support")}
        description={t(
          "Contanos cómo podemos ayudarte.",
          "Tell us how we can help.",
        )}
      >
        <form
          className="flex max-h-[70dvh] flex-col gap-4 overflow-y-auto"
          onSubmit={(event) => event.preventDefault()}
        >
          <p role="status" className="text-sm text-muted-foreground">
            {t(
              "El envío estará disponible cuando habilitemos el correo de soporte. Por ahora no se enviará ningún mensaje ni archivo.",
              "Sending will be available once our support email is enabled. No messages or files will be sent for now.",
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
            <p id="support-file-help" className="text-sm text-muted-foreground">
              {t(
                "Hasta 5 archivos y 10 MB en total.",
                "Up to 5 files and 10 MB in total.",
              )}
            </p>
            <input
              ref={fileInput}
              id="support-files"
              type="file"
              multiple
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
                    10 * 1024 * 1024
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
                  "Superaste el límite de archivos o tamaño.",
                  "The file count or size limit was exceeded.",
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
          <Button type="submit" disabled>
            {t("Enviar consulta (próximamente)", "Send inquiry (coming soon)")}
          </Button>
        </form>
      </AppDialog>
    </>
  );
}
