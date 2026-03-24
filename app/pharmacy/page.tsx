import connectToDatabase from '@/utils/mongodb';
import { Medicine } from '@/utils/models';
import Link from 'next/link';
import { Pill, ShoppingCart, AlertCircle } from 'lucide-react';
import AddToCartButton from './AddToCartButton';

export const revalidate = 0;

export default async function PharmacyPage() {
  let medicines: any[] = [];
  let error = false;

  try {
    await connectToDatabase();
    medicines = await Medicine.find({}).sort({ name: 1 }).lean();
  } catch (err) {
    error = true;
  }

  if (error) {
    return <div className="p-8 text-red-500">Database connection error.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">E-Pharmacy</h1>
            <p className="mt-2 text-lg text-slate-500">Order your medicines online for quick home delivery.</p>
          </div>
          <Link href="/checkout" className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-medium shadow-md transition-colors">
            <ShoppingCart className="w-5 h-5 mr-2" />
            Go to Checkout
          </Link>
        </div>

        {(!medicines || medicines.length === 0) ? (
          <div className="text-center bg-white p-12 rounded-2xl shadow-sm border border-slate-200">
            <Pill className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <p className="text-slate-500">Our pharmacy catalog is currently empty.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
            {medicines.map((med) => (
              <div key={med._id.toString()} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-lg transition-shadow">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-emerald-100 text-emerald-600 p-3 rounded-xl">
                      <Pill className="w-6 h-6" />
                    </div>
                    {med.isRxRequired && (
                      <span className="flex items-center text-xs font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-md">
                        <AlertCircle className="w-3 h-3 mr-1" /> Rx Only
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">{med.name}</h3>
                  <p className="text-2xl font-black text-blue-600 mb-4">${med.price.toFixed(2)}</p>
                  
                  <div className="text-sm font-medium text-slate-500 mb-6">
                    {med.stockQuantity > 0 ? (
                      <span className="text-emerald-500">In Stock: {med.stockQuantity}</span>
                    ) : (
                      <span className="text-red-500">Out of Stock (BR-14)</span>
                    )}
                  </div>
                </div>
                
                <AddToCartButton medicineId={med._id.toString()} disabled={med.stockQuantity === 0} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
