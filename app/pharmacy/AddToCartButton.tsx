'use client'

import { useTransition, useState } from 'react';
import { addToCart } from '@/app/actions/cartActions';
import { Check } from 'lucide-react';

export default function AddToCartButton({ medicineId, disabled }: { medicineId: string, disabled: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append('medicineId', medicineId);
      const res = await addToCart(formData);
      if (res?.success) {
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
      } else if (res?.error) {
        alert(res.error);
      }
    });
  };

  return (
    <button 
      onClick={handleAdd}
      disabled={disabled || isPending || added}
      className={`w-full font-semibold py-3 px-4 rounded-xl transition-colors ${
        added 
          ? 'bg-emerald-500 text-white' 
          : 'bg-slate-900 hover:bg-slate-800 text-white disabled:bg-slate-300 disabled:cursor-not-allowed'
      }`}
    >
      {isPending ? 'Adding...' : added ? <span className="flex items-center justify-center"><Check className="w-5 h-5 mr-1" /> Added</span> : 'Add to Cart'}
    </button>
  );
}
