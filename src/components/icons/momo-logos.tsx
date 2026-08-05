/** Official Mobile Money brand marks — visual only. */
export function MtnMomoLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      aria-hidden
      role="img"
    >
      <title>MTN Mobile Money</title>
      <rect width="40" height="40" rx="10" fill="#FFCC00" />
      <text
        x="20"
        y="24"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="800"
        fontSize="11"
        fill="#1A1A1A"
      >
        MTN
      </text>
    </svg>
  );
}

export function TelecelCashLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      aria-hidden
      role="img"
    >
      <title>Telecel Cash</title>
      <rect width="40" height="40" rx="10" fill="#E60027" />
      <text
        x="20"
        y="18"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="800"
        fontSize="7"
        fill="#FFFFFF"
      >
        telecel
      </text>
      <text
        x="20"
        y="28"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="700"
        fontSize="7"
        fill="#FFFFFF"
      >
        Cash
      </text>
    </svg>
  );
}
