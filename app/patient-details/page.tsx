'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useEmergencyStore } from '../../store/useEmergencyStore';
import PageTransition from '../../components/layout/PageTransition';
import { supabase } from '../../lib/supabaseClient';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  age: z.number().min(1, 'Age must be greater than 0'),
  weight: z.number().optional().or(z.literal('')),
  gender: z.string(),
  bloodGroup: z.string().optional(),
  medicalConditions: z.string().optional(),
  medications: z.string().optional(),
  allergies: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function PatientDetailsPage() {
  const router = useRouter();
  const { patientDetails, setPatientDetails } = useEmergencyStore();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: patientDetails.name,
      age: patientDetails.age === '' ? undefined : (patientDetails.age as number),
      weight: patientDetails.weight === '' ? undefined : (patientDetails.weight as number),
      gender: patientDetails.gender,
      bloodGroup: patientDetails.bloodGroup,
      medicalConditions: patientDetails.medicalConditions,
      medications: patientDetails.medications,
      allergies: patientDetails.allergies,
    },
  });

  const gender = watch('gender');

  const onSubmit = async (data: FormData) => {
    setPatientDetails({
      name: data.name,
      age: data.age,
      weight: data.weight || '',
      gender: data.gender,
      bloodGroup: data.bloodGroup || '',
      medicalConditions: data.medicalConditions || '',
      medications: data.medications || '',
      allergies: data.allergies || '',
    });

    let currentSessionId = useEmergencyStore.getState().sessionId;
    if (!currentSessionId) {
      currentSessionId = crypto.randomUUID();
      useEmergencyStore.getState().setSessionId(currentSessionId);
    }

    try {
      const payload = {
        name: data.name,
        age: data.age,
        gender: data.gender,
        weight: data.weight || null,
        blood_group: data.bloodGroup || null,
        medical_conditions: data.medicalConditions || null,
        medications: data.medications || null,
        allergies: data.allergies || null,
        emergency_description: '',
        language: 'en'
      };
      
      console.log("Inserting payload into patient_cases:", payload);

      const { data: insertData, error } = await supabase
        .from('patient_cases')
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.error("Supabase Insert Error:", JSON.stringify(error, null, 2));
        console.error("Error message:", error?.message);
        console.error("Error details:", error?.details);
        console.error("Error hint:", error?.hint);
        console.error("Error code:", error?.code);
      } else {
        console.log('Successfully inserted patient_cases row:', insertData);
        if (insertData?.id) {
          useEmergencyStore.getState().setCaseId(insertData.id);
        }
      }
    } catch (err) {
      console.error('Unexpected error inserting to Supabase:', err);
    }

    router.push('/emergency-description');
  };
  return (
    <PageTransition
      backPath="/"
      onNext={handleSubmit(onSubmit)}
      nextLabel="Continue to Assessment"
    >
      <div className="w-full flex justify-center px-[var(--spacing-margin-mobile)] pt-6 pb-32">
        <div className="w-full max-w-3xl flex flex-col items-center">
          {/* Title */}
          <div className="text-center mb-8 animate-fade-in-up">
            <h2 className="font-[family-name:var(--font-headline-lg)] text-[length:var(--font-headline-lg)] font-bold text-[var(--color-primary)]">Patient Profile</h2>
            <p className="font-[family-name:var(--font-body-md)] text-[length:var(--font-body-md)] text-[var(--color-on-surface-variant)] mt-[var(--spacing-stack-sm)]">
              Please provide accurate information for the AI Copilot.
            </p>
          </div>

          {/* Form Card */}
          <div className="w-full bg-[var(--color-surface-container-lowest)] rounded-3xl border border-[var(--color-outline-variant)] p-6 md:p-8 shadow-sm animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Patient Name */}
              <div className="flex flex-col space-y-2">
                <label className="font-[family-name:var(--font-label-lg)] text-[length:var(--font-label-lg)] text-[var(--color-on-surface)] tracking-wide font-medium" htmlFor="name">Patient Name</label>
                <div className="relative flex items-center bg-[var(--color-surface-bright)] border border-[var(--color-outline-variant)] rounded-xl overflow-hidden focus-within:border-[var(--color-primary)] focus-within:shadow-sm transition-all">
                  <span className="material-symbols-outlined text-[var(--color-outline)] ml-4 absolute pointer-events-none">person</span>
                  <input
                    {...register('name')}
                    className="w-full h-[56px] bg-transparent border-none pl-12 pr-4 font-[family-name:var(--font-body-lg)] text-[length:var(--font-body-lg)] text-[var(--color-on-surface)] placeholder:text-[var(--color-outline)] focus:ring-0 focus:outline-none"
                    id="name"
                    placeholder="Enter full name"
                    type="text"
                  />
                </div>
                {errors.name && <p className="text-[var(--color-error)] text-sm">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Age */}
                <div className="flex flex-col space-y-2">
                  <label className="font-[family-name:var(--font-label-lg)] text-[length:var(--font-label-lg)] text-[var(--color-on-surface)] tracking-wide font-medium" htmlFor="age">Age</label>
                  <div className="relative flex items-center bg-[var(--color-surface-bright)] border border-[var(--color-outline-variant)] rounded-xl overflow-hidden focus-within:border-[var(--color-primary)] focus-within:shadow-sm transition-all">
                    <span className="material-symbols-outlined text-[var(--color-outline)] ml-4 absolute pointer-events-none">cake</span>
                    <input
                      {...register('age', { valueAsNumber: true })}
                      className="w-full h-[56px] bg-transparent border-none pl-12 pr-4 font-[family-name:var(--font-body-lg)] text-[length:var(--font-body-lg)] text-[var(--color-on-surface)] placeholder:text-[var(--color-outline)] focus:ring-0 focus:outline-none"
                      id="age"
                      placeholder="Years"
                      type="number"
                    />
                  </div>
                  {errors.age && <p className="text-[var(--color-error)] text-sm">{errors.age.message}</p>}
                </div>

                {/* Weight */}
                <div className="flex flex-col space-y-2">
                  <label className="font-[family-name:var(--font-label-lg)] text-[length:var(--font-label-lg)] text-[var(--color-on-surface)] tracking-wide font-medium" htmlFor="weight">
                    Weight <span className="text-[var(--color-outline)] font-normal ml-1">(Optional)</span>
                  </label>
                  <div className="relative flex items-center bg-[var(--color-surface-bright)] border border-[var(--color-outline-variant)] rounded-xl overflow-hidden focus-within:border-[var(--color-primary)] focus-within:shadow-sm transition-all">
                    <span className="material-symbols-outlined text-[var(--color-outline)] ml-4 absolute pointer-events-none">monitor_weight</span>
                    <input
                      {...register('weight', { valueAsNumber: true })}
                      className="w-full h-[56px] bg-transparent border-none pl-12 pr-4 font-[family-name:var(--font-body-lg)] text-[length:var(--font-body-lg)] text-[var(--color-on-surface)] placeholder:text-[var(--color-outline)] focus:ring-0 focus:outline-none"
                      id="weight"
                      placeholder="kg or lbs"
                      type="number"
                    />
                  </div>
                </div>
              </div>

              {/* Gender */}
              <div className="flex flex-col space-y-2">
                <label className="font-[family-name:var(--font-label-lg)] text-[length:var(--font-label-lg)] text-[var(--color-on-surface)] tracking-wide font-medium">Gender</label>
                <div className="flex flex-wrap sm:flex-nowrap gap-1 bg-[var(--color-surface-container)] rounded-xl p-1 shadow-inner">
                  {['Male', 'Female', 'Other'].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setValue('gender', g)}
                      className={`flex-1 min-w-[30%] h-[48px] rounded-lg font-[family-name:var(--font-label-lg)] text-[length:var(--font-label-lg)] transition-all duration-200 ${
                        gender === g
                          ? 'bg-[var(--color-surface-container-lowest)] text-[var(--color-primary)] shadow-sm border border-[var(--color-outline-variant)]'
                          : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] border border-transparent'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Blood Group */}
              <div className="flex flex-col space-y-2">
                <label className="font-[family-name:var(--font-label-lg)] text-[length:var(--font-label-lg)] text-[var(--color-on-surface)] tracking-wide font-medium" htmlFor="bloodGroup">Blood Group</label>
                <div className="relative flex items-center bg-[var(--color-surface-bright)] border border-[var(--color-outline-variant)] rounded-xl overflow-hidden focus-within:border-[var(--color-primary)] focus-within:shadow-sm transition-all">
                  <span className="material-symbols-outlined text-[var(--color-outline)] ml-4 absolute pointer-events-none">bloodtype</span>
                  <select
                    {...register('bloodGroup')}
                    className="w-full h-[56px] bg-transparent border-none pl-12 pr-10 font-[family-name:var(--font-body-lg)] text-[length:var(--font-body-lg)] text-[var(--color-on-surface)] focus:ring-0 appearance-none focus:outline-none cursor-pointer"
                    id="bloodGroup"
                  >
                    <option disabled value="">Select blood group</option>
                    <option value="a+">A+</option>
                    <option value="a-">A-</option>
                    <option value="b+">B+</option>
                    <option value="b-">B-</option>
                    <option value="o+">O+</option>
                    <option value="o-">O-</option>
                    <option value="ab+">AB+</option>
                    <option value="ab-">AB-</option>
                    <option value="unknown">Unknown</option>
                  </select>
                  <span className="material-symbols-outlined text-[var(--color-outline)] absolute right-4 pointer-events-none">keyboard_arrow_down</span>
                </div>
              </div>

              {/* Medical Conditions */}
              <div className="flex flex-col space-y-2">
                <label className="font-[family-name:var(--font-label-lg)] text-[length:var(--font-label-lg)] text-[var(--color-on-surface)] tracking-wide font-medium" htmlFor="medicalConditions">Pre-existing Medical Conditions</label>
                <div className="relative bg-[var(--color-surface-bright)] border border-[var(--color-outline-variant)] rounded-xl overflow-hidden focus-within:border-[var(--color-primary)] focus-within:shadow-sm transition-all">
                  <textarea
                    {...register('medicalConditions')}
                    className="w-full bg-transparent border-none p-4 font-[family-name:var(--font-body-lg)] text-[length:var(--font-body-lg)] text-[var(--color-on-surface)] placeholder:text-[var(--color-outline)] focus:ring-0 resize-none focus:outline-none"
                    id="medicalConditions"
                    placeholder="List any known conditions (e.g., Asthma, Diabetes)"
                    rows={3}
                  ></textarea>
                </div>
              </div>

              {/* Medications */}
              <div className="flex flex-col space-y-2">
                <label className="font-[family-name:var(--font-label-lg)] text-[length:var(--font-label-lg)] text-[var(--color-on-surface)] tracking-wide font-medium" htmlFor="medications">Current Medications</label>
                <div className="relative bg-[var(--color-surface-bright)] border border-[var(--color-outline-variant)] rounded-xl overflow-hidden focus-within:border-[var(--color-primary)] focus-within:shadow-sm transition-all">
                  <textarea
                    {...register('medications')}
                    className="w-full bg-transparent border-none p-4 font-[family-name:var(--font-body-lg)] text-[length:var(--font-body-lg)] text-[var(--color-on-surface)] placeholder:text-[var(--color-outline)] focus:ring-0 resize-none focus:outline-none"
                    id="medications"
                    placeholder="List active prescriptions"
                    rows={2}
                  ></textarea>
                </div>
              </div>

              {/* Allergies */}
              <div className="flex flex-col space-y-2">
                <label className="font-[family-name:var(--font-label-lg)] text-[length:var(--font-label-lg)] text-[var(--color-on-surface)] tracking-wide font-medium" htmlFor="allergies">Allergies</label>
                <div className="relative flex items-center bg-[var(--color-surface-bright)] border border-[var(--color-error-container)] rounded-xl overflow-hidden focus-within:border-[var(--color-error)] focus-within:ring-1 focus-within:ring-[var(--color-error)] focus-within:shadow-sm transition-all">
                  <span className="material-symbols-outlined text-[var(--color-error)] ml-4 absolute pointer-events-none">warning</span>
                  <input
                    {...register('allergies')}
                    className="w-full h-[56px] bg-transparent border-none pl-12 pr-4 font-[family-name:var(--font-body-lg)] text-[length:var(--font-body-lg)] text-[var(--color-on-surface)] placeholder:text-[var(--color-outline)] focus:ring-0 focus:outline-none"
                    id="allergies"
                    placeholder="e.g., Penicillin, Peanuts"
                    type="text"
                  />
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
