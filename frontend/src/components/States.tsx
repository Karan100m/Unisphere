import { Loader2, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export function LoadingState({ label = "Loading...", className }: { label?: string; className?: string }) {
  return (
    <div
      data-testid="loading-state"
      className={cn("flex flex-col items-center justify-center gap-3 py-16 text-slate-400", className)}
    >
      <Loader2 className="size-7 animate-spin text-violet-400" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  testId = "empty-state",
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  testId?: string;
}) {
  return (
    <div
      data-testid={testId}
      className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-14 text-center"
    >
      <div className="grid size-12 place-items-center rounded-xl bg-violet-500/10 text-violet-400">
        {icon ?? <Inbox className="size-6" />}
      </div>
      <h3 className="font-heading text-base font-semibold text-slate-100">{title}</h3>
      {description && <p className="max-w-sm text-sm text-slate-400">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, testId = "error-state" }: { message?: string; testId?: string }) {
  return (
    <div
      data-testid={testId}
      className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.06] px-5 py-6 text-center"
    >
      <p className="text-sm text-rose-300">{message ?? "We couldn't load this content right now."}</p>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
      <div className="flex gap-3">
        <div className="size-11 rounded-full bg-white/[0.06]" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-1/3 rounded bg-white/[0.06]" />
          <div className="h-2.5 w-1/4 rounded bg-white/[0.04]" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-2.5 w-full rounded bg-white/[0.05]" />
        <div className="h-2.5 w-4/5 rounded bg-white/[0.05]" />
      </div>
    </div>
  );
}
