import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
  {
    variants: {
      variant: {
        primary: "bg-primary text-white hover:bg-primary-dark shadow-soft",
        secondary: "bg-secondary text-white hover:bg-secondary-muted",
        outline:
          "border border-border bg-white text-secondary hover:bg-primary-light/40",
        ghost: "bg-transparent text-secondary hover:bg-primary-light/50",
        soft: "bg-primary-light text-primary hover:bg-primary/15",
        danger: "bg-danger-light text-danger hover:bg-danger/15",
      },
      size: {
        sm: "h-9 px-4 text-sm rounded-full",
        md: "h-11 px-5 text-sm rounded-full",
        lg: "h-14 px-6 text-base rounded-[24px]",
        xl: "h-16 px-6 text-base rounded-[24px]",
        icon: "h-11 w-11 rounded-full",
        "icon-sm": "h-9 w-9 rounded-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({
  className,
  variant,
  size,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
