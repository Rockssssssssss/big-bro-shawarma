import { cn } from "@/lib/utils";

interface IconProps {
  className?: string;
  active?: boolean;
}

/** Realistic wrap-style shawarma icon */
export function ShawarmaIcon({ className, active }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn("h-5 w-5", className)}
      aria-hidden
    >
      <path
        d="M7.5 4.5c1.2-1.4 3.8-1.6 6.2-.4 2.2 1.1 3.8 3.2 4.3 5.6.4 2.1-.1 4.2-1.4 5.9L11 21.2c-.7.6-1.8.4-2.2-.4L4.6 12.5c-.7-1.5-.4-3.3.8-4.5l2.1-2.1Z"
        fill={active ? "currentColor" : "#E8A06A"}
        opacity={active ? 0.95 : 1}
      />
      <path
        d="M8.2 6.2c1.6 1.4 3.6 2.2 5.7 2.4"
        stroke={active ? "rgba(255,255,255,0.75)" : "#4B2E2B"}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M7.4 8.8c1.8 1.5 4 2.3 6.3 2.4"
        stroke={active ? "rgba(255,255,255,0.65)" : "#4B2E2B"}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M6.8 11.4c1.9 1.4 4.1 2.1 6.4 2.1"
        stroke={active ? "rgba(255,255,255,0.55)" : "#4B2E2B"}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <circle cx="15.2" cy="8.2" r="1.1" fill={active ? "#fff" : "#22C55E"} />
      <circle cx="13.4" cy="11" r="0.9" fill={active ? "#fff" : "#F97316"} />
    </svg>
  );
}

/** Nice gift-box package icon */
export function GiftPackageIcon({ className, active }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn("h-5 w-5", className)}
      aria-hidden
    >
      <rect
        x="4"
        y="10"
        width="16"
        height="10"
        rx="2"
        fill={active ? "currentColor" : "#F97316"}
      />
      <rect
        x="3.5"
        y="7"
        width="17"
        height="3.5"
        rx="1.2"
        fill={active ? "rgba(255,255,255,0.9)" : "#4B2E2B"}
      />
      <path
        d="M12 7v13"
        stroke={active ? "#F97316" : "#fff"}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 7c-1.6-2.4-4.2-2.6-4.8-1.2-.5 1.2.6 2.4 2.4 3.2L12 10"
        fill={active ? "rgba(255,255,255,0.95)" : "#EA580C"}
      />
      <path
        d="M12 7c1.6-2.4 4.2-2.6 4.8-1.2.5 1.2-.6 2.4-2.4 3.2L12 10"
        fill={active ? "rgba(255,255,255,0.95)" : "#FDBA74"}
      />
      <path
        d="M4 14.5h16"
        stroke={active ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.45)"}
        strokeWidth="1"
      />
    </svg>
  );
}

/** Cold drink / soda cup icon */
export function DrinkIcon({ className, active }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn("h-5 w-5", className)}
      aria-hidden
    >
      <path
        d="M8 3h8l-.7 2.2H8.7L8 3Z"
        fill={active ? "currentColor" : "#4B2E2B"}
      />
      <path
        d="M7.2 6h9.6l-1.3 12.2c-.1 1.1-1 1.9-2.1 1.9H10.6c-1.1 0-2-.8-2.1-1.9L7.2 6Z"
        fill={active ? "currentColor" : "#F97316"}
      />
      <path
        d="M9.2 10.5h5.6"
        stroke={active ? "rgba(255,255,255,0.7)" : "#fff"}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M9.5 13.5h5"
        stroke={active ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.8)"}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M14.5 3.2c1.4.2 2.6 1.1 3.2 2.4"
        stroke={active ? "rgba(255,255,255,0.8)" : "#4B2E2B"}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="10.2" cy="16.2" r="0.7" fill={active ? "#fff" : "#FFEDD5"} />
    </svg>
  );
}

/** Sparkle for All */
export function AllIcon({ className, active }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn("h-5 w-5", className)}
      aria-hidden
    >
      <path
        d="M12 3.5 13.6 9.2 19.5 10.5 13.6 11.8 12 17.5 10.4 11.8 4.5 10.5 10.4 9.2 12 3.5Z"
        fill={active ? "currentColor" : "#F59E0B"}
      />
      <path
        d="M18.2 14.2 19 16.8 21.5 17.5 19 18.2 18.2 20.8 17.4 18.2 14.9 17.5 17.4 16.8 18.2 14.2Z"
        fill={active ? "rgba(255,255,255,0.9)" : "#F97316"}
      />
    </svg>
  );
}
