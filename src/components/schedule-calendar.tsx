

"use client"

import * as React from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWithinInterval, addMonths, subMonths, getDay, startOfWeek, endOfWeek, getMonth, startOfDay, endOfDay, addDays, getWeek, subDays } from "date-fns" // Added subDays
import { es } from 'date-fns/locale' // Import Spanish locale
import { ChevronLeft, ChevronRight, User, Building2, Filter, X, Clock, FileSpreadsheet, MessageSquare, MapPin, CalendarDays, List, Check } from "lucide-react" // Added MapPin, CalendarDays, List, Check
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
import { useToast } from "@/hooks/use-toast"; // Import useToast
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"; // Import Table components
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"; // Import ToggleGroup


// Use a non-empty value for the 'all' option
const ALL_FILTER_VALUE = "__ALL__";

type ViewMode = 'monthly' | 'weekly' | 'daily';

interface ScheduleCalendarProps {
  allShifts: Shift[]; // Renamed from shifts to allShifts for clarity
  setShifts: (shifts: Shift[]) => void; // Function to update the main shifts state
}

// Changed order to start from Monday, Spanish day names
const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export function ScheduleCalendar({ allShifts, setShifts }: ScheduleCalendarProps) {
  const [currentDate, setCurrentDate] = React.useState<Date | null>(null); // Initialize with null
  const [viewMode, setViewMode] = React.useState<ViewMode>('monthly');
  const [filterType, setFilterType] = React.useState<"worker" | "area" | "none">("none")
  const [filterValue, setFilterValue] = React.useState<string>("") // Store the actual filter value, '' means no filter
  const [selectedDay, setSelectedDay] = React.useState<Date | null>(null);
  const [selectedShifts, setSelectedShifts] = React.useState<Shift[]>([]);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const { toast } = useToast(); // Get the toast function

  // Set initial date on client mount to avoid hydration errors
  React.useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  // Explicitly set weekStartsOn: 1 (Monday)
  const weekStartsOn = 1;

  // Calculate date ranges based on viewMode and currentDate
  const { start, end } = React.useMemo(() => {
    if (!currentDate) return { start: null, end: null }; // Return null if date not set yet

    switch (viewMode) {
      case 'monthly':
        return {
          start: startOfWeek(startOfMonth(currentDate), { weekStartsOn }),
          end: endOfWeek(endOfMonth(currentDate), { weekStartsOn })
        };
      case 'weekly':
        return {
          start: startOfWeek(currentDate, { weekStartsOn }),
          end: endOfWeek(currentDate, { weekStartsOn })
        };
      case 'daily':
        return {
          start: startOfDay(currentDate),
          end: endOfDay(currentDate)
        };
      default:
        return { start: null, end: null };
    }
  }, [currentDate, viewMode, weekStartsOn]);

  // Generate the days array only if start and end are valid dates
  const daysInView = React.useMemo(() => {
    if (start && end) {
      return eachDayOfInterval({ start, end });
    }
    return [];
  }, [start, end]);

  const handlePrev = () => {
    if (!currentDate) return;
    switch (viewMode) {
      case 'monthly':
        setCurrentDate(subMonths(currentDate, 1));
        break;
      case 'weekly':
        setCurrentDate(subDays(currentDate, 7)); // Subtract 7 days for previous week
        break;
      case 'daily':
        setCurrentDate(subDays(currentDate, 1)); // Use subDays for consistency
        break;
    }
  };

  const handleNext = () => {
    if (!currentDate) return;
    switch (viewMode) {
      case 'monthly':
        setCurrentDate(addMonths(currentDate, 1));
        break;
      case 'weekly':
        setCurrentDate(addDays(currentDate, 7)); // Add 7 days for next week
        break;
      case 'daily':
        setCurrentDate(addDays(currentDate, 1));
        break;
    }
  };


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
    } else {
        // Optionally open modal even if empty, or show a toast
        toast({
            title: "Sin Turnos",
            description: `No hay turnos registrados${filterType !== 'none' && filterValue ? ' que coincidan con el filtro' : ''} para ${format(day, 'PPP', { locale: es })}.`,
            variant: "default",
        });
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
            <SelectValue placeholder="Filtrar por Area" />
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

   // Function to handle exporting data to Excel with separate sheets per area
    const handleExportExcel = () => {
        if (!currentDate) return; // Don't export if date is not set

        // 1. Filter shifts for the current view interval (month, week, or day) based on display filters
        const shiftsForCurrentView = filteredShiftsForDisplay.filter(shift => {
            if (!start || !end) return false;
            return isWithinInterval(shift.date, { start: startOfDay(start), end: endOfDay(end) }); // Use isWithinInterval
        });


        if (shiftsForCurrentView.length === 0) {
            toast({
                title: "Sin Datos",
                description: "No hay turnos para exportar para el período y filtro seleccionados.",
                variant: "destructive", // Use destructive variant for errors
            });
            return;
        }

        // 2. Create a new workbook
        const wb = XLSX.utils.book_new();

        // 3. Get unique areas present in the filtered shifts
        const uniqueAreasInView = [...new Set(shiftsForCurrentView.map(shift => shift.area))].sort();

        // 4. Create a sheet for each area
        uniqueAreasInView.forEach(area => {
            // Filter shifts for the current area
            const shiftsForArea = shiftsForCurrentView.filter(shift => shift.area === area);

            // Prepare data for this area's sheet
            const dataForSheet = shiftsForArea
                .sort((a, b) => a.date.getTime() - b.date.getTime() || (a.startTime || "").localeCompare(b.startTime || "")) // Sort by date then time
                .map(shift => ({
                    Fecha: format(shift.date, 'yyyy-MM-dd'), // Keep consistent format
                    Trabajador: shift.worker,
                    // Area: shift.area, // Area column might be redundant as it's the sheet name
                    Ubicacion: shift.location, // Add Location column
                    'Hora Inicio': shift.startTime,
                    'Hora Fin': shift.endTime,
                    Comentarios: shift.comments || '',
                }));

            // Create worksheet
            const ws = XLSX.utils.json_to_sheet(dataForSheet);

            // Clean area name for sheet name (optional, basic cleaning)
            const sheetName = area.replace(/[/\\?*[\]]/g, '').substring(0, 31); // Max 31 chars, remove invalid chars

            // Append worksheet to workbook with area name
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
        });


        // 5. Generate filename based on view
        let baseFileName = `shiftmaster_horario`;
        if (viewMode === 'monthly') {
             baseFileName += `_${format(currentDate, "yyyy-MM", { locale: es })}`;
        } else if (viewMode === 'weekly') {
            const weekNumber = getWeek(currentDate, { weekStartsOn: 1, locale: es });
             baseFileName += `_${currentDate.getFullYear()}-Semana${weekNumber}`;
        } else { // daily
             baseFileName += `_${format(currentDate, "yyyy-MM-dd", { locale: es })}`;
        }
        const fileName = `${baseFileName}_por_area.xlsx`; // Use locale for consistency

        // 6. Trigger download
        XLSX.writeFile(wb, fileName);

        toast({
            title: "Exportación Exitosa",
            description: `Horario exportado a ${fileName} con hojas separadas por área.`,
            variant: "success", // Use success variant
        });
    };

    // Get the current title for the calendar header based on view mode
     const getCalendarTitle = () => {
        if (!currentDate) return "Cargando..."; // Show loading text until date is ready

        switch (viewMode) {
            case 'monthly':
                 // Capitalize first letter of month
                return format(currentDate, "MMMM yyyy", { locale: es }).charAt(0).toUpperCase() + format(currentDate, "MMMM yyyy", { locale: es }).slice(1);
            case 'weekly':
                if (!start || !end) return "Cargando...";
                 const weekNumber = getWeek(currentDate, { weekStartsOn: 1, locale: es });
                // Display week number and year, or date range
                // Example: "Semana 25, 2024" or "Jun 17 - Jun 23, 2024"
                // return `Semana ${weekNumber}, ${format(currentDate, 'yyyy', { locale: es })}`;
                return `${format(start, 'd MMM', { locale: es })} - ${format(end, 'd MMM, yyyy', { locale: es })}`;
            case 'daily':
                 // Format day, date, month, year
                 return format(currentDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es }).charAt(0).toUpperCase() + format(currentDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es }).slice(1); ;
            default:
                return "Calendario";
        }
    };

    // Function to render the calendar grid based on the view mode
    const renderCalendarGrid = () => {
        if (!currentDate || !start || !end) return <div className="text-center p-10 text-muted-foreground">Cargando calendario...</div>; // Placeholder while loading

        switch (viewMode) {
            case 'monthly':
                return (
                    <>
                        <div className="grid grid-cols-7 gap-1 text-center font-semibold text-muted-foreground mb-2">
                            {dayNames.map(day => <div key={day}>{day}</div>)}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                           {daysInView.map((day, index) => {
                                const dayShiftsDisplay = getShiftsForDay(day, filteredShiftsForDisplay);
                                const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                                const totalShiftsForDay = getShiftsForDay(day, allShifts).length;

                                return (
                                    <div
                                        key={index}
                                        onClick={() => isCurrentMonth && handleDayClick(day)}
                                        className={`relative border rounded-md p-2 min-h-[120px] transition-colors duration-200 ease-in-out flex flex-col ${
                                        isCurrentMonth ? 'bg-card hover:bg-secondary/80 cursor-pointer' : 'bg-muted/50 text-muted-foreground'
                                        } ${isSameDay(day, new Date()) ? 'ring-2 ring-primary' : ''} ${!isCurrentMonth || dayShiftsDisplay.length === 0 ? 'opacity-70' : ''}`}
                                        aria-label={`Día ${format(day, 'd')}, ${dayShiftsDisplay.length}/${totalShiftsForDay} turnos ${filterType !== 'none' && filterValue ? `(filtrado por ${filterType === 'worker' ? 'trabajador' : 'área'} '${filterValue}')` : '(sin filtro)'}`}
                                    >
                                        <div className={`font-medium text-sm mb-1 ${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground/70'}`}>{format(day, "d")}</div>
                                        {dayShiftsDisplay.length > 0 && isCurrentMonth && (
                                        <ScrollArea className="flex-grow mt-1">
                                            <div className="space-y-1 text-xs">
                                                {dayShiftsDisplay.map(shift => {
                                                    const SpecificAreaIcon = getAreaIcon(shift.area);
                                                    let tooltipLines = [
                                                        `${shift.worker} (${shift.startTime || 'N/A'}-${shift.endTime || 'N/A'}) en ${shift.area}`,
                                                        `Ubicación: ${shift.location === 'Remoto' ? 'Remoto' : 'Oficina'}`,
                                                    ];
                                                    if (shift.comments) {
                                                        const truncatedComment = shift.comments.length > 50 ? shift.comments.substring(0, 47) + '...' : shift.comments;
                                                        tooltipLines.push(`Comentarios: ${truncatedComment}`);
                                                    }
                                                    const tooltipContent = tooltipLines.join('\n');

                                                    return (
                                                        <Tooltip key={shift.id} delayDuration={300}>
                                                        <TooltipTrigger asChild>
                                                            <Badge
                                                            variant="secondary"
                                                            className="flex items-center justify-start w-full text-left p-1 truncate shadow-sm cursor-default"
                                                            >
                                                            <SpecificAreaIcon className="h-3 w-3 mr-1 shrink-0" />
                                                            <span className="font-semibold mr-1 truncate">{shift.worker}:</span>
                                                            <span className="text-muted-foreground">{shift.startTime || '?'}</span>
                                                            {shift.comments && <MessageSquare className="h-3 w-3 ml-1 shrink-0 text-blue-400" />}
                                                            {shift.location === 'Remoto' && <MapPin className="h-3 w-3 ml-1 shrink-0 text-purple-400" />}
                                                            </Badge>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="whitespace-pre-line max-w-xs">
                                                            <p>{tooltipContent}</p>
                                                        </TooltipContent>
                                                        </Tooltip>
                                                    );
                                                })}
                                            </div>
                                        </ScrollArea>
                                        )}
                                        {!isCurrentMonth && <div className="flex-grow"></div>}
                                        {isCurrentMonth && totalShiftsForDay > 0 && dayShiftsDisplay.length === 0 && (
                                        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground/50">
                                            (Filtro activo)
                                        </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                );
            case 'weekly':
                 return (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {dayNames.map(dayName => (
                                    <TableHead key={dayName} className="text-center">{dayName}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                {daysInView.map((day, index) => {
                                    const dayShiftsDisplay = getShiftsForDay(day, filteredShiftsForDisplay);
                                    const totalShiftsForDay = getShiftsForDay(day, allShifts).length;
                                    return (
                                        <TableCell
                                            key={index}
                                            onClick={() => handleDayClick(day)}
                                            className={`relative border h-40 align-top p-2 cursor-pointer hover:bg-accent/50 ${isSameDay(day, new Date()) ? 'bg-accent/20' : ''} ${dayShiftsDisplay.length === 0 ? 'opacity-70' : ''}`}
                                            aria-label={`Día ${format(day, 'd')}, ${dayShiftsDisplay.length}/${totalShiftsForDay} turnos`}
                                        >
                                            <div className="font-medium text-sm mb-1">{format(day, "d")}</div>
                                            <ScrollArea className="h-32">
                                                <div className="space-y-1 text-xs">
                                                    {dayShiftsDisplay.map(shift => (
                                                        <Badge key={shift.id} variant="secondary" className="w-full text-left p-1 truncate shadow-sm">
                                                            {shift.startTime} {shift.worker} ({shift.area})
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </ScrollArea>
                                            {totalShiftsForDay > 0 && dayShiftsDisplay.length === 0 && (
                                                <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground/50">
                                                    (Filtro activo)
                                                </div>
                                            )}
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        </TableBody>
                    </Table>
                 );
            case 'daily':
                const dailyShifts = getShiftsForDay(currentDate, filteredShiftsForDisplay);
                 return (
                    <ScrollArea className="h-[60vh]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Hora</TableHead>
                                    <TableHead>Trabajador</TableHead>
                                    <TableHead>Área</TableHead>
                                    <TableHead>Ubicación</TableHead>
                                    <TableHead>Comentarios</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dailyShifts.length > 0 ? (
                                    dailyShifts.map(shift => (
                                        <TableRow key={shift.id} onClick={() => handleDayClick(shift.date)} className="cursor-pointer hover:bg-muted/50">
                                            <TableCell>{shift.startTime} - {shift.endTime}</TableCell>
                                            <TableCell>{shift.worker}</TableCell>
                                            <TableCell>{shift.area}</TableCell>
                                            <TableCell>{shift.location}</TableCell>
                                            <TableCell className="max-w-xs truncate">{shift.comments}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                                            No hay turnos registrados {filterType !== 'none' && filterValue ? ' que coincidan con el filtro ' : ''} para este día.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                 );
            default:
                return null;
        }
    };


  return (
    <TooltipProvider>
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0 pb-4">
         <div className="flex flex-col space-y-1">
             <CardTitle className="text-2xl font-bold text-primary">
                {getCalendarTitle()}
             </CardTitle>
             <span className="text-sm text-muted-foreground">Vista {viewMode === 'monthly' ? 'Mensual' : viewMode === 'weekly' ? 'Semanal' : 'Diaria'}</span>
         </div>
           <div className="flex flex-wrap items-center gap-2">
             {/* View Mode Toggle */}
             <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as ViewMode)} size="sm" aria-label="Seleccionar vista">
               <ToggleGroupItem value="monthly" aria-label="Vista mensual">
                 <CalendarDays className="h-4 w-4" />
                 <span className="ml-2 hidden sm:inline">Mes</span>
               </ToggleGroupItem>
               <ToggleGroupItem value="weekly" aria-label="Vista semanal">
                 <List className="h-4 w-4" />
                  <span className="ml-2 hidden sm:inline">Semana</span>
               </ToggleGroupItem>
               <ToggleGroupItem value="daily" aria-label="Vista diaria">
                 <Check className="h-4 w-4" />
                  <span className="ml-2 hidden sm:inline">Día</span>
               </ToggleGroupItem>
             </ToggleGroup>


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
                      <Button variant="outline" size="icon" onClick={handlePrev} aria-label="Anterior">
                          <ChevronLeft className="h-4 w-4" />
                      </Button>
                   </TooltipTrigger>
                   <TooltipContent>
                    <p>{viewMode === 'monthly' ? 'Mes anterior' : viewMode === 'weekly' ? 'Semana anterior' : 'Día anterior'}</p>
                  </TooltipContent>
                </Tooltip>
                 <Tooltip delayDuration={100}>
                   <TooltipTrigger asChild>
                     <Button variant="outline" size="icon" onClick={handleNext} aria-label="Siguiente">
                          <ChevronRight className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                     <p>{viewMode === 'monthly' ? 'Mes siguiente' : viewMode === 'weekly' ? 'Semana siguiente' : 'Día siguiente'}</p>
                    </TooltipContent>
                 </Tooltip>
            </div>
             {/* Export Button */}
            <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={handleExportExcel} aria-label="Exportar a Excel por Área">
                        <FileSpreadsheet className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                     <p>Exportar vista actual (por área)</p>
                </TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>
        <CardContent>
          {/* Render the appropriate calendar grid based on the view mode */}
          {renderCalendarGrid()}
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


