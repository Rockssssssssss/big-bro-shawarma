import { formatCedi } from "@/lib/utils";

const history = [
  {
    id: "h1",
    orderId: "BB-1028",
    customer: "Yaw Osei",
    address: "East Legon",
    amount: 67,
    earning: 12,
    time: "Yesterday · 8:40 PM",
  },
  {
    id: "h2",
    orderId: "BB-1022",
    customer: "Ama Mensah",
    address: "Cantonments",
    amount: 118,
    earning: 15,
    time: "Yesterday · 2:15 PM",
  },
  {
    id: "h3",
    orderId: "BB-1015",
    customer: "Efua Darko",
    address: "Labone",
    amount: 55,
    earning: 12,
    time: "Aug 2 · 1:05 PM",
  },
  {
    id: "h4",
    orderId: "BB-1009",
    customer: "Kojo Boateng",
    address: "Osu",
    amount: 160,
    earning: 18,
    time: "Aug 1 · 7:22 PM",
  },
];

export default function RiderHistoryPage() {
  const totalEarnings = history.reduce((s, h) => s + h.earning, 0);

  return (
    <div className="animate-fade-up px-4 py-4">
      <h1 className="text-xl font-bold text-secondary">History</h1>
      <p className="text-sm text-muted">Completed deliveries</p>

      <div className="mt-4 rounded-[20px] bg-secondary p-5 text-white shadow-card">
        <p className="text-sm text-white/70">Earnings (recent)</p>
        <p className="mt-1 text-3xl font-extrabold">
          {formatCedi(totalEarnings)}
        </p>
        <p className="mt-1 text-xs text-white/60">
          {history.length} completed deliveries
        </p>
      </div>

      <div className="mt-4 space-y-2.5">
        {history.map((h) => (
          <article
            key={h.id}
            className="rounded-[20px] bg-white p-4 shadow-card"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold text-secondary">{h.customer}</p>
                <p className="text-xs text-muted">
                  {h.orderId} · {h.address}
                </p>
              </div>
              <p className="font-bold text-accent">+{formatCedi(h.earning)}</p>
            </div>
            <div className="mt-2 flex justify-between text-xs text-muted">
              <span>Collected {formatCedi(h.amount)}</span>
              <span>{h.time}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
