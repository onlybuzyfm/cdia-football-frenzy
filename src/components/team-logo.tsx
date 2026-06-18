import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export function TeamLogo({
  name,
  url,
  color,
  size = 40,
  className,
}: {
  name?: string | null;
  url?: string | null;
  color?: string | null;
  size?: number;
  className?: string;
}) {
  if (url) {
    return (
      <img
        src={url}
        alt={name ? `Escudo ${name}` : "Escudo"}
        width={size}
        height={size}
        className={cn("inline-block rounded-md object-cover ring-1 ring-border", className)}
        style={{ width: size, height: size }}
      />
    );
  }
  const initials = (name ?? "?")
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-md text-xs font-bold text-white ring-1 ring-black/10",
        className,
      )}
      style={{ width: size, height: size, backgroundColor: color || "oklch(0.32 0.16 258)" }}
    >
      {initials || <Shield className="h-4 w-4" />}
    </span>
  );
}