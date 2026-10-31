import * as ImagePicker from "expo-image-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { useRef, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { ResizableInput } from "@/components/resizable-input";
import { Button, Card, Field, Label, styles, DialogScroll } from "@/components/ui";
import { env } from "@/lib/env";
import { makeId } from "@/lib/id";
import { supabase } from "@/lib/supabase";
import { useAccount } from "@/state/account";
import { colors, space } from "@/theme";

const categories = [
  ["account", "Cuenta y acceso", "Account and sign-in"],
  ["technical", "Problema técnico", "Technical issue"],
  ["exercises", "Ejercicios y rutinas", "Exercises and routines"],
  ["suggestion", "Sugerencia", "Suggestion"],
  ["privacy", "Privacidad y datos", "Privacy and data"],
  ["other", "Otra consulta", "Other inquiry"],
] as const;

const MAX_BYTES = 3 * 1024 * 1024;
type Attachment = { uri: string; name: string; size: number };

/** Same inquiry form as the web; it goes to soporte@fitty.uy through the Fitty API. */
export function SupportForm({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { t } = useAccount();
  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<Attachment[]>([]);
  const [fileError, setFileError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [sent, setSent] = useState(false);
  const [menu, setMenu] = useState(false);
  const [resizing, setResizing] = useState(false);
  // One id per draft so retrying a request that may have arrived is not sent twice.
  const requestId = useRef<string | undefined>(undefined);
  const inFlight = useRef(false);
  const edit = <T,>(setter: (value: T) => void) => (value: T) => {
    requestId.current = undefined;
    setFeedback("");
    setter(value);
  };
  const addFiles = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: 5 - files.length,
      quality: 1,
    });
    if (result.canceled) return;
    try {
      const prepared: Attachment[] = [];
      for (const asset of result.assets) {
        const context = ImageManipulator.manipulate(asset.uri);
        const ratio = Math.min(1, 1600 / Math.max(asset.width, asset.height));
        if (ratio < 1)
          context.resize({
            width: Math.round(asset.width * ratio),
            height: Math.round(asset.height * ratio),
          });
        const saved = await (await context.renderAsync()).saveAsync({
          format: SaveFormat.JPEG,
          compress: 0.6,
        });
        const size = (await (await fetch(saved.uri)).blob()).size;
        prepared.push({
          uri: saved.uri,
          name: `adjunto-${files.length + prepared.length + 1}.jpg`,
          size,
        });
      }
      const next = [...files, ...prepared];
      if (
        next.length > 5 ||
        next.reduce((sum, file) => sum + file.size, 0) > MAX_BYTES
      )
        setFileError(true);
      else {
        setFiles(next);
        setFileError(false);
        requestId.current = undefined;
      }
    } catch {
      setFileError(true);
    }
  };
  const submit = async () => {
    if (inFlight.current || !category || !subject.trim() || !message.trim())
      return;
    inFlight.current = true;
    setBusy(true);
    setFeedback("");
    requestId.current ??= makeId();
    const retry = t(
      "No se pudo confirmar el envío. Conservamos tu borrador para que reintentes.",
      "We could not confirm delivery. Your draft is preserved so you can retry.",
    );
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const form = new FormData();
      form.append("requestId", requestId.current);
      form.append("category", category);
      form.append("subject", subject);
      form.append("message", message);
      for (const file of files)
        form.append("files", {
          uri: file.uri,
          name: file.name,
          type: "image/jpeg",
        } as unknown as Blob);
      const response = await fetch(`${env.apiUrl}/api/v1/support`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      const data = (await response.json().catch(() => null)) as {
        ok?: boolean;
      } | null;
      if (response.ok && data?.ok === true) {
        setCategory("");
        setSubject("");
        setMessage("");
        setFiles([]);
        requestId.current = undefined;
        setSent(true);
      } else
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
              : retry,
        );
    } catch {
      setFeedback(retry);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  const close = () => {
    if (busy) return;
    setSent(false);
    setFeedback("");
    onClose();
  };
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <Pressable
        onPress={close}
        style={{ flex: 1, justifyContent: "center", padding: space(4), backgroundColor: "#000a" }}
      >
        <Pressable onPress={() => undefined} style={{ maxHeight: "92%" }}>
          <Card>
            <DialogScroll
              contentContainerStyle={{ gap: space(3) }}
              keyboardShouldPersistTaps="handled"
              scrollEnabled={!resizing}
            >
              <Text
                accessibilityRole="header"
                style={{ color: colors.foreground, fontSize: 20, fontWeight: "800", textAlign: "center" }}
              >
                {sent ? t("Consulta enviada", "Inquiry sent") : t("Soporte", "Support")}
              </Text>
              {sent ? (
                <>
                  <Text style={{ fontSize: 56, textAlign: "center", color: colors.success }}>✓</Text>
                  <Label muted>
                    {t("Te responderemos por correo.", "We will reply by email.")}
                  </Label>
                  <Button onPress={close}>{t("Cerrar", "Close")}</Button>
                </>
              ) : (
                <>
                  <Label muted>
                    {t(
                      "Contanos cómo podemos ayudarte. Tu consulta, adjuntos y correo de cuenta se enviarán a soporte@fitty.uy. Te responderemos por correo.",
                      "Tell us how we can help. Your inquiry, attachments and account email will be sent to soporte@fitty.uy. We will reply by email.",
                    )}
                  </Label>
                  <Label muted>{t("Tipo de consulta", "Inquiry type")}</Label>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ expanded: menu }}
                    onPress={() => setMenu((open) => !open)}
                    style={[
                      styles.input,
                      {
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: category ? colors.foreground : colors.muted,
                        fontSize: 16,
                      }}
                    >
                      {category
                        ? t(
                            categories.find(([id]) => id === category)![1],
                            categories.find(([id]) => id === category)![2],
                          )
                        : t("Seleccioná una opción", "Select an option")}
                    </Text>
                    <Text style={{ color: colors.accent }}>{menu ? "▴" : "▾"}</Text>
                  </Pressable>
                  {menu ? (
                    <View
                      style={{
                        borderRadius: 14,
                        borderColor: colors.border,
                        borderWidth: 1,
                        backgroundColor: colors.secondary,
                        overflow: "hidden",
                      }}
                    >
                      {categories.map(([id, es, en]) => (
                        <Pressable
                          key={id}
                          accessibilityRole="button"
                          accessibilityState={{ selected: category === id }}
                          onPress={() => {
                            edit(setCategory)(id);
                            setMenu(false);
                          }}
                          style={{
                            minHeight: 48,
                            paddingHorizontal: space(4),
                            justifyContent: "center",
                            backgroundColor: category === id ? "#173a52" : "transparent",
                          }}
                        >
                          <Text
                            style={{
                              color: colors.foreground,
                              fontSize: 16,
                              fontWeight: category === id ? "800" : "500",
                            }}
                          >
                            {t(es, en)}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : null}
                  <Field
                    label={t("Título", "Subject")}
                    value={subject}
                    onChangeText={edit(setSubject)}
                    maxLength={150}
                  />
                  <ResizableInput
                    label={t("Mensaje", "Message")}
                    value={message}
                    onChangeText={edit(setMessage)}
                    onResizing={setResizing}
                  />
                  <Label muted>
                    {t("Archivos adjuntos (opcional)", "Attachments (optional)")}
                  </Label>
                  <Label muted>
                    {t(
                      "Hasta 5 imágenes y 3 MB en total.",
                      "Up to 5 images and 3 MB total.",
                    )}
                  </Label>
                  <Button
                    variant="secondary"
                    disabled={busy || files.length >= 5}
                    onPress={() => void addFiles()}
                  >
                    {t("Agregar imágenes", "Add images")}
                  </Button>
                  {fileError ? (
                    <Label>
                      {t(
                        "Revisá la cantidad y el tamaño de los archivos.",
                        "Check the file count and size.",
                      )}
                    </Label>
                  ) : null}
                  {files.map((file, index) => (
                    <View
                      key={file.uri}
                      style={{ flexDirection: "row", alignItems: "center", gap: space(2) }}
                    >
                      <Text style={{ flex: 1, color: colors.foreground }} numberOfLines={1}>
                        {file.name} · {Math.round(file.size / 1024)} KB
                      </Text>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`${t("Quitar archivo", "Remove file")}: ${file.name}`}
                        onPress={() => {
                          setFiles(files.filter((_, position) => position !== index));
                          setFileError(false);
                          requestId.current = undefined;
                        }}
                      >
                        <Text style={{ color: colors.destructive, fontSize: 20, fontWeight: "800" }}>
                          ✕
                        </Text>
                      </Pressable>
                    </View>
                  ))}
                  <Label muted>
                    {t(
                      "No compartas contraseñas.",
                      "Do not share passwords.",
                    )}
                  </Label>
                  <Button
                    loading={busy}
                    disabled={!category || !subject.trim() || !message.trim()}
                    onPress={() => void submit()}
                  >
                    {t("Enviar consulta", "Send inquiry")}
                  </Button>
                  {feedback ? <Label>{feedback}</Label> : null}
                  <Button variant="secondary" disabled={busy} onPress={close}>
                    {t("Cancelar", "Cancel")}
                  </Button>
                </>
              )}
            </DialogScroll>
          </Card>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
