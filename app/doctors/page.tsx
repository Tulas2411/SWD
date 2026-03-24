import connectToDatabase from '@/utils/mongodb';
import { Profile, DoctorSchedule } from '@/utils/models';
import Link from 'next/link';
import { Calendar, Clock, Star, Users } from 'lucide-react';

export const revalidate = 0;

export default async function DoctorsPage() {
  let doctors: any[] = [];
  let error = false;

  try {
    await connectToDatabase();
    
    // Fetch doctors
    const docs = await Profile.find({ role: 'doctor' }).lean();
    
    // Fetch their schedules
    for (let doc of docs) {
      const schedules = await DoctorSchedule.find({ doctorId: doc._id }).lean();
      doc.doctor_schedules = schedules;
    }
    doctors = docs;
  } catch (err) {
    error = true;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">Failed to load doctors</div>;
  }

  const now = new Date();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-blue-900 tracking-tight sm:text-5xl">
            Find Your Specialist
          </h1>
          <p className="mt-4 text-xl text-slate-500">
            Book a consultation with our world-class healthcare professionals.
          </p>
        </div>

        {(!doctors || doctors.length === 0) ? (
          <div className="text-center p-12 bg-white rounded-2xl shadow-sm border border-slate-100">
            <Users className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-4 text-lg font-medium text-slate-900">No doctors available</h3>
            <p className="mt-2 text-slate-500">Please check back later.</p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {doctors.map((doctor) => {
              const availableSlots = (doctor.doctor_schedules || []).filter((slot: any) => {
                if (slot.status === 'booked') return false;
                if (slot.status === 'soft_locked' && slot.softLockExpiresAt) {
                  return new Date(slot.softLockExpiresAt) < now;
                }
                return true;
              });

              return (
                <div key={doctor._id.toString()} className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 border border-slate-100 flex flex-col">
                  <div className="p-8 flex-grow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold">
                        {doctor.fullName.charAt(0)}
                      </div>
                      <div className="flex items-center bg-amber-50 px-3 py-1 rounded-full">
                        <Star className="w-4 h-4 text-amber-500 fill-current" />
                        <span className="ml-1 text-sm font-medium text-amber-700">4.9</span>
                      </div>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Dr. {doctor.fullName}</h3>
                    <p className="text-blue-600 font-medium mb-6">General Practitioner</p>
                    
                    <div className="space-y-3 mb-8">
                      <div className="flex items-center text-slate-500">
                        <Calendar className="w-5 h-5 mr-3 text-slate-400" />
                        <span>{availableSlots.length} slots available</span>
                      </div>
                      <div className="flex items-center text-slate-500">
                        <Clock className="w-5 h-5 mr-3 text-slate-400" />
                        <span>Next available today</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 bg-slate-50 border-t border-slate-100">
                    <Link 
                      href={`/book/${doctor._id}`}
                      className="w-full block text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200"
                    >
                      Book Consultation
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
