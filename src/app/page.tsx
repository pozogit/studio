
"use client";

import * as React from 'react';
import { ShiftForm } from "@/components/shift-form";
import { ScheduleCalendar } from "@/components/schedule-calendar";
import { Toaster } from "@/components/ui/toaster"
import type { Shift } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';
import { CalendarClock, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button'; // Import Button
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"; // Import Dialog components


export default function Home() {
  // State for shifts
  const [shifts, setShifts] = React.useState<Shift[]>([]);
  // State to control the shift form modal
  const [isFormModalOpen, setIsFormModalOpen] = React.useState(false);


  // Function to add a new shift to the state
  const addShift = (newShift: Shift) => {
    setShifts((prevShifts) => [...prevShifts, newShift].sort((a, b) => a.date.getTime() - b.date.getTime() || (a.startTime || "").localeCompare(b.startTime || "")));
    // Optionally close the modal after adding shift - handled by onFormSubmitSuccess prop now
    // setIsFormModalOpen(false);
  };

  // Function to update the entire shifts array (used for editing/deleting)
   const updateShifts = (updatedShifts: Shift[]) => {
    setShifts(updatedShifts.sort((a, b) => a.date.getTime() - b.date.getTime() || (a.startTime || "").localeCompare(b.startTime || "")));
   };


   // Callback to close the form modal on successful submission
   const handleFormSuccess = () => {
      setIsFormModalOpen(false);
   }

  return (
    <main className="container mx-auto p-4 md:p-8">
       <header className="mb-8 flex justify-between items-center">
        <div className="flex items-center space-x-3">
           {/* Placeholder Logo */}
           <CalendarClock className="h-10 w-10 text-primary" />
           <div>
            <h1 className="text-4xl font-bold text-primary mb-1">ShiftMaster</h1>
            <p className="text-lg text-muted-foreground">Organiza y visualiza los horarios de trabajo de tu equipo de forma eficiente.</p>
          </div>
        </div>
        <ThemeToggle /> {/* Add the theme toggle button */}
      </header>

       {/* Button to trigger the Shift Form Modal */}
       <div className="mb-6 flex justify-end">
         <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
            <DialogTrigger asChild>
                 <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Registrar Nuevo Turno
                 </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]"> {/* Adjusted width */}
              <DialogHeader>
                <DialogTitle>Registrar Nuevo Turno</DialogTitle>
                <DialogDescription>
                  Completa los detalles para añadir uno o más turnos de trabajo al calendario.
                </DialogDescription>
              </DialogHeader>
               {/* Shift Form inside the Modal */}
               {/* No need for Card component inside modal */}
              <div className="py-4"> {/* Added padding */}
                 <ShiftForm addShift={addShift} onFormSubmitSuccess={handleFormSuccess} />
              </div>
               {/* Footer can be added if needed, e.g., for a close button, but DialogClose is usually sufficient */}
            </DialogContent>
         </Dialog>
       </div>


      {/* Calendar View Section - Takes full width now */}
      <div>
           {/* Pass the full shifts list and the update function */}
          <ScheduleCalendar allShifts={shifts} setShifts={updateShifts} />
      </div>


      {/* Toaster for notifications */}
      <Toaster />
    </main>
  );
}

