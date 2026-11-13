"use client";
import { cn } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./dialog";
export function AppDialog({
  open,
  onClose,
  title,
  titleAction,
  compactHeader = false,
  description = "",
  children,
  overlayClassName,
  disablePointerDismissal = false,
  centered = false,
  backLabel,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  titleAction?: React.ReactNode;
  compactHeader?: boolean;
  description?: string;
  children: React.ReactNode;
  overlayClassName?: string;
  disablePointerDismissal?: boolean;
  centered?: boolean;
  /** Replaces the corner cross with a back arrow on the left (label for screen readers). */
  backLabel?: string;
}) {
  return (
    <Dialog
      open={open}
      disablePointerDismissal={disablePointerDismissal}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
    >
      <DialogContent
        overlayClassName={overlayClassName}
        showCloseButton={!backLabel}
        className={cn(
          "w-[calc(100%-2rem)] max-w-[680px] sm:max-w-[680px] p-5",
          compactHeader && "compact-dialog",
        )}
      >
        {backLabel && (
          <DialogClose
            className="dialog-back-button"
            aria-label={backLabel}
          >
            <ChevronLeft aria-hidden="true" />
          </DialogClose>
        )}
        <DialogHeader className={centered ? "text-center" : undefined}>
          <div
            className={
              centered
                ? cn("flex items-center justify-center gap-2", backLabel && "px-10")
                : compactHeader
                  ? "compact-dialog-header flex items-center justify-between gap-2 pr-7"
                  : "flex items-center gap-2 pr-8"
            }
          >
            <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
            {titleAction}
          </div>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
