interface OrderStatusBadgeProps {
  status: string;
}

export default function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const statusMap: {
    [key: string]: { label: string; color: string };
  } = {
    PENDING: {
      label: "Pendente",
      color: "bg-yellow-100 text-yellow-800 border-yellow-300",
    },
    COMPLETED: {
      label: "Pago",
      color: "bg-green-100 text-green-800 border-green-300",
    },
    PROCESSING: {
      label: "Processando",
      color: "bg-blue-100 text-blue-800 border-blue-300",
    },
    FAILED: {
      label: "Falhou",
      color: "bg-red-100 text-red-800 border-red-300",
    },
    REFUNDED: {
      label: "Reembolsado",
      color: "bg-slate-100 text-slate-800 border-slate-300",
    },
  };

  const statusInfo = statusMap[status] || statusMap.PENDING;

  return (
    <span
      className={`inline-block rounded-full border px-4 py-2 text-sm font-semibold ${statusInfo.color}`}
    >
      {statusInfo.label}
    </span>
  );
}
