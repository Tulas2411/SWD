'use client'

import { useState } from 'react';
import { orderMedicine } from '@/app/actions/orderMedicine';
import { clearCart } from '@/app/actions/cartActions';
import { AlertTriangle, CreditCard, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

export default function CheckoutForm({ cart }: { cart: any[] }) {
  const hasRx = cart.some(item => item.isRxRequired);
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Still using the Mock Patient
  const patientId = '65f0a0e5b9b2a61234567890';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const cartPayload = cart.map(i => ({ id: i.id, quantity: i.quantity }));
    formData.append('cart', JSON.stringify(cartPayload));
    formData.append('patientId', patientId);

    const result = await orderMedicine(formData);

    if (result.error) {
      setMessage({ type: 'error', text: result.error });
    } else if (result.success) {
      setMessage({ type: 'success', text: `Order #${result.orderId} placed successfully!` });
      // Clear real cart after ordering
      await clearCart(patientId);
    }
    
    setLoading(false);
  };

  if (cart.length === 0 && !message?.success) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center bg-white rounded-3xl mt-12 shadow-sm border border-slate-200">
        <ShoppingCart className="mx-auto h-16 w-16 text-slate-300 mb-6" />
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Your Cart is Empty</h2>
        <p className="text-slate-500 mb-8">Pills are waiting for you in the pharmacy.</p>
        <Link href="/pharmacy" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-colors">
          Browse Medicines
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
      {/* Cart Review */}
      <div className="md:col-span-1 order-2 md:order-1">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-6">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Order Summary</h2>
          <div className="space-y-4 mb-6">
            {cart.map(item => (
              <div key={item.id} className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">{item.name}</h4>
                  <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                </div>
                <span className="font-semibold text-slate-800">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-100 pt-4 flex justify-between items-center text-lg font-bold">
            <span>Total</span>
            <span className="text-blue-600">${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Checkout Form */}
      <div className="md:col-span-2 order-1 md:order-2">
        {message?.success ? (
          <div className="bg-white rounded-3xl shadow-xl border border-emerald-100 overflow-hidden text-center p-12">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">✓</div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Order Confirmed!</h2>
            <p className="text-slate-600 mb-8">{message.text}</p>
            <Link href="/pharmacy" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-colors">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-100">
              <h2 className="text-2xl font-bold text-slate-900">Secure Checkout</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              {message && (
                <div className={`p-4 rounded-xl font-medium ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                  {message.text}
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                  <CreditCard className="mr-2 w-5 h-5" /> Shipping Address
                </h3>
                <textarea 
                  name="address" 
                  rows={2} 
                  required
                  placeholder="123 Example St, Hanoi"
                  className="w-full rounded-xl border border-slate-200 p-3 bg-slate-50 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {hasRx && (
                <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl">
                  <h3 className="text-lg font-semibold text-blue-900 flex items-center mb-2">
                    <AlertTriangle className="mr-2 w-5 h-5 text-amber-500" />
                    Prescription Required (BR-12)
                  </h3>
                  <p className="text-sm text-blue-800 mb-6">
                    Because your cart contains prescription (Rx) medicine, you must provide a valid doctor's prescription.
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-blue-900 mb-2">Upload Prescription File</label>
                      <input 
                        type="file" 
                        name="prescriptionFile" 
                        accept="image/*,.pdf" 
                        required 
                        className="w-full text-blue-800 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 bg-white border border-blue-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-blue-900 mb-2">Issue Date (BR-13: Must be &le; 30 days)</label>
                      <input 
                        type="date" 
                        name="issueDate" 
                        required 
                        className="w-full rounded-xl border border-blue-200 p-3 bg-white focus:border-blue-500 text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing Order...' : 'Place Order'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
      
    </div>
  );
}
