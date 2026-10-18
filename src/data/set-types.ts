export const setTypeLabels: Record<
  string,
  readonly [string, string, string, string, string]
> = {
  es: ["Calentamiento", "Normal", "Fallo", "Descendente", "Piramidal"],
  en: ["Warm-up", "Normal", "Failure", "Drop set", "Pyramid"],
  fr: ["Échauffement", "Normale", "Échec", "Dégressive", "Pyramidale"],
  de: ["Aufwärmen", "Normal", "Muskelversagen", "Dropsatz", "Pyramide"],
  it: ["Riscaldamento", "Normale", "Cedimento", "Discendente", "Piramidale"],
  pt: ["Aquecimento", "Normal", "Falha", "Descendente", "Piramidal"],
  zh: ["热身", "常规", "力竭", "递减", "金字塔"],
  hi: ["वार्म-अप", "सामान्य", "विफलता", "ड्रॉप सेट", "पिरामिड"],
  ar: ["إحماء", "عادية", "فشل عضلي", "تنازلية", "هرمية"],
};
export function localizedSetTypes(language: string) {
  const names = setTypeLabels[language] ?? setTypeLabels.en!;
  return (["warmup", "normal", "failure", "drop", "pyramid"] as const).map(
    (id, index) => ({
      id,
      name: names[index]!,
      letter: Array.from(names[index]!)[0]!.toUpperCase(),
    }),
  );
}
