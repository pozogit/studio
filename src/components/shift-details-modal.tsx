
"use client";

import * as React from "react";
import { format } from "date-fns";
import { es } from 'date-fns/locale';
import { User, Building2, CalendarDays, Clock, Edit, Trash2, Save, X, MessageSquare } from "lucide-react";
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
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Shift } from "@/lib/types";
import { getAreaIcon } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import Select
import { allAreas, areaWorkerMap } from "@/lib/data"; // Import data


// Time validation regex (HH:MM format)
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

// Zod schema for editing a single shift
const editShiftSchema = z.object({
  worker: z.string().min(1, { // Changed validation to min 1 as it's a selection
    message: "Please select a worker.",
  }),
  area: z.string().min(1, { // Changed validation to min 1 as it's a selection
    message: "Please select an area.",
  }),
  startTime: z.string().regex(timeRegex, {
    message: "Invalid start time format (HH:MM).",
  }),
  endTime: z.string().regex(timeRegex, {
    message: "Invalid end time format (HH:MM).",
  }),
  comments: z.string().optional(),
}).refine(data => {
    if (data.startTime && data.endTime && timeRegex.test(data.startTime) && timeRegex.test(data.endTime)) {
        return data.startTime < data.endTime;
    }
    return true;
}, {
    message: "End time must be after start time.",
    path: ["endTime"],
});

type EditShiftFormData = z.infer<typeof editShiftSchema>;


interface ShiftDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shifts: Shift[];
  allShifts: Shift[];
  date: Date;
  onUpdateShifts: (updatedShifts: Shift[]) => void;
  onDeleteShift: (shiftId: string) => void;
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
  const [availableWorkersEdit, setAvailableWorkersEdit] = React.useState<string[]>([]);

  const form = useForm<EditShiftFormData>({
    resolver: zodResolver(editShiftSchema),
    defaultValues: {
      worker: "",
      area: "",
      startTime: "",
      endTime: "",
      comments: "",
    },
  });

  // Watch the 'area' field in the edit form
  const selectedAreaEdit = form.watch("area");

  // Effect to update available workers for the *edit* form
  React.useEffect(() => {
    if (editingShiftId && selectedAreaEdit) { // Only run when editing and area is selected
      const workers = areaWorkerMap[selectedAreaEdit] || [];
      setAvailableWorkersEdit(workers.sort());
      // Check if the current worker is still valid for the new area
      // If not, reset the worker field (optional, depends on desired behavior)
      const currentWorker = form.getValues("worker");
      if (!workers.includes(currentWorker)) {
         form.setValue('worker', '', { shouldValidate: true }); // Reset and validate
      }
    } else if (editingShiftId) {
        setAvailableWorkersEdit([]); // Clear if area is deselected during edit
        form.setValue('worker', '', { shouldValidate: true }); // Reset worker
    }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAreaEdit, editingShiftId]); // Depend on selected area and editing state


  const handleEditClick = (shift: Shift) => {
    setEditingShiftId(shift.id);
    // Pre-populate the workers list based on the initial area of the shift being edited
    const initialWorkers = areaWorkerMap[shift.area] || [];
    setAvailableWorkersEdit(initialWorkers.sort());
    form.reset({
      worker: shift.worker,
      area: shift.area,
      startTime: shift.startTime,
      endTime: shift.endTime,
      comments: shift.comments || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingShiftId(null);
    setAvailableWorkersEdit([]); // Clear workers list
    form.reset();
  };

 const handleSaveEdit = (shiftId: string) => {
    form.handleSubmit((data: EditShiftFormData) => {
      const updatedAllShifts = allShifts.map(s =>
        s.id === shiftId ? { ...s, ...data, comments: data.comments || undefined } : s
      );
      onUpdateShifts(updatedAllShifts);
      setEditingShiftId(null);
      setAvailableWorkersEdit([]); // Clear workers list
      toast({
        title: "Shift Updated",
        description: `Shift for ${data.worker} on ${format(date, "PPP", { locale: es })} updated.`,
        variant: "default",
      });
    })().catch(err => {
         console.error("Validation failed:", err);
     });
 };


   const handleDeleteConfirm = (shiftId: string) => {
       const shiftToDelete = shifts.find(s => s.id === shiftId);
       onDeleteShift(shiftId);
        if (shiftToDelete) {
             toast({
                title: "Shift Deleted",
                description: `Shift for ${shiftToDelete.worker} on ${format(date, "PPP", { locale: es })} deleted.`,
                variant: "default",
            });
        }
   };

  if (!isOpen) return null;

  const sortedShifts = [...shifts].sort((a, b) => {
    if (!a.startTime && !b.startTime) return 0;
    if (!a.startTime) return -1;
    if (!b.startTime) return 1;
    return a.startTime.localeCompare(b.startTime);
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {if (!open) handleCancelEdit(); onClose();}}> {/* Ensure cancel edit on close */}
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center text-primary">
            <CalendarDays className="mr-2 h-5 w-5" />
            Turnos para {format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
          </DialogTitle>
          <DialogDescription>
             {editingShiftId ? "Editando turno" : "Detalles de los turnos registrados para este día."}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] p-1 pr-3">
          <div className="space-y-4 py-4">
            {sortedShifts.length > 0 ? (
              sortedShifts.map((shift) => {
                const isEditing = editingShiftId === shift.id;
                const SpecificAreaIcon = getAreaIcon(shift.area);
                return (
                  <div key={shift.id} className="flex items-start space-x-3 p-3 border rounded-lg shadow-sm bg-card transition-colors relative group">
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
                           {shift.comments && (
                              <p className="text-sm text-muted-foreground flex items-start pt-1">
                                <MessageSquare className="mr-2 h-4 w-4 mt-0.5 shrink-0" />
                                <span className="whitespace-pre-wrap">{shift.comments}</span>
                              </p>
                           )}
                        </div>
                        <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditClick(shift)} aria-label="Editar turno">
                                <Edit className="h-4 w-4" />
                            </Button>
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
                            {/* Area Select (Edit) */}
                            <div>
                              <Label htmlFor={`area-${shift.id}`} className="text-xs font-medium flex items-center mb-1">
                                <Building2 className="mr-1 h-3 w-3" /> Area
                              </Label>
                              <Select
                                onValueChange={(value) => form.setValue('area', value, { shouldValidate: true })}
                                value={form.getValues('area')}
                              >
                                <FormControl>
                                  <SelectTrigger className="h-9 text-sm">
                                    <SelectValue placeholder="Select an area" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {allAreas.map(areaName => (
                                    <SelectItem key={areaName} value={areaName}>
                                      {areaName}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {form.formState.errors.area && <p className="text-xs text-destructive mt-1">{form.formState.errors.area.message}</p>}
                            </div>
                            {/* Worker Select (Edit) */}
                            <div>
                              <Label htmlFor={`worker-${shift.id}`} className="text-xs font-medium flex items-center mb-1">
                                <User className="mr-1 h-3 w-3" /> Worker
                              </Label>
                              <Select
                                onValueChange={(value) => form.setValue('worker', value, { shouldValidate: true })}
                                value={form.getValues('worker')}
                                disabled={!selectedAreaEdit || availableWorkersEdit.length === 0}
                              >
                                <FormControl>
                                  <SelectTrigger className="h-9 text-sm">
                                    <SelectValue placeholder={!selectedAreaEdit ? "Select area first" : "Select a worker"} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {availableWorkersEdit.length > 0 ? (
                                    availableWorkersEdit.map(workerName => (
                                      <SelectItem key={workerName} value={workerName}>
                                        {workerName}
                                      </SelectItem>
                                    ))
                                  ) : (
                                     selectedAreaEdit && <SelectItem value="-" disabled>No workers for this area</SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                              {form.formState.errors.worker && <p className="text-xs text-destructive mt-1">{form.formState.errors.worker.message}</p>}
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
                        <div>
                            <Label htmlFor={`comments-${shift.id}`} className="text-xs font-medium flex items-center mb-1">
                                <MessageSquare className="mr-1 h-3 w-3" /> Comments (Optional)
                            </Label>
                            <Textarea id={`comments-${shift.id}`} {...form.register("comments")} placeholder="Add comments" className="h-20 text-sm resize-none" />
                            {form.formState.errors.comments && <p className="text-xs text-destructive mt-1">{form.formState.errors.comments.message}</p>}
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
        {!editingShiftId && (
            <DialogFooter>
             <Button variant="outline" onClick={onClose}>Cerrar</Button>
            </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
