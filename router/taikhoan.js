const express = require('express');
const bcrypt = require('bcryptjs');
const TaiKhoan = require('../models/taikhoan');
const NhanVien = require('../models/nhanvien');
const router = express.Router();

router.get('/', async (req, res) => {
    const taiKhoans = await TaiKhoan.find().populate('NhanVien');
    res.render('taikhoan', {
        title: 'Danh sách tài khoản',
        taiKhoans,
        user: req.session.user,
        menuItems: req.menuItems
    });
});

router.get('/them', async (req, res) => {
    const nhanViens = await NhanVien.find();
    res.render('taikhoan_them', {
        title: 'Thêm tài khoản',
        nhanViens,
        user: req.session.user,
        menuItems: req.menuItems
    });
});

router.post('/them', async (req, res) => {
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

router.get('/sua/:id', async (req, res) => {
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

router.post('/sua/:id', async (req, res) => {
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

router.get('/xoa/:id', async (req, res) => {
    const id = req.params.id;
    await TaiKhoan.findByIdAndDelete(id);
    res.redirect('/taikhoan');
});

module.exports = router;
