
"use client";

import * as React from "react";
import { format } from "date-fns";
// import { es } from 'date-fns/locale'; // Removed Spanish locale
import { User, Building2, CalendarDays, Clock, Edit, Trash2, Save, X, MessageSquare, AlertCircle, MapPin } from "lucide-react"; // Added MapPin
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // Import RadioGroup
import { allAreas, areaWorkerMap } from "@/lib/data"; // Import data
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"; // Import Form components


// Time validation regex (HH:MM format)
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

// Zod schema for editing a single shift
const editShiftSchema = z.object({
  worker: z.string().min(1, {
    message: "Please select a worker.",
  }),
  area: z.string().min(1, {
    message: "Please select an area.",
  }),
  startTime: z.string().regex(timeRegex, {
    message: "Invalid start time format (HH:MM).",
  }),
  endTime: z.string().regex(timeRegex, {
    message: "Invalid end time format (HH:MM).",
  }),
  location: z.enum(['Office', 'Remote'], {
    required_error: "Please select a location.",
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
      location: "Office", // Default to Office, adjust if needed
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
      location: shift.location || 'Office', // Use existing or default to Office
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
        title: "Shift Updated",
        description: `Shift for ${data.worker} on ${format(date, "PPP")} updated.`, // Removed locale
        variant: "success", // Use success variant
      });
    })().catch(err => {
         console.error("Validation failed:", err);
         // Optionally show validation errors in toast
         toast({
            title: "Validation Error",
            description: "Please review the form fields.",
            variant: "destructive", // Use destructive variant
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
                title: "Shift Deleted",
                description: `Shift for ${shiftToDelete.worker} on ${format(date, "PPP")} deleted.`, // Removed locale
                variant: "default", // Use default variant for neutral info
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
            Shifts for {format(date, "EEEE, MMMM d, yyyy")} {/* Removed locale */}
          </DialogTitle>
          <DialogDescription>
             {editingShiftId ? "Editing selected shift." : `Showing ${shifts.length} of ${totalShiftsForDay} shifts for this day.`}
             {isFiltered && !editingShiftId && <span className="text-xs text-muted-foreground"> (Filter applied)</span>}
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
                            <MapPin className="mr-2 h-4 w-4" />
                            {shift.location || 'N/A'} {/* Display location */}
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
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditClick(shift)} aria-label="Edit shift">
                                <Edit className="h-4 w-4" />
                            </Button>
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" aria-label="Delete shift">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the shift for {shift.worker} in {shift.area} from {shift.startTime} to {shift.endTime}.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteConfirm(shift.id)} className="bg-destructive hover:bg-destructive/90">
                                        Delete
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
                                            <Building2 className="mr-1 h-3 w-3" /> Area
                                        </Label>
                                        <Select onValueChange={field.onChange} value={field.value}>
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
                                            <User className="mr-1 h-3 w-3" /> Worker
                                        </Label>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
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
                                            <Clock className="mr-1 h-3 w-3" /> Start Time
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
                                            <Clock className="mr-1 h-3 w-3" /> End Time
                                        </Label>
                                        <FormControl>
                                            <Input type="time" {...field} className="h-9 text-sm" />
                                        </FormControl>
                                        <FormMessage className="text-xs" />
                                    </FormItem>
                                  )}
                                />
                            </div>
                             {/* Location Edit Field */}
                              <FormField
                                control={form.control}
                                name="location"
                                render={({ field }) => (
                                  <FormItem className="space-y-2">
                                    <Label className="text-xs font-medium flex items-center">
                                      <MapPin className="mr-1 h-3 w-3" /> Location
                                    </Label>
                                    <FormControl>
                                      <RadioGroup
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        className="flex space-x-4"
                                      >
                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                          <FormControl>
                                            <RadioGroupItem value="Office" />
                                          </FormControl>
                                          <FormLabel className="font-normal text-sm">
                                            Office
                                          </FormLabel>
                                        </FormItem>
                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                          <FormControl>
                                            <RadioGroupItem value="Remote" />
                                          </FormControl>
                                          <FormLabel className="font-normal text-sm">
                                            Remote
                                          </FormLabel>
                                        </FormItem>
                                      </RadioGroup>
                                    </FormControl>
                                    <FormMessage className="text-xs" />
                                  </FormItem>
                                )}
                              />
                             <FormField
                                  control={form.control}
                                  name="comments"
                                  render={({ field }) => (
                                    <FormItem>
                                        <Label className="text-xs font-medium flex items-center mb-1">
                                            <MessageSquare className="mr-1 h-3 w-3" /> Comments (Optional)
                                        </Label>
                                        <FormControl>
                                            <Textarea placeholder="Add comments" {...field} className="h-20 text-sm resize-none" />
                                        </FormControl>
                                        <FormMessage className="text-xs" />
                                    </FormItem>
                                  )}
                                />

                            <div className="flex justify-end space-x-2 pt-2">
                                <Button type="button" variant="ghost" size="sm" onClick={handleCancelEdit}>
                                    <X className="mr-1 h-4 w-4" /> Cancel
                                </Button>
                                <Button type="submit" variant="default" size="sm">
                                    <Save className="mr-1 h-4 w-4" /> Save
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
                    ? "No shifts match the current filter for this day."
                    : "No shifts registered for this day."}
                </p>
            )}
          </div>
        </ScrollArea>
        {!editingShiftId && (
            <DialogFooter>
             <Button variant="outline" onClick={onClose}>Close</Button>
            </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
