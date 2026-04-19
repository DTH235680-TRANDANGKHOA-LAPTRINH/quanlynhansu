require('dotenv').config({ path: 'API.env' }); // Load biến môi trường từ API.env

const express = require('express');
const session = require('express-session'); // Thêm thư viện session
const bcrypt = require('bcryptjs');
const app = express();
var mongoose = require('mongoose');
// Kết nối database
var uri = 'mongodb://admin:admin123@ac-78i6j9y-shard-00-02.ogusrmz.mongodb.net:27017/quanlynhansu?ssl=true&authSource=admin';
mongoose.connect(uri)
    .then(() => {
        console.log('Đã kết nối thành công tới MongoDB.');
    })
    .catch(err => {
        console.error('Lỗi kết nối MongoDB:', err);
    });

app.set('views', './views');
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Cấu hình Session (BẮT BUỘC ĐỂ LƯU TRẠNG THÁI ĐĂNG NHẬP)
app.use(session({
    secret: 'khoabimat_quanlynhansu',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 3600000 } // Session tồn tại 1 tiếng (tính bằng mili-giây)
}));

app.use((req, res, next) => {
    if (req.session?.user) {
        req.menuItems = buildMenu(req.session.user, req.path);
    }
    next();
});

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const allowedAdminEmails = (process.env.GOOGLE_ADMIN_EMAIL || 'trandangkhoa.ag67@gmail.com')
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean);

// Thiết lập Passport
app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    const email = profile.emails?.[0]?.value?.toLowerCase();
    if (!email || !allowedAdminEmails.includes(email)) {
      return done(null, false, { message: 'Email này không được phép đăng nhập.' });
    }

    const user = {
      id: profile.id,
      displayName: profile.displayName,
      email,
      photo: profile.photos?.[0]?.value,
      QuyenHan: 'admin',
      TenDangNhap: email,
      KichHoat: 1
    };
    return done(null, user);
  }
));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// --- TẠO CÁC ĐƯỜNG DẪN (ROUTES) ---

// 1. Khi nhấn nút Đăng nhập
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// 2. Đường dẫn Google trả kết quả về
app.get('/auth/google/callback', (req, res, next) => {
  passport.authenticate('google', { failureRedirect: '/login?error=denied', session: true }, (err, user) => {
    if (err || !user) {
      return res.redirect('/login?error=denied');
    }
    req.logIn(user, (loginErr) => {
      if (loginErr) {
        return next(loginErr);
      }
      req.session.user = user;
      res.redirect('/');
    });
  })(req, res, next);
});

// 3. Trang Dashboard (Trang chủ sau khi đăng nhập)

const PhongBan = require('./models/phongban');
const ChucVu = require('./models/chucvu');
const NhanVien = require('./models/nhanvien');
const HopDong = require('./models/hopdong');
const Luong = require('./models/luong');
const ChamCong = require('./models/chamcong');
const TaiKhoan = require('./models/taikhoan');

const menuConfig = {
    admin: [
        { label: 'Nhân sự', href: '/nhansu', icon: 'bi-people' },
        { label: 'Lương & Thưởng', href: '/luong', icon: 'bi-cash-stack' },
        { label: 'Chấm công & Phép', href: '/chamcong', icon: 'bi-clock-history' },
        { label: 'Hợp đồng', href: '/hopdong', icon: 'bi-file-earmark-text' },
        { label: 'Tuyển dụng', href: '/tuyendung', icon: 'bi-person-badge' },
        { label: 'Tài khoản', href: '/taikhoan', icon: 'bi-people-fill' }
    ],
    hr: [
        { label: 'Nhân sự', href: '/nhansu', icon: 'bi-people' },
        { label: 'Hợp đồng', href: '/hopdong', icon: 'bi-file-earmark-text' },
        { label: 'Tuyển dụng', href: '/tuyendung', icon: 'bi-person-badge' }
    ],
    ketoan: [
        { label: 'Chấm công & Phép', href: '/chamcong', icon: 'bi-clock-history' },
        { label: 'Lương & Thưởng', href: '/luong', icon: 'bi-cash-stack' },
        { label: 'Nhân sự', href: '/nhansu', icon: 'bi-people' }
    ],
    nhanvien: [
        { label: 'Hồ sơ', href: '/hoso', icon: 'bi-person-badge' },
        { label: 'Tài khoản', href: '/taikhoan/ca-nhan', icon: 'bi-person-circle' },
        { label: 'Lương & Thưởng', href: '/luong', icon: 'bi-cash-stack' },
        { label: 'Chấm công & Phép', href: '/chamcong', icon: 'bi-clock-history' }
    ]
};

const taiKhoanRouter = require('./router/taikhoan');
const nhanVienRouter = require('./router/nhanvien');
const apiNhanVienRouter = require('./router/api_nhanvien');
const apiTaiKhoanRouter = require('./router/api_taikhoan');
const apiPhongBanRouter = require('./router/api_phongban');
const apiChucVuRouter = require('./router/api_chucvu');
const apiHopDongRouter = require('./router/api_hopdong');
const apiLuongRouter = require('./router/api_luong');
const apiChamCongRouter = require('./router/api_chamcong');

// Middleware: Kiểm tra đăng nhập (Bảo vệ các route cần thiết)
const checkLogin = (req, res, next) => {
    if (req.session.user) {
        next(); // Đã đăng nhập, cho phép đi tiếp
    } else {
        res.redirect('/login'); // Chưa đăng nhập, bắt quay về trang login
    }
};

const normalizeRole = (role) => {
    if (role === 'user') return 'nhanvien';
    return role;
};

const allowRoles = (roles) => (req, res, next) => {
    const user = req.session.user;
    const role = normalizeRole(user?.QuyenHan);
    if (user && roles.includes(role)) {
        return next();
    }
    res.status(403).send('Không có quyền truy cập');
};

const calculatePersonalIncomeTax = (grossIncome, socialInsurance, dependents = 0) => {
    const personalAllowance = 11000000;
    const dependentAllowance = 4400000 * dependents;
    let taxable = grossIncome - socialInsurance - personalAllowance - dependentAllowance;
    if (taxable <= 0) return 0;

    const brackets = [10000000, 30000000, 60000000, 100000000];
    const rates = [0.05, 0.1, 0.2, 0.3, 0.35];
    let tax = 0;
    let remaining = taxable;
    let previous = 0;

    for (let i = 0; i < brackets.length; i++) {
        const limit = brackets[i];
        if (remaining <= 0) break;
        const amount = Math.min(remaining, limit - previous);
        tax += amount * rates[i];
        remaining -= amount;
        previous = limit;
    }
    if (remaining > 0) {
        tax += remaining * rates[rates.length - 1];
    }

    return Math.round(tax);
};

const getDaysInMonth = (month, year) => new Date(year, month, 0).getDate();

const contractActiveInMonth = (contract, month, year) => {
    const monthStart = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const monthEnd = new Date(year, month - 1, getDaysInMonth(month, year), 23, 59, 59, 999);
    const start = contract.NgayBatDau ? new Date(contract.NgayBatDau) : null;
    const end = contract.NgayKetThuc ? new Date(contract.NgayKetThuc) : null;
    if (!start) return false;
    return start <= monthEnd && (!end || end >= monthStart);
};

const calculateProratedBaseSalary = (contract, month, year) => {
    const fullSalary = contract.LuongThoaThuan || 0;
    if (!contract.NgayBatDau) return fullSalary;

    const monthStart = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const monthEnd = new Date(year, month - 1, getDaysInMonth(month, year), 23, 59, 59, 999);
    const start = new Date(contract.NgayBatDau);
    const end = contract.NgayKetThuc ? new Date(contract.NgayKetThuc) : null;
    const actualStart = start > monthStart ? start : monthStart;
    const actualEnd = end && end < monthEnd ? end : monthEnd;
    if (actualStart > actualEnd) return fullSalary;

    const daysWorked = Math.round((actualEnd - actualStart) / (1000 * 60 * 60 * 24)) + 1;
    const totalDays = getDaysInMonth(month, year);
    return Math.round(fullSalary * (daysWorked / totalDays));
};

const updateLatestContractBaseSalary = async (employeeId, newSalary) => {
    const contract = await HopDong.findOne({ NhanVien: employeeId }).sort({ NgayBatDau: -1 });
    if (contract) {
        contract.LuongThoaThuan = newSalary;
        await contract.save();
    }
};

app.use('/taikhoan', checkLogin, taiKhoanRouter);
app.use('/nhansu', checkLogin, allowRoles(['admin', 'hr', 'ketoan']), nhanVienRouter);

// API Routes (không cần authentication cho demo)
app.use('/api/nhanvien', apiNhanVienRouter);
app.use('/api/taikhoan', apiTaiKhoanRouter);
app.use('/api/phongban', apiPhongBanRouter);
app.use('/api/chucvu', apiChucVuRouter);
app.use('/api/hopdong', apiHopDongRouter);
app.use('/api/luong', apiLuongRouter);
app.use('/api/chamcong', apiChamCongRouter);

const buildMenu = (user, currentPath) => {
    const role = normalizeRole(user?.QuyenHan) || 'nhanvien';
    const items = menuConfig[role] || menuConfig.nhanvien;
    return items.map(item => ({ ...item, active: item.href === currentPath }));
};

// Route trang chủ: hiển thị landing page nếu chưa đăng nhập, chuyển hướng nếu đã đăng nhập
app.get('/', async (req, res) => {
    const user = req.session.user;
    if (user) {
        const role = normalizeRole(user?.QuyenHan);
        if (role === 'nhanvien') {
            return res.redirect('/hoso');
        }
        return res.redirect('/nhansu');
    }

    res.render('public_home', {
        title: 'Renbang Tuyển Dụng',
        contact: {
            email: 'info@renbang.vn',
            phone: '028.6685.5009',
            address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
            zalo: 'Zalo: 028.6685.5009'
        }
    });
});

app.get('/chamcong', checkLogin, allowRoles(['admin', 'ketoan', 'nhanvien']), async (req, res) => {
    try {
        const user = req.session.user;
        const isEmployee = user.QuyenHan === 'nhanvien';
        const filter = isEmployee ? { NhanVien: user.NhanVien?._id || user.NhanVien } : {};
        const attendance = await ChamCong.find(filter).populate('NhanVien').sort({ Ngay: -1 }).limit(50);

        const summary = await ChamCong.aggregate([
            { $match: filter },
            { $group: { _id: '$TrangThai', count: { $sum: 1 } } }
        ]);
        const stats = summary.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {});

        let employees = [];
        if (!isEmployee) {
            employees = await NhanVien.find({ TrangThai: 'Đang làm việc' }).sort({ TenNV: 1 });
        }

        res.render('chamcong', {
            user,
            menuItems: buildMenu(user, req.path),
            attendance,
            stats,
            employees
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Lỗi khi tải chấm công');
    }
});

app.get('/api/chamcong', checkLogin, allowRoles(['admin', 'ketoan', 'nhanvien']), async (req, res) => {
    try {
        const user = req.session.user;
        const isEmployee = user.QuyenHan === 'nhanvien';
        const filter = isEmployee ? { NhanVien: user.NhanVien?._id || user.NhanVien } : {};
        const attendance = await ChamCong.find(filter).populate('NhanVien').sort({ Ngay: -1 }).limit(100);

        const summary = attendance.reduce((acc, item) => {
            acc[item.TrangThai] = (acc[item.TrangThai] || 0) + 1;
            return acc;
        }, {});

        res.json({ success: true, attendance, summary });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi khi lấy dữ liệu chấm công.' });
    }
});

app.post('/api/chamcong', checkLogin, allowRoles(['admin', 'ketoan', 'nhanvien']), async (req, res) => {
    try {
        const user = req.session.user;
        if (user.QuyenHan !== 'nhanvien') {
            return res.status(403).json({ success: false, message: 'Chấm công chỉ được thực hiện bởi nhân viên.' });
        }
        const data = {
            NhanVien: user.NhanVien?._id || user.NhanVien,
            Ngay: req.body.Ngay ? new Date(req.body.Ngay) : new Date(),
            TrangThai: ['Đi làm', 'Đi trễ', 'Nghỉ phép', 'OT', 'Nghỉ không phép'].includes(req.body.TrangThai) ? req.body.TrangThai : 'Đi làm',
            GioVao: req.body.GioVao || '',
            GioRa: req.body.GioRa || '',
            DiaDiem: req.body.DiaDiem || '',
            GhiChu: req.body.GhiChu || ''
        };

        if (!data.NhanVien) {
            return res.status(400).json({ success: false, message: 'Không tìm thấy nhân viên chấm công.' });
        }
        if (!data.Ngay || Number.isNaN(data.Ngay.getTime())) {
            return res.status(400).json({ success: false, message: 'Ngày chấm công không hợp lệ.' });
        }

        const startOfDay = new Date(data.Ngay);
        startOfDay.setHours(0, 0, 0, 0);
        const nextDay = new Date(startOfDay);
        nextDay.setDate(nextDay.getDate() + 1);

        const existing = await ChamCong.findOne({
            NhanVien: data.NhanVien,
            Ngay: { $gte: startOfDay, $lt: nextDay }
        });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Hôm nay bạn đã chấm công rồi. Mỗi ngày chỉ được chấm công một lần.' });
        }

        const record = await ChamCong.create(data);
        const saved = await record.populate('NhanVien');
        res.status(201).json({ success: true, record: saved });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi khi lưu chấm công.' });
    }
});

app.get('/luong', checkLogin, allowRoles(['admin', 'ketoan', 'nhanvien']), async (req, res) => {
    try {
        const user = req.session.user;
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();

        const monthStart = new Date(currentYear, currentMonth - 1, 1, 0, 0, 0, 0);
        const monthEnd = new Date(currentYear, currentMonth - 1, getDaysInMonth(currentMonth, currentYear), 23, 59, 59, 999);

        const contracts = await HopDong.find({
            NgayBatDau: { $lte: monthEnd },
            $or: [{ NgayKetThuc: null }, { NgayKetThuc: { $gte: monthStart } }]
        });

        await Promise.all(contracts.map(async contract => {
            const startDate = contract.NgayBatDau ? new Date(contract.NgayBatDau) : null;
            if (!startDate) return;

            const firstPaidDate = new Date(startDate);
            firstPaidDate.setMonth(firstPaidDate.getMonth() + 1);
            firstPaidDate.setHours(0, 0, 0, 0);
            if (currentDate < firstPaidDate) return;

            if (!contractActiveInMonth(contract, currentMonth, currentYear)) return;

            const exists = await Luong.exists({
                NhanVien: contract.NhanVien,
                Thang: currentMonth,
                Nam: currentYear
            });
            if (!exists) {
                await Luong.create({
                    NhanVien: contract.NhanVien,
                    Thang: currentMonth,
                    Nam: currentYear,
                    LuongCoBan: calculateProratedBaseSalary(contract, currentMonth, currentYear),
                    PhuCapChucVu: 0,
                    PhuCapKhuVuc: 0,
                    LuongOT: 0,
                    ThuongKPI: 0,
                    ThuongChuyenCan: 0,
                    PhuCapAnTrua: 0,
                    TroCapPhucLoi: 0,
                    ThueTNCN: 0,
                    GiamTruKhac: 0
                });
            }
        }));

        const filter = user.QuyenHan === 'nhanvien' ? { NhanVien: user.NhanVien?._id || user.NhanVien } : {};
        const records = await Luong.find(filter).populate('NhanVien').sort({ Nam: -1, Thang: -1 });
        const totals = records.reduce((acc, item) => {
            acc.totalPayroll += item.TongThuNhap;
            acc.totalReward += (item.ThuongKPI || 0) + (item.ThuongChuyenCan || 0);
            acc.totalDeduction += item.TongKhauTru || 0;
            acc.totalNet += item.LuongThucLinh || 0;
            return acc;
        }, { totalPayroll: 0, totalReward: 0, totalDeduction: 0, totalNet: 0 });

        res.render('luong', {
            user,
            menuItems: buildMenu(user, req.path),
            luongRecords: records,
            totals,
            canEdit: ['admin', 'hr', 'ketoan'].includes(user.QuyenHan)
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Lỗi khi tải lương');
    }
});

app.get('/luong/them', checkLogin, allowRoles(['admin', 'ketoan']), async (req, res) => {
    try {
        const employees = await NhanVien.find({ TrangThai: 'Đang làm việc' });
        res.render('luong_them', {
            user: req.session.user,
            menuItems: buildMenu(req.session.user, req.path),
            employees,
            record: null
        });
    } catch (error) {
        console.error('Lỗi mở trang thêm lương:', error);
        res.status(500).send('Lỗi khi mở trang thêm lương. Vui lòng kiểm tra log server.');
    }
});

app.post('/luong/them', checkLogin, allowRoles(['admin', 'ketoan']), async (req, res) => {
    try {
        // --- CHÈN LOG DỮ LIỆU Ở ĐÂY ---
        console.log("=== THÔNG TIN TỪ FORM LƯƠNG GỬI LÊN ===");
        console.log(req.body); 
        console.log("=========================================");

        const data = {
            NhanVien: req.body.NhanVien,
            Thang: Number(req.body.Thang),
            Nam: Number(req.body.Nam),
            LuongCoBan: Number(req.body.LuongCoBan),
            PhuCapChucVu: Number(req.body.PhuCapChucVu) || 0,
            PhuCapKhuVuc: Number(req.body.PhuCapKhuVuc) || 0,
            LuongOT: Number(req.body.LuongOT) || 0,
            ThuongKPI: Number(req.body.ThuongKPI) || 0,
            ThuongChuyenCan: Number(req.body.ThuongChuyenCan) || 0,
            PhuCapAnTrua: Number(req.body.PhuCapAnTrua) || 0,
            TroCapPhucLoi: Number(req.body.TroCapPhucLoi) || 0,
            GiamTruKhac: Number(req.body.GiamTruKhac) || 0
        };

        if (!data.NhanVien) {
            return res.status(400).send('Vui lòng chọn nhân viên trước khi thêm lương.');
        }
        if (!data.Thang || data.Thang < 1 || data.Thang > 12) {
            return res.status(400).send('Tháng không hợp lệ.');
        }
        if (!data.Nam || data.Nam < 1900) {
            return res.status(400).send('Năm không hợp lệ.');
        }

        const employee = await NhanVien.findById(data.NhanVien);
        if (!employee) {
            return res.status(400).send('Nhân viên không tồn tại.');
        }

        const exists = await Luong.exists({ NhanVien: data.NhanVien, Thang: data.Thang, Nam: data.Nam });
        if (exists) {
            return res.status(400).send('Bảng lương của nhân viên cho tháng này đã tồn tại.');
        }

        await Luong.create(data);
        await updateLatestContractBaseSalary(data.NhanVien, data.LuongCoBan);
        res.redirect('/luong');
    } catch (error) {
        // --- CHÈN LOG LỖI Ở ĐÂY ---
        console.log("=== ⚠️ PHÁT HIỆN LỖI KHI LƯU BẢNG LƯƠNG ===");
        console.log(error); // In ra toàn bộ cục lỗi đỏ chót để bắt bệnh
        console.log("=============================================");
        
        // In trực tiếp lỗi ra màn hình web luôn cho bạn dễ nhìn (thay vì câu báo lỗi chung chung)
        res.status(500).send('Chi tiết lỗi: ' + error.message);
    }
});

app.get('/luong/sua/:id', checkLogin, allowRoles(['admin', 'ketoan']), async (req, res) => {
    const record = await Luong.findById(req.params.id).populate('NhanVien');
    if (!record) {
        return res.redirect('/luong');
    }
    const employees = await NhanVien.find({ TrangThai: 'Đang làm việc' });
    res.render('luong_them', {
        user: req.session.user,
        menuItems: buildMenu(req.session.user, req.path),
        employees,
        record
    });
});

app.post('/luong/sua/:id', checkLogin, allowRoles(['admin', 'ketoan']), async (req, res) => {
    const data = {
        NhanVien: req.body.NhanVien,
        Thang: Number(req.body.Thang) || new Date().getMonth() + 1,
        Nam: Number(req.body.Nam) || new Date().getFullYear(),
        LuongCoBan: Number(req.body.LuongCoBan) || 0,
        PhuCapChucVu: Number(req.body.PhuCapChucVu) || 0,
        PhuCapKhuVuc: Number(req.body.PhuCapKhuVuc) || 0,
        LuongOT: Number(req.body.LuongOT) || 0,
        ThuongKPI: Number(req.body.ThuongKPI) || 0,
        ThuongChuyenCan: Number(req.body.ThuongChuyenCan) || 0,
        PhuCapAnTrua: Number(req.body.PhuCapAnTrua) || 0,
        TroCapPhucLoi: Number(req.body.TroCapPhucLoi) || 0,
        ThueTNCN: 0,
        GiamTruKhac: Number(req.body.GiamTruKhac) || 0
    };
    const employee = await NhanVien.findById(data.NhanVien);
    const dependents = employee?.SoNguoiPhuThuoc || 0;
    const gross = data.LuongCoBan + data.PhuCapChucVu + data.PhuCapKhuVuc + data.LuongOT + data.ThuongKPI + data.ThuongChuyenCan + data.PhuCapAnTrua + data.TroCapPhucLoi;
    const social = Math.round(data.LuongCoBan * 0.08 + data.LuongCoBan * 0.015 + data.LuongCoBan * 0.01);
    data.ThueTNCN = calculatePersonalIncomeTax(gross, social, dependents, data.GiamTruKhac);
    await Luong.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true, context: 'query' });
    await updateLatestContractBaseSalary(data.NhanVien, data.LuongCoBan);
    res.redirect('/luong');
});

app.post('/luong/xoa/:id', checkLogin, allowRoles(['admin', 'ketoan']), async (req, res) => {
    await Luong.findByIdAndDelete(req.params.id);
    res.redirect('/luong');
});

app.get('/hopdong', checkLogin, allowRoles(['admin', 'hr', 'ketoan']), async (req, res) => {
    const hopdongs = await HopDong.find().populate('NhanVien').sort({ NgayBatDau: -1 });
    res.render('hopdong', {
        user: req.session.user,
        menuItems: buildMenu(req.session.user, req.path),
        hopdongs
    });
});

app.get('/hopdong/them', checkLogin, allowRoles(['admin', 'hr', 'ketoan']), async (req, res) => {
    const employees = await NhanVien.find({ TrangThai: 'Đang làm việc' });
    res.render('hopdong_them', {
        user: req.session.user,
        menuItems: buildMenu(req.session.user, req.path),
        employees
    });
});

app.post('/hopdong/them', checkLogin, allowRoles(['admin', 'hr', 'ketoan']), async (req, res) => {
    await HopDong.create({
        NhanVien: req.body.NhanVien,
        LoaiHD: req.body.LoaiHD,
        NgayBatDau: req.body.NgayBatDau || new Date(),
        NgayKetThuc: req.body.NgayKetThuc || null,
        LuongThoaThuan: Number(req.body.LuongThoaThuan) || 0
    });
    res.redirect('/hopdong');
});

app.post('/hopdong/xoa/:id', checkLogin, allowRoles(['admin', 'hr', 'ketoan']), async (req, res) => {
    await HopDong.findByIdAndDelete(req.params.id);
    res.redirect('/hopdong');
});

app.get('/tuyendung', checkLogin, allowRoles(['admin', 'hr']), async (req, res) => {
    const employees = await NhanVien.find().populate('PhongBan').populate('ChucVu');
    res.render('tuyendung', {
        user: req.session.user,
        menuItems: buildMenu(req.session.user, req.path),
        employees
    });
});

app.post('/tuyendung/xoa/:id', checkLogin, allowRoles(['admin', 'hr']), async (req, res) => {
    await Promise.all([
        HopDong.deleteMany({ NhanVien: req.params.id }),
        TaiKhoan.deleteMany({ NhanVien: req.params.id }),
        NhanVien.findByIdAndDelete(req.params.id)
    ]);
    res.redirect('/tuyendung');
});

app.get('/hoso', checkLogin, allowRoles(['admin', 'hr', 'ketoan', 'nhanvien']), async (req, res) => {
    if (req.session.user.QuyenHan === 'nhanvien') {
        const me = await NhanVien.findById(req.session.user.NhanVien).populate('PhongBan').populate('ChucVu');
        return res.render('hoso', {
            user: req.session.user,
            menuItems: buildMenu(req.session.user, req.path),
            me
        });
    }
    const employees = await NhanVien.find().populate('PhongBan').populate('ChucVu');
    res.render('hoso', {
        user: req.session.user,
        menuItems: buildMenu(req.session.user, req.path),
        employees
    });
});

app.get('/hoso/sua', checkLogin, allowRoles(['nhanvien']), async (req, res) => {
    try {
        const me = await NhanVien.findById(req.session.user.NhanVien);
        res.render('hoso_sua', {
            user: req.session.user,
            menuItems: buildMenu(req.session.user, req.path),
            me
        });
    } catch (error) {
        console.error('Lỗi mở trang sửa hồ sơ nhân viên:', error);
        res.status(500).send('Lỗi khi mở trang sửa hồ sơ.');
    }
});

app.post('/hoso/sua', checkLogin, allowRoles(['nhanvien']), async (req, res) => {
    try {
        const { DienThoai, DiaChi, Gmail } = req.body;
        await NhanVien.findByIdAndUpdate(req.session.user.NhanVien, { DienThoai, DiaChi, Gmail });
        res.redirect('/hoso');
    } catch (error) {
        console.error('Lỗi khi cập nhật hồ sơ nhân viên:', error);
        res.status(500).send('Lỗi khi cập nhật hồ sơ.');
    }
});

app.get('/report', checkLogin, allowRoles(['admin', 'hr', 'ketoan']), async (req, res) => {
    const [nhanViens, luongRecords, chamCongs] = await Promise.all([
        NhanVien.find().populate('PhongBan').populate('ChucVu'),
        Luong.find().populate('NhanVien'),
        ChamCong.find().populate('NhanVien')
    ]);

    const totalPayroll = luongRecords.reduce((sum, item) => sum + (item.TongThuNhap || 0), 0);
    const totalReward = luongRecords.reduce((sum, item) => sum + ((item.ThuongKPI || 0) + (item.ThuongChuyenCan || 0)), 0);
    const departmentCounts = nhanViens.reduce((map, nv) => {
        const key = nv.PhongBan?.TenPB || 'Chưa phân loại';
        map[key] = (map[key] || 0) + 1;
        return map;
    }, {});

    const attendanceStatuses = ['Đi làm', 'Đi trễ', 'Nghỉ phép', 'OT', 'Nghỉ không phép'];
    const attendanceCounts = attendanceStatuses.reduce((map, status) => {
        map[status] = 0;
        return map;
    }, {});
    chamCongs.forEach(item => {
        if (item.TrangThai) {
            attendanceCounts[item.TrangThai] = (attendanceCounts[item.TrangThai] || 0) + 1;
        }
    });

    res.render('report', {
        user: req.session.user,
        menuItems: buildMenu(req.session.user, req.path),
        totalPayroll,
        totalReward,
        departmentCounts,
        attendanceCounts,
        totalEmployees: nhanViens.length
    });
});

app.get('/admin', checkLogin, allowRoles(['admin']), (req, res) => {
    res.render('admin', {
        user: req.session.user,
        menuItems: buildMenu(req.session.user, req.path)
    });
});

// --- LOGIC ĐĂNG NHẬP ---
// Hiện form đăng nhập
app.get('/login', (req, res) => {
    if (req.session.user) return res.redirect('/');
    const error = req.query.error === 'denied' ? 'Email này không được phép đăng nhập. Vui lòng dùng Gmail admin.' : null;
    res.render('login', { message: error });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.render('login', { message: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.' });
    }
    try {
        const user = await TaiKhoan.findOne({ TenDangNhap: username }).populate('NhanVien');
        if (!user || user.KichHoat === 0) {
            return res.render('login', { message: 'Sai tên đăng nhập hoặc mật khẩu.' });
        }

        let match = await bcrypt.compare(password, user.MatKhau || '');
        if (!match && user.MatKhau === password) {
            match = true;
            try {
                user.MatKhau = await bcrypt.hash(password, 10);
                await user.save();
            } catch (err) {
                console.error('Không thể cập nhật mật khẩu đã mã hóa:', err);
            }
        }

        if (!match) {
            return res.render('login', { message: 'Sai tên đăng nhập hoặc mật khẩu.' });
        }

        req.session.user = {
            id: user._id,
            TenDangNhap: user.TenDangNhap,
            QuyenHan: normalizeRole(user.QuyenHan),
            Email: user.Email,
            NhanVien: user.NhanVien,
            KichHoat: user.KichHoat
        };
        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send('Lỗi server');
    }
});

// --- LOGIC ĐĂNG XUẤT ---
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        res.redirect('/');
    });
});

// Lắng nghe port (Render cấp port trong process.env.PORT)
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running at http://127.0.0.1:${port}`);
});