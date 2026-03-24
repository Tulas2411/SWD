'use server'

import connectToDatabase from '@/utils/mongodb';
import { Cart, Medicine } from '@/utils/models';
import { revalidatePath } from 'next/cache';

// Mock patientID since we don't have authentication
const PATIENT_ID = '65f0a0e5b9b2a61234567890'; 

export async function addToCart(formData: FormData) {
  try {
    await connectToDatabase();
  } catch (e) {
    return { error: 'Database connection failed' };
  }

  const medicineId = formData.get('medicineId') as string;
  if (!medicineId) return { error: 'Medicine ID is missing' };

  // Verify medicine exists and is in stock
  const medicine = await Medicine.findById(medicineId);
  if (!medicine || medicine.stockQuantity < 1) {
    return { error: 'Item out of stock or not found' };
  }

  // Find or create cart for the patient
  let cart = await Cart.findOne({ patientId: PATIENT_ID });
  if (!cart) {
    cart = new Cart({ patientId: PATIENT_ID, items: [] });
  }

  // Check if item already in cart
  const existingItemIndex = cart.items.findIndex((item: any) => item.medicineId.toString() === medicineId);
  if (existingItemIndex > -1) {
    // Check if adding 1 exceeds stock
    if (cart.items[existingItemIndex].quantity + 1 > medicine.stockQuantity) {
       return { error: `Cannot add more. Only ${medicine.stockQuantity} in stock.` };
    }
    cart.items[existingItemIndex].quantity += 1;
  } else {
    cart.items.push({ medicineId: medicineId, quantity: 1 });
  }

  await cart.save();
  revalidatePath('/pharmacy');
  revalidatePath('/checkout');

  return { success: true };
}

export async function clearCart(patientId: string) {
  await connectToDatabase();
  await Cart.findOneAndUpdate({ patientId }, { items: [] });
}
