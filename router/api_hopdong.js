const express = require('express');
const HopDong = require('../models/hopdong');
const router = express.Router();

// GET /api/hopdong - Lấy danh sách hợp đồng
router.get('/', async (req, res) => {
    try {
        const { nhanvien } = req.query;
        const filter = {};

        if (nhanvien) filter.NhanVien = nhanvien;

        const hopDongs = await HopDong.find(filter)
            .populate('NhanVien')
            .sort({ NgayBatDau: -1 });

        res.json({
            success: true,
            data: hopDongs,
            count: hopDongs.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách hợp đồng',
            error: error.message
        });
    }
});

// GET /api/hopdong/:id - Lấy chi tiết hợp đồng
router.get('/:id', async (req, res) => {
    try {
        const hopDong = await HopDong.findById(req.params.id)
            .populate('NhanVien');

        if (!hopDong) {
            return res.status(404).json({
                success: false,
                message: 'Hợp đồng không tồn tại'
            });
        }

        res.json({
            success: true,
            data: hopDong
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin hợp đồng',
            error: error.message
        });
    }
});

// POST /api/hopdong - Thêm hợp đồng mới
router.post('/', async (req, res) => {
    try {
        const hopDong = new HopDong(req.body);
        await hopDong.save();

        res.status(201).json({
            success: true,
            message: 'Thêm hợp đồng thành công',
            data: hopDong
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi thêm hợp đồng',
            error: error.message
        });
    }
});

// PUT /api/hopdong/:id - Cập nhật hợp đồng
router.put('/:id', async (req, res) => {
    try {
        const hopDong = await HopDong.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('NhanVien');

        if (!hopDong) {
            return res.status(404).json({
                success: false,
                message: 'Hợp đồng không tồn tại'
            });
        }

        res.json({
            success: true,
            message: 'Cập nhật hợp đồng thành công',
            data: hopDong
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật hợp đồng',
            error: error.message
        });
    }
});

// DELETE /api/hopdong/:id - Xóa hợp đồng
router.delete('/:id', async (req, res) => {
    try {
        const hopDong = await HopDong.findByIdAndDelete(req.params.id);

        if (!hopDong) {
            return res.status(404).json({
                success: false,
                message: 'Hợp đồng không tồn tại'
            });
        }

        res.json({
            success: true,
            message: 'Xóa hợp đồng thành công'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa hợp đồng',
            error: error.message
        });
    }
});

module.exports = router;