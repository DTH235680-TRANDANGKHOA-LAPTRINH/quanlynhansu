var mongoose = require('mongoose');

var chamCongSchema = new mongoose.Schema({
    NhanVien: { type: mongoose.Schema.Types.ObjectId, ref: 'NhanVien', required: true },
    Ngay: { type: Date, required: true },
    TrangThai: { type: String, enum: ['Đi làm', 'Đi trễ', 'Nghỉ phép', 'Tăng ca', 'OT', 'Nghỉ không phép'], default: 'Đi làm' },
    GioVao: { type: String },
    GioRa: { type: String },
    DiaDiem: { type: String },
    GhiChu: { type: String }
});

var chamCongModel = mongoose.model('ChamCong', chamCongSchema);
module.exports = chamCongModel;
