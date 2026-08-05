import { ShoppingBasket } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "h-9 w-9",
  md: "h-11 w-11",
  lg: "h-14 w-14",
};

export function Logo({ className, showText = false, size = "md" }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-primary text-white shadow-soft",
          sizes[size],
        )}
      >
        <ShoppingBasket
          className={cn(
            size === "sm" ? "h-4 w-4" : size === "md" ? "h-5 w-5" : "h-6 w-6",
          )}
          strokeWidth={2.2}
        />
      </div>
      {showText && (
        <div className="leading-tight">
          <p className="text-[17px] font-bold text-secondary">Big Bro</p>
          <p className="text-[10px] font-semibold tracking-[0.18em] text-primary">
            SHAWARMA
          </p>
        </div>
      )}
    </div>
  );
}
