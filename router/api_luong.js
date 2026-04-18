const express = require('express');
const Luong = require('../models/luong');
const router = express.Router();

// GET /api/luong - Lấy danh sách lương
router.get('/', async (req, res) => {
    try {
        const { nhanvien, nam, thang } = req.query;
        const filter = {};

        if (nhanvien) filter.NhanVien = nhanvien;
        if (nam) filter.Nam = parseInt(nam);
        if (thang) filter.Thang = parseInt(thang);

        const luongs = await Luong.find(filter)
            .populate('NhanVien')
            .sort({ Nam: -1, Thang: -1 });

        res.json({
            success: true,
            data: luongs,
            count: luongs.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách lương',
            error: error.message
        });
    }
});

// GET /api/luong/:id - Lấy chi tiết lương
router.get('/:id', async (req, res) => {
    try {
        const luong = await Luong.findById(req.params.id)
            .populate('NhanVien');

        if (!luong) {
            return res.status(404).json({
                success: false,
                message: 'Bản ghi lương không tồn tại'
            });
        }

        res.json({
            success: true,
            data: luong
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin lương',
            error: error.message
        });
    }
});

// POST /api/luong - Thêm bản ghi lương mới
router.post('/', async (req, res) => {
    try {
        const luong = new Luong(req.body);
        await luong.save();

        res.status(201).json({
            success: true,
            message: 'Thêm bản ghi lương thành công',
            data: luong
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi thêm bản ghi lương',
            error: error.message
        });
    }
});

// PUT /api/luong/:id - Cập nhật lương
router.put('/:id', async (req, res) => {
    try {
        const luong = await Luong.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('NhanVien');

        if (!luong) {
            return res.status(404).json({
                success: false,
                message: 'Bản ghi lương không tồn tại'
            });
        }

        res.json({
            success: true,
            message: 'Cập nhật lương thành công',
            data: luong
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật lương',
            error: error.message
        });
    }
});

// DELETE /api/luong/:id - Xóa bản ghi lương
router.delete('/:id', async (req, res) => {
    try {
        const luong = await Luong.findByIdAndDelete(req.params.id);

        if (!luong) {
            return res.status(404).json({
                success: false,
                message: 'Bản ghi lương không tồn tại'
            });
        }

        res.json({
            success: true,
            message: 'Xóa bản ghi lương thành công'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa bản ghi lương',
            error: error.message
        });
    }
});

module.exports = router;