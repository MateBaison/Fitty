import { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { countryCodes } from "@fitty/core/data/country-codes";
import { localeFor } from "@fitty/core/data/translations";
import { Button, Card, Label, styles } from "@/components/ui";
import { Slider } from "@/components/slider";
import { useAccount, useSnapshot } from "@/state/account";
import { colors, space } from "@/theme";

/** Looks like an input; tapping it opens the real picker. */
export function PickerButton({
  label,
  value,
  placeholder,
  onPress,
  invalid,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onPress: () => void;
  invalid?: boolean;
}) {
  return (
    <View style={{ gap: space(1.5) }}>
      <Label muted>{label}</Label>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value || placeholder || ""}`}
        onPress={onPress}
        style={[
          styles.input,
          {
            justifyContent: "center",
            borderColor: invalid ? colors.destructive : colors.border,
          },
        ]}
      >
        <Text
          style={{
            color: value ? colors.foreground : colors.muted,
            fontSize: 16,
          }}
        >
          {value || placeholder || ""}
        </Text>
      </Pressable>
    </View>
  );
}

function Sheet({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "center", padding: space(4), backgroundColor: "#000a" }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
          onPress={onClose}
          style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
        />
        <View style={{ maxHeight: "90%" }}>
          <Card>{children}</Card>
        </View>
      </View>
    </Modal>
  );
}

const pad = (value: number) => String(value).padStart(2, "0");
const key = (year: number, month: number, day: number) =>
  `${year}-${pad(month + 1)}-${pad(day)}`;

/** Calendar for choosing a date (YYYY-MM-DD) with a quick year list, for birth dates. */
export function DateField({
  label,
  value,
  onChange,
  max,
  invalid,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  max: string;
  invalid?: boolean;
}) {
  const { t } = useAccount();
  const locale = localeFor(useSnapshot().settings.language ?? "es");
  const [open, setOpen] = useState(false);
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
  const start = parsed ? new Date(`${parsed}T12:00:00`) : new Date(1995, 5, 15);
  const [year, setYear] = useState(start.getFullYear());
  const [month, setMonth] = useState(start.getMonth());
  const [choosingYear, setChoosingYear] = useState(false);
  const maxYear = Number(max.slice(0, 4));
  const years = Array.from({ length: maxYear - 1899 }, (_, index) => maxYear - index);
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const length = new Date(year, month + 1, 0).getDate();
  const cells = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length }, (_, index) => index + 1),
  ];
  const shift = (delta: number) => {
    const next = new Date(year, month + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  };
  const shown = parsed
    ? new Date(`${parsed}T12:00:00`).toLocaleDateString(locale, {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";
  return (
    <>
      <PickerButton
        label={label}
        value={shown}
        placeholder={t("Elegir fecha", "Choose date")}
        invalid={invalid}
        onPress={() => {
          setChoosingYear(false);
          setOpen(true);
        }}
      />
      <Sheet visible={open} onClose={() => setOpen(false)}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: space(2) }}>
          <Pressable accessibilityRole="button" accessibilityLabel={t("Mes anterior", "Previous month")} onPress={() => shift(-1)} style={navStyle}>
            <Text style={navText}>‹</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setChoosingYear((current) => !current)}
            style={{ flex: 1, alignItems: "center", minHeight: 44, justifyContent: "center" }}
          >
            <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "800", textTransform: "capitalize" }}>
              {new Date(year, month, 1).toLocaleDateString(locale, { month: "long" })} {year} ▾
            </Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={t("Mes siguiente", "Next month")} onPress={() => shift(1)} style={navStyle}>
            <Text style={navText}>›</Text>
          </Pressable>
        </View>
        {choosingYear ? (
          <FlatList
 showsVerticalScrollIndicator={false}
            data={years}
            numColumns={4}
            style={{ maxHeight: 320 }}
            keyExtractor={(item) => String(item)}
            columnWrapperStyle={{ gap: space(2) }}
            contentContainerStyle={{ gap: space(2) }}
            initialScrollIndex={Math.max(0, years.indexOf(year) - 4)}
            getItemLayout={(_, index) => ({ length: 52, offset: 52 * Math.floor(index / 4), index })}
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setYear(item);
                  setChoosingYear(false);
                }}
                style={{
                  flex: 1,
                  minHeight: 44,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: item === year ? colors.primary : colors.secondary,
                }}
              >
                <Text style={{ color: item === year ? colors.primaryForeground : colors.foreground, fontWeight: "800" }}>
                  {item}
                </Text>
              </Pressable>
            )}
          />
        ) : (
          <>
            <View style={{ flexDirection: "row" }}>
              {Array.from({ length: 7 }, (_, index) => (
                <Text key={index} style={{ width: `${100 / 7}%`, textAlign: "center", color: colors.muted, fontSize: 12, fontWeight: "700", textTransform: "uppercase" }}>
                  {new Date(2024, 0, 1 + index).toLocaleDateString(locale, { weekday: "narrow" })}
                </Text>
              ))}
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {cells.map((day, index) => {
                if (!day) return <View key={`b${index}`} style={{ width: `${100 / 7}%`, aspectRatio: 1 }} />;
                const dateKey = key(year, month, day);
                const disabled = dateKey > max;
                const active = dateKey === parsed;
                return (
                  <Pressable
                    key={dateKey}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active, disabled }}
                    disabled={disabled}
                    onPress={() => {
                      onChange(dateKey);
                      setOpen(false);
                    }}
                    style={{ width: `${100 / 7}%`, aspectRatio: 1, padding: 2 }}
                  >
                    <View
                      style={{
                        flex: 1,
                        borderRadius: 12,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: active ? colors.primary : "transparent",
                        opacity: disabled ? 0.3 : 1,
                      }}
                    >
                      <Text style={{ color: active ? colors.primaryForeground : colors.foreground, fontWeight: active ? "800" : "500" }}>
                        {day}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}
        <Button variant="secondary" onPress={() => setOpen(false)}>
          {t("Cerrar", "Close")}
        </Button>
      </Sheet>
    </>
  );
}

const navStyle = {
  width: 44,
  height: 44,
  borderRadius: 12,
  alignItems: "center" as const,
  justifyContent: "center" as const,
  backgroundColor: colors.secondary,
};
const navText = { color: colors.accent, fontSize: 24, fontWeight: "700" as const };

/** Country chosen from the same list as the web; the stored value is the localized name. */
export function CountryField({
  label,
  value,
  onChange,
  invalid,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
}) {
  const { t } = useAccount();
  const language = useSnapshot().settings.language ?? "es";
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const names = useMemo(() => {
    let display: Intl.DisplayNames | null = null;
    try {
      display = new Intl.DisplayNames([localeFor(language)], { type: "region" });
    } catch {
      display = null;
    }
    return countryCodes
      .map((code) => display?.of(code) ?? code)
      .sort((a, b) => a.localeCompare(b));
  }, [language]);
  const normalized = query.trim().toLowerCase();
  const list = normalized
    ? names.filter((name) => name.toLowerCase().includes(normalized))
    : names;
  return (
    <>
      <PickerButton
        label={label}
        value={value}
        placeholder={t("Seleccioná un país", "Select a country")}
        invalid={invalid}
        onPress={() => {
          setQuery("");
          setOpen(true);
        }}
      />
      <Sheet visible={open} onClose={() => setOpen(false)}>
        <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: "800", textAlign: "center" }}>
          {t("País", "Country")}
        </Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t("Buscar país", "Search country")}
          placeholderTextColor={colors.muted}
          style={styles.input}
        />
        <FlatList
 showsVerticalScrollIndicator={false}
          data={list}
          style={{ maxHeight: 380 }}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                onChange(item);
                setOpen(false);
              }}
              style={{
                minHeight: 48,
                paddingHorizontal: space(3),
                justifyContent: "center",
                borderRadius: 12,
                backgroundColor: item === value ? "#173a52" : "transparent",
              }}
            >
              <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: item === value ? "800" : "500" }}>
                {item}
              </Text>
            </Pressable>
          )}
        />
        <Button variant="secondary" onPress={() => setOpen(false)}>
          {t("Cerrar", "Close")}
        </Button>
      </Sheet>
    </>
  );
}

/** Ruler whose marks slide past a fixed center line as the value changes. */
function Ruler({
  value,
  tick,
  labelEvery,
  length,
  vertical = false,
}: {
  value: number;
  /** Value distance between two marks. */
  tick: number;
  /** A longer mark with a number every this many marks. */
  labelEvery: number;
  length: number;
  vertical?: boolean;
}) {
  const gap = 10;
  const half = Math.ceil(length / 2 / gap) + 1;
  const base = Math.round(value / tick);
  const marks = Array.from({ length: half * 2 + 1 }, (_, index) => base - half + index);
  const thickness = 56;
  return (
    <View
      pointerEvents="none"
      style={
        vertical
          ? { width: thickness, height: length, overflow: "hidden" }
          : { height: thickness, width: length, overflow: "hidden" }
      }
    >
      {marks.map((mark) => {
        const offset = (mark - value / tick) * gap;
        const major = mark % labelEvery === 0;
        const position = (vertical ? length / 2 - offset : length / 2 + offset) - 1;
        const label = Math.round(mark * tick * 100) / 100;
        return vertical ? (
          <View key={mark} style={{ position: "absolute", top: position - 8, left: 0, flexDirection: "row", alignItems: "center", gap: 4, height: 16 }}>
            <View style={{ width: major ? 22 : 12, height: 2, backgroundColor: major ? colors.foreground : colors.muted }} />
            {major ? <Text style={{ color: colors.muted, fontSize: 11 }}>{label}</Text> : null}
          </View>
        ) : (
          <View key={mark} style={{ position: "absolute", left: position - 12, top: 0, width: 24, alignItems: "center" }}>
            <View style={{ width: 2, height: major ? 22 : 12, backgroundColor: major ? colors.foreground : colors.muted }} />
            {major ? <Text style={{ color: colors.muted, fontSize: 11 }}>{label}</Text> : null}
          </View>
        );
      })}
      <View
        style={
          vertical
            ? { position: "absolute", top: length / 2 - 1, left: 0, width: 34, height: 3, backgroundColor: colors.primary }
            : { position: "absolute", left: length / 2 - 1, top: 0, height: 34, width: 3, backgroundColor: colors.primary }
        }
      />
    </View>
  );
}

/** Height (vertical slider) or weight (horizontal slider); the blue number can be typed directly. */
export function MeasureField({
  kind,
  label,
  value,
  onChange,
  invalid,
}: {
  kind: "height" | "weight";
  label: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
}) {
  const { t } = useAccount();
  const settings = useSnapshot().settings;
  const unit = kind === "height" ? (settings.height ?? "cm") : (settings.weight ?? "kg");
  const range =
    kind === "height"
      ? unit === "ft"
        ? { min: 3, max: 9, step: 0.1, fallback: 5.7, tick: 0.1, labelEvery: 5 }
        : { min: 100, max: 250, step: 1, fallback: 175, tick: 1, labelEvery: 10 }
      : { min: 25, max: 425, step: 0.5, fallback: 75, tick: 1, labelEvery: 5 };
  const [open, setOpen] = useState(false);
  const numeric = Number(value.replace(",", "."));
  const current = Number.isFinite(numeric) && numeric > 0 ? numeric : range.fallback;
  const clamped = Math.min(range.max, Math.max(range.min, current));
  const text = (n: number) => String(Math.round(n * 100) / 100);
  return (
    <>
      <PickerButton
        label={`${label} (${unit})`}
        value={value ? `${value} ${unit}` : ""}
        placeholder={t("Elegir", "Choose")}
        invalid={invalid}
        onPress={() => setOpen(true)}
      />
      <Sheet visible={open} onClose={() => setOpen(false)}>
        <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: "800", textAlign: "center" }}>
          {label} ({unit})
        </Text>
        <TextInput
          value={value || text(clamped)}
          onChangeText={onChange}
          keyboardType="decimal-pad"
          selectTextOnFocus
          returnKeyType="done"
          accessibilityLabel={`${label} (${unit})`}
          style={{
            color: colors.primary,
            fontSize: 48,
            fontWeight: "800",
            textAlign: "center",
            paddingVertical: space(1),
          }}
        />
        <Text style={{ color: colors.muted, fontSize: 12, textAlign: "center" }}>
          {t("Tocá el número para escribirlo", "Tap the number to type it")}
        </Text>
        {kind === "height" ? (
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space(2) }}>
            <Slider
              vertical
              length={240}
              value={clamped}
              min={range.min}
              max={range.max}
              step={range.step}
              onChange={(next) => onChange(text(next))}
            />
            <Ruler vertical value={clamped} tick={range.tick} labelEvery={range.labelEvery} length={268} />
          </View>
        ) : (
          <View style={{ alignItems: "center", gap: space(1) }}>
            <Ruler value={clamped} tick={range.tick} labelEvery={range.labelEvery} length={278} />
            <Slider
              length={250}
              value={clamped}
              min={range.min}
              max={range.max}
              step={range.step}
              onChange={(next) => onChange(text(next))}
            />
          </View>
        )}
        <Button onPress={() => setOpen(false)}>{t("Listo", "Done")}</Button>
      </Sheet>
    </>
  );
}
