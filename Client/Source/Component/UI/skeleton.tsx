import { cn } from "@/Library/Utility";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-Pulse rounded-md bg-muted", className)} {...props} />;
}

export { Skeleton };
