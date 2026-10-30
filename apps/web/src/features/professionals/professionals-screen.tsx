"use client";
import { useState } from "react";
import { LocationFilters } from "./location-filters";
import { Search, UsersRound } from "lucide-react";
import { useApp } from "@/state/app-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initial = {
  search: "",
  specialty: "",
  sex: "",
  mode: "both",
  country: "",
  city: "",
  language: "",
};
export function ProfessionalsScreen() {
  const { t } = useApp();
  const [filters, setFilters] = useState(initial);
  const update = (key: keyof typeof initial, value: string) =>
    setFilters((current) => ({
      ...current,
      [key]: value,
      ...(key === "country" ? { city: "" } : {}),
      ...(key === "mode" && value !== "in-person" && value !== "both"
        ? { country: "", city: "" }
        : {}),
    }));
  const any = (Object.keys(initial) as (keyof typeof initial)[]).some(
    (key) => filters[key] !== initial[key],
  );
  const select = (
    key: keyof typeof initial,
    label: string,
    options: [string, string][],
  ) => (
    <label className="professionals-field" key={key}>
      <span>{label}</span>
      <select
        value={filters[key]}
        onChange={(event) => update(key, event.target.value)}
      >
        {key !== "mode" && <option value="">{t("Todos", "All")}</option>}
        {options.map(([value, name]) => (
          <option key={value} value={value}>
            {name}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <div className="professionals-screen">
      <section className="professionals-intro">
        <span className="professionals-icon">
          <UsersRound aria-hidden="true" />
        </span>
        <div>
          <h2>{t("Encontrá tu profesional", "Find your professional")}</h2>
          <p>
            {t(
              "Buscá acompañamiento para tu entrenamiento y bienestar.",
              "Find support for your training and wellbeing.",
            )}
          </p>
        </div>
      </section>
      <section
        className="professionals-filters"
        aria-label={t("Filtros de búsqueda", "Search filters")}
      >
        <label className="professionals-search">
          <span>{t("Buscar por nombre", "Search by name")}</span>
          <div>
            <Search aria-hidden="true" />
            <Input
              type="search"
              maxLength={100}
              value={filters.search}
              onChange={(event) => update("search", event.target.value)}
            />
          </div>
        </label>
        <div className="professionals-filter-grid">
          {select("specialty", t("Especialidad", "Specialty"), [
            ["nutrition", t("Nutricionista", "Nutritionist")],
            ["training", t("Entrenador/a", "Trainer")],
            ["physio", t("Kinesiólogo/a", "Physiotherapist")],
            [
              "sports-psychology",
              t("Psicología deportiva", "Sports psychology"),
            ],
            [
              "physical-conditioning",
              t("Preparación física", "Physical conditioning"),
            ],
          ])}
          {select("sex", t("Sexo del profesional", "Professional’s sex"), [
            ["female", t("Femenino", "Female")],
            ["male", t("Masculino", "Male")],
          ])}
          {select("mode", t("Modalidad", "Consultation mode"), [
            ["virtual", t("Virtual", "Online")],
            ["in-person", t("Presencial", "In person")],
            ["both", t("Virtual y presencial", "Online and in person")],
          ])}
          {select(
            "language",
            t("Idioma de atención", "Consultation language"),
            [
              ["es", "Español"],
              ["en", "English"],
              ["pt", "Português"],
            ],
          )}
          {(filters.mode === "in-person" || filters.mode === "both") && (
            <LocationFilters
              country={filters.country}
              city={filters.city}
              onCountry={(value) => update("country", value)}
              onCity={(value) => update("city", value)}
            />
          )}
        </div>
        <div className="professionals-filter-footer">
          <span>{t("Directorio en preparación", "Directory coming soon")}</span>
          <Button
            variant="secondary"
            disabled={!any}
            onClick={() => setFilters(initial)}
          >
            {t("Limpiar filtros", "Clear filters")}
          </Button>
        </div>
      </section>
      <section className="professionals-empty" aria-live="polite">
        <UsersRound aria-hidden="true" />
        <h3>
          {t(
            "Próximamente, profesionales en Fitty",
            "Professionals are coming to Fitty",
          )}
        </h3>
        <p>
          {t(
            "Todavía no hay profesionales publicados. Las postulaciones aún no están habilitadas.",
            "No professionals are listed yet. Applications are not open yet.",
          )}
        </p>
      </section>
    </div>
  );
}
