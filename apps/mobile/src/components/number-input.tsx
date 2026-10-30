import { useEffect, useState } from "react";
import { TextInput } from "react-native";
import { styles } from "@/components/ui";

/**
 * Keeps typing local and saves on blur/submit, so each keystroke does not clone
 * and persist the whole account snapshot.
 */
export function NumberInput({
  value,
  onCommit,
  decimal,
  accessibilityLabel,
}: {
  value: number | null | undefined;
  onCommit: (value: number | null) => void;
  decimal?: boolean;
  accessibilityLabel: string;
}) {
  const [text, setText] = useState(value == null ? "" : String(value));
  useEffect(() => setText(value == null ? "" : String(value)), [value]);
  const commit = () => {
    const normalized = text.replace(",", ".").trim();
    const parsed = normalized === "" ? null : Number(normalized);
    if (parsed !== null && !Number.isFinite(parsed)) {
      setText(value == null ? "" : String(value));
      return;
    }
    const next =
      parsed === null
        ? null
        : Math.max(0, decimal ? parsed : Math.floor(parsed));
    if (next !== (value ?? null)) onCommit(next);
  };
  return (
    <TextInput
      value={text}
      onChangeText={setText}
      onBlur={commit}
      onSubmitEditing={commit}
      keyboardType={decimal ? "decimal-pad" : "number-pad"}
      returnKeyType="done"
      selectTextOnFocus
      accessibilityLabel={accessibilityLabel}
      style={[styles.input, { flex: 1, textAlign: "center", minWidth: 0 }]}
    />
  );
}
