import dotenv from "dotenv";
dotenv.config();

const keyId = process.env.ALPACA_API_KEY;
const secretKey = process.env.ALPACA_API_SECRET || process.env.ALPACA_SECRET_KEY;

if (!keyId || !secretKey) {
  console.log("ALPACA_API_KEY or ALPACA_API_SECRET not found in .env");
  process.exit(1);
} else {
  console.log("Alpaca keys found. Testing connection...");
}

fetch('https://paper-api.alpaca.markets/v2/account', {
  headers: {
    'APCA-API-KEY-ID': keyId,
    'APCA-API-SECRET-KEY': secretKey
  }
}).then(async res => {
  if (res.ok) {
    const data = await res.json();
    console.log('✅ Alpaca Paper API keys are VALID and working!');
    console.log(`Account Status: ${data.status}, Buying Power: $${data.buying_power}`);
  } else {
    const err = await res.text();
    console.log('❌ Alpaca API keys are INVALID (Status: ' + res.status + ')');
    console.log('Error Details:', err);
  }
}).catch(err => {
  console.error("Fetch Error:", err);
});
