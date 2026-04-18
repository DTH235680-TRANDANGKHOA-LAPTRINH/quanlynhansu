const express = require('express');
const bcrypt = require('bcryptjs');
const TaiKhoan = require('../models/taikhoan');
const NhanVien = require('../models/nhanvien');
const router = express.Router();

// GET /api/taikhoan - Lấy danh sách tài khoản
router.get('/', async (req, res) => {
    try {
        const taiKhoans = await TaiKhoan.find()
            .populate('NhanVien')
            .sort({ TenDangNhap: 1 });

        res.json({
            success: true,
            data: taiKhoans,
            count: taiKhoans.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách tài khoản',
            error: error.message
        });
    }
});

// GET /api/taikhoan/:id - Lấy chi tiết tài khoản
router.get('/:id', async (req, res) => {
    try {
        const taiKhoan = await TaiKhoan.findById(req.params.id)
            .populate('NhanVien');

        if (!taiKhoan) {
            return res.status(404).json({
                success: false,
                message: 'Tài khoản không tồn tại'
            });
        }

        res.json({
            success: true,
            data: taiKhoan
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin tài khoản',
            error: error.message
        });
    }
});

// POST /api/taikhoan - Thêm tài khoản mới
router.post('/', async (req, res) => {
    try {
        const { TenDangNhap, MatKhau, QuyenHan, NhanVien: nhanVienId } = req.body;

        // Kiểm tra tên đăng nhập đã tồn tại
        const existingAccount = await TaiKhoan.findOne({ TenDangNhap });
        if (existingAccount) {
            return res.status(400).json({
                success: false,
                message: 'Tên đăng nhập đã tồn tại'
            });
        }

        // Hash mật khẩu
        const hashedPassword = await bcrypt.hash(MatKhau, 10);

        const taiKhoan = new TaiKhoan({
            TenDangNhap,
            MatKhau: hashedPassword,
            MatKhauPlain: MatKhau,
            QuyenHan,
            NhanVien: nhanVienId
        });

        await taiKhoan.save();

        res.status(201).json({
            success: true,
            message: 'Thêm tài khoản thành công',
            data: taiKhoan
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi thêm tài khoản',
            error: error.message
        });
    }
});

// PUT /api/taikhoan/:id - Cập nhật tài khoản
router.put('/:id', async (req, res) => {
    try {
        const { MatKhau, ...updateData } = req.body;

        // Nếu có mật khẩu mới, hash nó
        if (MatKhau) {
            updateData.MatKhau = await bcrypt.hash(MatKhau, 10);
            updateData.MatKhauPlain = MatKhau;
        }

        const taiKhoan = await TaiKhoan.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate('NhanVien');

        if (!taiKhoan) {
            return res.status(404).json({
                success: false,
                message: 'Tài khoản không tồn tại'
            });
        }

        res.json({
            success: true,
            message: 'Cập nhật tài khoản thành công',
            data: taiKhoan
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật tài khoản',
            error: error.message
        });
    }
});

// DELETE /api/taikhoan/:id - Xóa tài khoản
router.delete('/:id', async (req, res) => {
    try {
        const taiKhoan = await TaiKhoan.findByIdAndDelete(req.params.id);

        if (!taiKhoan) {
            return res.status(404).json({
                success: false,
                message: 'Tài khoản không tồn tại'
            });
        }

        res.json({
            success: true,
            message: 'Xóa tài khoản thành công'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa tài khoản',
            error: error.message
        });
    }
});

module.exports = router;