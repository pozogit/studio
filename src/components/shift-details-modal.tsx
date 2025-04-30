
"use client";

import * as React from "react";
import { format } from "date-fns";
import { es } from 'date-fns/locale';
import { User, Building2, CalendarDays, Clock, Edit, Trash2, Save, X } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose, // Import DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Shift } from "@/lib/types";
import { getAreaIcon } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


// Time validation regex (HH:MM format)
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

// Zod schema for editing a single shift (similar to ShiftForm but without date)
const editShiftSchema = z.object({
  worker: z.string().min(2, {
    message: "Worker name must be at least 2 characters.",
  }),
  area: z.string().min(2, {
    message: "Area name must be at least 2 characters.",
  }),
  startTime: z.string().regex(timeRegex, {
    message: "Invalid start time format (HH:MM).",
  }),
  endTime: z.string().regex(timeRegex, {
    message: "Invalid end time format (HH:MM).",
  }),
}).refine(data => {
    // Basic time comparison: Ensure end time is after start time on the same day
    if (data.startTime && data.endTime && timeRegex.test(data.startTime) && timeRegex.test(data.endTime)) {
        return data.startTime < data.endTime;
    }
    return true; // Skip if formats are invalid (handled by regex)
}, {
    message: "End time must be after start time.",
    path: ["endTime"], // Attach error to the end time field
});

type EditShiftFormData = z.infer<typeof editShiftSchema>;


interface ShiftDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shifts: Shift[]; // Shifts for the specific date being viewed
  allShifts: Shift[]; // All shifts in the application state
  date: Date;
  onUpdateShifts: (updatedShifts: Shift[]) => void; // Callback to update the main state
  onDeleteShift: (shiftId: string) => void; // Callback to delete a shift
}

export function ShiftDetailsModal({
  isOpen,
  onClose,
  shifts,
  allShifts,
  date,
  onUpdateShifts,
  onDeleteShift
}: ShiftDetailsModalProps) {
  const [editingShiftId, setEditingShiftId] = React.useState<string | null>(null);
  const form = useForm<EditShiftFormData>({
    resolver: zodResolver(editShiftSchema),
    defaultValues: {
      worker: "",
      area: "",
      startTime: "",
      endTime: "",
    },
  });

  const handleEditClick = (shift: Shift) => {
    setEditingShiftId(shift.id);
    form.reset({
      worker: shift.worker,
      area: shift.area,
      startTime: shift.startTime,
      endTime: shift.endTime,
    });
  };

  const handleCancelEdit = () => {
    setEditingShiftId(null);
    form.reset(); // Clear form errors and values
  };

 const handleSaveEdit = (shiftId: string) => {
    form.handleSubmit((data: EditShiftFormData) => {
      const updatedAllShifts = allShifts.map(s =>
        s.id === shiftId ? { ...s, ...data } : s
      );
      onUpdateShifts(updatedAllShifts); // Update the parent state
      setEditingShiftId(null); // Exit edit mode
      toast({
        title: "Shift Updated",
        description: `Shift for ${data.worker} on ${format(date, "PPP", { locale: es })} updated.`,
        variant: "default",
      });
    })().catch(err => {
         console.error("Validation failed:", err);
         // Errors should be displayed by FormMessage components
     });
 };


   const handleDeleteConfirm = (shiftId: string) => {
       const shiftToDelete = shifts.find(s => s.id === shiftId);
       onDeleteShift(shiftId); // Call the delete handler passed from parent
        if (shiftToDelete) {
             toast({
                title: "Shift Deleted",
                description: `Shift for ${shiftToDelete.worker} on ${format(date, "PPP", { locale: es })} deleted.`,
                variant: "default", // Or destructive if preferred
            });
        }
       // No need to close modal here, parent handles it if necessary
   };

  if (!isOpen) return null;

  // Sort shifts by start time for better readability, handling potentially undefined times
  const sortedShifts = [...shifts].sort((a, b) => {
    // Handle cases where startTime might be missing or null
    if (!a.startTime && !b.startTime) return 0; // Both missing, treat as equal
    if (!a.startTime) return -1; // a is missing, sort it first
    if (!b.startTime) return 1;  // b is missing, sort it last (after a)
    // Both exist, compare normally
    return a.startTime.localeCompare(b.startTime);
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px]"> {/* Slightly wider */}
        <DialogHeader>
          <DialogTitle className="flex items-center text-primary">
            <CalendarDays className="mr-2 h-5 w-5" />
            Turnos para {format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
          </DialogTitle>
          <DialogDescription>
             {editingShiftId ? "Editando turno" : "Detalles de los turnos registrados para este día."}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] p-1 pr-3"> {/* Added padding-right */}
          <div className="space-y-4 py-4">
            {sortedShifts.length > 0 ? (
              sortedShifts.map((shift) => {
                const isEditing = editingShiftId === shift.id;
                const SpecificAreaIcon = getAreaIcon(shift.area);
                return (
                  <div key={shift.id} className="flex items-start space-x-3 p-3 border rounded-lg shadow-sm bg-card transition-colors relative group"> {/* Added relative and group */}
                   {!isEditing ? (
                     <>
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
                            {shift.startTime && shift.endTime
                              ? `${shift.startTime} - ${shift.endTime}`
                              : shift.startTime
                                ? `${shift.startTime} - (No end time)`
                                : shift.endTime
                                  ? `(No start time) - ${shift.endTime}`
                                  : '(Time not specified)'}
                          </p>
                        </div>
                        {/* Action buttons - show on hover */}
                        <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditClick(shift)} aria-label="Editar turno">
                                <Edit className="h-4 w-4" />
                            </Button>
                            {/* Delete confirmation */}
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" aria-label="Eliminar turno">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Esta acción no se puede deshacer. Esto eliminará permanentemente el turno de {shift.worker} para {shift.area} de {shift.startTime} a {shift.endTime}.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteConfirm(shift.id)} className="bg-destructive hover:bg-destructive/90">
                                        Eliminar
                                    </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                             </AlertDialog>

                        </div>
                     </>
                    ) : (
                      // Edit Form
                      <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(shift.id); }} className="w-full space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor={`worker-${shift.id}`} className="text-xs font-medium flex items-center mb-1">
                                    <User className="mr-1 h-3 w-3" /> Worker
                                </Label>
                                <Input id={`worker-${shift.id}`} {...form.register("worker")} placeholder="Worker Name" className="h-9 text-sm" />
                                {form.formState.errors.worker && <p className="text-xs text-destructive mt-1">{form.formState.errors.worker.message}</p>}
                            </div>
                            <div>
                                <Label htmlFor={`area-${shift.id}`} className="text-xs font-medium flex items-center mb-1">
                                    <Building2 className="mr-1 h-3 w-3" /> Area
                                </Label>
                                <Input id={`area-${shift.id}`} {...form.register("area")} placeholder="Area Name" className="h-9 text-sm" />
                                {form.formState.errors.area && <p className="text-xs text-destructive mt-1">{form.formState.errors.area.message}</p>}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor={`startTime-${shift.id}`} className="text-xs font-medium flex items-center mb-1">
                                    <Clock className="mr-1 h-3 w-3" /> Start Time
                                </Label>
                                <Input id={`startTime-${shift.id}`} type="time" {...form.register("startTime")} className="h-9 text-sm" />
                                {form.formState.errors.startTime && <p className="text-xs text-destructive mt-1">{form.formState.errors.startTime.message}</p>}
                             </div>
                             <div>
                                <Label htmlFor={`endTime-${shift.id}`} className="text-xs font-medium flex items-center mb-1">
                                    <Clock className="mr-1 h-3 w-3" /> End Time
                                </Label>
                                <Input id={`endTime-${shift.id}`} type="time" {...form.register("endTime")} className="h-9 text-sm" />
                                {form.formState.errors.endTime && <p className="text-xs text-destructive mt-1">{form.formState.errors.endTime.message}</p>}
                             </div>
                        </div>
                        <div className="flex justify-end space-x-2 pt-2">
                            <Button type="button" variant="ghost" size="sm" onClick={handleCancelEdit}>
                                <X className="mr-1 h-4 w-4" /> Cancel
                            </Button>
                            <Button type="submit" variant="default" size="sm">
                                <Save className="mr-1 h-4 w-4" /> Save
                            </Button>
                         </div>
                      </form>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No hay turnos registrados para este día.</p>
            )}
          </div>
        </ScrollArea>
        {/* Only show main close button if not editing */}
        {!editingShiftId && (
            <DialogFooter>
             <Button variant="outline" onClick={onClose}>Cerrar</Button>
            </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
