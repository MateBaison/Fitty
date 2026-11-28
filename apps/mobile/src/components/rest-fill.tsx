import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";
import type { Rest } from "@/state/rest";

/**
 * Colors the clock of a set little by little, clockwise from the top, as its
 * rest goes by.
 */
export function RestFill({
  rest,
  width,
  height,
}: {
  rest: Rest;
  width: number;
  height: number;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(timer);
  }, []);
  const progress = Math.min(
    1,
    Math.max(0, 1 - (rest.end - now) / (rest.seconds * 1000)),
  );
  const x = width / 2,
    y = height / 2,
    // Long enough to reach the corners; the button clips it.
    radius = width + height,
    angle = progress * 2 * Math.PI;
  return (
    <Svg
      width={width}
      height={height}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    >
      <Path
        fill="#ff8a4c"
        d={
          progress >= 0.999
            ? `M0 0H${width}V${height}H0Z`
            : `M${x} ${y}V${y - radius}A${radius} ${radius} 0 ${angle > Math.PI ? 1 : 0} 1 ${x + radius * Math.sin(angle)} ${y - radius * Math.cos(angle)}Z`
        }
      />
    </Svg>
  );
}
