import { CartItem as CartItemType, useCart } from "@/lib/contexts/CartContext";

interface CartItemProps {
  item: CartItemType;
}

export default function CartItem({ item }: CartItemProps) {
  const { removeItem } = useCart();

  return (
    <div className="flex gap-4 py-4 border-b border-gray-200">
      {/* Placeholder */}
      <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
        <div className="text-3xl">📸</div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 line-clamp-2">
          {item.name}
        </h3>
        <p className="text-sm text-gray-600">
          {item.eventTitle} • de {item.photographerName}
        </p>
      </div>

      {/* Price & Remove */}
      <div className="text-right flex flex-col justify-between">
        <div className="text-lg font-bold text-green-600">
          € {item.price.toFixed(2)}
        </div>
        <button
          onClick={() => removeItem(item.photoId)}
          className="text-red-600 hover:text-red-700 text-sm font-semibold"
        >
          Remover
        </button>
      </div>
    </div>
  );
}
