import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  backHref?: string;
  className?: string;
  action?: React.ReactNode;
}

export function PageHeader({
  title,
  backHref,
  className,
  action,
}: PageHeaderProps) {
  return (
    <div className={cn("flex items-center gap-2 px-4 pb-3 pt-1", className)}>
      {backHref ? (
        <Link
          href={backHref}
          className="flex h-9 w-9 items-center justify-center rounded-full text-secondary hover:bg-white"
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
      ) : (
        <div className="w-9" />
      )}
      <h1 className="flex-1 text-lg font-bold text-secondary">{title}</h1>
      {action ?? <div className="w-9" />}
    </div>
  );
}
