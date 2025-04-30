-- Schema for ShiftMaster application

-- Table for Areas/Departments
CREATE TABLE Areas (
    AreaID INT PRIMARY KEY IDENTITY(1,1),
    AreaName NVARCHAR(100) NOT NULL UNIQUE,
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- Table for Workers/Employees
CREATE TABLE Workers (
    WorkerID INT PRIMARY KEY IDENTITY(1,1),
    WorkerName NVARCHAR(150) NOT NULL,
    AreaID INT, -- Foreign key linking to the primary area the worker belongs to (optional, could also use mapping table)
    IsActive BIT DEFAULT 1, -- To indicate if a worker is currently active
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (AreaID) REFERENCES Areas(AreaID) ON DELETE SET NULL -- Set AreaID to NULL if Area is deleted
);

-- Optional: Mapping table if a worker can belong to multiple areas (Many-to-Many)
-- CREATE TABLE WorkerAreaMap (
--     WorkerID INT,
--     AreaID INT,
--     PRIMARY KEY (WorkerID, AreaID),
--     FOREIGN KEY (WorkerID) REFERENCES Workers(WorkerID) ON DELETE CASCADE,
--     FOREIGN KEY (AreaID) REFERENCES Areas(AreaID) ON DELETE CASCADE
-- );

-- Table for Shifts
CREATE TABLE Shifts (
    ShiftID INT PRIMARY KEY IDENTITY(1,1),
    ShiftDate DATE NOT NULL,
    WorkerID INT NOT NULL,
    AreaID INT NOT NULL,
    StartTime TIME NOT NULL,
    EndTime TIME NOT NULL,
    Location NVARCHAR(50) CHECK (Location IN ('Office', 'Remote')) NOT NULL, -- Added Location column with check constraint
    Comments NVARCHAR(500), -- Optional comments about the shift
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (WorkerID) REFERENCES Workers(WorkerID) ON DELETE CASCADE, -- If worker is deleted, delete their shifts
    FOREIGN KEY (AreaID) REFERENCES Areas(AreaID) ON DELETE CASCADE, -- If area is deleted, delete shifts in that area
    -- Constraint to ensure EndTime is after StartTime
    CONSTRAINT CK_ShiftEndTimeAfterStartTime CHECK (EndTime > StartTime),
    -- Unique constraint to prevent duplicate shifts for the same worker on the same day/time (adjust as needed)
    -- CONSTRAINT UQ_WorkerShift UNIQUE (ShiftDate, WorkerID, StartTime, EndTime)
);

-- Trigger to update UpdatedAt timestamp on Shifts table modification
CREATE TRIGGER TRG_Shifts_UpdateTimestamp
ON Shifts
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Shifts
    SET UpdatedAt = GETDATE()
    FROM Shifts s
    INNER JOIN inserted i ON s.ShiftID = i.ShiftID;
END;
GO

-- Indexes for performance
CREATE INDEX IDX_Shifts_ShiftDate ON Shifts(ShiftDate);
CREATE INDEX IDX_Shifts_WorkerID ON Shifts(WorkerID);
CREATE INDEX IDX_Shifts_AreaID ON Shifts(AreaID);
CREATE INDEX IDX_Workers_AreaID ON Workers(AreaID);

-- Example Data Insertion (Optional)
/*
-- Insert Areas
INSERT INTO Areas (AreaName) VALUES ('Office'), ('Factory'), ('Warehouse'), ('Support'), ('Remote');

-- Insert Workers (assuming AreaIDs correspond to the order above)
INSERT INTO Workers (WorkerName, AreaID) VALUES
('Alice Smith', 1), ('Bob Johnson', 2), ('Charlie Brown', 1),
('Diana Prince', 4), ('Edward Davis', 1), ('Frank Miller', 3),
('Grace Wilson', 2), ('Henry Rodriguez', 4), ('Ivy Garcia', 3),
('Judy Taylor', 5), ('Kevin Anderson', 5);

-- Insert Shifts Example
INSERT INTO Shifts (ShiftDate, WorkerID, AreaID, StartTime, EndTime, Location, Comments) VALUES
('2024-07-29', 1, 1, '09:00:00', '17:00:00', 'Office', 'Regular office shift'),
('2024-07-29', 7, 2, '08:00:00', '16:00:00', 'Office', 'Factory floor duty'),
('2024-07-30', 10, 5, '10:00:00', '18:00:00', 'Remote', 'Working from home');
*/

PRINT 'ShiftMaster schema created successfully.';
