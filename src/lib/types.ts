import type { LucideIcon } from 'lucide-react';

// Updated Shift interface to include start and end times and comments
export interface Shift {
  id: string;
  date: Date; // Each shift object represents a single day
  worker: string;
  area: string;
  startTime: string; // e.g., "09:00"
  endTime: string;   // e.g., "17:00"
  comments?: string; // Optional field for comments
}


// Mapping of area names (lowercase keys) to Lucide icons
// Used by getAreaIcon function
export const areaIconsMap: Record<string, LucideIcon> = {
  office: require('lucide-react').Briefcase,
  factory: require('lucide-react').Factory,
  warehouse: require('lucide-react').Warehouse,
  store: require('lucide-react').Store,
  field: require('lucide-react').Tractor,
  remote: require('lucide-react').Laptop,
  kitchen: require('lucide-react').ChefHat,
  support: require('lucide-react').Headset,
  shop: require('lucide-react').Store, // Alias for store
  farm: require('lucide-react').Tractor, // Alias for field
  home: require('lucide-react').Laptop, // Alias for remote
  'call center': require('lucide-react').Headset, // Alias for support
  // Add more specific area names and their icons here
};

// Default icon if no specific match is found
export const defaultAreaIcon: LucideIcon = require('lucide-react').Building2;

// Function to get an icon based on area name
export const getAreaIcon = (areaName: string): LucideIcon => {
  const lowerAreaName = areaName.toLowerCase();

  // Check for direct match or keywords in the map
  for (const key in areaIconsMap) {
    if (lowerAreaName.includes(key)) {
      return areaIconsMap[key];
    }
  }

  return defaultAreaIcon; // Return default if no match
};
