"use client";
import { useEffect } from "react";
import { INCOMING_ROUTINE_KEY } from "@fitty/core/storage/account-cache";
export function AuthEntry() {
  useEffect(() => {
    const hash = new URLSearchParams(location.hash.slice(1));
    const routine = hash.get("routine");
    if (routine && routine.length <= 120_000) {
      sessionStorage.setItem(INCOMING_ROUTINE_KEY, routine);
      history.replaceState(null, "", location.pathname + location.search);
    }
  }, []);
  return null;
}
