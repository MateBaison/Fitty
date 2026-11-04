import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { useRef, useState } from "react";
import {
  ScrollView,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui";
import { useAccount } from "@/state/account";
import { colors, space } from "@/theme";

type Slide = { icon: SymbolViewProps["name"]; title: string; text: string };

/** Three-screen tour of what the app does, shown once after the profile setup. */
export function Intro({ onDone }: { onDone: () => void }) {
  const { t } = useAccount();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scroller = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const [page, setPage] = useState(0);
  const slides: Slide[] = [
    {
      icon: { ios: "list.bullet.rectangle", android: "list_alt" },
      title: t("Tus rutinas", "Your routines"),
      text: t(
        "Armá tu rutina por días o dejá que Fitty te proponga una según tu nivel y tus objetivos.",
        "Build your routine by days or let Fitty suggest one for your level and goals.",
      ),
    },
    {
      icon: { ios: "figure.strengthtraining.traditional", android: "fitness_center" },
      title: t("Biblioteca de ejercicios", "Exercise library"),
      text: t(
        "Mirá cómo se hace cada ejercicio, con imágenes y pasos claros. Filtrá por zona y equipo.",
        "See how each exercise is done, with images and clear steps. Filter by area and equipment.",
      ),
    },
    {
      icon: { ios: "chart.line.uptrend.xyaxis", android: "show_chart" },
      title: t("Tu progreso", "Your progress"),
      text: t(
        "Anotá tus series, seguí tus récords y mirá cómo mejorás semana a semana.",
        "Log your sets, follow your records and see how you improve week by week.",
      ),
    },
  ];
  const last = page === slides.length - 1;
  const go = (index: number) => {
    scroller.current?.scrollTo({ x: index * width, animated: true });
    setPage(index);
  };
  const settle = (event: NativeSyntheticEvent<NativeScrollEvent>) =>
    setPage(Math.round(event.nativeEvent.contentOffset.x / width));
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: insets.top + space(3),
        paddingBottom: insets.bottom + space(4),
      }}
    >
      <View style={{ alignItems: "flex-end", paddingHorizontal: space(5), minHeight: 28 }}>
        {last ? null : (
          <Text
            accessibilityRole="button"
            onPress={onDone}
            style={{ color: colors.muted, fontWeight: "700", fontSize: 16 }}
          >
            {t("Omitir", "Skip")}
          </Text>
        )}
      </View>
      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={settle}
        style={{ flex: 1 }}
      >
        {slides.map((slide) => (
          <View
            key={slide.title}
            style={{
              width,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: space(8),
              gap: space(5),
            }}
          >
            <View
              style={{
                width: 132,
                height: 132,
                borderRadius: 66,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.secondary,
                borderColor: colors.border,
                borderWidth: 1,
              }}
            >
              <SymbolView name={slide.icon} tintColor={colors.primary} size={64} />
            </View>
            <Text
              accessibilityRole="header"
              style={{
                color: colors.foreground,
                fontSize: 28,
                fontWeight: "800",
                textAlign: "center",
              }}
            >
              {slide.title}
            </Text>
            <Text
              style={{
                color: colors.muted,
                fontSize: 17,
                lineHeight: 25,
                textAlign: "center",
              }}
            >
              {slide.text}
            </Text>
          </View>
        ))}
      </ScrollView>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          gap: space(2),
          paddingVertical: space(4),
        }}
      >
        {slides.map((slide, index) => (
          <View
            key={slide.title}
            style={{
              width: index === page ? 22 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: index === page ? colors.primary : colors.border,
            }}
          />
        ))}
      </View>
      <View style={{ paddingHorizontal: space(5) }}>
        <Button onPress={() => (last ? onDone() : go(page + 1))}>
          {last ? t("Empezar", "Get started") : t("Siguiente", "Next")}
        </Button>
      </View>
    </View>
  );
}
