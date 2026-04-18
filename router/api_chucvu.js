const express = require('express');
const ChucVu = require('../models/chucvu');
const router = express.Router();

// GET /api/chucvu - Lấy danh sách chức vụ
router.get('/', async (req, res) => {
    try {
        const chucVus = await ChucVu.find().sort({ TenCV: 1 });

        res.json({
            success: true,
            data: chucVus,
            count: chucVus.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách chức vụ',
            error: error.message
        });
    }
});

// GET /api/chucvu/:id - Lấy chi tiết chức vụ
router.get('/:id', async (req, res) => {
    try {
        const chucVu = await ChucVu.findById(req.params.id);

        if (!chucVu) {
            return res.status(404).json({
                success: false,
                message: 'Chức vụ không tồn tại'
            });
        }

        res.json({
            success: true,
            data: chucVu
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin chức vụ',
            error: error.message
        });
    }
});

// POST /api/chucvu - Thêm chức vụ mới
router.post('/', async (req, res) => {
    try {
        const chucVu = new ChucVu(req.body);
        await chucVu.save();

        res.status(201).json({
            success: true,
            message: 'Thêm chức vụ thành công',
            data: chucVu
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi thêm chức vụ',
            error: error.message
        });
    }
});

// PUT /api/chucvu/:id - Cập nhật chức vụ
router.put('/:id', async (req, res) => {
    try {
        const chucVu = await ChucVu.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!chucVu) {
            return res.status(404).json({
                success: false,
                message: 'Chức vụ không tồn tại'
            });
        }

        res.json({
            success: true,
            message: 'Cập nhật chức vụ thành công',
            data: chucVu
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật chức vụ',
            error: error.message
        });
    }
});

// DELETE /api/chucvu/:id - Xóa chức vụ
router.delete('/:id', async (req, res) => {
    try {
        const chucVu = await ChucVu.findByIdAndDelete(req.params.id);

        if (!chucVu) {
            return res.status(404).json({
                success: false,
                message: 'Chức vụ không tồn tại'
            });
        }

        res.json({
            success: true,
            message: 'Xóa chức vụ thành công'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa chức vụ',
            error: error.message
        });
    }
});

module.exports = router;