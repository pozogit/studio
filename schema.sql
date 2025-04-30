-- SQL Server Schema for ShiftMaster

-- Areas Table
-- Stores different work areas or departments.
CREATE TABLE Areas (
    AreaID INT PRIMARY KEY IDENTITY(1,1),
    NombreArea VARCHAR(100) NOT NULL UNIQUE,
    -- Added Activo column: 1 for active, 0 for inactive
    Activo BIT NOT NULL DEFAULT 1
);
GO

-- Trabajadores Table
-- Stores information about workers.
CREATE TABLE Trabajadores (
    TrabajadorID INT PRIMARY KEY IDENTITY(1,1),
    NombreTrabajador VARCHAR(100) NOT NULL,
    -- Added Activo column: 1 for active, 0 for inactive
    Activo BIT NOT NULL DEFAULT 1
);
GO

-- AreaTrabajador Table (Junction Table)
-- Maps which workers belong to which areas (Many-to-Many relationship).
-- A worker can belong to multiple areas, and an area can have multiple workers.
CREATE TABLE AreaTrabajador (
    AreaTrabajadorID INT PRIMARY KEY IDENTITY(1,1), -- Added a surrogate key for easier management
    AreaID INT NOT NULL,
    TrabajadorID INT NOT NULL,
    -- Added Activo column to manage the assignment itself: 1 for active, 0 for inactive
    Activo BIT NOT NULL DEFAULT 1,
    -- Define Foreign Key constraints WITHOUT cascade delete
    FOREIGN KEY (AreaID) REFERENCES Areas(AreaID),
    FOREIGN KEY (TrabajadorID) REFERENCES Trabajadores(TrabajadorID),
    -- Ensure a worker-area combination is unique (consider if inactive assignments should also be unique)
    UNIQUE (AreaID, TrabajadorID)
);
GO

-- Turnos Table
-- Records individual work shifts.
CREATE TABLE Turnos (
    TurnoID INT PRIMARY KEY IDENTITY(1,1),
    Fecha DATE NOT NULL,
    TrabajadorID INT NOT NULL,
    AreaID INT NOT NULL, -- Storing AreaID directly simplifies shift queries
    HoraInicio TIME NOT NULL,
    HoraFin TIME NOT NULL,
    Ubicacion VARCHAR(50) NOT NULL CHECK (Ubicacion IN ('Oficina', 'Remoto')), -- Check constraint for location
    Comentarios NVARCHAR(MAX), -- Optional comments
    -- Added Activo column: 1 for active, 0 for inactive (e.g., for cancelled shifts)
    Activo BIT NOT NULL DEFAULT 1,
    -- Define Foreign Key constraints WITHOUT cascade delete
    FOREIGN KEY (TrabajadorID) REFERENCES Trabajadores(TrabajadorID),
    FOREIGN KEY (AreaID) REFERENCES Areas(AreaID),
    -- Add constraint to ensure start time is before end time
    CHECK (HoraInicio < HoraFin)
);
GO

-- Optional: Add Indexes for better query performance
CREATE INDEX IX_Turnos_Fecha ON Turnos(Fecha);
GO
CREATE INDEX IX_Turnos_TrabajadorID ON Turnos(TrabajadorID);
GO
CREATE INDEX IX_Turnos_AreaID ON Turnos(AreaID);
GO
CREATE INDEX IX_AreaTrabajador_TrabajadorID ON AreaTrabajador(TrabajadorID);
GO
CREATE INDEX IX_AreaTrabajador_AreaID ON AreaTrabajador(AreaID);
GO

-- Note on Deleting Records:
-- Since ON DELETE CASCADE is not used, related records must be handled manually
-- before deleting a parent record (e.g., delete Turnos before deleting a Trabajador).
-- Alternatively, use the 'Activo' flag for soft deletes (marking records as inactive).
-- This approach preserves historical data.
-- Example: To "delete" a worker, set Trabajadores.Activo = 0 and AreaTrabajador.Activo = 0 for their assignments.
