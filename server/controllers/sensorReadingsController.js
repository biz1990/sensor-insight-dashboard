const sql = require('mssql');
const db = require('../config/db');

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

        // 1. Tìm kiếm thiết bị dựa trên serialNumber
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

        // 2. Thêm dữ liệu cảm biến vào bảng SensorReadings
        const insertResult = await pool.request()
            .input('deviceId', sql.Int, deviceId) // Vẫn sử dụng deviceId làm khóa ngoại
            .input('temperature', sql.Decimal(5, 2), temperature)
            .input('humidity', sql.Decimal(5, 2), humidity)
            .query(`
                INSERT INTO SensorReadings (deviceId, temperature, humidity)
                VALUES (@deviceId, @temperature, @humidity)
            `);

        if (insertResult.rowsAffected[0] > 0) {
            res.status(201).json({
                success: true,
                message: 'Dữ liệu cảm biến đã được thêm thành công.'
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
    } finally {
        sql.close();
    }
};
