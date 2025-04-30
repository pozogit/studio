"use client";

import * as React from 'react';
import { ShiftForm } from "@/components/shift-form";
import { ScheduleCalendar } from "@/components/schedule-calendar";
import { Toaster } from "@/components/ui/toaster"
import type { Shift } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function Home() {
  // Using React state for simplicity. For larger apps, consider Zustand, Redux, or Context API.
  const [shifts, setShifts] = React.useState<Shift[]>([]);

  // Function to add a new shift to the state
  const addShift = (newShift: Shift) => {
    setShifts((prevShifts) => [...prevShifts, newShift].sort((a, b) => a.date.getTime() - b.date.getTime()));
  };

   // Load shifts from localStorage on initial render (optional persistence)
  React.useEffect(() => {
    const storedShifts = localStorage.getItem('shifts');
    if (storedShifts) {
      try {
        const parsedShifts = JSON.parse(storedShifts).map((s: any) => ({
          ...s,
          date: new Date(s.date), // Ensure date is parsed back to Date object
        }));
        setShifts(parsedShifts);
      } catch (error) {
        console.error("Failed to parse shifts from localStorage", error);
        localStorage.removeItem('shifts'); // Clear invalid data
      }
    }
  }, []);

  // Save shifts to localStorage whenever they change (optional persistence)
  React.useEffect(() => {
    localStorage.setItem('shifts', JSON.stringify(shifts));
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
          <ScheduleCalendar shifts={shifts} />
        </div>
      </div>

      {/* Toaster for notifications */}
      <Toaster />
    </main>
  );
}
