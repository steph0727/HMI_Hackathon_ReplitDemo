import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Send, Loader2, FileText, CheckCircle2, User, ActivitySquare } from "lucide-react";
import { triageInputSchema, type TriageInput } from "@shared/routes";
import { useSubmitTriage } from "@/hooks/use-patients";
import { useVoiceRecorder } from "../../replit_integrations/audio/useVoiceRecorder";
import { cn } from "@/lib/utils";

export default function Intake() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [inputMode, setInputMode] = useState<"text" | "voice">("text");
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  
  const { state: recordingState, startRecording, stopRecording } = useVoiceRecorder();
  const { mutate: submitTriage, isPending } = useSubmitTriage();

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<TriageInput>({
    resolver: zodResolver(triageInputSchema),
    defaultValues: {
      name: "",
      age: undefined,
      medicalHistory: "",
      familyHistory: "",
      symptomsInput: "",
      isAudio: false,
    }
  });

  const symptomsVal = watch("symptomsInput");

  const onSubmit = (data: TriageInput) => {
    submitTriage(data, {
      onSuccess: () => {
        setIsSuccess(true);
        reset();
        setRecordedAudioUrl(null);
        setTimeout(() => setIsSuccess(false), 5000);
      }
    });
  };

  const handleRecordToggle = async () => {
    if (recordingState === "idle" || recordingState === "stopped") {
      setRecordedAudioUrl(null);
      setValue("symptomsInput", "");
      setValue("isAudio", true);
      await startRecording();
    } else if (recordingState === "recording") {
      const blob = await stopRecording();
      setRecordedAudioUrl(URL.createObjectURL(blob));
      
      // Convert to base64 for API
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = (reader.result as string).split(',')[1];
        
        // Instant transcription for preview and language detection
        try {
          const response = await fetch('/api/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audio: base64data })
          });
          if (response.ok) {
            const { text } = await response.json();
            setValue("symptomsInput", text);
            setValue("isAudio", false); // Now it's text, so we can treat it as such or keep as is. 
            // Better to keep it as false so the backend doesn't re-transcribe if we don't want to, 
            // but the current backend logic re-transcribes if isAudio is true.
            // Let's set it to false since we already have the text.
          }
        } catch (err) {
          console.error("Transcription error:", err);
          setValue("symptomsInput", base64data);
          setValue("isAudio", true);
        }
      };
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 overflow-hidden"
        >
          <div className="bg-slate-50 border-b border-slate-100 px-8 py-6">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <User className="text-primary w-6 h-6" />
              New Patient Intake
            </h2>
            <p className="text-slate-500 mt-1">Please enter patient details and describe symptoms for AI urgency scoring.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8">
            <AnimatePresence>
              {isSuccess && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 flex items-center gap-3"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <p className="font-medium">Patient successfully added to the priority queue!</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Full Name</label>
                <input 
                  {...register("name")}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="e.g. John Doe"
                />
                {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Age</label>
                <input 
                  type="number"
                  {...register("age")}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="Years"
                />
                {errors.age && <p className="text-red-500 text-sm">{errors.age.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Medical History</label>
              <textarea 
                {...register("medicalHistory")}
                rows={2}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                placeholder="Pre-existing conditions, allergies, medications..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Family History</label>
              <textarea 
                {...register("familyHistory")}
                rows={2}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                placeholder="Relevant hereditary conditions..."
              />
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <ActivitySquare className="w-4 h-4 text-primary" />
                  Primary Symptoms
                </label>
                <div className="bg-slate-100 p-1 rounded-lg flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => { setInputMode("text"); setValue("isAudio", false); setValue("symptomsInput", ""); setRecordedAudioUrl(null); }}
                    className={cn(
                      "px-3 py-1.5 text-xs font-semibold rounded-md transition-all",
                      inputMode === "text" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    Type Text
                  </button>
                  <button
                    type="button"
                    onClick={() => { setInputMode("voice"); setValue("isAudio", true); setValue("symptomsInput", ""); }}
                    className={cn(
                      "px-3 py-1.5 text-xs font-semibold rounded-md transition-all",
                      inputMode === "voice" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    Voice Record
                  </button>
                </div>
              </div>

              {inputMode === "text" ? (
                <div className="space-y-2">
                  <textarea 
                    {...register("symptomsInput")}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                    placeholder="Describe what the patient is experiencing in detail..."
                  />
                  {errors.symptomsInput && <p className="text-red-500 text-sm">{errors.symptomsInput.message}</p>}
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center bg-slate-50/50">
                  <button
                    type="button"
                    onClick={handleRecordToggle}
                    className={cn(
                      "w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl",
                      recordingState === "recording" 
                        ? "bg-red-500 text-white shadow-red-500/30 scale-110 animate-pulse" 
                        : "bg-primary text-white shadow-primary/25 hover:scale-105 hover:bg-primary/90"
                    )}
                  >
                    {recordingState === "recording" ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                  </button>
                  
                  <div className="mt-6 text-center">
                    {recordingState === "recording" && (
                      <p className="text-red-500 font-medium animate-pulse">Recording symptoms...</p>
                    )}
                    {recordingState === "idle" && (
                      <p className="text-slate-500 font-medium">Click to start recording patient speech</p>
                    )}
                    {recordingState === "stopped" && !recordedAudioUrl && (
                      <p className="text-slate-500 font-medium">Processing audio...</p>
                    )}
                    {recordedAudioUrl && (
                      <div className="flex flex-col items-center gap-3">
                        <p className="text-emerald-600 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Audio transcribed successfully
                        </p>
                        <textarea 
                          {...register("symptomsInput")}
                          rows={4}
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                          placeholder="Transcribed symptoms will appear here..."
                        />
                        <button 
                          type="button" 
                          onClick={handleRecordToggle}
                          className="text-sm text-slate-500 underline hover:text-slate-800"
                        >
                          Record again
                        </button>
                      </div>
                    )}
                  </div>
                  {errors.symptomsInput && !symptomsVal && <p className="text-red-500 text-sm mt-4">Voice input is required in voice mode.</p>}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-primary to-blue-600 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing Symptoms & Scoring...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit to Triage Queue
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
