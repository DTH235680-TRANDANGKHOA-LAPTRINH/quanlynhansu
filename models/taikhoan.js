var mongoose = require('mongoose');

var taiKhoanSchema = new mongoose.Schema({
    TenDangNhap: { type: String, unique: true, required: true },
    MatKhau: { type: String, required: true },
    MatKhauPlain: { type: String },
    Email: { type: String },
    QuyenHan: { type: String, default: 'nhanvien' }, // admin, hr, ketoan hoặc nhanvien
    KichHoat: { type: Number, default: 1 },
    // Liên kết với bảng Nhân Viên để biết tài khoản này của ai
    NhanVien: { type: mongoose.Schema.Types.ObjectId, ref: 'NhanVien' }
});

var taiKhoanModel = mongoose.model('TaiKhoan', taiKhoanSchema);
module.exports = taiKhoanModel;