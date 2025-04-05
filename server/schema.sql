
-- Create database
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'SensorDB')
BEGIN
    CREATE DATABASE SensorDB;
END
GO

USE SensorDB;
GO

-- Create DeviceLocations table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DeviceLocations')
BEGIN
    CREATE TABLE DeviceLocations (
        id INT PRIMARY KEY IDENTITY(1,1),
        name NVARCHAR(100) NOT NULL,
        description NVARCHAR(255),
        createdAt DATETIME DEFAULT GETDATE(),
        updatedAt DATETIME DEFAULT GETDATE()
    );
END
GO

-- Create Devices table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Devices')
BEGIN
    CREATE TABLE Devices (
        id INT PRIMARY KEY IDENTITY(1,1),
        name NVARCHAR(100) NOT NULL,
        serialNumber NVARCHAR(50) NOT NULL UNIQUE,
        locationId INT REFERENCES DeviceLocations(id),
        status NVARCHAR(20) DEFAULT 'offline',
        createdAt DATETIME DEFAULT GETDATE(),
        updatedAt DATETIME DEFAULT GETDATE()
    );
END
GO

-- Create SensorReadings table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SensorReadings')
BEGIN
    CREATE TABLE SensorReadings (
        id INT PRIMARY KEY IDENTITY(1,1),
        deviceId INT REFERENCES Devices(id),
        temperature DECIMAL(5,2),
        humidity DECIMAL(5,2),
        timestamp DATETIME DEFAULT GETDATE()
    );
END
GO

-- Create Users table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    CREATE TABLE Users (
        id INT PRIMARY KEY IDENTITY(1,1),
        username NVARCHAR(50) NOT NULL UNIQUE,
        email NVARCHAR(100) NOT NULL UNIQUE,
        passwordHash NVARCHAR(255) NOT NULL,
        role NVARCHAR(20) DEFAULT 'user',
        isActive BIT DEFAULT 1,
        createdAt DATETIME DEFAULT GETDATE(),
        updatedAt DATETIME DEFAULT GETDATE()
    );
END
GO

-- Create WarningThresholds table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'WarningThresholds')
BEGIN
    CREATE TABLE WarningThresholds (
        id INT PRIMARY KEY IDENTITY(1,1),
        minTemperature DECIMAL(5,2) DEFAULT 15.0,
        maxTemperature DECIMAL(5,2) DEFAULT 30.0,
        minHumidity DECIMAL(5,2) DEFAULT 30.0,
        maxHumidity DECIMAL(5,2) DEFAULT 70.0,
        updatedAt DATETIME DEFAULT GETDATE(),
        updatedBy INT REFERENCES Users(id)
    );
END
GO

-- Insert initial sample data if tables are empty
IF NOT EXISTS (SELECT TOP 1 * FROM DeviceLocations)
BEGIN
    INSERT INTO DeviceLocations (name, description)
    VALUES 
        ('Server Room', 'Main server room on floor 1'),
        ('Lab', 'Research laboratory'),
        ('Office', 'Main office space'),
        ('Warehouse', 'Storage warehouse'),
        ('Cold Storage', 'Cold storage room');
END
GO

-- Insert admin user if Users table is empty
IF NOT EXISTS (SELECT TOP 1 * FROM Users)
BEGIN
    -- In a real app, this would be a proper password hash
    INSERT INTO Users (username, email, passwordHash, role)
    VALUES ('admin', 'admin@example.com', 'password_hash_here', 'admin');
END
GO

-- Insert default warning threshold if table is empty
IF NOT EXISTS (SELECT TOP 1 * FROM WarningThresholds)
BEGIN
    INSERT INTO WarningThresholds (minTemperature, maxTemperature, minHumidity, maxHumidity, updatedBy)
    VALUES (15.0, 30.0, 30.0, 70.0, 1);
END
GO
