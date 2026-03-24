'use server'

import connectToDatabase from '@/utils/mongodb';
import { Medicine, Prescription, Order, OrderDetail } from '@/utils/models';
import { revalidatePath } from 'next/cache';

export async function orderMedicine(formData: FormData) {
  try {
    await connectToDatabase();
  } catch (e) {
    return { error: 'Database connection failed' };
  }

  const patientId = formData.get('patientId') as string;
  const cartJson = formData.get('cart') as string;
  
  if (!patientId || !cartJson) {
    return { error: 'Missing patient ID or cart payload' };
  }

  let cartItems: { id: string, quantity: number }[] = [];
  try {
    cartItems = JSON.parse(cartJson);
  } catch {
    return { error: 'Invalid cart format' };
  }

  if (cartItems.length === 0) {
    return { error: 'Cart is empty' };
  }

  const medicineIds = cartItems.map(item => item.id);
  const medicines = await Medicine.find({ _id: { $in: medicineIds } });

  if (!medicines || medicines.length !== medicineIds.length) {
    return { error: 'Some medicines were not found in the database.' };
  }

  let requiresRx = false;
  let totalAmount = 0;
  
  for (const item of cartItems) {
    const dbMedicine = medicines.find(m => m._id.toString() === item.id);
    if (!dbMedicine) return { error: `Medicine not found in database: ${item.id}` };
    
    // BR-14: Stock Validation
    if (dbMedicine.stockQuantity < item.quantity) {
      return { error: `Insufficient stock for medicine: ${dbMedicine.name}. Available: ${dbMedicine.stockQuantity}` };
    }
    
    if (dbMedicine.isRxRequired) {
      requiresRx = true;
    }

    totalAmount += dbMedicine.price * item.quantity;
  }

  let prescriptionId = null;

  // RX Check (BR-12, BR-13)
  if (requiresRx) {
    const file = formData.get('prescriptionFile') as File | null;
    const issueDateStr = formData.get('issueDate') as string | null;

    if (!file || file.size === 0 || !issueDateStr) {
      return { error: 'A valid prescription file and its issue date are strictly required for Rx drugs (BR-12)' };
    }

    const issueDate = new Date(issueDateStr);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    if (issueDate < thirtyDaysAgo) {
      return { error: 'Prescription is older than 30 days. It is legally invalid (BR-13).' };
    }

    const syntheticFileUrl = `/storage/prescriptions/${Date.now()}_${file.name}`;

    try {
      const pres = await Prescription.create({
        patientId,
        fileUrl: syntheticFileUrl,
        issueDate: issueDate
      });
      prescriptionId = pres._id;
    } catch (e) {
      return { error: 'Failed to record prescription in database' };
    }
  }

  // Create Order and Deduct Stock Transactionally
  // In MongoDB replica sets, we could use session.withTransaction, but for this standalone we do sequentially safely
  try {
    const order = await Order.create({
      patientId,
      prescriptionId,
      totalAmount,
      status: 'pending'
    });

    const orderDetails = [];
    for (const item of cartItems) {
      const dbMedicine = medicines.find(m => m._id.toString() === item.id)!;
      
      // Deduct stock
      dbMedicine.stockQuantity -= item.quantity;
      await dbMedicine.save();

      orderDetails.push({
        orderId: order._id,
        medicineId: dbMedicine._id,
        quantity: item.quantity,
        unitPrice: dbMedicine.price
      });
    }

    await OrderDetail.insertMany(orderDetails);

    revalidatePath('/pharmacy');
    revalidatePath('/checkout');

    return { success: true, orderId: order._id.toString() };
  } catch (e) {
    return { error: 'Database Error: Failed to process order completely' };
  }
}
