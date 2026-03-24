'use server'

import connectToDatabase from '@/utils/mongodb';
import { DoctorSchedule, Appointment } from '@/utils/models';
import { revalidatePath } from 'next/cache';

export async function bookAppointment(formData: FormData) {
  try {
    await connectToDatabase();
  } catch (e) {
    return { error: 'Database connection failed' };
  }
  
  const doctorId = formData.get('doctorId') as string;
  const patientId = formData.get('patientId') as string;
  const scheduleId = formData.get('scheduleId') as string;
  const reason = formData.get('reason') as string;

  if (!doctorId || !patientId || !scheduleId) {
    return { error: 'Missing required fields' };
  }

  const schedule = await DoctorSchedule.findById(scheduleId);
  if (!schedule) {
    return { error: 'Schedule not found' };
  }

  const now = new Date();
  const isSoftLocked = schedule.status === 'soft_locked' && schedule.softLockExpiresAt && new Date(schedule.softLockExpiresAt) > now;
  const isBooked = schedule.status === 'booked';

  if (isSoftLocked || isBooked) {
    return { error: 'This slot is recently booked or locked by another user.' };
  }

  // Soft-lock for 10 minutes (BR-28)
  const softLockExpiresAt = new Date(now.getTime() + 10 * 60000);
  schedule.status = 'soft_locked';
  schedule.softLockExpiresAt = softLockExpiresAt;
  await schedule.save();

  try {
    const appointment = await Appointment.create({
      patientId,
      doctorId,
      scheduleId,
      status: 'pending',
      reasonForVisit: reason || ''
    });

    revalidatePath('/doctors');
    revalidatePath(`/book/${doctorId}`);
    
    return { success: true, appointmentId: appointment._id.toString() };
  } catch (error) {
    schedule.status = 'available';
    schedule.softLockExpiresAt = undefined;
    await schedule.save();
    return { error: 'Failed to create the appointment record' };
  }
}
