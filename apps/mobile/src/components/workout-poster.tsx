import { forwardRef, Fragment } from "react";
import Svg, {
  Defs,
  Image as SvgImage,
  LinearGradient,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import { localeFor } from "@fitty/core/data/translations";
import type { Snapshot } from "@fitty/core/domain/schemas/snapshot";
import { findExercise, type Session } from "@fitty/core/domain/workouts";

const short = (value: string, max: number) =>
  value.length > max ? `${value.slice(0, max - 1)}…` : value;

/**
 * The shareable 1080 × 1920 workout image, drawn like the web poster. The Fitty
 * logo appears once (top left); it already contains the word, so no extra text.
 */
export const WorkoutPoster = forwardRef<
  Svg,
  { snapshot: Snapshot; session: Session; width: number }
>(function WorkoutPoster({ snapshot, session, width }, ref) {
  const language = snapshot.settings.language ?? "es";
  const es = language === "es";
  const exercises =
    session.exercises?.filter(
      (exercise) => exercise.sets || exercise.performedSets?.length,
    ) ?? [];
  const sets = exercises.reduce(
    (sum, exercise) =>
      sum + (exercise.performedSets?.length ?? exercise.sets ?? 0),
    0,
  );
  const date = new Date(session.date).toLocaleDateString(localeFor(language), {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return (
    <Svg
      ref={ref}
      width={width}
      height={(width * 1920) / 1080}
      viewBox="0 0 1080 1920"
    >
      <Defs>
        <LinearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#111621" />
          <Stop offset="0.55" stopColor="#090b10" />
          <Stop offset="1" stopColor="#321b18" />
        </LinearGradient>
      </Defs>
      <Rect width="1080" height="1920" fill="url(#bg)" />
      <SvgImage
        href={require("@/assets/images/fitty-wordmark.png")}
        x="76"
        y="64"
        width="230"
        height="110"
        preserveAspectRatio="xMinYMid meet"
      />
      <SvgText x="76" y="235" fill="#ff8a4c" fontSize="28" fontWeight="700">
        {es ? "MI ENTRENAMIENTO" : "MY WORKOUT"}
      </SvgText>
      <SvgText x="76" y="340" fill="#f5f7fb" fontSize="76" fontWeight="700">
        {short(session.day, 22)}
      </SvgText>
      <SvgText x="76" y="405" fill="#f5f7fb" fontSize="37" fontWeight="700">
        {short(session.routine, 40)}
      </SvgText>
      <SvgText x="76" y="470" fill="#a7b0c1" fontSize="29" fontWeight="700">
        {date}
      </SvgText>
      <Rect x="76" y="535" width="450" height="190" rx="30" fill="#171d28" />
      <Rect x="554" y="535" width="450" height="190" rx="30" fill="#171d28" />
      <SvgText x="108" y="627" fill="#ff8a4c" fontSize="76" fontWeight="700">
        {String(exercises.length)}
      </SvgText>
      <SvgText x="108" y="686" fill="#f5f7fb" fontSize="25" fontWeight="700">
        {es ? "EJERCICIOS" : "EXERCISES"}
      </SvgText>
      <SvgText x="586" y="627" fill="#54d68b" fontSize="76" fontWeight="700">
        {String(sets)}
      </SvgText>
      <SvgText x="586" y="686" fill="#f5f7fb" fontSize="25" fontWeight="700">
        {es ? "SERIES REGISTRADAS" : "LOGGED SETS"}
      </SvgText>
      <SvgText x="76" y="805" fill="#a7b0c1" fontSize="30" fontWeight="700">
        {es ? "ASÍ ENTRENÉ" : "HOW I TRAINED"}
      </SvgText>
      {exercises.slice(0, 8).map((exercise, index) => {
        const y = 847 + index * 108;
        const best = [...(exercise.performedSets ?? [])].sort(
          (a, b) =>
            (b.kg ?? 0) - (a.kg ?? 0) ||
            (b.reps ?? b.seconds ?? 0) - (a.reps ?? a.seconds ?? 0),
        )[0];
        const count = exercise.performedSets?.length ?? exercise.sets ?? 0;
        return (
          <Fragment key={index}>
            <Rect
              x="76"
              y={y}
              width="928"
              height="94"
              rx="30"
              fill="#171d28"
            />
            <SvgText
              x="98"
              y={y + 59}
              fill="#ff8a4c"
              fontSize="29"
              fontWeight="700"
            >
              {String(index + 1).padStart(2, "0")}
            </SvgText>
            <SvgText
              x="165"
              y={y + 36}
              fill="#f5f7fb"
              fontSize="30"
              fontWeight="700"
            >
              {short(findExercise(snapshot, exercise.id)?.name ?? exercise.id, 44)}
            </SvgText>
            <SvgText
              x="165"
              y={y + 73}
              fill="#a7b0c1"
              fontSize="25"
              fontWeight="700"
            >
              {`${count} ${es ? "series" : "sets"}${best ? ` · ${best.kg ?? 0} ${session.weightUnit ?? "kg"} × ${best.seconds != null ? `${best.seconds} s` : `${best.reps} reps`}` : ""}`}
            </SvgText>
          </Fragment>
        );
      })}
      <SvgText x="76" y="1865" fill="#a7b0c1" fontSize="28" fontWeight="700">
        {es ? "Mi progreso, a mi ritmo." : "My progress, at my pace."}
      </SvgText>
    </Svg>
  );
});
