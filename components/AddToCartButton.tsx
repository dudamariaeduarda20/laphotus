'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useCart, CartItem } from '@/lib/contexts/CartContext';

interface AddToCartButtonProps {
  photoId: string;
  photoName: string;
  photoPrice: number;
  eventId: string;
  eventTitle: string;
  photographerId: string;
  photographerName: string;
  className?: string;
}

export default function AddToCartButton({
  photoId,
  photoName,
  photoPrice,
  eventId,
  eventTitle,
  photographerId,
  photographerName,
  className = '',
}: AddToCartButtonProps) {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<'success' | 'error' | null>(null);
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const router = useRouter();

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      const cartItem: CartItem = {
        id: photoId,
        photoId,
        name: photoName,
        price: photoPrice,
        eventId,
        eventTitle,
        photographerId,
        photographerName,
      };
      addItem(cartItem);
      setFeedback('success');
      setTimeout(() => setFeedback(null), 3000);
    } catch (error) {
      console.error('Add to cart failed:', error);
      setFeedback('error');
      setTimeout(() => setFeedback(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleAddToCart}
        disabled={loading}
        className={`px-6 py-3 bg-[#ff2f92] text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition ${className}`}
      >
        {loading ? 'Adicionando...' : 'Adicionar ao Carrinho'}
      </button>
      {feedback === 'success' && (
        <p className="text-sm text-green-600 font-medium">✓ Adicionado ao carrinho</p>
      )}
      {feedback === 'error' && (
        <p className="text-sm text-red-600 font-medium">✗ Erro ao adicionar</p>
      )}
    </div>
  );
}
