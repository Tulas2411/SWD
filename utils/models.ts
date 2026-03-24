import mongoose, { Schema, Document } from 'mongoose';

// 1. Profile Model
const profileSchema = new Schema({
  fullName: { type: String, required: true },
  role: { type: String, enum: ['patient', 'doctor', 'pharmacist', 'admin'], default: 'patient' },
}, { timestamps: true });

export const Profile = mongoose.models.Profile || mongoose.model('Profile', profileSchema);

// 2. DoctorSchedule Model
const doctorScheduleSchema = new Schema({
  doctorId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
  slotDate: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  status: { type: String, enum: ['available', 'soft_locked', 'booked'], default: 'available' },
  softLockExpiresAt: { type: Date }
}, { timestamps: true });

export const DoctorSchedule = mongoose.models.DoctorSchedule || mongoose.model('DoctorSchedule', doctorScheduleSchema);

// 3. Appointment Model
const appointmentSchema = new Schema({
  patientId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
  doctorId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
  scheduleId: { type: Schema.Types.ObjectId, ref: 'DoctorSchedule' },
  status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' },
  reasonForVisit: { type: String }
}, { timestamps: true });

export const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);

// 4. Medicine Model
const medicineSchema = new Schema({
  name: { type: String, required: true },
  imageUrl: { type: String },
  price: { type: Number, required: true, min: 0 },
  isRxRequired: { type: Boolean, default: false },
  stockQuantity: { type: Number, required: true, default: 0, min: 0 }
}, { timestamps: true });

export const Medicine = mongoose.models.Medicine || mongoose.model('Medicine', medicineSchema);

// 5. Prescription Model
const prescriptionSchema = new Schema({
  patientId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
  fileUrl: { type: String, required: true },
  issueDate: { type: Date, required: true }
}, { timestamps: true });

export const Prescription = mongoose.models.Prescription || mongoose.model('Prescription', prescriptionSchema);

// 6. Order Model
const orderSchema = new Schema({
  patientId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
  prescriptionId: { type: Schema.Types.ObjectId, ref: 'Prescription' },
  totalAmount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'], default: 'pending' }
}, { timestamps: true });

export const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

// 7. OrderDetail Model
const orderDetailSchema = new Schema({
  orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  medicineId: { type: Schema.Types.ObjectId, ref: 'Medicine', required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 }
}, { timestamps: true });

export const OrderDetail = mongoose.models.OrderDetail || mongoose.model('OrderDetail', orderDetailSchema);

// 8. Cart Model (Added for Shopping Cart Backend)
const cartItemSchema = new Schema({
  medicineId: { type: Schema.Types.ObjectId, ref: 'Medicine', required: true },
  quantity: { type: Number, required: true, min: 1, default: 1 }
});

const cartSchema = new Schema({
  patientId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true, unique: true },
  items: [cartItemSchema]
}, { timestamps: true });

export const Cart = mongoose.models.Cart || mongoose.model('Cart', cartSchema);
