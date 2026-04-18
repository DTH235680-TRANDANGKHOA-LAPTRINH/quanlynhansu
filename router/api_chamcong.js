const express = require('express');
const ChamCong = require('../models/chamcong');
const router = express.Router();

// GET /api/chamcong - Lấy danh sách chấm công
router.get('/', async (req, res) => {
    try {
        const { nhanvien, nam, thang, ngay } = req.query;
        const filter = {};

        if (nhanvien) filter.NhanVien = nhanvien;
        if (nam) filter.Nam = parseInt(nam);
        if (thang) filter.Thang = parseInt(thang);
        if (ngay) filter.Ngay = parseInt(ngay);

        const chamCongs = await ChamCong.find(filter)
            .populate('NhanVien')
            .sort({ Nam: -1, Thang: -1, Ngay: -1 });

        res.json({
            success: true,
            data: chamCongs,
            count: chamCongs.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách chấm công',
            error: error.message
        });
    }
});

// GET /api/chamcong/:id - Lấy chi tiết chấm công
router.get('/:id', async (req, res) => {
    try {
        const chamCong = await ChamCong.findById(req.params.id)
            .populate('NhanVien');

        if (!chamCong) {
            return res.status(404).json({
                success: false,
                message: 'Bản ghi chấm công không tồn tại'
            });
        }

        res.json({
            success: true,
            data: chamCong
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin chấm công',
            error: error.message
        });
    }
});

// POST /api/chamcong - Thêm bản ghi chấm công mới
router.post('/', async (req, res) => {
    try {
        const chamCong = new ChamCong(req.body);
        await chamCong.save();

        res.status(201).json({
            success: true,
            message: 'Thêm bản ghi chấm công thành công',
            data: chamCong
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi thêm bản ghi chấm công',
            error: error.message
        });
    }
});

// PUT /api/chamcong/:id - Cập nhật chấm công
router.put('/:id', async (req, res) => {
    try {
        const chamCong = await ChamCong.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('NhanVien');

        if (!chamCong) {
            return res.status(404).json({
                success: false,
                message: 'Bản ghi chấm công không tồn tại'
            });
        }

        res.json({
            success: true,
            message: 'Cập nhật chấm công thành công',
            data: chamCong
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật chấm công',
            error: error.message
        });
    }
});

// DELETE /api/chamcong/:id - Xóa bản ghi chấm công
router.delete('/:id', async (req, res) => {
    try {
        const chamCong = await ChamCong.findByIdAndDelete(req.params.id);

        if (!chamCong) {
            return res.status(404).json({
                success: false,
                message: 'Bản ghi chấm công không tồn tại'
            });
        }

        res.json({
            success: true,
            message: 'Xóa bản ghi chấm công thành công'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa bản ghi chấm công',
            error: error.message
        });
    }
});

module.exports = router;