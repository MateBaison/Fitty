"use client";
import { useSwipeNavigation } from "@/lib/browser/use-swipe-navigation";
import { useState } from "react";
import { ClocksScreen } from "./clocks-screen";
import { CalculatorsScreen } from "@/features/calculators/calculators-screen";
import { useApp } from "@/state/app-provider";
export function ToolsScreen() {
  const [section, setSection] = useState("clocks"),
    { t } = useApp();
  const swipe = useSwipeNavigation((direction) => {
    if (section === "clocks" && direction === "next") {
      setSection("calculators");
      return true;
    }
    if (section === "calculators" && direction === "previous") {
      setSection("clocks");
      return true;
    }
    return false;
  });
  return (
    <div className="swipe-navigation" {...swipe}>
      <div className="muscle-chips">
        <button
          aria-pressed={section === "clocks"}
          onClick={() => setSection("clocks")}
        >
          {t("Reloj", "Clock")}
        </button>
        <button
          aria-pressed={section === "calculators"}
          onClick={() => setSection("calculators")}
        >
          {t("Calculadoras", "Calculators")}
        </button>
      </div>
      {section === "clocks" ? <ClocksScreen /> : <CalculatorsScreen />}
    </div>
  );
}
