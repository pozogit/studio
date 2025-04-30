
"use client";

import * as React from "react";
import { format } from "date-fns";
import { es } from 'date-fns/locale';
import { User, Building2, CalendarDays, Clock, Edit, Trash2, Save, X, MessageSquare, AlertCircle } from "lucide-react"; // Added AlertCircle
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
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"; // Import Form components


// Time validation regex (HH:MM format)
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

// Zod schema for editing a single shift
const editShiftSchema = z.object({
  worker: z.string().min(1, { // Changed validation to min 1 as it's a selection
    message: "Por favor seleccione un trabajador.",
  }),
  area: z.string().min(1, { // Changed validation to min 1 as it's a selection
    message: "Por favor seleccione un área.",
  }),
  startTime: z.string().regex(timeRegex, {
    message: "Formato de hora de inicio inválido (HH:MM).",
  }),
  endTime: z.string().regex(timeRegex, {
    message: "Formato de hora de fin inválido (HH:MM).",
  }),
  comments: z.string().optional(),
}).refine(data => {
    if (data.startTime && data.endTime && timeRegex.test(data.startTime) && timeRegex.test(data.endTime)) {
        return data.startTime < data.endTime;
    }
    return true;
}, {
    message: "La hora de fin debe ser posterior a la hora de inicio.",
    path: ["endTime"],
});

type EditShiftFormData = z.infer<typeof editShiftSchema>;


interface ShiftDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shifts: Shift[]; // These are the shifts filtered for the day and potentially by worker/area
  allShifts: Shift[]; // The complete list of all shifts for updating/deleting
  date: Date;
  onUpdateShifts: (updatedShifts: Shift[]) => void; // Callback operates on the *full* list
  onDeleteShift: (shiftId: string) => void; // Callback operates on the *full* list
}

export function ShiftDetailsModal({
  isOpen,
  onClose,
  shifts, // Filtered shifts to display
  allShifts, // Full list for backend operations
  date,
  onUpdateShifts,
  onDeleteShift
}: ShiftDetailsModalProps) {
  const [editingShiftId, setEditingShiftId] = React.useState<string | null>(null);
  const [availableWorkersEdit, setAvailableWorkersEdit] = React.useState<string[]>([]);

  // Find the total number of shifts for this day from the unfiltered list
  const totalShiftsForDay = React.useMemo(() => {
    return allShifts.filter(s => format(s.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')).length;
  }, [allShifts, date]);

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
      // IMPORTANT: Update based on the `allShifts` list
      const updatedAllShifts = allShifts.map(s =>
        s.id === shiftId ? { ...s, ...data, date: new Date(date), comments: data.comments || undefined } : s // Ensure date is correct, update comments
      );
      onUpdateShifts(updatedAllShifts); // Pass the fully updated list back
      setEditingShiftId(null);
      setAvailableWorkersEdit([]); // Clear workers list
      toast({
        title: "Turno Actualizado",
        description: `Turno para ${data.worker} el ${format(date, "PPP", { locale: es })} actualizado.`,
        variant: "default",
      });
    })().catch(err => {
         console.error("Validation failed:", err);
         // Optionally show validation errors in toast
         toast({
            title: "Error de Validación",
            description: "Por favor revise los campos del formulario.",
            variant: "destructive",
         })
     });
 };


   const handleDeleteConfirm = (shiftId: string) => {
       // IMPORTANT: Find shift in the *displayed* list for the toast message,
       // but call onDeleteShift with the ID, which operates on the `allShifts` list.
       const shiftToDelete = shifts.find(s => s.id === shiftId);
       onDeleteShift(shiftId);
        if (shiftToDelete) {
             toast({
                title: "Turno Eliminado",
                description: `Turno para ${shiftToDelete.worker} el ${format(date, "PPP", { locale: es })} eliminado.`,
                variant: "default",
            });
        }
   };

  if (!isOpen) return null;

  // Sort the *displayed* (potentially filtered) shifts
  const sortedShifts = [...shifts].sort((a, b) => {
    if (!a.startTime && !b.startTime) return 0;
    if (!a.startTime) return -1;
    if (!b.startTime) return 1;
    return a.startTime.localeCompare(b.startTime);
  });

  const isFiltered = shifts.length < totalShiftsForDay;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {if (!open) handleCancelEdit(); onClose();}}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center text-primary">
            <CalendarDays className="mr-2 h-5 w-5" />
            Turnos para {format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
          </DialogTitle>
          <DialogDescription>
             {editingShiftId ? "Editando turno seleccionado." : `Mostrando ${shifts.length} de ${totalShiftsForDay} turnos para este día.`}
             {isFiltered && !editingShiftId && <span className="text-xs text-muted-foreground"> (Filtro aplicado)</span>}
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
                                ? `${shift.startTime} - (Sin hora fin)`
                                : shift.endTime
                                  ? `(Sin hora inicio) - ${shift.endTime}`
                                  : '(Hora no especificada)'}
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
                      // Edit Form using react-hook-form
                      <Form {...form}>
                         <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(shift.id); }} className="w-full space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <FormField
                                  control={form.control}
                                  name="area"
                                  render={({ field }) => (
                                    <FormItem>
                                        <Label className="text-xs font-medium flex items-center mb-1">
                                            <Building2 className="mr-1 h-3 w-3" /> Área
                                        </Label>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="h-9 text-sm">
                                                    <SelectValue placeholder="Seleccionar un área" />
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
                                        <FormMessage className="text-xs" />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="worker"
                                  render={({ field }) => (
                                     <FormItem>
                                        <Label className="text-xs font-medium flex items-center mb-1">
                                            <User className="mr-1 h-3 w-3" /> Trabajador
                                        </Label>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                            disabled={!selectedAreaEdit || availableWorkersEdit.length === 0}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="h-9 text-sm">
                                                    <SelectValue placeholder={!selectedAreaEdit ? "Selecciona área primero" : "Seleccionar un trabajador"} />
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
                                                    selectedAreaEdit && <SelectItem value="-" disabled>No hay trabajadores para esta área</SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage className="text-xs" />
                                    </FormItem>
                                  )}
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <FormField
                                  control={form.control}
                                  name="startTime"
                                  render={({ field }) => (
                                    <FormItem>
                                        <Label className="text-xs font-medium flex items-center mb-1">
                                            <Clock className="mr-1 h-3 w-3" /> Hora Inicio
                                        </Label>
                                        <FormControl>
                                            <Input type="time" {...field} className="h-9 text-sm" />
                                        </FormControl>
                                        <FormMessage className="text-xs" />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="endTime"
                                  render={({ field }) => (
                                    <FormItem>
                                        <Label className="text-xs font-medium flex items-center mb-1">
                                            <Clock className="mr-1 h-3 w-3" /> Hora Fin
                                        </Label>
                                        <FormControl>
                                            <Input type="time" {...field} className="h-9 text-sm" />
                                        </FormControl>
                                        <FormMessage className="text-xs" />
                                    </FormItem>
                                  )}
                                />
                            </div>
                             <FormField
                                  control={form.control}
                                  name="comments"
                                  render={({ field }) => (
                                    <FormItem>
                                        <Label className="text-xs font-medium flex items-center mb-1">
                                            <MessageSquare className="mr-1 h-3 w-3" /> Comentarios (Opcional)
                                        </Label>
                                        <FormControl>
                                            <Textarea placeholder="Añadir comentarios" {...field} className="h-20 text-sm resize-none" />
                                        </FormControl>
                                        <FormMessage className="text-xs" />
                                    </FormItem>
                                  )}
                                />

                            <div className="flex justify-end space-x-2 pt-2">
                                <Button type="button" variant="ghost" size="sm" onClick={handleCancelEdit}>
                                    <X className="mr-1 h-4 w-4" /> Cancelar
                                </Button>
                                <Button type="submit" variant="default" size="sm">
                                    <Save className="mr-1 h-4 w-4" /> Guardar
                                </Button>
                            </div>
                        </form>
                       </Form>
                    )}
                  </div>
                );
              })
            ) : (
               // Show message indicating either no shifts or shifts filtered out
                <p className="text-sm text-muted-foreground text-center py-4 flex items-center justify-center gap-2">
                  <AlertCircle className="h-4 w-4"/>
                  {totalShiftsForDay > 0 && isFiltered
                    ? "No hay turnos que coincidan con el filtro actual para este día."
                    : "No hay turnos registrados para este día."}
                </p>
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

