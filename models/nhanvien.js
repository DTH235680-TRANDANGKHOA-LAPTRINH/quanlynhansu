var mongoose = require('mongoose');

var nhanVienSchema = new mongoose.Schema({
    TenNV: { type: String, required: true },
    NgaySinh: { type: Date },
    GioiTinh: { type: String },
    DiaChi: { type: String },
    DienThoai: { type: String },
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