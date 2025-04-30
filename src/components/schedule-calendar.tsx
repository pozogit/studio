
"use client"

import * as React from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWithinInterval, addMonths, subMonths, getDay, startOfWeek, endOfWeek, getMonth } from "date-fns"
import { es } from 'date-fns/locale' // Import Spanish locale
import { ChevronLeft, ChevronRight, User, Building2, Filter, X, Clock, FileSpreadsheet, MessageSquare } from "lucide-react" // Added MessageSquare
import * as XLSX from 'xlsx'; // Import xlsx library

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
import { allAreas, allWorkers } from "@/lib/data"; // Import default data for filters


// Use a non-empty value for the 'all' option
const ALL_FILTER_VALUE = "__ALL__";

interface ScheduleCalendarProps {
  allShifts: Shift[]; // Renamed from shifts to allShifts for clarity
  setShifts: (shifts: Shift[]) => void; // Function to update the main shifts state
}

const dayNames = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá']; // Spanish day names

export function ScheduleCalendar({ allShifts, setShifts }: ScheduleCalendarProps) {
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

  const filteredShiftsForDisplay = React.useMemo(() => {
    // Filter based on filterValue, which is '' if 'All' is selected or no filter type
    if (!filterValue || filterType === "none") {
      return allShifts;
    }
    return allShifts.filter(shift => {
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
  }, [allShifts, filterType, filterValue]); // Depend on allShifts

  const getShiftsForDay = (day: Date, shiftsToFilter: Shift[]) => {
    // Sort shifts by start time within the day
    return shiftsToFilter
        .filter(shift => isSameDay(shift.date, day))
        .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || "")); // Handle potentially null times
  }


  const handleDayClick = (day: Date) => {
    // Get shifts for the clicked day using the *filtered* list for the modal
    const dayShiftsFiltered = getShiftsForDay(day, filteredShiftsForDisplay);
    // Only open the modal if there are shifts matching the current filter for that day
    if (dayShiftsFiltered.length > 0) {
      setSelectedDay(day);
      setSelectedShifts(dayShiftsFiltered); // Modal shows filtered shifts for the day
      setIsModalOpen(true);
    }
  };

  // Use unique workers/areas from the imported data for filters
  const uniqueWorkers = allWorkers; // Already sorted in data.ts
  const uniqueAreas = allAreas;   // Already sorted in data.ts


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

  // Handler to update shifts (passed down to the modal)
   const handleUpdateShifts = (updatedShifts: Shift[]) => {
     setShifts(updatedShifts); // Update the parent state
     setIsModalOpen(false); // Close modal after update
   };

   // Handler to delete a shift (passed down to the modal)
   const handleDeleteShift = (shiftId: string) => {
      const remainingShifts = allShifts.filter(shift => shift.id !== shiftId);
      setShifts(remainingShifts); // Update the parent state
      // Update selected shifts for the modal if it's still open for that day
      if (selectedDay) {
        // Re-filter the remaining shifts to update the modal content accurately
        const remainingFilteredShifts = filteredShiftsForDisplay.filter(shift => shift.id !== shiftId);
        const updatedDayShifts = getShiftsForDay(selectedDay, remainingFilteredShifts);
        setSelectedShifts(updatedDayShifts);
        // Close modal if no *filtered* shifts remain for the selected day
        if (updatedDayShifts.length === 0) {
          setIsModalOpen(false);
          setSelectedDay(null);
        }
      }
    };

   // Function to handle exporting data to Excel
    const handleExportExcel = () => {
        // 1. Filter shifts for the current month based on display filters
        const shiftsForCurrentMonth = filteredShiftsForDisplay.filter(
            shift => getMonth(shift.date) === getMonth(currentMonth) &&
                     shift.date.getFullYear() === currentMonth.getFullYear()
        );

        // 2. Prepare data for Excel (map to desired format)
        const dataForExcel = shiftsForCurrentMonth
            .sort((a, b) => a.date.getTime() - b.date.getTime() || (a.startTime || "").localeCompare(b.startTime || "")) // Sort by date then time
            .map(shift => ({
                Fecha: format(shift.date, 'yyyy-MM-dd'), // Format date as YYYY-MM-DD
                Trabajador: shift.worker,
                Área: shift.area,
                'Hora Inicio': shift.startTime,
                'Hora Fin': shift.endTime,
                Comentarios: shift.comments || '', // Add comments field
            }));

        // 3. Create worksheet and workbook
        const ws = XLSX.utils.json_to_sheet(dataForExcel);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Horario"); // Name the sheet "Horario"

        // 4. Generate filename
        const fileName = `shiftmaster_horario_${format(currentMonth, "yyyy-MM", { locale: es })}.xlsx`;

        // 5. Trigger download
        XLSX.writeFile(wb, fileName);
    };


  return (
    <TooltipProvider>
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0 pb-4">
         <div className="flex flex-col space-y-1">
             <CardTitle className="text-2xl font-bold text-primary">
                {format(currentMonth, "MMMM yyyy", { locale: es })}
            </CardTitle>
             <span className="text-sm text-muted-foreground">Vista de calendario</span>
         </div>
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
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={clearFilter} aria-label="Limpiar filtro">
                        <X className="h-4 w-4" />
                      </Button>
                  </TooltipTrigger>
                   <TooltipContent>
                    <p>Limpiar filtro</p>
                  </TooltipContent>
                </Tooltip>
            )}
            <div className="flex items-center space-x-1">
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" onClick={handlePrevMonth} aria-label="Mes anterior">
                          <ChevronLeft className="h-4 w-4" />
                      </Button>
                   </TooltipTrigger>
                   <TooltipContent>
                    <p>Mes anterior</p>
                  </TooltipContent>
                </Tooltip>
                 <Tooltip delayDuration={100}>
                   <TooltipTrigger asChild>
                     <Button variant="outline" size="icon" onClick={handleNextMonth} aria-label="Mes siguiente">
                          <ChevronRight className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                     <p>Mes siguiente</p>
                    </TooltipContent>
                 </Tooltip>
            </div>
             {/* Export Button */}
            <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={handleExportExcel} aria-label="Exportar a Excel">
                        <FileSpreadsheet className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Exportar mes actual a Excel</p>
                </TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 text-center font-semibold text-muted-foreground mb-2">
            {dayNames.map(day => <div key={day}>{day}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {daysInMonth.map((day, index) => {
              // Get shifts for the day using the *filtered* list for display
              const dayShiftsDisplay = getShiftsForDay(day, filteredShiftsForDisplay);
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
              const totalShiftsForDay = getShiftsForDay(day, allShifts).length; // Get total shifts for aria-label

              return (
                <div
                  key={index}
                  onClick={() => isCurrentMonth && handleDayClick(day)} // Make day clickable only if in current month
                  className={`relative border rounded-md p-2 min-h-[120px] transition-colors duration-200 ease-in-out flex flex-col ${ /* Increased min-height slightly */
                    isCurrentMonth ? 'bg-card hover:bg-secondary/80 cursor-pointer' : 'bg-muted/50 text-muted-foreground'
                  } ${isSameDay(day, new Date()) ? 'ring-2 ring-primary' : ''} ${!isCurrentMonth || dayShiftsDisplay.length === 0 ? 'opacity-70' : ''}` /* Fade if no shifts match filter */}
                  // Updated aria-label to show filtered count / total count
                  aria-label={`Día ${format(day, 'd')}, ${dayShiftsDisplay.length}/${totalShiftsForDay} turnos (${filterType !== 'none' && filterValue ? `filtrado por ${filterType} '${filterValue}'` : 'sin filtro'})`}
                >
                  <div className={`font-medium text-sm mb-1 ${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground/70'}`}>{format(day, "d")}</div>
                  {/* Display shifts from the filtered list */}
                  {dayShiftsDisplay.length > 0 && isCurrentMonth && (
                    <ScrollArea className="flex-grow mt-1"> {/* Use flex-grow for scroll area */}
                       <div className="space-y-1 text-xs">
                        {dayShiftsDisplay.map(shift => {
                           const SpecificAreaIcon = getAreaIcon(shift.area);
                           // Improved tooltip content generation
                           let tooltipLines = [
                             `${shift.worker} (${shift.startTime || 'N/A'}-${shift.endTime || 'N/A'}) en ${shift.area}`
                           ];
                           if (shift.comments) {
                             // Add comments, truncate if too long for a simple tooltip line
                             const truncatedComment = shift.comments.length > 50 ? shift.comments.substring(0, 47) + '...' : shift.comments;
                             tooltipLines.push(`Comentarios: ${truncatedComment}`);
                           }
                           const tooltipContent = tooltipLines.join('\n'); // Join lines with newline

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
                                   {shift.comments && <MessageSquare className="h-3 w-3 ml-1 shrink-0 text-blue-400" />} {/* Icon for comments */}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent className="whitespace-pre-line max-w-xs"> {/* Allow wrapping and set max width */}
                                <p>{tooltipContent}</p>
                              </TooltipContent>
                            </Tooltip>
                            );
                         })}
                      </div>
                     </ScrollArea>
                  )}
                   {!isCurrentMonth && <div className="flex-grow"></div>} {/* Ensure non-month days fill space */}
                   {/* Indicate visually if filters are active and hiding shifts */}
                   {isCurrentMonth && totalShiftsForDay > 0 && dayShiftsDisplay.length === 0 && (
                     <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground/50">
                        (Filtro activo)
                     </div>
                   )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Modal for displaying and editing shift details */}
      {selectedDay && (
        <ShiftDetailsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          shifts={selectedShifts} // Pass the *filtered* shifts for the selected day
          allShifts={allShifts} // Pass the complete list of shifts for update/delete operations
          date={selectedDay}
          onUpdateShifts={handleUpdateShifts} // Pass the update handler
          onDeleteShift={handleDeleteShift} // Pass the delete handler
        />
      )}
      </TooltipProvider>
  )
}
