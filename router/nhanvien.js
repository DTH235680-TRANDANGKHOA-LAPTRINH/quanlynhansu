const express = require('express');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const NhanVien = require('../models/nhanvien');
const PhongBan = require('../models/phongban');
const ChucVu = require('../models/chucvu');
const HopDong = require('../models/hopdong');
const Luong = require('../models/luong');
const TaiKhoan = require('../models/taikhoan');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'public', 'images');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

let upload;
let uploadEnabled = false;
try {
    const multer = require('multer');
    uploadEnabled = true;
    const storage = multer.diskStorage({
        destination: (req, file, cb) => cb(null, uploadDir),
        filename: (req, file, cb) => {
            const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
            cb(null, `${Date.now()}-${safeName}`);
        }
    });

    upload = multer({
        storage,
        fileFilter: (req, file, cb) => {
            const allowed = [
                'image/png',
                'image/jpeg',
                'image/jpg',
                'image/webp',
                'image/gif',
                'image/bmp',
                'image/svg+xml'
            ];
            cb(null, allowed.includes(file.mimetype));
        }
    });
} catch (error) {
    console.warn('Multer không được cài đặt; upload ảnh sẽ bị vô hiệu hóa.');
    upload = {
        single: () => (req, res, next) => {
            if (!req.body) req.body = {};
            req.file = null;
            next();
        }
    };
}

const requireAdmin = (req, res, next) => {
    if (req.session?.user?.QuyenHan !== 'admin') {
        return res.status(403).send('Không có quyền truy cập');
    }
    next();
};

const requireHRorAdmin = (req, res, next) => {
    const role = req.session?.user?.QuyenHan;
    if (role !== 'admin' && role !== 'hr') {
        return res.status(403).send('Không có quyền truy cập');
    }
    next();
};

const buildStatusBadge = (status) => {
    switch ((status || '').toLowerCase()) {
        case 'đã nghỉ việc':
        case 'đã nghỉ':
            return { label: 'Đã nghỉ việc', color: 'danger' };
        default:
            return { label: status || 'Đang làm việc', color: 'success' };
    }
};

router.get('/', async (req, res) => {
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

    const [nhanViens, phongBans, chucVus] = await Promise.all([
        NhanVien.find(filter).populate('PhongBan').populate('ChucVu'),
        PhongBan.find(),
        ChucVu.find()
    ]);

    const accountEmails = await TaiKhoan.find({ NhanVien: { $in: nhanViens.map(nv => nv._id) } }).select('Email NhanVien').lean();
    const emailMap = accountEmails.reduce((map, acc) => {
        if (acc.NhanVien) map[acc.NhanVien.toString()] = acc.Email || '';
        return map;
    }, {});

    nhanViens.forEach(nv => {
        nv.TaiKhoanEmail = emailMap[nv._id.toString()] || '';
    });

    res.render('nhansu', {
        title: 'Danh sách nhân sự',
        user: req.session.user,
        menuItems: req.menuItems,
        nhanViens,
        phongBans,
        chucVus,
        filters: { q, phongban, chucvu, trangthai }
    });
});

router.get('/them', requireHRorAdmin, async (req, res) => {
    const [phongBans, chucVus] = await Promise.all([PhongBan.find(), ChucVu.find()]);
    res.render('nhansu_them', {
        title: 'Onboarding nhân viên mới',
        user: req.session.user,
        menuItems: req.menuItems,
        phongBans,
        chucVus,
        uploadEnabled
    });
});

router.post('/them', requireHRorAdmin, upload.single('HinhAnh'), async (req, res) => {
    try {
        const body = req.body || {};
        const {
            TenNV,
            NgaySinh,
            GioiTinh,
            DiaChi,
            DienThoai,
            PhongBan,
            ChucVu,
            SoNguoiPhuThuoc,
            LoaiHD,
            NgayBatDau,
            NgayKetThuc,
            LuongThoaThuan
        } = body;

        if (!TenNV || !DienThoai) {
            return res.status(400).send('Thiếu thông tin bắt buộc: Tên nhân viên và số điện thoại.');
        }

        const nhanVienData = {
            TenNV,
            NgaySinh: NgaySinh || null,
            GioiTinh,
            DiaChi,
            DienThoai,
            PhongBan: PhongBan || null,
            ChucVu: ChucVu || null,
            SoNguoiPhuThuoc: Number(SoNguoiPhuThuoc) || 0,
            TrangThai: 'Đang làm việc'
        };

        if (req.file) {
            nhanVienData.HinhAnh = `images/${req.file.filename}`;
        }

        const nhanVien = await NhanVien.create(nhanVienData);

        if (LoaiHD || NgayBatDau || LuongThoaThuan) {
            await HopDong.create({
                NhanVien: nhanVien._id,
                LoaiHD: LoaiHD || 'Chính thức',
                NgayBatDau: NgayBatDau || new Date(),
                NgayKetThuc: NgayKetThuc || null,
                LuongThoaThuan: Number(LuongThoaThuan) || 0
            });
        }

        let username = body.TenDangNhap?.trim() || DienThoai?.trim() || TenNV.replace(/\s+/g, '').toLowerCase();
        if (!username) username = `nv${Date.now()}`;
        let count = 0;
        const baseUsername = username;
        while (await TaiKhoan.exists({ TenDangNhap: username })) {
            count += 1;
            username = `${baseUsername}${count}`;
        }

        const password = body.MatKhau?.trim() || '123456';
        const hashedPassword = await bcrypt.hash(password, 10);
        await TaiKhoan.create({
            TenDangNhap: username,
            MatKhau: hashedPassword,
            MatKhauPlain: password,
            Email: '',
            QuyenHan: 'nhanvien',
            KichHoat: 1,
            NhanVien: nhanVien._id
        });

        res.redirect('/nhansu');
    } catch (error) {
        console.error('Lỗi khi thêm nhân viên:', error);
        res.status(500).send('Lỗi khi lưu nhân viên. Vui lòng kiểm tra cấu hình MongoDB và quyền ghi.');
    }
});

router.get('/export', async (req, res) => {
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

    const nhanViens = await NhanVien.find(filter).populate('PhongBan').populate('ChucVu');

    const csvRows = [
        'MaNV,TenNV,PhongBan,ChucVu,DienThoai,TrangThai'
    ];
    nhanViens.forEach(nv => {
        csvRows.push(
            `${nv._id},"${nv.TenNV}","${nv.PhongBan?.TenPB || ''}","${nv.ChucVu?.TenCV || ''}","${nv.DienThoai || ''}","${nv.TrangThai || ''}"`
        );
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=nhan_su_export.csv');
    res.send(csvRows.join('\n'));
});

router.get('/:id', async (req, res) => {
    const id = req.params.id;
    const employee = await NhanVien.findById(id).populate('PhongBan').populate('ChucVu');
    if (!employee) return res.status(404).send('Nhân viên không tồn tại');

    const [hopDong, taiKhoan, luongGanNhat, phongBans, chucVus] = await Promise.all([
        HopDong.findOne({ NhanVien: id }).sort({ NgayBatDau: -1 }),
        TaiKhoan.findOne({ NhanVien: id }),
        Luong.findOne({ NhanVien: id }).sort({ Nam: -1, Thang: -1 }),
        PhongBan.find(),
        ChucVu.find()
    ]);

    res.render('nhansu_chitiet', {
        title: 'Chi tiết nhân sự',
        user: req.session.user,
        menuItems: req.menuItems,
        employee,
        hopDong,
        taiKhoan,
        luongGanNhat,
        phongBans,
        chucVus,
        uploadEnabled
    });
});

router.post('/:id/cap-nhat', requireHRorAdmin, upload.single('HinhAnh'), async (req, res) => {
    const id = req.params.id;
    const body = req.body || {};
    const { DiaChi, DienThoai, SoNguoiPhuThuoc, GioiTinh, NgaySinh } = body;
    const data = {
        DiaChi,
        DienThoai,
        SoNguoiPhuThuoc: Number(SoNguoiPhuThuoc) || 0,
        GioiTinh,
        NgaySinh: NgaySinh || null
    };
    if (req.file) {
        const existing = await NhanVien.findById(id).select('HinhAnh').lean();
        if (existing?.HinhAnh && existing.HinhAnh.startsWith('images/') && existing.HinhAnh !== `images/${req.file.filename}`) {
            const oldPath = path.join(__dirname, '..', 'public', existing.HinhAnh);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }
        data.HinhAnh = `images/${req.file.filename}`;
    }
    await NhanVien.findByIdAndUpdate(id, data);
    res.redirect('/nhansu');
});

router.post('/:id/chuyen-cong-tac', requireHRorAdmin, async (req, res) => {
    const id = req.params.id;
    const { PhongBan, ChucVu } = req.body;
    await NhanVien.findByIdAndUpdate(id, {
        PhongBan: PhongBan || null,
        ChucVu: ChucVu || null
    });
    res.redirect('/nhansu');
});

router.post('/:id/account', requireAdmin, async (req, res) => {
    const id = req.params.id;
    const { MatKhauMoi, KichHoat } = req.body;
    const taiKhoan = await TaiKhoan.findOne({ NhanVien: id });
    if (!taiKhoan) return res.status(404).send('Tài khoản không tìm thấy');

    if (MatKhauMoi) {
        taiKhoan.MatKhau = await bcrypt.hash(MatKhauMoi, 10);
        taiKhoan.MatKhauPlain = MatKhauMoi;
    }
    if (typeof KichHoat !== 'undefined') {
        taiKhoan.KichHoat = Number(KichHoat);
    }
    await taiKhoan.save();
    res.redirect('/nhansu');
});

router.post('/:id/offboard', requireHRorAdmin, async (req, res) => {
    const id = req.params.id;
    await NhanVien.findByIdAndUpdate(id, { TrangThai: 'Đã nghỉ việc' });
    const taiKhoan = await TaiKhoan.findOne({ NhanVien: id });
    if (taiKhoan) {
        taiKhoan.KichHoat = 0;
        await taiKhoan.save();
    }
    res.redirect(`/nhansu/${id}`);
});

router.post('/:id/xoa', requireHRorAdmin, async (req, res) => {
    const id = req.params.id;
    const employee = await NhanVien.findById(id).select('HinhAnh').lean();
    if (employee?.HinhAnh && employee.HinhAnh.startsWith('images/')) {
        const imagePath = path.join(__dirname, '..', 'public', employee.HinhAnh);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }
    }
    await Promise.all([
        TaiKhoan.deleteMany({ NhanVien: id }),
        HopDong.deleteMany({ NhanVien: id }),
        NhanVien.findByIdAndDelete(id)
    ]);
    res.redirect('/nhansu');
});

module.exports = router;
