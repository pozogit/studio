// Data structure mapping areas (departments) to the workers within them.
// Keys are area names, values are arrays of worker names.
export const areaWorkerMap: Record<string, string[]> = {
  "Office": ["Alice Smith", "Charlie Brown", "Edward Davis"],
  "Factory": ["Bob Johnson", "Grace Wilson"],
  "Warehouse": ["Frank Miller", "Ivy Garcia"],
  "Support": ["Diana Prince", "Henry Rodriguez"],
  "Remote": ["Judy Taylor", "Kevin Anderson"],
  // Add more areas and their corresponding workers
};

// Extract all unique area names from the map keys
export const allAreas: string[] = Object.keys(areaWorkerMap).sort();

// Extract all unique worker names from the map values
export const allWorkers: string[] = [...new Set(Object.values(areaWorkerMap).flat())].sort();

// You can also maintain the original separate lists if needed elsewhere,
// but the map is the primary source for the relationship.
export const defaultWorkers: string[] = allWorkers;
export const defaultAreas: string[] = allAreas;
