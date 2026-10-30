"use client";
import { useEffect, useMemo, useState } from "react";
import countries from "@/data/professional-countries.json";
import { useApp } from "@/state/app-provider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type City = [string, string, string];
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase();
export function LocationFilters({
  country,
  city,
  onCountry,
  onCity,
}: {
  country: string;
  city: string;
  onCountry: (value: string) => void;
  onCity: (value: string) => void;
}) {
  const { t, snapshot } = useApp();
  const language = snapshot.settings.language ?? "es";
  const [result, setResult] = useState<{
    country: string;
    cities: City[];
    error?: boolean;
  }>({ country: "", cities: [] });
  const [query, setQuery] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!country) return;
    const controller = new AbortController();
    let active = true;
    fetch(`/data/professional-cities/${country}.json`, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("Location catalog unavailable");
        return response.json() as Promise<unknown>;
      })
      .then((data) => {
        if (
          !Array.isArray(data) ||
          !data.every(
            (row) =>
              Array.isArray(row) &&
              row.length === 3 &&
              row.every((value) => typeof value === "string"),
          )
        )
          throw new Error("Invalid location catalog");
        if (active) setResult({ country, cities: data as City[] });
      })
      .catch(() => {
        if (active) setResult({ country, cities: [], error: true });
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [country, retry]);
  const countryOptions = useMemo(() => {
    const names = new Intl.DisplayNames([language], { type: "region" });
    return countries
      .map(([code, name]) => [code!, names.of(code!) ?? name!] as const)
      .sort((a, b) => a[1].localeCompare(b[1], language));
  }, [language]);
  const ready = result.country === country && !result.error;
  const cities = ready ? result.cities : [];
  const matches = useMemo(() => {
    const search = normalize(query);
    return cities.filter(([, name]) => normalize(name).includes(search));
  }, [cities, query]);
  const visible = matches.slice(0, 200);
  const selected = cities.find(([id]) => id === city);
  if (selected && !visible.some(([id]) => id === city))
    visible.unshift(selected);
  return (
    <>
      <label className="professionals-field">
        <span>{t("País", "Country")}</span>
        <select
          aria-label={t("País", "Country")}
          value={country}
          onChange={(event) => {
            setQuery("");
            onCountry(event.target.value);
          }}
        >
          <option value="">
            {t("Seleccioná un país", "Select a country")}
          </option>
          {countryOptions.map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <div className="professionals-field">
        <label htmlFor="professional-city">{t("Ciudad", "City")}</label>
        {country && ready && cities.length > 0 && (
          <Input
            type="search"
            maxLength={100}
            aria-label={t("Buscar ciudad", "Search cities")}
            placeholder={t("Buscar ciudad", "Search cities")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        )}
        <select
          id="professional-city"
          value={city}
          disabled={!country || !ready || !cities.length}
          onChange={(event) => onCity(event.target.value)}
        >
          <option value="">
            {t("Seleccioná una ciudad", "Select a city")}
          </option>
          {visible.map(([id, name, region]) => (
            <option key={id} value={id}>
              {name}
              {region ? ` · ${region}` : ""}
            </option>
          ))}
        </select>
        <small role="status">
          {!country
            ? t("Primero seleccioná un país", "Select a country first")
            : result.country !== country
              ? t("Cargando ciudades…", "Loading cities…")
              : result.error
                ? t(
                    "No se pudieron cargar las ciudades",
                    "Could not load cities",
                  )
                : !cities.length
                  ? t("No hay ciudades disponibles", "No cities available")
                  : !matches.length
                    ? t("No se encontraron ciudades", "No cities found")
                    : matches.length > 200
                      ? t(
                          "Escribí para filtrar la lista de ciudades",
                          "Type to narrow down the city list",
                        )
                      : ""}
        </small>
        {country && result.country === country && result.error && (
          <Button
            variant="secondary"
            onClick={() => {
              setResult({ country: "", cities: [] });
              setRetry((value) => value + 1);
            }}
          >
            {t("Reintentar", "Retry")}
          </Button>
        )}
      </div>
      <small className="professionals-location-source">
        <a href="https://www.geonames.org/" target="_blank" rel="noreferrer">
          GeoNames
        </a>{" "}
        ·{" "}
        <a
          href="https://creativecommons.org/licenses/by/4.0/"
          target="_blank"
          rel="noreferrer"
        >
          CC BY 4.0
        </a>
      </small>
    </>
  );
}
