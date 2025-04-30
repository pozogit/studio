// Data structure mapping areas (departments) to the workers within them.
// Keys are area names, values are arrays of worker names.
export const areaWorkerMap: Record<string, string[]> = {
  "Oficina": ["Alice Smith", "Charlie Brown", "Edward Davis"],
  "Fabrica": ["Bob Johnson", "Grace Wilson"], // Renamed 'Factory'
  "Almacen": ["Frank Miller", "Ivy Garcia"], // Renamed 'Warehouse'
  "Soporte": ["Diana Prince", "Henry Rodriguez"],
  "Remoto": ["Judy Taylor", "Kevin Anderson"],
  // Add more areas and their corresponding workers
};

// Extract all unique area names from the map keys
export const allAreas: string[] = Object.keys(areaWorkerMap).sort();

// Extract all unique worker names from the map values
export const allWorkers: string[] = [...new Set(Object.values(areaWorkerMap).flat())].sort();

// New structure to hold worker details, including email
// Using a Map for efficient lookup by worker name
export const workersDetails = new Map<string, { email: string | null }>(
  allWorkers.map(name => {
    // Assign dummy emails for the example
    let email: string | null = null;
    if (name === 'Alice Smith') email = 'alice.smith@example.com';
    else if (name === 'Charlie Brown') email = 'charlie.brown@example.com';
    else if (name === 'Edward Davis') email = 'edward.davis@example.com';
    else if (name === 'Bob Johnson') email = 'bob.johnson@example.com';
    else if (name === 'Grace Wilson') email = 'grace.wilson@example.com';
    else if (name === 'Frank Miller') email = 'frank.miller@example.com';
    else if (name === 'Ivy Garcia') email = 'ivy.garcia@example.com';
    else if (name === 'Diana Prince') email = 'diana.prince@example.com';
    else if (name === 'Henry Rodriguez') email = 'henry.rodriguez@example.com';
    else if (name === 'Judy Taylor') email = 'judy.taylor@example.com';
    else if (name === 'Kevin Anderson') email = 'kevin.anderson@example.com';
    // Add more emails for other workers if needed

    return [name, { email }];
  })
);


// You can also maintain the original separate lists if needed elsewhere,
// but the map is the primary source for the relationship.
export const defaultWorkers: string[] = allWorkers;
export const defaultAreas: string[] = allAreas;
