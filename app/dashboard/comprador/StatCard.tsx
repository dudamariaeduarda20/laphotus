interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  color: string;
}

export default function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <div className={`rounded-lg border p-6 ${color}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-[#666]">{label}</p>
          <p className="mt-2 text-3xl font-bold text-[#333]">{value}</p>
        </div>
        <span className="text-4xl">{icon}</span>
      </div>
    </div>
  );
}
