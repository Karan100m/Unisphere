import { initials } from "@/lib/helpers";
import { cn } from "@/lib/utils";

interface AvatarProps {
  src?: string;
  name: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  ring?: boolean;
  testId?: string;
}

const SIZES: Record<string, string> = {
  xs: "size-7 text-[10px]",
  sm: "size-9 text-xs",
  md: "size-11 text-sm",
  lg: "size-14 text-base",
  xl: "size-20 text-xl",
  "2xl": "size-28 text-3xl",
};

export function Avatar({ src, name, size = "md", className, ring, testId }: AvatarProps) {
  return (
    <div
      data-testid={testId}
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-violet-500 to-amber-500 flex items-center justify-center font-semibold text-white",
        SIZES[size],
        ring && "ring-2 ring-violet-500/60 ring-offset-2 ring-offset-[#0B0713]",
        className,
      )}
    >
      {src ? (
        <img src={src} alt={name} loading="lazy" className="size-full object-cover" />
      ) : (
        <span>{initials(name)}</span>
      )}
    </div>
  );
}
