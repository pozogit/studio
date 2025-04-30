
"use client"

import * as React from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWithinInterval, addMonths, subMonths, getDay, startOfWeek, endOfWeek } from "date-fns"
import { es } from 'date-fns/locale' // Import Spanish locale
import { ChevronLeft, ChevronRight, User, Building2, Filter, X, Clock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import type { Shift } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getAreaIcon } from "@/lib/types";
import { ShiftDetailsModal } from "@/components/shift-details-modal"; // Import the modal component
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Use a non-empty value for the 'all' option
const ALL_FILTER_VALUE = "__ALL__";

interface ScheduleCalendarProps {
  shifts: Shift[];
}

const dayNames = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá']; // Spanish day names

export function ScheduleCalendar({ shifts }: ScheduleCalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date())
  const [filterType, setFilterType] = React.useState<"worker" | "area" | "none">("none")
  const [filterValue, setFilterValue] = React.useState<string>("") // Store the actual filter value, '' means no filter
  const [selectedDay, setSelectedDay] = React.useState<Date | null>(null);
  const [selectedShifts, setSelectedShifts] = React.useState<Shift[]>([]);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const start = startOfWeek(startOfMonth(currentMonth), { locale: es })
  const end = endOfWeek(endOfMonth(currentMonth), { locale: es })
  const daysInMonth = eachDayOfInterval({ start, end })

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

  const filteredShifts = React.useMemo(() => {
    // Filter based on filterValue, which is '' if 'All' is selected or no filter type
    if (!filterValue || filterType === "none") {
      return shifts;
    }
    return shifts.filter(shift => {
      if (filterType === "worker") {
        // Exact match for worker filter (assuming select gives exact value)
        return shift.worker === filterValue;
      }
      if (filterType === "area") {
         // Exact match for area filter
        return shift.area === filterValue;
      }
      return true;
    });
  }, [shifts, filterType, filterValue]);

  const getShiftsForDay = (day: Date) => {
    // Sort shifts by start time within the day
    return filteredShifts
        .filter(shift => isSameDay(shift.date, day))
        .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || "")); // Handle potentially null times
  }


  const handleDayClick = (day: Date) => {
    const dayShifts = getShiftsForDay(day);
    if (dayShifts.length > 0) {
      setSelectedDay(day);
      setSelectedShifts(dayShifts);
      setIsModalOpen(true);
    }
  };

  const uniqueWorkers = React.useMemo(() => [...new Set(shifts.map(s => s.worker))].sort(), [shifts]);
  const uniqueAreas = React.useMemo(() => [...new Set(shifts.map(s => s.area))].sort(), [shifts]);

  const handleFilterValueChange = (value: string) => {
    // If the special 'All' value is selected, reset filterValue to empty string
    if (value === ALL_FILTER_VALUE) {
      setFilterValue("");
    } else {
      setFilterValue(value);
    }
  };

  const renderFilterInput = () => {
    // The value displayed in the Select trigger should be the stored filterValue
    // or the special ALL_FILTER_VALUE if filterValue is empty (meaning 'All' is selected)
    const displayValue = filterValue === "" ? ALL_FILTER_VALUE : filterValue;

    if (filterType === "worker") {
      return (
        <Select value={displayValue} onValueChange={handleFilterValueChange}>
          <SelectTrigger className="w-full md:w-[180px]">
             <User className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filtrar por Trabajador" />
          </SelectTrigger>
          <SelectContent>
             {/* Use the non-empty value for the 'All' option */}
             <SelectItem value={ALL_FILTER_VALUE}>Todos</SelectItem>
            {uniqueWorkers.map(worker => (
              <SelectItem key={worker} value={worker}>{worker}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    if (filterType === "area") {
       return (
        <Select value={displayValue} onValueChange={handleFilterValueChange}>
          <SelectTrigger className="w-full md:w-[180px]">
            <Building2 className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filtrar por Área" />
          </SelectTrigger>
          <SelectContent>
             {/* Use the non-empty value for the 'All' option */}
            <SelectItem value={ALL_FILTER_VALUE}>Todas</SelectItem>
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
    <TooltipProvider>
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
             {/* Show clear button only if a filter type is selected and a specific value (not 'All') is chosen */}
             {filterType !== 'none' && filterValue && (
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
                  className={`relative border rounded-md p-2 min-h-[120px] transition-colors duration-200 ease-in-out flex flex-col ${ /* Increased min-height slightly */
                    isCurrentMonth ? 'bg-card hover:bg-secondary/80 cursor-pointer' : 'bg-muted/50 text-muted-foreground'
                  } ${isSameDay(day, new Date()) ? 'ring-2 ring-primary' : ''}`}
                  aria-label={`Día ${format(day, 'd')}, ${dayShifts.length} turnos`} // Accessibility
                >
                  <div className={`font-medium text-sm mb-1 ${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground/70'}`}>{format(day, "d")}</div>
                  {dayShifts.length > 0 && isCurrentMonth && ( // Only show shifts if in current month
                    <ScrollArea className="flex-grow mt-1"> {/* Use flex-grow for scroll area */}
                       <div className="space-y-1 text-xs">
                        {dayShifts.map(shift => {
                           const SpecificAreaIcon = getAreaIcon(shift.area);
                           const tooltipContent = `${shift.worker} (${shift.startTime || 'N/A'}-${shift.endTime || 'N/A'}) en ${shift.area}`;
                           return (
                             <Tooltip key={shift.id} delayDuration={300}>
                              <TooltipTrigger asChild>
                                <Badge
                                  variant="secondary"
                                  className="flex items-center justify-start w-full text-left p-1 truncate shadow-sm cursor-default" // Added cursor-default
                                >
                                  <SpecificAreaIcon className="h-3 w-3 mr-1 shrink-0" />
                                  <span className="font-semibold mr-1 truncate">{shift.worker}:</span>
                                  <span className="text-muted-foreground">{shift.startTime || '?'}</span>
                                  {/* Optional: Display Area/End time if space allows or on hover */}
                                  {/* <span className="truncate ml-1">{shift.area}</span> */}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{tooltipContent}</p>
                              </TooltipContent>
                            </Tooltip>
                            );
                         })}
                      </div>
                     </ScrollArea>
                  )}
                   {!isCurrentMonth && <div className="flex-grow"></div>} {/* Ensure non-month days fill space */}
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
      </TooltipProvider>
  )
}

