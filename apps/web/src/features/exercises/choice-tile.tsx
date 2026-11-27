"use client";
import { useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

/** A square choice; pressing it opens a floating list, like in the phone app. */
export function ChoiceTile<T extends string>({
  icon: Icon,
  label,
  value,
  options,
  onChange,
}: {
  icon: LucideIcon;
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const chosen = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button
        type="button"
        className="exercise-tile"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <Icon aria-hidden="true" />
        <span>{label}</span>
        <strong>
          {options.find((option) => option.value === value)?.label}
        </strong>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          initialFocus={chosen}
          // This window opens over the form's own window and must dim it too.
          overlayForceRender
          overlayClassName="bg-black/60"
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
    </>
  );
}
