const sql = require('mssql');
const db = require('../config/db');

/**
 * Add a new sensor reading with UTC+7 (Ho Chi Minh) timezone
 */
exports.addSensorReading = async (req, res) => {
    const { serialNumber, temperature, humidity } = req.body;

    if (!serialNumber || temperature === undefined || humidity === undefined) {
        return res.status(400).json({
            success: false,
            message: 'Vui lòng cung cấp đầy đủ serialNumber, nhiệt độ và độ ẩm.'
        });
    }

    try {
        const pool = await sql.connect(db.sqlConfig);

        // 1. Find device based on serialNumber
        const deviceResult = await pool.request()
            .input('serialNumber', sql.NVarChar, serialNumber)
            .query('SELECT id FROM Devices WHERE serialNumber = @serialNumber');

        if (deviceResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Không tìm thấy thiết bị với serialNumber: ${serialNumber}`
            });
        }

        const deviceId = deviceResult.recordset[0].id;

        // 2. Add sensor data to SensorReadings table with UTC+7 timezone
        const insertResult = await pool.request()
            .input('deviceId', sql.Int, deviceId)
            .input('temperature', sql.Decimal(5, 2), temperature)
            .input('humidity', sql.Decimal(5, 2), humidity)
            .query(`
                INSERT INTO SensorReadings (deviceId, temperature, humidity, timestamp)
                VALUES (
                    @deviceId, 
                    @temperature, 
                    @humidity, 
                    DATEADD(HOUR, 7, GETUTCDATE()) -- Store in UTC+7 (Ho Chi Minh) timezone
                )
            `);

        if (insertResult.rowsAffected[0] > 0) {
            // Update device status to online
            await pool.request()
                .input('deviceId', sql.Int, deviceId)
                .input('status', sql.NVarChar, 'online')
                .query(`
                    UPDATE Devices 
                    SET status = @status, updatedAt = GETDATE() 
                    WHERE id = @deviceId
                `);

            res.status(201).json({
                success: true,
                message: 'Dữ liệu cảm biến đã được thêm thành công.',
                timestamp: new Date(new Date().getTime() + (7 * 60 * 60 * 1000)) // UTC+7
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Lỗi khi thêm dữ liệu cảm biến.'
            });
        }
    } catch (error) {
        console.error('Lỗi khi thêm dữ liệu cảm biến:', error);
        res.status(500).json({
            success: false,
            message: `Lỗi server: ${error.message}`
        });
    }
};
