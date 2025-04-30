
-- =============================================
-- Database Setup Script for ShiftMaster
-- Target RDBMS: SQL Server
-- =============================================

-- Create Areas Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Areas]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Areas](
        [AreaID] [int] IDENTITY(1,1) NOT NULL,
        [AreaName] [nvarchar](100) NOT NULL,
        CONSTRAINT [PK_Areas] PRIMARY KEY CLUSTERED ([AreaID] ASC),
        CONSTRAINT [UQ_Areas_AreaName] UNIQUE NONCLUSTERED ([AreaName] ASC)
    );
    PRINT 'Table [Areas] created.';
END
ELSE
BEGIN
    PRINT 'Table [Areas] already exists.';
END
GO

-- Create Workers Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Workers]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Workers](
        [WorkerID] [int] IDENTITY(1,1) NOT NULL,
        [WorkerName] [nvarchar](150) NOT NULL,
        [AreaID] [int] NULL, -- Allow NULL initially or for workers not assigned to a primary area if needed
        CONSTRAINT [PK_Workers] PRIMARY KEY CLUSTERED ([WorkerID] ASC)
    );

    ALTER TABLE [dbo].[Workers] WITH CHECK ADD CONSTRAINT [FK_Workers_Areas] FOREIGN KEY([AreaID])
    REFERENCES [dbo].[Areas] ([AreaID])
    ON DELETE SET NULL; -- Or ON DELETE NO ACTION depending on requirements

    ALTER TABLE [dbo].[Workers] CHECK CONSTRAINT [FK_Workers_Areas];

    PRINT 'Table [Workers] created.';
END
ELSE
BEGIN
    PRINT 'Table [Workers] already exists.';
END
GO

-- Create Shifts Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Shifts]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Shifts](
        [ShiftID] [int] IDENTITY(1,1) NOT NULL,
        [ShiftDate] [date] NOT NULL,
        [WorkerID] [int] NOT NULL,
        [AreaID] [int] NOT NULL, -- Area might differ from worker's primary area for a specific shift
        [StartTime] [time](0) NOT NULL, -- Precision 0 for HH:MM:SS
        [EndTime] [time](0) NOT NULL,   -- Precision 0 for HH:MM:SS
        [Comments] [nvarchar](500) NULL,
        CONSTRAINT [PK_Shifts] PRIMARY KEY CLUSTERED ([ShiftID] ASC)
    );

    ALTER TABLE [dbo].[Shifts] WITH CHECK ADD CONSTRAINT [FK_Shifts_Workers] FOREIGN KEY([WorkerID])
    REFERENCES [dbo].[Workers] ([WorkerID])
    ON DELETE CASCADE; -- If a worker is deleted, delete their shifts

    ALTER TABLE [dbo].[Shifts] CHECK CONSTRAINT [FK_Shifts_Workers];

    ALTER TABLE [dbo].[Shifts] WITH CHECK ADD CONSTRAINT [FK_Shifts_Areas] FOREIGN KEY([AreaID])
    REFERENCES [dbo].[Areas] ([AreaID])
    ON DELETE CASCADE; -- If an area is deleted, delete shifts in that area

    ALTER TABLE [dbo].[Shifts] CHECK CONSTRAINT [FK_Shifts_Areas];

    -- Add check constraint to ensure EndTime is after StartTime
    ALTER TABLE [dbo].[Shifts] ADD CONSTRAINT [CK_Shifts_EndTimeAfterStartTime] CHECK ([EndTime] > [StartTime]);

    PRINT 'Table [Shifts] created.';
END
ELSE
BEGIN
    PRINT 'Table [Shifts] already exists.';
END
GO

-- =============================================
-- Populate Initial Data
-- =============================================

-- Populate Areas (only if the table is empty)
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Areas]') AND type in (N'U'))
   AND NOT EXISTS (SELECT 1 FROM [dbo].[Areas])
BEGIN
    PRINT 'Populating initial data into [Areas]...';
    INSERT INTO [dbo].[Areas] ([AreaName]) VALUES
    ('Factory'),
    ('Office'),
    ('Remote'),
    ('Support'),
    ('Warehouse');
    -- Add other default areas as needed

    PRINT 'Finished populating [Areas].';
END
ELSE
BEGIN
     PRINT 'Table [Areas] already contains data or does not exist. Skipping population.';
END
GO

-- Populate Workers (only if the table is empty)
-- Ensure Areas are populated first
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Workers]') AND type in (N'U'))
   AND EXISTS (SELECT 1 FROM [dbo].[Areas]) -- Check if Areas has data
   AND NOT EXISTS (SELECT 1 FROM [dbo].[Workers])
BEGIN
    PRINT 'Populating initial data into [Workers]...';

    -- Temporary storage for Area IDs
    DECLARE @OfficeAreaID INT = (SELECT AreaID FROM Areas WHERE AreaName = 'Office');
    DECLARE @FactoryAreaID INT = (SELECT AreaID FROM Areas WHERE AreaName = 'Factory');
    DECLARE @WarehouseAreaID INT = (SELECT AreaID FROM Areas WHERE AreaName = 'Warehouse');
    DECLARE @SupportAreaID INT = (SELECT AreaID FROM Areas WHERE AreaName = 'Support');
    DECLARE @RemoteAreaID INT = (SELECT AreaID FROM Areas WHERE AreaName = 'Remote');

    -- Insert workers associated with their primary area
    INSERT INTO [dbo].[Workers] ([WorkerName], [AreaID]) VALUES
    ('Alice Smith', @OfficeAreaID),
    ('Bob Johnson', @FactoryAreaID),
    ('Charlie Brown', @OfficeAreaID),
    ('Diana Prince', @SupportAreaID),
    ('Edward Davis', @OfficeAreaID),
    ('Frank Miller', @WarehouseAreaID),
    ('Grace Wilson', @FactoryAreaID),
    ('Henry Rodriguez', @SupportAreaID),
    ('Ivy Garcia', @WarehouseAreaID),
    ('Judy Taylor', @RemoteAreaID),
    ('Kevin Anderson', @RemoteAreaID);
    -- Add other default workers as needed

    PRINT 'Finished populating [Workers].';
END
ELSE
BEGIN
     PRINT 'Table [Workers] already contains data, [Areas] is empty, or [Workers] does not exist. Skipping population.';
END
GO

PRINT 'Database setup script finished.';
GO
