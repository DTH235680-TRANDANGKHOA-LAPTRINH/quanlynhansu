var mongoose = require('mongoose');

var chucVuSchema = new mongoose.Schema({
    TenCV: { type: String, required: true },
    HeSoPhuCap: { type: Number, default: 0 }
});

var chucVuModel = mongoose.model('ChucVu', chucVuSchema);
module.exports = chucVuModel;