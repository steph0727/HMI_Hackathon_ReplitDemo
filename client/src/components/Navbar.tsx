import { Link, useRoute } from "wouter";
import { Activity, LayoutDashboard, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [isIntake] = useRoute("/");
  const [isDoctor] = useRoute("/doctor");

  return (
    <nav className="sticky top-0 z-50 w-full glass-panel border-b border-slate-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
              <Activity className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">
                Nexus<span className="text-primary">Triage</span>
              </h1>
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 -mt-1">
                AI Clinical Intake
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-4">
            <Link 
              href="/" 
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200",
                isIntake 
                  ? "bg-slate-100 text-slate-900 shadow-sm" 
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              )}
            >
              <Stethoscope className="w-4 h-4" />
              <span className="hidden sm:inline">Patient Intake</span>
            </Link>
            
            <Link 
              href="/doctor" 
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200",
                isDoctor 
                  ? "bg-slate-100 text-slate-900 shadow-sm" 
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              )}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Doctor Dashboard</span>
            </Link>
          </div>

        </div>
      </div>
    </nav>
  );
}
