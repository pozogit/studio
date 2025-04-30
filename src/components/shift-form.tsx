
"use client";

import * as React from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format, eachDayOfInterval } from "date-fns";
import { es } from 'date-fns/locale'; // Import Spanish locale
import { User, Building2, Clock, MessageSquare, MapPin } from "lucide-react"; // Added MapPin
import type { DateRange } from "react-day-picker";


import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DateRangePicker } from "@/components/date-range-picker";
import { useToast } from "@/hooks/use-toast"; // Import useToast
import type { Shift } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // Import RadioGroup
import { allAreas, areaWorkerMap } from "@/lib/data"; // Import data from the new file

// Time validation regex (HH:MM format)
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const formSchema = z.object({
  dateRange: z.object({
      from: z.date({invalid_type_error: "Fecha de inicio inválida.", required_error: "Se requiere fecha de inicio."}),
      to: z.date({invalid_type_error: "Fecha de fin inválida.", required_error: "Se requiere fecha de fin."}),
    },{ required_error: "Se requiere rango de fechas." }
  ).refine(data => data.from <= data.to, {
      message: "La fecha final no puede ser anterior a la fecha de inicio.",
      path: ["to"], // Attach error to 'to'
  }),
  area: z.string().min(1, { // Area selection is required
    message: "Por favor selecciona un area.",
  }),
  worker: z.string().min(1, { // Worker selection is required
    message: "Por favor selecciona un trabajador.",
  }),
  startTime: z.string().regex(timeRegex, {
    message: "Hora de Inicio posee un formato invalido (HH:MM).",
  }),
  endTime: z.string().regex(timeRegex, {
    message: "Hora Final posee un formato invalido (HH:MM).",
  }),
  location: z.enum(['Oficina', 'Remoto'], { // Use Spanish enum values
    required_error: "Por favor selecciona una ubicación (Oficina o Remoto).",
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


interface ShiftFormProps {
  addShift: (shift: Shift) => void;
  onFormSubmitSuccess?: () => void; // Optional callback for success
}

export function ShiftForm({ addShift, onFormSubmitSuccess }: ShiftFormProps) {
  const [availableWorkers, setAvailableWorkers] = React.useState<string[]>([]);
  const { toast } = useToast(); // Get toast function

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      worker: "",
      area: "",
      dateRange: { // Initialize with undefined dates
        from: undefined,
        to: undefined,
      },
      startTime: "",
      endTime: "",
      location: "Oficina", // Default location to "Oficina"
      comments: "",
    },
  });

  // Watch the 'area' field to react to changes
  const selectedArea = form.watch("area");

  // Effect to update available workers when the selected area changes
  React.useEffect(() => {
    if (selectedArea) {
      const workers = areaWorkerMap[selectedArea] || [];
      setAvailableWorkers(workers.sort());
      // Reset worker selection when area changes
      form.setValue('worker', '', { shouldValidate: false }); // Reset without immediate validation
    } else {
      setAvailableWorkers([]); // Clear workers if no area is selected
      form.setValue('worker', '', { shouldValidate: false }); // Also clear worker selection
    }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedArea]); // Rerun effect when selectedArea changes


  function onSubmit(values: z.infer<typeof formSchema>) {
    const { dateRange, worker, area, startTime, endTime, location, comments } = values; // Include location

    // Additional check, although Zod should handle this
    if (!dateRange.from || !dateRange.to) {
      toast({
          title: "Error",
          description: "Por favor selecciona una fecha de inicio y fin.",
          variant: "destructive", // Use destructive variant for errors
       });
      return;
    }

    const days = eachDayOfInterval({
      start: dateRange.from,
      end: dateRange.to,
    });

    let shiftsAddedCount = 0;
    days.forEach(day => {
       const newShift: Shift = {
          id: crypto.randomUUID(),
          date: day,
          worker,
          area,
          startTime,
          endTime,
          location, // Add location to the new shift object
          comments: comments || undefined,
       };
       addShift(newShift);
       shiftsAddedCount++;
    });


    toast({
      title: "Turnos Añadidos",
      description: `${shiftsAddedCount} turno(s) para ${worker} de ${area} (${location}) desde ${format(dateRange.from, 'PPP', { locale: es })} hasta ${format(dateRange.to, 'PPP', { locale: es })} (${startTime} - ${endTime}) registrado(s).`,
      variant: "success", // Use success variant
    });
    form.reset();
    setAvailableWorkers([]); // Reset available workers on successful submit
    // Explicitly reset dateRange to trigger re-render of DateRangePicker with placeholder
    form.setValue('dateRange', { from: undefined, to: undefined });
    form.setValue('worker', '');
    form.setValue('area', '');
    form.setValue('location', 'Oficina'); // Reset location back to default "Oficina"
    form.setValue('comments', '');

    // Call the success callback to close the modal
    onFormSubmitSuccess?.();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="dateRange"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Rango de Fechas</FormLabel>
               <DateRangePicker
                date={field.value}
                setDate={(date) => field.onChange(date || { from: undefined, to: undefined })} // Ensure object format
                placeholder="Selecciona fecha inicio y fin"
                // Pass locale to DateRangePicker if it accepts it, or handle inside if needed
                // For now, assuming DateRangePicker itself uses the global locale setting or relies on Calendar
              />
              <FormDescription>
                Selecciona la fecha de inicio y fin de los turnos.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Area/Department Select */}
        <FormField
          control={form.control}
          name="area"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center">
                 <Building2 className="mr-2 h-4 w-4" /> Área/Departamento
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                  <FormControl>
                      <SelectTrigger>
                          <SelectValue placeholder="Selecciona un área" />
                      </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                       {allAreas.map(areaName => ( // Use allAreas from data.ts
                          <SelectItem key={areaName} value={areaName}>
                              {areaName}
                          </SelectItem>
                      ))}
                  </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Worker Select - Options depend on selected area */}
        <FormField
          control={form.control}
          name="worker"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center">
                <User className="mr-2 h-4 w-4" /> Trabajador
              </FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                // Disable worker select if no area is chosen
                disabled={!selectedArea || availableWorkers.length === 0}
              >
                  <FormControl>
                      <SelectTrigger>
                          <SelectValue placeholder={!selectedArea ? "Selecciona un área primero" : "Selecciona un trabajador"} />
                      </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                      {availableWorkers.length > 0 ? (
                          availableWorkers.map(workerName => (
                              <SelectItem key={workerName} value={workerName}>
                                  {workerName}
                              </SelectItem>
                          ))
                      ) : (
                          // Optional: Display a message if no workers are available for the selected area
                          selectedArea && <SelectItem value="-" disabled>No se encontraron trabajadores para esta área</SelectItem>
                      )}
                  </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                     <Clock className="mr-2 h-4 w-4" /> Hora Inicio
                  </FormLabel>
                  <FormControl>
                    <Input type="time" placeholder="HH:MM" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <Clock className="mr-2 h-4 w-4" /> Hora Fin
                  </FormLabel>
                  <FormControl>
                    <Input type="time" placeholder="HH:MM" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
         </div>

         {/* Location Selection (Office/Remote) */}
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel className="flex items-center">
                 <MapPin className="mr-2 h-4 w-4" /> Ubicación
              </FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value} // Use value from form state
                  className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-4"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="Oficina" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Oficina
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="Remoto" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Remoto
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />


        <FormField
          control={form.control}
          name="comments"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center">
                <MessageSquare className="mr-2 h-4 w-4" /> Comentarios (Opcional)
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Añadir comentarios relevantes sobre el/los turno(s)"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />


        <Button type="submit" className="w-full">
          Registrar Turnos
        </Button>
      </form>
    </Form>
  );
}

