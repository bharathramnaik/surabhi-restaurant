import { cn } from "@/lib/utils.ts";

function Spinner({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin", className)}
      {...props}
    />
  );
}

export { Spinner };
