
"use client";

import * as React from 'react';
import { ShiftForm } from "@/components/shift-form";
import { ScheduleCalendar } from "@/components/schedule-calendar";
import { Toaster } from "@/components/ui/toaster"
import type { Shift } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';


export default function Home() {
  // Using React state for simplicity. For larger apps, consider Zustand, Redux, or Context API.
  const [shifts, setShifts] = React.useState<Shift[]>([]);

  // Function to add a new shift to the state
  const addShift = (newShift: Shift) => {
    // Check for duplicates before adding (optional but good practice)
    // const exists = shifts.some(s =>
    //   s.date.getTime() === newShift.date.getTime() &&
    //   s.worker === newShift.worker &&
    //   s.area === newShift.area &&
    //   s.startTime === newShift.startTime &&
    //   s.endTime === newShift.endTime
    // );
    // if (exists) {
    //   // Handle duplicate shift scenario if needed (e.g., show a warning)
    //   console.warn("Attempted to add duplicate shift:", newShift);
    //   return;
    // }
    setShifts((prevShifts) => [...prevShifts, newShift].sort((a, b) => a.date.getTime() - b.date.getTime() || (a.startTime || "").localeCompare(b.startTime || "")));
  };

  // Function to update the entire shifts array (used for editing/deleting)
   const updateShifts = (updatedShifts: Shift[]) => {
    setShifts(updatedShifts.sort((a, b) => a.date.getTime() - b.date.getTime() || (a.startTime || "").localeCompare(b.startTime || "")));
   };


   // Load shifts from localStorage on initial render (optional persistence)
  React.useEffect(() => {
    const storedShifts = localStorage.getItem('shifts');
    if (storedShifts) {
      try {
        const parsedShifts = JSON.parse(storedShifts).map((s: any) => ({
          ...s,
          id: s.id || crypto.randomUUID(), // Ensure shifts have IDs
          date: new Date(s.date), // Ensure date is parsed back to Date object
          startTime: s.startTime || "", // Ensure times exist
          endTime: s.endTime || "",
        })).sort((a: Shift, b: Shift) => a.date.getTime() - b.date.getTime() || (a.startTime || "").localeCompare(b.startTime || ""));
        setShifts(parsedShifts);
      } catch (error) {
        console.error("Failed to parse shifts from localStorage", error);
        localStorage.removeItem('shifts'); // Clear invalid data
      }
    }
  }, []);

  // Save shifts to localStorage whenever they change (optional persistence)
  React.useEffect(() => {
    // Add a check to prevent saving empty shifts array if it was initially empty
    if (shifts.length > 0 || localStorage.getItem('shifts')) {
      localStorage.setItem('shifts', JSON.stringify(shifts));
    }
  }, [shifts]);


  return (
    <main className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-primary mb-2">ShiftMaster</h1>
        <p className="text-lg text-muted-foreground">Organize and visualize your team's work schedules efficiently.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Shift Registration Section */}
        <div className="lg:col-span-1">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Register New Shift</CardTitle>
              <CardDescription>Fill in the details to add a new work shift.</CardDescription>
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

