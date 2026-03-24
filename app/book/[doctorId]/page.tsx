import connectToDatabase from '@/utils/mongodb';
import { Profile, DoctorSchedule } from '@/utils/models';
import { bookAppointment } from '@/app/actions/bookAppointment';
import { notFound } from 'next/navigation';
import { Calendar, Clock, Stethoscope, ChevronRight, CheckCircle2 } from 'lucide-react';

export default async function BookingPage(props: { params: Promise<{ doctorId: string }> }) {
  const { doctorId } = await props.params;

  let doctor: any = null;
  let error = false;

  try {
    await connectToDatabase();
    
    doctor = await Profile.findById(doctorId).lean();
    if (doctor && doctor.role === 'doctor') {
      const schedules = await DoctorSchedule.find({ doctorId: doctor._id }).lean();
      doctor.doctor_schedules = schedules;
    }
  } catch (err) {
    error = true;
  }

  if (error || !doctor || doctor.role !== 'doctor') {
    return notFound();
  }

  // Dummy patient ID since we removed Supabase auth
  const patientId = '65f0a0e5b9b2a61234567890'; // Valid MongoDB ObjectId format

  const now = new Date();
  const availableSlots = (doctor.doctor_schedules || []).filter((s: any) => {
    if (s.status === 'booked') return false;
    if (s.status === 'soft_locked' && s.softLockExpiresAt && new Date(s.softLockExpiresAt) > now) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center text-sm font-medium text-slate-500 mb-8">
          <a href="/doctors" className="hover:text-blue-600 transition-colors">Doctors</a>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-slate-900">Dr. {doctor.fullName}</span>
        </div>

        <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-slate-100 flex flex-col md:flex-row">
          <div className="md:w-1/3 bg-blue-600 text-white p-10 flex flex-col justify-between">
            <div>
              <div className="h-20 w-20 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold mb-6">
                {doctor.fullName.charAt(0)}
              </div>
              <h2 className="text-3xl font-bold mb-2">Dr. {doctor.fullName}</h2>
              <p className="text-blue-100 font-medium mb-8 flex items-center">
                <Stethoscope className="w-5 h-5 mr-2" />
                General Practitioner
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center bg-blue-700/50 rounded-xl p-4">
                  <CheckCircle2 className="w-6 h-6 text-blue-300 mr-3" />
                  <div>
                    <p className="text-sm text-blue-200">Consultation Fee</p>
                    <p className="font-semibold">$50.00</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-12 text-sm text-blue-200">
              By booking, you agree to our Terms of Service & Cancellation Policy.
            </div>
          </div>

          <div className="md:w-2/3 p-10">
            <h3 className="text-2xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">
              Book your appointment
            </h3>
            
            <form action={bookAppointment} className="space-y-8">
              <input type="hidden" name="doctorId" value={doctorId} />
              <input type="hidden" name="patientId" value={patientId} />

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-4">
                  Available Slots
                </label>
                {availableSlots.length === 0 ? (
                  <div className="bg-amber-50 rounded-xl p-4 text-amber-700 border border-amber-200">
                    Dr. {doctor.fullName} has no available slots at the moment.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {availableSlots.map((slot: any) => (
                      <label 
                        key={slot._id.toString()} 
                        className="relative flex cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-500 hover:bg-blue-50 focus-within:ring-2 focus-within:ring-blue-500 transition-all"
                      >
                        <input type="radio" name="scheduleId" value={slot._id.toString()} className="sr-only" required />
                        <div className="flex flex-col items-center justify-center w-full text-center">
                          <span className="text-slate-900 font-medium mb-1">
                            {new Date(slot.slotDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                          </span>
                          <span className="text-blue-600 font-semibold bg-blue-100 px-2 py-1 rounded w-full">
                            {slot.startTime}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="reason" className="block text-sm font-semibold text-slate-700 mb-2">
                  Reason for visit (Optional)
                </label>
                <textarea 
                  id="reason" 
                  name="reason" 
                  rows={4} 
                  className="w-full rounded-xl border-slate-200 bg-slate-50 border p-4 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
                  placeholder="Please describe your symptoms briefly..."
                />
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button 
                  type="submit" 
                  disabled={availableSlots.length === 0}
                  className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  Confirm Booking (Soft-lock slot)
                </button>
                <p className="text-center text-sm text-slate-500 mt-4">
                  Note: The slot will be reserved for 10 minutes (BR-28) pending payment.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
