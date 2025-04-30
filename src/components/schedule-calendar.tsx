"use client"

import * as React from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWithinInterval, addMonths, subMonths, getDay, startOfWeek, endOfWeek } from "date-fns"
import { es } from 'date-fns/locale' // Import Spanish locale
import { ChevronLeft, ChevronRight, User, Building2, Filter, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import type { Shift } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getAreaIcon } from "@/lib/types";

interface ScheduleCalendarProps {
  shifts: Shift[];
}

const dayNames = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá']; // Spanish day names

export function ScheduleCalendar({ shifts }: ScheduleCalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date())
  const [filterType, setFilterType] = React.useState<"worker" | "area" | "none">("none")
  const [filterValue, setFilterValue] = React.useState<string>("")

  const start = startOfWeek(startOfMonth(currentMonth), { locale: es })
  const end = endOfWeek(endOfMonth(currentMonth), { locale: es })
  const daysInMonth = eachDayOfInterval({ start, end })

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

  const filteredShifts = React.useMemo(() => {
    if (filterType === "none" || !filterValue) {
      return shifts;
    }
    return shifts.filter(shift => {
      if (filterType === "worker") {
        return shift.worker.toLowerCase().includes(filterValue.toLowerCase());
      }
      if (filterType === "area") {
        return shift.area.toLowerCase().includes(filterValue.toLowerCase());
      }
      return true; // Should not happen with current logic
    });
  }, [shifts, filterType, filterValue]);

  const getShiftsForDay = (day: Date) => {
    return filteredShifts.filter(shift => isSameDay(shift.date, day));
  }

  const uniqueWorkers = React.useMemo(() => [...new Set(shifts.map(s => s.worker))], [shifts]);
  const uniqueAreas = React.useMemo(() => [...new Set(shifts.map(s => s.area))], [shifts]);

  const renderFilterInput = () => {
    if (filterType === "worker") {
      return (
        <Select value={filterValue} onValueChange={setFilterValue}>
          <SelectTrigger className="w-full md:w-[180px]">
             <User className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by Worker" />
          </SelectTrigger>
          <SelectContent>
            {uniqueWorkers.map(worker => (
              <SelectItem key={worker} value={worker}>{worker}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    if (filterType === "area") {
       return (
        <Select value={filterValue} onValueChange={setFilterValue}>
          <SelectTrigger className="w-full md:w-[180px]">
            <Building2 className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by Area" />
          </SelectTrigger>
          <SelectContent>
            {uniqueAreas.map(area => (
              <SelectItem key={area} value={area}>{area}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    return null; // No input when filter is 'none'
  }

  const clearFilter = () => {
    setFilterType("none");
    setFilterValue("");
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold text-primary">
          {format(currentMonth, "MMMM yyyy", { locale: es })}
        </CardTitle>
         <div className="flex items-center space-x-2">
           <Select value={filterType} onValueChange={(value) => { setFilterType(value as any); setFilterValue(''); }}>
            <SelectTrigger className="w-auto">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Filter</SelectItem>
              <SelectItem value="worker">Worker</SelectItem>
              <SelectItem value="area">Area</SelectItem>
            </SelectContent>
          </Select>
          {renderFilterInput()}
           {filterType !== 'none' && (
            <Button variant="ghost" size="icon" onClick={clearFilter} aria-label="Clear filter">
              <X className="h-4 w-4" />
            </Button>
          )}
          <Button variant="outline" size="icon" onClick={handlePrevMonth} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextMonth} aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 text-center font-semibold text-muted-foreground mb-2">
          {dayNames.map(day => <div key={day}>{day}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {daysInMonth.map((day, index) => {
            const dayShifts = getShiftsForDay(day);
            const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
            const AreaIcon = dayShifts.length > 0 ? getAreaIcon(dayShifts[0].area) : Building2; // Example: use first shift's area icon

            return (
              <div
                key={index}
                className={`relative border rounded-md p-2 min-h-[100px] transition-colors duration-300 ease-in-out ${
                  isCurrentMonth ? 'bg-card hover:bg-secondary/80' : 'bg-muted/50 text-muted-foreground'
                } ${isSameDay(day, new Date()) ? 'ring-2 ring-primary' : ''}`}
              >
                <div className={`font-medium ${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground/70'}`}>{format(day, "d")}</div>
                {dayShifts.length > 0 && (
                  <ScrollArea className="h-[60px] mt-1">
                     <div className="space-y-1 text-xs">
                      {dayShifts.map(shift => {
                         const SpecificAreaIcon = getAreaIcon(shift.area);
                         return (
                          <Badge key={shift.id} variant="secondary" className="flex items-center justify-start w-full text-left p-1 truncate shadow-sm">
                              <SpecificAreaIcon className="h-3 w-3 mr-1 shrink-0" />
                              <span className="font-semibold mr-1">{shift.worker}:</span>
                              <span className="truncate">{shift.area}</span>
                            </Badge>
                          );
                       })}
                    </div>
                   </ScrollArea>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  )
}
