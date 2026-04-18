const express = require('express');
const NhanVien = require('../models/nhanvien');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Cấu hình multer cho upload file
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../public/uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// GET /api/nhanvien - Lấy danh sách nhân viên
router.get('/', async (req, res) => {
    try {
        const { q, phongban, chucvu, trangthai } = req.query;
        const filter = {};

        if (q) {
            filter.$or = [
                { TenNV: { $regex: q, $options: 'i' } },
                { DienThoai: { $regex: q, $options: 'i' } }
            ];
            if (/^[0-9a-fA-F]{24}$/.test(q)) {
                filter.$or.push({ _id: q });
            }
        }
        if (phongban) filter.PhongBan = phongban;
        if (chucvu) filter.ChucVu = chucvu;
        if (trangthai) filter.TrangThai = trangthai;

        const nhanViens = await NhanVien.find(filter)
            .populate('PhongBan')
            .populate('ChucVu')
            .sort({ TenNV: 1 });

        res.json({
            success: true,
            data: nhanViens,
            count: nhanViens.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách nhân viên',
            error: error.message
        });
    }
});

// GET /api/nhanvien/:id - Lấy chi tiết nhân viên
router.get('/:id', async (req, res) => {
    try {
        const nhanVien = await NhanVien.findById(req.params.id)
            .populate('PhongBan')
            .populate('ChucVu');

        if (!nhanVien) {
            return res.status(404).json({
                success: false,
                message: 'Nhân viên không tồn tại'
            });
        }

        res.json({
            success: true,
            data: nhanVien
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin nhân viên',
            error: error.message
        });
    }
});

// POST /api/nhanvien - Thêm nhân viên mới
router.post('/', async (req, res) => {
    try {
        const nhanVienData = req.body;
        const nhanVien = new NhanVien(nhanVienData);
        await nhanVien.save();

        res.status(201).json({
            success: true,
            message: 'Thêm nhân viên thành công',
            data: nhanVien
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi thêm nhân viên',
            error: error.message
        });
    }
});

// PUT /api/nhanvien/:id - Cập nhật nhân viên
router.put('/:id', async (req, res) => {
    try {
        const nhanVien = await NhanVien.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('PhongBan').populate('ChucVu');

        if (!nhanVien) {
            return res.status(404).json({
                success: false,
                message: 'Nhân viên không tồn tại'
            });
        }

        res.json({
            success: true,
            message: 'Cập nhật nhân viên thành công',
            data: nhanVien
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật nhân viên',
            error: error.message
        });
    }
});

// DELETE /api/nhanvien/:id - Xóa nhân viên
router.delete('/:id', async (req, res) => {
    try {
        const nhanVien = await NhanVien.findByIdAndDelete(req.params.id);

        if (!nhanVien) {
            return res.status(404).json({
                success: false,
                message: 'Nhân viên không tồn tại'
            });
        }

        res.json({
            success: true,
            message: 'Xóa nhân viên thành công'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa nhân viên',
            error: error.message
        });
    }
});

// POST /api/nhanvien/upload/:id - Upload CV/Ảnh cục bộ
router.post('/upload/:id', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Không có file được upload'
            });
        }

        const nhanVienId = req.params.id;
        const fileType = req.body.fileType || 'other'; // cv, anh, other
        const localFilePath = req.file.path;

        // Kiểm tra nhân viên tồn tại
        const nhanVien = await NhanVien.findById(nhanVienId);
        if (!nhanVien) {
            fs.unlink(localFilePath, (err) => { if (err) console.error(err); });
            return res.status(404).json({
                success: false,
                message: 'Nhân viên không tồn tại'
            });
        }

        // Chỉ lưu file cục bộ
        const fileUrl = `/uploads/${path.basename(localFilePath)}`;
        if (fileType === 'cv') {
            nhanVien.CV_Link = fileUrl;
        } else if (fileType === 'anh') {
            nhanVien.AnhDaiDien = fileUrl;
        }
        await nhanVien.save();

        res.json({
            success: true,
            message: 'File uploaded thành công (lưu cục bộ)',
            data: {
                link: fileUrl
            }
        });
    } catch (error) {
        console.error('Error in upload:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi upload file',
            error: error.message
        });
    }
});

module.exports = router;