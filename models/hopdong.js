var mongoose = require('mongoose');

var hopDongSchema = new mongoose.Schema({
    NhanVien: { type: mongoose.Schema.Types.ObjectId, ref: 'NhanVien' },
    LoaiHD: { type: String },
    NgayBatDau: { type: Date },
    NgayKetThuc: { type: Date },
    LuongThoaThuan: { type: Number }
});

var hopDongModel = mongoose.model('HopDong', hopDongSchema);
module.exports = hopDongModel;