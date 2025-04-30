import type { LucideIcon } from 'lucide-react';
import { Briefcase, Factory, Warehouse, Store, Tractor, Laptop, ChefHat, Headset, Building2 } from 'lucide-react'; // Import icons directly

// Updated Shift interface to include start and end times, comments, and location
export interface Shift {
  id: string;
  date: Date; // Each shift object represents a single day
  worker: string;
  area: string;
  startTime: string; // e.g., "09:00"
  endTime: string;   // e.g., "17:00"
  location: 'Oficina' | 'Remoto'; // Changed location field values to Spanish
  comments?: string; // Optional field for comments
}


// Mapping of area names (lowercase keys in Spanish) to Lucide icons
// Used by getAreaIcon function
export const areaIconsMap: Record<string, LucideIcon> = {
  oficina: Briefcase,
  fabrica: Factory, // Corrected Spanish spelling
  almacen: Warehouse, // Corrected Spanish spelling
  tienda: Store,
  campo: Tractor,
  remoto: Laptop,
  cocina: ChefHat,
  soporte: Headset,
  // Add more specific Spanish area names and their icons here
};

// Default icon if no specific match is found
export const defaultAreaIcon: LucideIcon = Building2;

// Function to get an icon based on area name
export const getAreaIcon = (areaName: string): LucideIcon => {
  const lowerAreaName = areaName.toLowerCase().trim(); // Trim whitespace

  // Check for direct match or keywords in the map
  for (const key in areaIconsMap) {
    // Use includes for broader matching, but prioritize exact matches if possible
    if (lowerAreaName === key || lowerAreaName.includes(key)) {
      return areaIconsMap[key];
    }
  }
  // Handle common English variations if needed for backward compatibility or mixed input
  if (lowerAreaName.includes('office')) return Briefcase;
  if (lowerAreaName.includes('factory')) return Factory;
  if (lowerAreaName.includes('warehouse')) return Warehouse;
  if (lowerAreaName.includes('store') || lowerAreaName.includes('shop')) return Store;
  if (lowerAreaName.includes('field') || lowerAreaName.includes('farm')) return Tractor;
  if (lowerAreaName.includes('remote') || lowerAreaName.includes('home')) return Laptop;
  if (lowerAreaName.includes('kitchen')) return ChefHat;
  if (lowerAreaName.includes('support') || lowerAreaName.includes('call center')) return Headset;


  return defaultAreaIcon; // Return default if no match
};
