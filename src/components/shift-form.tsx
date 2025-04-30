
"use client";

import * as React from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format, eachDayOfInterval } from "date-fns";
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
import { toast } from "@/hooks/use-toast";
import type { Shift } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // Import RadioGroup
import { allAreas, areaWorkerMap } from "@/lib/data"; // Import data from the new file

// Time validation regex (HH:MM format)
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const formSchema = z.object({
  dateRange: z.object({
      from: z.date({ required_error: "Start date is required." }),
      to: z.date({ required_error: "End date is required." }),
    }, { required_error: "Date range is required." }
  ),
  area: z.string().min(1, { // Area selection is required
    message: "Please select an area.",
  }),
  worker: z.string().min(1, { // Worker selection is required
    message: "Please select a worker.",
  }),
  startTime: z.string().regex(timeRegex, {
    message: "Invalid start time format (HH:MM).",
  }),
  endTime: z.string().regex(timeRegex, {
    message: "Invalid end time format (HH:MM).",
  }),
  location: z.enum(['Office', 'Remote'], { // Added location validation
    required_error: "Please select a location (Office or Remote).",
  }),
  comments: z.string().optional(),
}).refine(data => data.dateRange.from <= data.dateRange.to, {
  message: "End date cannot be before start date.",
  path: ["dateRange"],
}).refine(data => {
    if (data.startTime && data.endTime && timeRegex.test(data.startTime) && timeRegex.test(data.endTime)) {
        return data.startTime < data.endTime;
    }
    return true;
}, {
    message: "End time must be after start time.",
    path: ["endTime"],
});


interface ShiftFormProps {
  addShift: (shift: Shift) => void;
}

export function ShiftForm({ addShift }: ShiftFormProps) {
  const [availableWorkers, setAvailableWorkers] = React.useState<string[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      worker: "",
      area: "",
      dateRange: undefined,
      startTime: "",
      endTime: "",
      location: undefined, // Default location to undefined initially
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

    if (!dateRange.from || !dateRange.to) {
      toast({
          title: "Error",
          description: "Please select both a start and end date.",
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
      title: "Shifts Added",
      description: `${shiftsAddedCount} shift(s) for ${worker} in ${area} (${location}) from ${format(dateRange.from, 'PPP')} to ${format(dateRange.to, 'PPP')} (${startTime} - ${endTime}) registered.`,
      variant: "success", // Use success variant
    });
    form.reset();
    setAvailableWorkers([]); // Reset available workers on successful submit
    form.setValue('dateRange', undefined);
    form.setValue('worker', '');
    form.setValue('area', '');
    form.setValue('location', undefined); // Reset location
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="dateRange"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date Range</FormLabel>
               <DateRangePicker
                date={field.value}
                setDate={field.onChange}
                placeholder="Select shift start and end date"
              />
              <FormDescription>
                Select the start and end date for the shifts.
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
                 <Building2 className="mr-2 h-4 w-4" /> Area/Department
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                  <FormControl>
                      <SelectTrigger>
                          <SelectValue placeholder="Select an area" />
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
                <User className="mr-2 h-4 w-4" /> Worker
              </FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                // Disable worker select if no area is chosen
                disabled={!selectedArea || availableWorkers.length === 0}
              >
                  <FormControl>
                      <SelectTrigger>
                          <SelectValue placeholder={!selectedArea ? "Select an area first" : "Select a worker"} />
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
                          selectedArea && <SelectItem value="-" disabled>No workers found for this area</SelectItem>
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
                     <Clock className="mr-2 h-4 w-4" /> Start Time
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
                    <Clock className="mr-2 h-4 w-4" /> End Time
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
                 <MapPin className="mr-2 h-4 w-4" /> Location
              </FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-4"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="Office" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Office
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="Remote" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Remote
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
                <MessageSquare className="mr-2 h-4 w-4" /> Comments (Optional)
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any relevant comments about the shift(s)"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />


        <Button type="submit" className="w-full">
          Register Shifts
        </Button>
      </form>
    </Form>
  );
}
