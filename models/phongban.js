var mongoose = require('mongoose');

var phongBanSchema = new mongoose.Schema({
    TenPB: { type: String, required: true }
});

var phongBanModel = mongoose.model('PhongBan', phongBanSchema);
module.exports = phongBanModel;