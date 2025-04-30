
"use client";

import * as React from "react";
import { format } from "date-fns";
import { es } from 'date-fns/locale';
import { User, Building2, CalendarDays, Clock } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Shift } from "@/lib/types";
import { getAreaIcon } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

interface ShiftDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shifts: Shift[];
  date: Date;
}

export function ShiftDetailsModal({ isOpen, onClose, shifts, date }: ShiftDetailsModalProps) {
  if (!isOpen) return null;

  // Sort shifts by start time for better readability
  const sortedShifts = [...shifts].sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]"> {/* Increased width slightly */}
        <DialogHeader>
          <DialogTitle className="flex items-center text-primary">
            <CalendarDays className="mr-2 h-5 w-5" />
            Turnos para {format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
          </DialogTitle>
          <DialogDescription>
            Detalles de los turnos registrados para este día.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] p-1 pr-3"> {/* Added padding-right */}
          <div className="space-y-4 py-4">
            {sortedShifts.length > 0 ? (
              sortedShifts.map((shift) => {
                const SpecificAreaIcon = getAreaIcon(shift.area);
                return (
                  <div key={shift.id} className="flex items-start space-x-3 p-3 border rounded-lg shadow-sm bg-card hover:bg-secondary/50 transition-colors">
                    <SpecificAreaIcon className="h-6 w-6 mt-1 text-primary shrink-0" />
                    <div className="flex-1 grid grid-cols-1 gap-1">
                      <p className="text-base font-semibold flex items-center">
                        <User className="mr-2 h-4 w-4 text-muted-foreground" />
                        {shift.worker}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center">
                        <Building2 className="mr-2 h-4 w-4" />
                        {shift.area}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center">
                        <Clock className="mr-2 h-4 w-4" />
                        {shift.startTime} - {shift.endTime}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No hay turnos registrados para este día.</p>
            )}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
