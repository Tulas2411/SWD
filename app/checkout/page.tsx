import connectToDatabase from '@/utils/mongodb';
import { Cart, Medicine } from '@/utils/models';
import CheckoutForm from './CheckoutForm';

export const revalidate = 0;

export default async function CheckoutPage() {
  await connectToDatabase();
  const patientId = '65f0a0e5b9b2a61234567890';
  
  // We must import Medicine so Mongoose registers it for population
  if (!Medicine) console.warn('Medicine model imported to register schema');

  const cartDoc = await Cart.findOne({ patientId }).populate('items.medicineId').lean();
  let realCart: any[] = [];

  if (cartDoc && cartDoc.items) {
    realCart = cartDoc.items
      .filter((item: any) => item.medicineId) // Avoid deleted medicines
      .map((item: any) => ({
        id: item.medicineId._id.toString(),
        name: item.medicineId.name,
        quantity: item.quantity,
        isRxRequired: item.medicineId.isRxRequired,
        price: item.medicineId.price
      }));
  }

  return <CheckoutForm cart={realCart} />;
}
