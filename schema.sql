-- Tabla para almacenar las Areas/Departamentos
CREATE TABLE Areas (
    AreaID INT PRIMARY KEY IDENTITY(1,1),
    NombreArea NVARCHAR(100) NOT NULL UNIQUE,
    Activo BIT NOT NULL DEFAULT 1 -- Columna para indicar si el área está activa
);

-- Tabla para almacenar los Trabajadores
CREATE TABLE Workers (
    WorkerID INT PRIMARY KEY IDENTITY(1,1),
    NombreCompleto NVARCHAR(150) NOT NULL,
    AreaID INT NOT NULL,
    Email NVARCHAR(255) NULL, -- Columna para el correo electrónico (opcional)
    Activo BIT NOT NULL DEFAULT 1, -- Columna para indicar si el trabajador está activo
    FOREIGN KEY (AreaID) REFERENCES Areas(AreaID)
    -- No agregar ON DELETE CASCADE para mantener el historial si se desactiva un área
);

-- Tabla para almacenar los Turnos (Shifts)
CREATE TABLE Shifts (
    ShiftID BIGINT PRIMARY KEY IDENTITY(1,1),
    Fecha DATE NOT NULL,
    WorkerID INT NOT NULL,
    AreaID INT NOT NULL, -- Aunque el trabajador pertenece a un área, puede ser útil registrarla aquí también por si cambia o para filtros
    HoraInicio TIME NOT NULL,
    HoraFin TIME NOT NULL,
    Ubicacion NVARCHAR(50) CHECK (Ubicacion IN ('Oficina', 'Remoto')) NOT NULL, -- 'Office' o 'Remote'
    Comentarios NVARCHAR(500) NULL, -- Campo para comentarios opcionales
    Activo BIT NOT NULL DEFAULT 1, -- Columna para indicar si el turno está activo (por si se cancela)
    FOREIGN KEY (WorkerID) REFERENCES Workers(WorkerID),
    FOREIGN KEY (AreaID) REFERENCES Areas(AreaID)
    -- No agregar ON DELETE CASCADE para mantener el historial si se desactivan trabajadores o áreas
);

-- Índices para mejorar el rendimiento de las consultas comunes
CREATE INDEX IX_Workers_AreaID ON Workers(AreaID);
CREATE INDEX IX_Shifts_Fecha ON Shifts(Fecha);
CREATE INDEX IX_Shifts_WorkerID ON Shifts(WorkerID);
CREATE INDEX IX_Shifts_AreaID ON Shifts(AreaID);

-- Insertar algunas Areas de ejemplo
INSERT INTO Areas (NombreArea) VALUES
('Oficina'),
('Fabrica'), -- Cambiado de Factory a Fabrica
('Almacen'), -- Cambiado de Warehouse a Almacen
('Soporte'),
('Remoto');

-- Insertar algunos Trabajadores de ejemplo (asumiendo IDs de Area 1 a 5)
INSERT INTO Workers (NombreCompleto, AreaID, Email) VALUES
('Alice Smith', 1, 'alice.smith@example.com'),
('Charlie Brown', 1, 'charlie.brown@example.com'),
('Edward Davis', 1, 'edward.davis@example.com'),
('Bob Johnson', 2, 'bob.johnson@example.com'),
('Grace Wilson', 2, 'grace.wilson@example.com'),
('Frank Miller', 3, 'frank.miller@example.com'),
('Ivy Garcia', 3, 'ivy.garcia@example.com'),
('Diana Prince', 4, 'diana.prince@example.com'),
('Henry Rodriguez', 4, 'henry.rodriguez@example.com'),
('Judy Taylor', 5, 'judy.taylor@example.com'),
('Kevin Anderson', 5, 'kevin.anderson@example.com');


-- Ejemplo de inserción de un Turno
/*
INSERT INTO Shifts (Fecha, WorkerID, AreaID, HoraInicio, HoraFin, Ubicacion, Comentarios)
VALUES
('2024-08-01', 1, 1, '09:00:00', '17:00:00', 'Oficina', 'Reunión de equipo por la mañana.');
*/

-- Ejemplo de consulta para ver turnos de un trabajador en una fecha específica
/*
SELECT
    S.Fecha,
    W.NombreCompleto AS Trabajador,
    A.NombreArea AS Area,
    S.HoraInicio,
    S.HoraFin,
    S.Ubicacion,
    S.Comentarios
FROM Shifts S
JOIN Workers W ON S.WorkerID = W.WorkerID
JOIN Areas A ON S.AreaID = A.AreaID
WHERE S.WorkerID = (SELECT WorkerID FROM Workers WHERE NombreCompleto = 'Alice Smith')
  AND S.Fecha = '2024-08-01'
  AND S.Activo = 1; -- Mostrar solo turnos activos
*/

-- Ejemplo de consulta para ver todos los turnos de un área en un rango de fechas
/*
SELECT
    S.Fecha,
    W.NombreCompleto AS Trabajador,
    A.NombreArea AS Area,
    S.HoraInicio,
    S.HoraFin,
    S.Ubicacion,
    S.Comentarios
FROM Shifts S
JOIN Workers W ON S.WorkerID = W.WorkerID
JOIN Areas A ON S.AreaID = A.AreaID
WHERE S.AreaID = (SELECT AreaID FROM Areas WHERE NombreArea = 'Oficina')
  AND S.Fecha BETWEEN '2024-08-01' AND '2024-08-07'
  AND S.Activo = 1; -- Mostrar solo turnos activos
*/
