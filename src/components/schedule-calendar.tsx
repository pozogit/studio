
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
import { ShiftDetailsModal } from "@/components/shift-details-modal"; // Import the modal component

interface ScheduleCalendarProps {
  shifts: Shift[];
}

const dayNames = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá']; // Spanish day names

export function ScheduleCalendar({ shifts }: ScheduleCalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date())
  const [filterType, setFilterType] = React.useState<"worker" | "area" | "none">("none")
  const [filterValue, setFilterValue] = React.useState<string>("")
  const [selectedDay, setSelectedDay] = React.useState<Date | null>(null);
  const [selectedShifts, setSelectedShifts] = React.useState<Shift[]>([]);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

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

  const handleDayClick = (day: Date) => {
    const dayShifts = getShiftsForDay(day);
    if (dayShifts.length > 0) {
      setSelectedDay(day);
      setSelectedShifts(dayShifts);
      setIsModalOpen(true);
    }
  };

  const uniqueWorkers = React.useMemo(() => [...new Set(shifts.map(s => s.worker))], [shifts]);
  const uniqueAreas = React.useMemo(() => [...new Set(shifts.map(s => s.area))], [shifts]);

  const renderFilterInput = () => {
    if (filterType === "worker") {
      return (
        <Select value={filterValue} onValueChange={setFilterValue}>
          <SelectTrigger className="w-full md:w-[180px]">
             <User className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filtrar por Trabajador" />
          </SelectTrigger>
          <SelectContent>
             <SelectItem value="">Todos</SelectItem> {/* Option to clear selection */}
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
            <SelectValue placeholder="Filtrar por Área" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas</SelectItem> {/* Option to clear selection */}
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
    <>
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-2 md:space-y-0 pb-4">
          <CardTitle className="text-2xl font-bold text-primary">
            {format(currentMonth, "MMMM yyyy", { locale: es })}
          </CardTitle>
           <div className="flex flex-wrap items-center gap-2">
             <Select value={filterType} onValueChange={(value) => { setFilterType(value as any); setFilterValue(''); }}>
              <SelectTrigger className="w-full md:w-auto">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filtrar por..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin Filtro</SelectItem>
                <SelectItem value="worker">Trabajador</SelectItem>
                <SelectItem value="area">Área</SelectItem>
              </SelectContent>
            </Select>
            {renderFilterInput()}
             {filterType !== 'none' && filterValue && ( // Show clear button only if a filter value is selected
              <Button variant="ghost" size="icon" onClick={clearFilter} aria-label="Limpiar filtro">
                <X className="h-4 w-4" />
              </Button>
            )}
            <div className="flex items-center space-x-1">
                <Button variant="outline" size="icon" onClick={handlePrevMonth} aria-label="Mes anterior">
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleNextMonth} aria-label="Mes siguiente">
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
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

              return (
                <div
                  key={index}
                  onClick={() => isCurrentMonth && handleDayClick(day)} // Make day clickable only if in current month
                  className={`relative border rounded-md p-2 min-h-[100px] transition-colors duration-300 ease-in-out ${
                    isCurrentMonth ? 'bg-card hover:bg-secondary/80 cursor-pointer' : 'bg-muted/50 text-muted-foreground'
                  } ${isSameDay(day, new Date()) ? 'ring-2 ring-primary' : ''}`}
                  aria-label={`Día ${format(day, 'd')}, ${dayShifts.length} turnos`} // Accessibility
                >
                  <div className={`font-medium text-sm mb-1 ${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground/70'}`}>{format(day, "d")}</div>
                  {dayShifts.length > 0 && isCurrentMonth && ( // Only show shifts if in current month
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

      {/* Modal for displaying shift details */}
      {selectedDay && (
        <ShiftDetailsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          shifts={selectedShifts}
          date={selectedDay}
        />
      )}
    </>
  )
}

