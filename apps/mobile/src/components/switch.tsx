import { Switch as NativeSwitch, type SwitchProps } from "react-native";
import { useRTL } from "@/lib/direction";

/** The system switch ignores the layout direction around it, so it is flipped here. */
export function Switch({ style, ...props }: SwitchProps) {
  const rtl = useRTL();
  return (
    <NativeSwitch
      {...props}
      style={rtl ? [style, { transform: [{ scaleX: -1 }] }] : style}
    />
  );
}
