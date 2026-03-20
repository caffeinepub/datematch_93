import { useState } from "react";
import { Check, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useReportUser } from "../../hooks/useQueries";

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetPrincipal: string;
  targetName: string;
  onSuccess: () => void;
}

const REASONS = [
  "Fake profile / Spam",
  "Inappropriate content",
  "Harassment or Hate speech",
  "Underage",
  "Other",
];

export function ReportDialog({
  open,
  onOpenChange,
  targetPrincipal,
  targetName,
  onSuccess,
}: ReportDialogProps) {
  const [reason, setReason] = useState(REASONS[0]);
  const { mutate: report, isPending } = useReportUser();
  const isDesktop = !useIsMobile(1024);

  const handleReport = () => {
    report(
      { target: targetPrincipal, reason },
      {
        onSuccess: () => {
          toast.success("User reported and blocked");
          onOpenChange(false);
          onSuccess();
        },
        onError: (err) => {
          toast.error(err.message || "Failed to submit report");
        },
      },
    );
  };

  const body = (
    <div className="flex flex-col gap-0">
      {/* Description */}
      <p className="text-sm text-muted-foreground px-6 pb-5">
        Help us keep DateMatch safe. They will also be automatically blocked.
      </p>

      {/* Reason list */}
      <div className="mb-4">
        {REASONS.map((r) => (
          <button
            key={r}
            onClick={() => setReason(r)}
            className={cn(
              "w-full flex items-center justify-between px-6 py-3.5 text-left transition-colors",
              reason === r ? "bg-primary/5" : "hover:bg-hover",
            )}
          >
            <span
              className={cn(
                "text-sm font-medium",
                reason === r ? "text-primary" : "text-foreground",
              )}
            >
              {r}
            </span>
            {reason === r && (
              <Check className="w-4 h-4 text-primary shrink-0" />
            )}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 px-6 pb-6">
        <button
          onClick={handleReport}
          disabled={isPending}
          className="w-full h-12 rounded-2xl bg-destructive text-destructive-foreground text-sm font-bold flex items-center justify-center transition-opacity disabled:opacity-50"
        >
          {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Submit Report
        </button>
        <button
          onClick={() => onOpenChange(false)}
          disabled={isPending}
          className="w-full h-11 rounded-2xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-hover transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  if (!isDesktop) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl flex flex-col p-0 gap-0 [&>button]:hidden"
        >
          <div className="w-10 h-1 rounded-full bg-border mx-auto mt-4 mb-0 shrink-0" />
          <div className="shrink-0 flex items-center gap-2.5 px-6 pt-5 pb-4">
            <ShieldAlert className="w-5 h-5 text-destructive shrink-0" />
            <SheetTitle className="text-base font-bold">
              Report {targetName}
            </SheetTitle>
          </div>
          {body}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="border-border max-w-sm flex flex-col p-0 gap-0 overflow-hidden rounded-3xl"
      >
        <div className="shrink-0 flex items-center gap-2.5 px-6 pt-6 pb-4">
          <ShieldAlert className="w-5 h-5 text-destructive shrink-0" />
          <DialogTitle className="text-base font-bold">
            Report {targetName}
          </DialogTitle>
        </div>
        {body}
      </DialogContent>
    </Dialog>
  );
}
