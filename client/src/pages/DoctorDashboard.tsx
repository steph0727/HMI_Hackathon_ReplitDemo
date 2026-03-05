import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Clock, CheckCircle2, AlertTriangle, ShieldCheck, User } from "lucide-react";
import { usePatients, useUpdatePatientStatus } from "@/hooks/use-patients";
import { type Patient } from "@shared/routes";
import { cn } from "@/lib/utils";

function getUrgencyStyle(score: number) {
  if (score >= 75) return { label: "Critical", class: "urgency-critical" };
  if (score >= 50) return { label: "High", class: "urgency-high" };
  if (score >= 25) return { label: "Medium", class: "urgency-medium" };
  return { label: "Low", class: "urgency-low" };
}

export default function DoctorDashboard() {
  const { data: patients = [], isLoading } = usePatients();
  const { mutate: updateStatus, isPending } = useUpdatePatientStatus();
  const [activeTab, setActiveTab] = useState<"waiting" | "assessed">("waiting");

  // Sort descending by score
  const filteredPatients = patients
    .filter(p => p.status === activeTab)
    .sort((a, b) => b.urgencyScore - a.urgencyScore);

  const waitingCount = patients.filter(p => p.status === "waiting").length;
  const criticalCount = patients.filter(p => p.status === "waiting" && p.urgencyScore >= 75).length;

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] p-8 flex justify-center items-center">
        <div className="animate-pulse flex flex-col items-center gap-4 text-slate-400">
          <Activity className="w-8 h-8 animate-bounce" />
          <p className="font-medium">Loading triage data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-lg shadow-slate-200/30 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
            <Clock className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Waiting Room</p>
            <h3 className="text-3xl font-bold text-slate-900">{waitingCount}</h3>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-lg shadow-slate-200/30 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Critical Cases</p>
            <h3 className="text-3xl font-bold text-slate-900">{criticalCount}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-lg shadow-slate-200/30 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Assessed Today</p>
            <h3 className="text-3xl font-bold text-slate-900">
              {patients.filter(p => p.status === "assessed").length}
            </h3>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-8 border-b border-slate-200 mb-8 relative">
        <button
          onClick={() => setActiveTab("waiting")}
          className={cn(
            "pb-4 text-sm font-bold tracking-wide transition-colors relative",
            activeTab === "waiting" ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
          )}
        >
          ACTIVE QUEUE
          {activeTab === "waiting" && (
            <motion.div layoutId="tab" className="absolute -bottom-px left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("assessed")}
          className={cn(
            "pb-4 text-sm font-bold tracking-wide transition-colors relative",
            activeTab === "assessed" ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
          )}
        >
          ASSESSED
          {activeTab === "assessed" && (
            <motion.div layoutId="tab" className="absolute -bottom-px left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
      </div>

      {/* List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredPatients.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="bg-white/50 border border-slate-200 border-dashed rounded-2xl p-12 text-center"
            >
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900">Queue is empty</h3>
              <p className="text-slate-500">No patients currently in this view.</p>
            </motion.div>
          ) : (
            filteredPatients.map((patient) => {
              const urgency = getUrgencyStyle(patient.urgencyScore);
              
              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={patient.id}
                  className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-md shadow-slate-200/20 hover:shadow-lg hover:border-slate-300 transition-all flex flex-col lg:flex-row gap-6 lg:items-start"
                >
                  {/* Left Column: Score */}
                  <div className="flex-shrink-0 flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 border border-slate-100 min-w-[120px]">
                    <div className={cn("w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold shadow-inner mb-2", urgency.class)}>
                      {patient.urgencyScore}
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                      {urgency.label}
                    </span>
                  </div>

                  {/* Middle Column: Details */}
                  <div className="flex-grow space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        {patient.name} 
                        <span className="text-sm font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                          {patient.age} yrs
                        </span>
                      </h3>
                      <p className="text-sm text-slate-500 mt-1">
                        Arrived: {new Date(patient.createdAt).toLocaleTimeString()}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Extracted Symptoms</h4>
                      <div className="flex flex-wrap gap-2">
                        {patient.extractedSymptoms.map((sym, i) => (
                          <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-100">
                            {sym}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">AI Triage Explanation</h4>
                      <p className="text-sm text-slate-700 leading-relaxed">{patient.explanation}</p>
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex-shrink-0 lg:ml-auto lg:self-stretch flex items-center justify-center border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6">
                    {activeTab === "waiting" ? (
                      <button
                        onClick={() => updateStatus({ id: patient.id, status: "assessed" })}
                        disabled={isPending}
                        className="w-full lg:w-auto px-6 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        Mark Assessed
                      </button>
                    ) : (
                      <button
                        onClick={() => updateStatus({ id: patient.id, status: "waiting" })}
                        disabled={isPending}
                        className="w-full lg:w-auto px-6 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                      >
                        <Clock className="w-5 h-5" />
                        Return to Queue
                      </button>
                    )}
                  </div>

                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
