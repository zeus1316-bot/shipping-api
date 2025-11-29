const express = require("express");
const fetch = require("node-fetch"); // npm install node-fetch
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

// 루트 라우트 (앱 정상 동작 확인용)
app.get("/", (req, res) => {
  res.send("카페24 배송비 커스터마이징 앱 서버 정상 동작 중!");
});

// 카페24 OAuth Redirect URI 처리 + 토큰 교환
app.get("/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).send("인증 코드가 전달되지 않았습니다.");
  }

  // 환경변수: MALL_ID, CAFE24_CLIENT_ID, CAFE24_CLIENT_SECRET 설정 필요
  const mallId = process.env.MALL_ID;
  const clientId = process.env.CAFE24_CLIENT_ID;
  const clientSecret = process.env.CAFE24_CLIENT_SECRET;
  const redirectUri = "https://shipping-api-opal.vercel.app/callback";

  if (!mallId || !clientId || !clientSecret) {
    return res
      .status(500)
      .send("환경변수(MALL_ID, CAFE24_CLIENT_ID, CAFE24_CLIENT_SECRET)가 없습니다.");
  }

  try {
    const tokenRes = await fetch(`https://${mallId}.cafe24api.com/api/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code
      }).toString()
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) {
      return res
        .status(tokenRes.status)
        .send(`토큰 교환 실패: ${JSON.stringify(tokenData)}`);
    }

    // 성공: 코드와 토큰 보여주기 (실서비스에선 저장/암호화 권장)
    res.send(
      `인증 코드: ${code}<br>` +
      `Access Token: ${tokenData.access_token}<br>` +
      `Refresh Token: ${tokenData.refresh_token}`
    );
  } catch (err) {
    res.status(500).send("토큰 교환 실패: " + err.message);
  }
});

// 배송비 계산 API 엔드포인트
app.post("/shipping-fee", (req, res) => {
  const { iceWeight = 0, parcelWeight = 0 } = req.body;
  const fee = calcIceFee(Number(iceWeight)) + calcParcelFee(Number(parcelWeight));
  res.json({ shippingFee: fee });
});

// Vercel 서버리스용 내보내기
module.exports = app;

// 로컬 실행용 (Vercel 환경에선 PORT 자동 관리)
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`🚀 Shipping API running on http://localhost:${port}`);
  });
}
