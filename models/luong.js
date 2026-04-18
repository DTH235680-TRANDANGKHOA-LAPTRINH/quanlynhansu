var mongoose = require('mongoose');

var luongSchema = new mongoose.Schema({

    NhanVien: { type: mongoose.Schema.Types.ObjectId, ref: 'NhanVien' },
    Thang: { type: Number, required: true },
    Nam: { type: Number, required: true },
    LuongCoBan: { type: Number, required: true },
    
    PhuCapChucVu: { type: Number, default: 0 },
    PhuCapKhuVuc: { type: Number, default: 0 },
    LuongOT: { type: Number, default: 0 },
    ThuongKPI: { type: Number, default: 0 },
    ThuongChuyenCan: { type: Number, default: 0 },
    PhuCapAnTrua: { type: Number, default: 0 },
    TroCapPhucLoi: { type: Number, default: 0 },
    
    // Các khoản bảo hiểm và khấu trừ (Nên dùng Node.js tính rồi lưu vào)
    BHXH: { type: Number, default: 0 },
    BHYT: { type: Number, default: 0 },
    BHTN: { type: Number, default: 0 },
    ThueTNCN: { type: Number, default: 0 },
    GiamTruKhac: { type: Number, default: 0 },
    
    // Tổng kết
    TongThuNhap: { type: Number, default: 0 },
    TongKhauTru: { type: Number, default: 0 },
    LuongThucLinh: { type: Number, default: 0 }
});

const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON));

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

    return roundMoney(tax);
};

const recalcPayroll = (doc) => {
    doc.BHXH = roundMoney(doc.LuongCoBan * 0.08);
    doc.BHYT = roundMoney(doc.LuongCoBan * 0.015);
    doc.BHTN = roundMoney(doc.LuongCoBan * 0.01);
    doc.TongThuNhap = roundMoney(
        doc.LuongCoBan + doc.PhuCapChucVu + doc.PhuCapKhuVuc + doc.LuongOT + doc.ThuongKPI + doc.ThuongChuyenCan + doc.PhuCapAnTrua + doc.TroCapPhucLoi
    );
    const gross = doc.TongThuNhap;
    const social = doc.BHXH + doc.BHYT + doc.BHTN;
    doc.ThueTNCN = calculatePersonalIncomeTax(gross, social);
    doc.TongKhauTru = roundMoney(doc.BHXH + doc.BHYT + doc.BHTN + doc.ThueTNCN + doc.GiamTruKhac);
    doc.LuongThucLinh = roundMoney(doc.TongThuNhap - doc.TongKhauTru);
};

// Bạn có thể thiết lập middleware pre-save để tự tính bảo hiểm như SQL
luongSchema.pre('save', function() {
    recalcPayroll(this);
});

luongSchema.pre('findOneAndUpdate', function() {
    const update = this.getUpdate() || {};
    const payload = update.$set ? update.$set : update;

    const newData = {
        LuongCoBan: Number(payload.LuongCoBan || 0),
        PhuCapChucVu: Number(payload.PhuCapChucVu || 0),
        PhuCapKhuVuc: Number(payload.PhuCapKhuVuc || 0),
        LuongOT: Number(payload.LuongOT || 0),
        ThuongKPI: Number(payload.ThuongKPI || 0),
        ThuongChuyenCan: Number(payload.ThuongChuyenCan || 0),
        PhuCapAnTrua: Number(payload.PhuCapAnTrua || 0),
        TroCapPhucLoi: Number(payload.TroCapPhucLoi || 0),
        ThueTNCN: Number(payload.ThueTNCN || 0),
        GiamTruKhac: Number(payload.GiamTruKhac || 0)
    };

    const computed = {
        BHXH: roundMoney(newData.LuongCoBan * 0.08),
        BHYT: roundMoney(newData.LuongCoBan * 0.015),
        BHTN: roundMoney(newData.LuongCoBan * 0.01),
        TongThuNhap: roundMoney(
            newData.LuongCoBan + newData.PhuCapChucVu + newData.PhuCapKhuVuc + newData.LuongOT + newData.ThuongKPI + newData.ThuongChuyenCan + newData.PhuCapAnTrua + newData.TroCapPhucLoi
        )
    };
    const gross = computed.TongThuNhap;
    const social = computed.BHXH + computed.BHYT + computed.BHTN;
    computed.ThueTNCN = calculatePersonalIncomeTax(gross, social);
    computed.TongKhauTru = roundMoney(
        computed.BHXH + computed.BHYT + computed.BHTN + computed.ThueTNCN + newData.GiamTruKhac
    );
    computed.LuongThucLinh = roundMoney(computed.TongThuNhap - computed.TongKhauTru);

    if (update.$set) {
        Object.assign(update.$set, computed);
    } else {
        Object.assign(update, computed);
    }
});

var luongModel = mongoose.model('Luong', luongSchema);
module.exports = luongModel;