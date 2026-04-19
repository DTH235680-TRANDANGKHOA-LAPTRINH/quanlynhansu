const express = require('express');
const bcrypt = require('bcryptjs');
const TaiKhoan = require('../models/taikhoan');
const NhanVien = require('../models/nhanvien');
const router = express.Router();

const requireAdmin = (req, res, next) => {
    if (req.session?.user?.QuyenHan !== 'admin') {
        return res.status(403).send('Không có quyền truy cập');
    }
    next();
};

router.get('/', requireAdmin, async (req, res) => {
    const taiKhoans = await TaiKhoan.find().populate('NhanVien');
    res.render('taikhoan', {
        title: 'Danh sách tài khoản',
        taiKhoans,
        user: req.session.user,
        menuItems: req.menuItems
    });
});

router.get('/them', requireAdmin, async (req, res) => {
    const nhanViens = await NhanVien.find();
    res.render('taikhoan_them', {
        title: 'Thêm tài khoản',
        nhanViens,
        user: req.session.user,
        menuItems: req.menuItems
    });
});

router.post('/them', requireAdmin, async (req, res) => {
    const { TenDangNhap, MatKhau, Email, QuyenHan, KichHoat, NhanVien } = req.body;
    const salt = bcrypt.genSaltSync(10);
    const hashed = bcrypt.hashSync(MatKhau || '123', salt);
    const role = ['admin', 'hr', 'ketoan', 'nhanvien'].includes(QuyenHan) ? QuyenHan : 'nhanvien';

    await TaiKhoan.create({
        TenDangNhap,
        MatKhau: hashed,
        MatKhauPlain: MatKhau || '123',
        Email: Email?.trim() || '',
        QuyenHan: role,
        KichHoat: Number(KichHoat) || 1,
        NhanVien: NhanVien || null
    });
    res.redirect('/taikhoan');
});

router.get('/sua/:id', requireAdmin, async (req, res) => {
    const id = req.params.id;
    const taiKhoan = await TaiKhoan.findById(id);
    const nhanViens = await NhanVien.find();
    res.render('taikhoan_sua', {
        title: 'Sửa tài khoản',
        taiKhoan,
        nhanViens,
        user: req.session.user,
        menuItems: req.menuItems
    });
});

router.post('/sua/:id', requireAdmin, async (req, res) => {
    const id = req.params.id;
    const { TenDangNhap, MatKhau, Email, QuyenHan, KichHoat, NhanVien } = req.body;
    const role = ['admin', 'hr', 'ketoan', 'nhanvien'].includes(QuyenHan) ? QuyenHan : 'nhanvien';
    const data = {
        TenDangNhap,
        Email: Email?.trim() || '',
        QuyenHan: role,
        KichHoat: Number(KichHoat) || 1,
        NhanVien: NhanVien || null
    };

    if (MatKhau) {
        const salt = bcrypt.genSaltSync(10);
        data.MatKhau = bcrypt.hashSync(MatKhau, salt);
        data.MatKhauPlain = MatKhau;
    }

    await TaiKhoan.findByIdAndUpdate(id, data);
    res.redirect('/taikhoan');
});

router.get('/ca-nhan', async (req, res) => {
    try {
        const taiKhoan = await TaiKhoan.findOne({ NhanVien: req.session.user.NhanVien }).populate('NhanVien');
        if (!taiKhoan) {
            return res.redirect('/login');
        }
        res.render('taikhoan_canhan', {
            title: 'Tài khoản cá nhân',
            taiKhoan,
            user: req.session.user,
            menuItems: req.menuItems
        });
    } catch (error) {
        console.error('Lỗi mở trang tài khoản cá nhân:', error);
        res.status(500).send('Lỗi khi mở trang tài khoản cá nhân.');
    }
});

router.post('/ca-nhan', async (req, res) => {
    try {
        const { MatKhau, Email } = req.body;
        const taiKhoan = await TaiKhoan.findOne({ NhanVien: req.session.user.NhanVien });
        if (!taiKhoan) {
            return res.redirect('/login');
        }
        const data = { Email: Email?.trim() || '' };
        if (MatKhau) {
            const salt = bcrypt.genSaltSync(10);
            data.MatKhau = bcrypt.hashSync(MatKhau, salt);
            data.MatKhauPlain = MatKhau;
        }
        await TaiKhoan.findByIdAndUpdate(taiKhoan._id, data);
        res.redirect('/taikhoan/ca-nhan');
    } catch (error) {
        console.error('Lỗi lưu tài khoản cá nhân:', error);
        res.status(500).send('Lỗi khi lưu tài khoản cá nhân.');
    }
});

module.exports = router;
