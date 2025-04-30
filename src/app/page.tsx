

"use client";

import * as React from 'react';
import { ShiftForm } from "@/components/shift-form";
import { ScheduleCalendar } from "@/components/schedule-calendar";
import { Toaster } from "@/components/ui/toaster"
import type { Shift } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';


export default function Home() {
  // Using React state for simplicity. Data will only persist for the current session.
  const [shifts, setShifts] = React.useState<Shift[]>([]);

  // Function to add a new shift to the state
  const addShift = (newShift: Shift) => {
    setShifts((prevShifts) => [...prevShifts, newShift].sort((a, b) => a.date.getTime() - b.date.getTime() || (a.startTime || "").localeCompare(b.startTime || "")));
  };

  // Function to update the entire shifts array (used for editing/deleting)
   const updateShifts = (updatedShifts: Shift[]) => {
    setShifts(updatedShifts.sort((a, b) => a.date.getTime() - b.date.getTime() || (a.startTime || "").localeCompare(b.startTime || "")));
   };


   // LocalStorage persistence removed. Shifts will reset on page refresh.

  return (
    <main className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-primary mb-2">ShiftMaster</h1>
        <p className="text-lg text-muted-foreground">Organiza y visualiza los horarios de trabajo de tu equipo de forma eficiente.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Shift Registration Section */}
        <div className="lg:col-span-1">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Registrar Nuevo Turno</CardTitle>
              <CardDescription>Completa los detalles para añadir un nuevo turno de trabajo.</CardDescription>
            </CardHeader>
            <CardContent>
              <ShiftForm addShift={addShift} />
            </CardContent>
          </Card>
        </div>

        {/* Calendar View Section */}
        <div className="lg:col-span-2">
           {/* Pass the full shifts list and the update function */}
          <ScheduleCalendar allShifts={shifts} setShifts={updateShifts} />
        </div>
      </div>

      {/* Toaster for notifications */}
      <Toaster />
    </main>
  );
}

