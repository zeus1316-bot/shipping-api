const express = require("express");
const app = express();
app.use(express.json());

// 아이스박스 배송비 계산
function calcIceFee(w) {
  if (w <= 0) return 0;
  if (w <= 10) return 3500;
  return 3500 + Math.ceil((w - 10) / 10) * 3500;
}

// 일반 택배 배송비 계산
function calcParcelFee(w) {
  if (w <= 0) return 0;
  if (w <= 13) return 3500;
  return 3500 + Math.ceil((w - 13) / 12) * 3500;
}

// API 엔드포인트
app.post("/shipping-fee", (req, res) => {
  const { iceWeight, parcelWeight } = req.body;
  const fee = calcIceFee(iceWeight) + calcParcelFee(parcelWeight);
  res.json({ shippingFee: fee });
});

// 서버 실행
app.listen(3000, () => {
  console.log("🚀 Shipping API running on http://localhost:3000");
});
