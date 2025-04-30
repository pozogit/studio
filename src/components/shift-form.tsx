
"use client";

import * as React from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format, eachDayOfInterval } from "date-fns";
import { User, Building2, Clock } from "lucide-react";
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
import { DateRangePicker } from "@/components/date-range-picker"; // Import the new component
import { toast } from "@/hooks/use-toast";
import type { Shift } from "@/lib/types";

// Time validation regex (HH:MM format)
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const formSchema = z.object({
  dateRange: z.object({
      from: z.date({ required_error: "Start date is required." }),
      to: z.date({ required_error: "End date is required." }),
    }, { required_error: "Date range is required." }
  ),
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
}).refine(data => data.dateRange.from <= data.dateRange.to, {
  message: "End date cannot be before start date.",
  path: ["dateRange"], // Attach error to the date range field
}).refine(data => {
    // Basic time comparison: Ensure end time is after start time on the same day
    // More complex logic might be needed for overnight shifts spanning midnight
    if (data.startTime && data.endTime && timeRegex.test(data.startTime) && timeRegex.test(data.endTime)) {
        return data.startTime < data.endTime;
    }
    return true; // Skip if formats are invalid (handled by regex)
}, {
    message: "End time must be after start time.",
    path: ["endTime"], // Attach error to the end time field
});


interface ShiftFormProps {
  addShift: (shift: Shift) => void; // Keep this to add one shift at a time to parent state
}

export function ShiftForm({ addShift }: ShiftFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      worker: "",
      area: "",
      dateRange: undefined,
      startTime: "", // Initialize time fields
      endTime: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const { dateRange, worker, area, startTime, endTime } = values;

    if (!dateRange.from || !dateRange.to) {
      toast({
          title: "Error",
          description: "Please select both a start and end date.",
          variant: "destructive",
       });
      return; // Should be caught by validation, but good practice
    }

    const days = eachDayOfInterval({
      start: dateRange.from,
      end: dateRange.to,
    });

    let shiftsAddedCount = 0;
    days.forEach(day => {
       const newShift: Shift = {
          id: crypto.randomUUID(), // Simple ID generation for client-side
          date: day, // Assign the specific day from the range
          worker,
          area,
          startTime,
          endTime,
       };
       addShift(newShift);
       shiftsAddedCount++;
    });


    toast({
      title: "Shifts Added",
      description: `${shiftsAddedCount} shift(s) for ${worker} in ${area} from ${format(dateRange.from, 'PPP')} to ${format(dateRange.to, 'PPP')} (${startTime} - ${endTime}) registered.`,
      variant: "default",
    });
    form.reset(); // Reset form after successful submission
     // Manually reset date range as it's a complex object
     form.setValue('dateRange', undefined);
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
        <FormField
          control={form.control}
          name="worker"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center">
                <User className="mr-2 h-4 w-4" /> Worker
              </FormLabel>
              <FormControl>
                <Input placeholder="Enter worker name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="area"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center">
                 <Building2 className="mr-2 h-4 w-4" /> Area/Department
              </FormLabel>
              <FormControl>
                <Input placeholder="Enter area or department name" {...field} />
              </FormControl>
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
                    {/* Consider using a dedicated time picker component if available/needed */}
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
                     {/* Consider using a dedicated time picker component if available/needed */}
                    <Input type="time" placeholder="HH:MM" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
         </div>

        <Button type="submit" className="w-full">
          Register Shifts
        </Button>
      </form>
    </Form>
  );
}
