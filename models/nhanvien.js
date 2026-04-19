var mongoose = require('mongoose');

var nhanVienSchema = new mongoose.Schema({
    TenNV: { type: String, required: true },
    NgaySinh: { type: Date }, // Ngày sinh đầy đủ
    GioiTinh: { type: String },
    DiaChi: { type: String },
    DienThoai: { type: String, match: /^[0-9]{10}$/ }, // Chỉ số, max 10
    Gmail: { type: String, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }, // Email validation
    PhongBan: { type: mongoose.Schema.Types.ObjectId, ref: 'PhongBan' },
    ChucVu: { type: mongoose.Schema.Types.ObjectId, ref: 'ChucVu' },
    SoNguoiPhuThuoc: { type: Number, default: 0 },
    TrangThai: { type: String },
    HinhAnh: { type: String, default: '' }, // Thêm ảnh thẻ
    
    // File lưu trữ cục bộ / link nội bộ
    CV_FileId: { type: String, default: '' },
    CV_Link: { type: String, default: '' }, // Link xem CV
    AnhDaiDien_FileId: { type: String, default: '' },
    AnhDaiDien: { type: String, default: '' } // Link ảnh đại diện
});

var nhanVienModel = mongoose.model('NhanVien', nhanVienSchema);
module.exports = nhanVienModel;