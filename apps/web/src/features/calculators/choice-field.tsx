"use client";
import { useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

/**
 * Looks like a select but opens a floating list. A long choice wraps instead of
 * being cut off when the field only takes half the width.
 */
export function ChoiceField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const chosen = useRef<HTMLButtonElement>(null);
  const shown = options.find((option) => option.value === value)?.label;
  return (
    <div className="choice-field">
      <span aria-hidden="true">{label}</span>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-label={`${label}: ${shown}`}
        onClick={() => setOpen(true)}
      >
        <span>{shown}</span>
        <ChevronDown aria-hidden="true" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          initialFocus={chosen}
          className="w-[calc(100%-2rem)] max-w-[420px] gap-3 p-5 sm:max-w-[420px]"
        >
          <DialogTitle className="pr-8 text-lg font-bold">{label}</DialogTitle>
          <div className="filter-list exercise-options">
            {options.map((option) => (
              <button
                key={option.value}
                ref={option.value === value ? chosen : undefined}
                type="button"
                aria-pressed={option.value === value}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
