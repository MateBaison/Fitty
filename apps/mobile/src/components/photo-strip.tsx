import { Image } from "expo-image";
import { Pressable, Text, View } from "react-native";
import { Button } from "@/components/ui";
import { pickPhoto } from "@/lib/photos";
import { useAccount } from "@/state/account";
import { colors, space } from "@/theme";

/** Up to `max` compressed photos with add/remove controls. */
export function PhotoStrip({
  photos,
  onChange,
  max = 3,
}: {
  photos: string[];
  onChange: (photos: string[]) => void;
  max?: number;
}) {
  const { notify, t } = useAccount();
  return (
    <View style={{ gap: space(2) }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space(2) }}>
        {photos.map((photo, index) => (
          <View key={index}>
            <Image
              source={photo}
              style={{ width: 96, height: 96, borderRadius: 12 }}
              accessibilityIgnoresInvertColors
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${t("Quitar foto", "Remove photo")} ${index + 1}`}
              onPress={() =>
                onChange(photos.filter((_, position) => position !== index))
              }
              hitSlop={8}
              style={{
                position: "absolute",
                top: 4,
                right: 4,
                backgroundColor: colors.background,
                borderRadius: 12,
                width: 24,
                height: 24,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: colors.foreground }}>✕</Text>
            </Pressable>
          </View>
        ))}
      </View>
      {photos.length < max ? (
        <Button
          variant="secondary"
          onPress={async () => {
            try {
              const photo = await pickPhoto();
              if (photo) onChange([...photos, photo]);
            } catch (error) {
              notify(error instanceof Error ? error.message : String(error));
            }
          }}
        >
          {t("+ Agregar foto", "+ Add photo")}
        </Button>
      ) : null}
    </View>
  );
}
