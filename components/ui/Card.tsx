import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, children, ...rest }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <section {...rest} className={cn("card", className)}>
      {children}
    </section>
  );
}

export function CardTitle({ children, sub, right }: { children: ReactNode; sub?: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-3">
      <div>
        <h2 className="t-card">{children}</h2>
        {sub ? <p className="t-cap mt-0.5">{sub}</p> : null}
      </div>
      {right}
    </div>
  );
}
