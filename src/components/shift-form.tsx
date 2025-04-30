"use client";

import type * as React from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, User, Building2 } from "lucide-react";

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
import { DatePicker } from "@/components/date-picker";
import { toast } from "@/hooks/use-toast";
import type { Shift } from "@/lib/types";

const formSchema = z.object({
  date: z.date({
    required_error: "A date is required.",
  }),
  worker: z.string().min(2, {
    message: "Worker name must be at least 2 characters.",
  }),
  area: z.string().min(2, {
    message: "Area name must be at least 2 characters.",
  }),
});

interface ShiftFormProps {
  addShift: (shift: Shift) => void;
}

export function ShiftForm({ addShift }: ShiftFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      worker: "",
      area: "",
      date: undefined,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const newShift: Shift = {
      id: crypto.randomUUID(), // Simple ID generation for client-side
      ...values,
    };
    addShift(newShift);
    toast({
      title: "Shift Added",
      description: `${values.worker}'s shift in ${values.area} on ${format(values.date, 'PPP')} registered.`,
      variant: "default", // Use default (blue primary) for info
    });
    form.reset(); // Reset form after successful submission
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
              <DatePicker
                date={field.value}
                setDate={field.onChange}
                placeholder="Select shift date"
              />
              <FormDescription>
                Select the date for the work shift.
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
        <Button type="submit" className="w-full">
          Register Shift
        </Button>
      </form>
    </Form>
  );
}
