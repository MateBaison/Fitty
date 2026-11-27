import { Image, type ImageStyle } from "expo-image";
import { useState, type ReactNode } from "react";
import { Pressable, View, type StyleProp } from "react-native";
import type { CatalogExercise } from "@fitty/core/domain/workouts";
import { exerciseSource } from "@/lib/exercise-image";
import { useAccount, useSnapshot } from "@/state/account";
import { colors, space } from "@/theme";

/** Large exercise picture, with thumbnails when the user added several photos. */
export function ExerciseGallery({
  exercise,
  style,
  contentFit = "contain",
  children,
}: {
  exercise: CatalogExercise;
  style: StyleProp<ImageStyle>;
  contentFit?: "cover" | "contain";
  /** Controls drawn over the large picture. */
  children?: ReactNode;
}) {
  const { t } = useAccount();
  const gender = useSnapshot().profile.gender;
  const [chosen, setChosen] = useState({ id: exercise.id, index: 0 });
  const index = chosen.id === exercise.id ? chosen.index : 0;
  const photos = exercise.photos ?? [];
  return (
    <View>
      <View>
        <Image
          source={photos[index] ?? exerciseSource(exercise, gender)}
          style={style}
          contentFit={photos.length ? "contain" : contentFit}
          cachePolicy="disk"
          accessibilityIgnoresInvertColors
        />
        {children}
      </View>
      {photos.length > 1 ? (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            gap: space(2),
            paddingTop: space(2),
          }}
        >
          {photos.map((photo, position) => (
            <Pressable
              key={position}
              accessibilityRole="button"
              accessibilityLabel={`${t("Foto", "Photo")} ${position + 1}`}
              accessibilityState={{ selected: position === index }}
              onPress={() => setChosen({ id: exercise.id, index: position })}
              style={{
                borderRadius: 12,
                borderWidth: 2,
                borderColor:
                  position === index ? colors.primary : "transparent",
              }}
            >
              <Image
                source={photo}
                style={{ width: 60, height: 60, borderRadius: 10 }}
                contentFit="cover"
                accessibilityIgnoresInvertColors
              />
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}
