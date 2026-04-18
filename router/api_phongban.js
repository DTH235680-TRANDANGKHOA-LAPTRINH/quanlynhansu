const express = require('express');
const PhongBan = require('../models/phongban');
const router = express.Router();

// GET /api/phongban - Lấy danh sách phòng ban
router.get('/', async (req, res) => {
    try {
        const phongBans = await PhongBan.find().sort({ TenPB: 1 });

        res.json({
            success: true,
            data: phongBans,
            count: phongBans.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách phòng ban',
            error: error.message
        });
    }
});

// GET /api/phongban/:id - Lấy chi tiết phòng ban
router.get('/:id', async (req, res) => {
    try {
        const phongBan = await PhongBan.findById(req.params.id);

        if (!phongBan) {
            return res.status(404).json({
                success: false,
                message: 'Phòng ban không tồn tại'
            });
        }

        res.json({
            success: true,
            data: phongBan
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin phòng ban',
            error: error.message
        });
    }
});

// POST /api/phongban - Thêm phòng ban mới
router.post('/', async (req, res) => {
    try {
        const phongBan = new PhongBan(req.body);
        await phongBan.save();

        res.status(201).json({
            success: true,
            message: 'Thêm phòng ban thành công',
            data: phongBan
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi thêm phòng ban',
            error: error.message
        });
    }
});

// PUT /api/phongban/:id - Cập nhật phòng ban
router.put('/:id', async (req, res) => {
    try {
        const phongBan = await PhongBan.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!phongBan) {
            return res.status(404).json({
                success: false,
                message: 'Phòng ban không tồn tại'
            });
        }

        res.json({
            success: true,
            message: 'Cập nhật phòng ban thành công',
            data: phongBan
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật phòng ban',
            error: error.message
        });
    }
});

// DELETE /api/phongban/:id - Xóa phòng ban
router.delete('/:id', async (req, res) => {
    try {
        const phongBan = await PhongBan.findByIdAndDelete(req.params.id);

        if (!phongBan) {
            return res.status(404).json({
                success: false,
                message: 'Phòng ban không tồn tại'
            });
        }

        res.json({
            success: true,
            message: 'Xóa phòng ban thành công'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa phòng ban',
            error: error.message
        });
    }
});

module.exports = router;