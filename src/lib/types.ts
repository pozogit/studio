import type { LucideIcon } from 'lucide-react';

// Updated Shift interface to include start and end times
export interface Shift {
  id: string;
  date: Date; // Each shift object represents a single day
  worker: string;
  area: string;
  startTime: string; // e.g., "09:00"
  endTime: string;   // e.g., "17:00"
}

// Example Area Icons - you can expand this
// Ensure these icons exist in lucide-react
export const areaIcons: { [key: string]: LucideIcon } = {
  Office: require('lucide-react').Briefcase,
  Factory: require('lucide-react').Factory,
  Warehouse: require('lucide-react').Warehouse,
  Store: require('lucide-react').Store,
  Field: require('lucide-react').Tractor,
  Remote: require('lucide-react').Laptop,
  Kitchen: require('lucide-react').ChefHat, // Added example
  Support: require('lucide-react').Headset, // Added example
  Default: require('lucide-react').Building2, // Default icon
};

export const getAreaIcon = (areaName: string): LucideIcon => {
  // Simple matching logic, improve as needed
  const lowerAreaName = areaName.toLowerCase();
  if (lowerAreaName.includes('office')) return areaIcons.Office;
  if (lowerAreaName.includes('factory')) return areaIcons.Factory;
  if (lowerAreaName.includes('warehouse')) return areaIcons.Warehouse;
  if (lowerAreaName.includes('store') || lowerAreaName.includes('shop')) return areaIcons.Store;
  if (lowerAreaName.includes('field') || lowerAreaName.includes('farm')) return areaIcons.Field;
  if (lowerAreaName.includes('remote') || lowerAreaName.includes('home')) return areaIcons.Remote;
  if (lowerAreaName.includes('kitchen') || lowerAreaName.includes('food')) return areaIcons.Kitchen;
  if (lowerAreaName.includes('support') || lowerAreaName.includes('call center')) return areaIcons.Support;

  // Check if a key directly matches
  const exactMatch = Object.keys(areaIcons).find(key => key.toLowerCase() === lowerAreaName);
  if (exactMatch && exactMatch !== 'Default') return areaIcons[exactMatch];

  return areaIcons.Default;
};
