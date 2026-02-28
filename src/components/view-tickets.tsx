
"use client";

import TicketCard from "./ticket-card";
import type { Ticket, Supervisor } from "@/types";
import { Inbox } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

interface ViewTicketsProps {
  tickets: Ticket[];
  supervisors?: Supervisor[];
  isMunicipalView?: boolean;
  isSupervisorView?: boolean;
  isNearbyView?: boolean;
  onJoinReport?: (ticketId: string) => void;
}

export default function ViewTickets({ tickets, supervisors, isMunicipalView = false, isSupervisorView = false, isNearbyView = false, onJoinReport }: ViewTicketsProps) {
  if (tickets.length === 0) {
    return (
      <div className="text-center py-16 border-2 border-dashed rounded-lg">
        <Inbox className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold font-headline">No Tickets Found</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          There are no tickets to display in this view.
        </p>
      </div>
    );
  }

  const groupedTickets = tickets.reduce((acc, ticket) => {
    const category = ticket.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(ticket);
    return acc;
  }, {} as Record<string, Ticket[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedTickets).map(([category, categoryTickets]) => (
        <Collapsible key={category} defaultOpen={true}>
          <CollapsibleTrigger className="w-full">
            <div className="flex justify-between items-center bg-muted/50 px-4 py-3 rounded-md border">
              <h3 className="text-lg font-semibold font-headline">{category} ({categoryTickets.length})</h3>
              <ChevronDown className="h-5 w-5 transition-transform [&[data-state=open]]:rotate-180" />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
             <div className="space-y-4 pt-4">
              {categoryTickets.map((ticket) => (
                <TicketCard 
                  key={ticket.id} 
                  ticket={ticket} 
                  supervisors={supervisors} 
                  isMunicipalView={isMunicipalView} 
                  isSupervisorView={isSupervisorView}
                  isNearbyView={isNearbyView}
                  onJoinReport={onJoinReport}
                />
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
}
