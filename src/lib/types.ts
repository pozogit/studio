export interface Shift {
  id: string;
  date: Date;
  worker: string;
  area: string;
}

// Example Area Icons - you can expand this
export const areaIcons: { [key: string]: React.ComponentType<{ className?: string }> } = {
  Office: require('lucide-react').Briefcase,
  Factory: require('lucide-react').Factory,
  Warehouse: require('lucide-react').Warehouse,
  Store: require('lucide-react').Store,
  Field: require('lucide-react').Tractor,
  Remote: require('lucide-react').Laptop,
  Default: require('lucide-react').Building2, // Default icon
};

export const getAreaIcon = (areaName: string): React.ComponentType<{ className?: string }> => {
  // Simple matching logic, improve as needed
  if (areaName.toLowerCase().includes('office')) return areaIcons.Office;
  if (areaName.toLowerCase().includes('factory')) return areaIcons.Factory;
  if (areaName.toLowerCase().includes('warehouse')) return areaIcons.Warehouse;
  if (areaName.toLowerCase().includes('store') || areaName.toLowerCase().includes('shop')) return areaIcons.Store;
  if (areaName.toLowerCase().includes('field') || areaName.toLowerCase().includes('farm')) return areaIcons.Field;
   if (areaName.toLowerCase().includes('remote') || areaName.toLowerCase().includes('home')) return areaIcons.Remote;
  return areaIcons.Default;
};
