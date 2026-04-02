import dotenv from "dotenv";
dotenv.config();

const k = process.env.NVIDIA_API_KEY || process.env.OPENAI_API_KEY;

if (!k) {
  console.log('NVIDIA_API_KEY not found in .env');
  process.exit(1);
} else {
  console.log('NVIDIA_API_KEY found, length:', k.length);
}

// Ping the NVIDIA NIM compatibilty endpoint
fetch('https://integrate.api.nvidia.com/v1/models', {
  headers: { 'Authorization': 'Bearer ' + k }
}).then(res => {
  if (res.ok) {
    console.log('✅ NVIDIA NIM API Key is VALID and working!');
  } else {
    console.log('❌ NVIDIA NIM API Key is INVALID (Status: ' + res.status + ')');
  }
}).catch(err => {
  console.error("Fetch Error:", err);
});
