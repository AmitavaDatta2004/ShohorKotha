
"use client";

import { cn } from "@/lib/utils";
import { Check, Loader } from "lucide-react";

type Status = "Submitted" | "In Progress" | "Pending Approval" | "Resolved";
const statuses: Status[] = ["Submitted", "In Progress", "Pending Approval", "Resolved"];

interface StatusTimelineProps {
  currentStatus: Status;
}

export default function StatusTimeline({ currentStatus }: StatusTimelineProps) {
  const currentIndex = statuses.indexOf(currentStatus);
  const isResolved = currentIndex === statuses.length - 1;

  return (
    <div className="w-full px-2 pt-2">
      <div className="relative flex justify-between">
        <div 
            className="absolute left-0 top-4 h-2 w-full bg-muted rounded-full"
            aria-hidden="true"
        ></div>
        <div
          className="absolute left-0 top-4 h-2 bg-gradient-to-r from-accent to-primary rounded-full transition-all duration-500"
          style={{ width: isResolved ? '100%' : `calc(${(currentIndex / (statuses.length - 1)) * 100}% - 1rem)` }}
          aria-hidden="true"
        ></div>
        {statuses.map((status, index) => {
          const isActive = index <= currentIndex;
          const isCurrent = index === currentIndex;
          return (
            <div key={status} className="relative z-10 flex flex-col items-center w-24">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 bg-card transition-all duration-500",
                  isActive ? "border-primary" : "border-border",
                  isCurrent && "shadow-lg shadow-primary/30"
                )}
              >
                {isActive ? (
                    isCurrent && currentStatus !== 'Resolved' ? (
                        <Loader className="h-5 w-5 text-primary animate-spin" />
                    ) : (
                        <Check className="h-5 w-5 text-primary" />
                    )
                ) : (
                    <div className="h-2 w-2 rounded-full bg-border transition-colors duration-500"></div>
                )}
              </div>
              <p
                className={cn(
                  "mt-2 text-xs text-center font-semibold transition-colors duration-500",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {status}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
