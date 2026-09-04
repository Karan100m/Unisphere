import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Flag } from "lucide-react";
import { apiPost } from "@/lib/api";
import { getErrorMessage, REPORT_REASONS } from "@/lib/helpers";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  targetType: "user" | "post" | "comment" | "story" | "message";
  targetId: string;
  targetLabel?: string;
}

export function ReportDialog({ open, onOpenChange, targetType, targetId, targetLabel }: ReportDialogProps) {
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState("");

  const reportMutation = useMutation({
    mutationFn: () =>
      apiPost("/safety/report", {
        target_type: targetType,
        target_id: targetId,
        reason,
        details,
      }),
    onSuccess: () => {
      toast.success("Report submitted. Our safety team will review it shortly.");
      setDetails("");
      onOpenChange(false);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="report-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading">
            <Flag className="size-4 text-rose-400" /> Report {targetType}
          </DialogTitle>
          <DialogDescription>
            {targetLabel
              ? `Reporting: ${targetLabel}`
              : "Help us keep Unisphere safe. Reports are confidential."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-400">Reason</p>
            <div className="flex flex-col gap-1.5">
              {REPORT_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  data-testid={`report-reason-${r.split(" ")[0].toLowerCase()}`}
                  onClick={() => setReason(r)}
                  className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors duration-200 ${
                    reason === r
                      ? "border-violet-500/60 bg-violet-500/10 text-violet-200"
                      : "border-white/[0.08] text-slate-300 hover:border-white/20"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <Textarea
            data-testid="report-details-input"
            placeholder="Add any additional context (optional)"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={3}
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} data-testid="report-cancel-btn">
            Cancel
          </Button>
          <Button
            variant="destructive"
            data-testid="report-submit-btn"
            disabled={reportMutation.isPending}
            onClick={() => reportMutation.mutate()}
          >
            {reportMutation.isPending ? "Submitting..." : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
