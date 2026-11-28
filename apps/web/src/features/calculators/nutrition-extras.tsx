"use client";
import { ChevronDown } from "lucide-react";
import {
  extraAmount,
  nutritionExtraGroups,
  nutritionSources,
} from "@fitty/core/domain/calculations/nutrition-extras";
import { useApp } from "@/state/app-provider";

/** The long "Extras" bar under the macros: what else to watch, and why. */
export function NutritionExtras({ calories }: { calories: number }) {
  const { t } = useApp();
  return (
    <details className="extras">
      <summary>
        <span>
          <strong>{t("Extras", "Extras")}</strong>
          <small>
            {t(
              "Fibra, frutas, vitaminas y qué limitar",
              "Fiber, fruit, vitamins and what to limit",
            )}
          </small>
        </span>
        <ChevronDown aria-hidden="true" />
      </summary>
      {nutritionExtraGroups.map((group) => (
        <section key={group.id} aria-labelledby={`extras-${group.id}`}>
          <h3 id={`extras-${group.id}`}>{t(...group.title)}</h3>
          {group.items.map((item) => {
            const amount = extraAmount(item, calories, t);
            return (
              <details key={item.id} className="extras-item">
                <summary>
                  <span>
                    <strong>{t(...item.name)}</strong>
                    {amount && <small>{amount}</small>}
                  </span>
                  <ChevronDown aria-hidden="true" />
                </summary>
                <p>{t(...item.benefit)}</p>
                <p>
                  <b>
                    {group.id === "limits"
                      ? t("Dónde está", "Where it hides")
                      : t("Dónde encontrarlo", "Where to find it")}
                  </b>
                  {t(...item.foods)}
                </p>
              </details>
            );
          })}
        </section>
      ))}
      <p className="extras-note">
        {t(
          "Cifras generales para adultos sanos; pueden cambiar con la edad, el embarazo o la salud.",
          "General figures for healthy adults; age, pregnancy or health can change them.",
        )}
      </p>
      <h3>{t("Fuentes", "Sources")}</h3>
      <ul className="extras-sources">
        {nutritionSources.map((source) => (
          <li key={source.url}>
            <a href={source.url} target="_blank" rel="noreferrer">
              {source.label}
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}
