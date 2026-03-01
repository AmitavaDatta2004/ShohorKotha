"use client";

import { cn } from "@/lib/utils";
import { Check, Loader2 } from "lucide-react";

type Status = "Submitted" | "In Progress" | "Pending Approval" | "Resolved";
const statuses: Status[] = ["Submitted", "In Progress", "Pending Approval", "Resolved"];

const statusConfig: Record<Status, { 
  color: string; 
  bg: string; 
  border: string; 
  text: string;
  shadow: string;
}> = {
  "Submitted": { 
    color: "bg-amber-500", 
    bg: "bg-amber-500", 
    border: "border-amber-500", 
    text: "text-amber-600",
    shadow: "shadow-amber-500/20"
  },
  "In Progress": { 
    color: "bg-indigo-600", 
    bg: "bg-indigo-600", 
    border: "border-indigo-600", 
    text: "text-indigo-600",
    shadow: "shadow-indigo-600/20"
  },
  "Pending Approval": { 
    color: "bg-orange-500", 
    bg: "bg-orange-500", 
    border: "border-orange-500", 
    text: "text-orange-600",
    shadow: "shadow-orange-500/20"
  },
  "Resolved": { 
    color: "bg-emerald-500", 
    bg: "bg-emerald-500", 
    border: "border-emerald-500", 
    text: "text-emerald-600",
    shadow: "shadow-emerald-500/20"
  },
};

interface StatusTimelineProps {
  currentStatus: Status;
}

export default function StatusTimeline({ currentStatus }: StatusTimelineProps) {
  const currentIndex = statuses.indexOf(currentStatus);
  const isResolved = currentIndex === statuses.length - 1;
  const currentConfig = statusConfig[currentStatus];

  // Calculate the progress line width
  // Each segment is 1/(count-1). We subtract half a node width from start and end conceptually,
  // but for a simple bar we can just offset it.
  const progressWidth = isResolved ? 100 : (currentIndex / (statuses.length - 1)) * 100;

  return (
    <div className="w-full">
      <div className="relative flex justify-between items-start">
        {/* Track Background */}
        <div 
            className="absolute left-0 top-5 h-1.5 w-full bg-slate-100 rounded-full"
            aria-hidden="true"
        ></div>
        
        {/* Track Active Progress */}
        <div
          className={cn(
            "absolute left-0 top-5 h-1.5 rounded-full transition-all duration-1000 ease-out",
            currentConfig.bg,
            currentConfig.shadow,
            "shadow-[0_0_15px_rgba(0,0,0,0.1)]"
          )}
          style={{ width: `${progressWidth}%` }}
          aria-hidden="true"
        ></div>

        {statuses.map((status, index) => {
          const isActive = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const isPast = index < currentIndex;
          const config = statusConfig[status];

          return (
            <div key={status} className="relative z-10 flex flex-col items-center flex-1">
              {/* Node Circle */}
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-2xl border-2 bg-white transition-all duration-700 shrink-0",
                  isActive ? config.border : "border-slate-200",
                  isCurrent && cn("shadow-xl scale-110", config.shadow),
                  isPast && config.bg,
                  isPast && config.border
                )}
              >
                {isPast || (isActive && isResolved) ? (
                    <Check className={cn("h-5 w-5", isPast ? "text-white" : config.text)} />
                ) : isCurrent ? (
                    <Loader2 className={cn("h-5 w-5 animate-spin", config.text)} />
                ) : (
                    <div className="h-2 w-2 rounded-full bg-slate-200"></div>
                )}
              </div>
              
              {/* Status Label */}
              <div className="mt-4 px-1 text-center w-full min-h-[2.5rem] flex flex-col items-center">
                <p
                  className={cn(
                    "text-[8px] sm:text-[10px] font-black uppercase tracking-tight sm:tracking-widest leading-tight transition-colors duration-500",
                    isActive ? "text-slate-900" : "text-slate-300",
                    isCurrent && config.text
                  )}
                >
                  {status}
                </p>
                {isCurrent && (
                  <div className={cn("h-1 w-1 rounded-full mt-1 animate-pulse", config.bg)}></div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
