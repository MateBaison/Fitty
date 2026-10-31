import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { View } from "react-native";
import { Button, Card, Label } from "@/components/ui";
import { linkProvider } from "@/lib/oauth";
import { supabase } from "@/lib/supabase";
import { useAccount } from "@/state/account";
import { useSession } from "@/state/session";
import { space } from "@/theme";

const providers = [
  ["google", "Google"],
  ["apple", "Apple"],
] as const;

/** Sign-in methods linked to this account; any linked method opens the same data. */
export function LinkedApps() {
  const { t } = useAccount();
  const { session } = useSession();
  const queryClient = useQueryClient();
  const identities = useQuery({
    queryKey: ["identities"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getUserIdentities();
      if (error) throw error;
      return data.identities;
    },
  });
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["identities"] });
  const link = useMutation({
    mutationFn: linkProvider,
    onSettled: refresh,
  });
  const unlink = useMutation({
    mutationFn: async (provider: string) => {
      const target = identities.data?.find(
        (item) => item.provider === provider,
      );
      // Never leave an account without a way to sign in.
      if (!target || (identities.data?.length ?? 0) < 2)
        throw new Error("last");
      const { error } = await supabase.auth.unlinkIdentity(target);
      if (error) throw error;
    },
    onSettled: refresh,
  });
  const linked = identities.data?.map((item) => item.provider) ?? [];
  const busy = link.isPending || unlink.isPending;
  const failure = link.error ?? unlink.error;
  return (
    <>
      <Card>
        <Label muted>
          {t(
            "Vinculá tus cuentas para iniciar sesión como prefieras. Tus datos son los mismos sin importar el método.",
            "Link your accounts to sign in however you like. Your data stays the same whichever method you use.",
          )}
        </Label>
        <View style={{ gap: space(1) }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              gap: space(3),
            }}
          >
            <Label>{t("Correo", "Email")}</Label>
            <Label muted>{session?.user.email}</Label>
          </View>
          <Label muted>
            {t(
              "Siempre podés entrar con un código enviado a este correo.",
              "You can always sign in with a code sent to this email.",
            )}
          </Label>
        </View>
        {providers.map(([id, name]) => (
          <View
            key={id}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: space(3),
            }}
          >
            <Label>{name}</Label>
            {identities.data ? (
              linked.includes(id) ? (
                <Button
                  variant="secondary"
                  disabled={busy || linked.length < 2}
                  onPress={() => unlink.mutate(id)}
                >
                  {t("Desvincular", "Unlink")}
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  disabled={busy}
                  onPress={() => link.mutate(id)}
                >
                  {t("Vincular", "Link")}
                </Button>
              )
            ) : null}
          </View>
        ))}
        {failure ? (
          <Label>
            {failure.message === "last"
              ? t(
                  "No podés desvincular tu único método de inicio de sesión.",
                  "You cannot unlink your only sign-in method.",
                )
              : t(
                  "No pudimos vincular esta cuenta. Puede que ya esté vinculada a otro usuario de Fitty.",
                  "We could not link this account. It may already belong to another Fitty user.",
                )}
          </Label>
        ) : null}
      </Card>
    </>
  );
}
