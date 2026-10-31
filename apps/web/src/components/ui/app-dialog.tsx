"use client";
import { cn } from "@/lib/utils";
import {
  Dialog,
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
        className={cn(
          "w-[calc(100%-2rem)] max-w-[680px] sm:max-w-[680px] p-5",
          compactHeader && "compact-dialog",
        )}
      >
        <DialogHeader className={centered ? "text-center" : undefined}>
          <div
            className={
              centered
                ? "flex items-center justify-center gap-2"
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
