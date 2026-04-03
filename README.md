# 🛡️ DeepShield FinOps

> **An Intent-Aware Financial Firewall for Autonomous AI Agents.** > Built for the **OSSome Hacks 3.0** "Claw & Shield" Track.

## 🚀 The Problem
As autonomous AI agents gain access to live financial APIs, they become vulnerable to prompt injection, deepfake news, and hallucinations. A single hallucinated ticker or a trade executed on fake Twitter news can wipe out an account in seconds. 

## 💡 Our Solution
**DeepShield FinOps** is a multi-agent MERN stack application that acts as a deterministic guardrail between an AI's "brain" and a live financial market. 

We utilize an **OpenClaw Multi-Agent Pipeline** to process financial news, but before any trade hits our live **Alpaca Trading Broker**, it is physically intercepted by our **ArmorClaw Middleware**. ArmorClaw mathematically guarantees that no trade executes unless it passes strict, hardcoded security rules.

### ✨ Key Features
1. **Multi-Agent Reasoning:** Specialized OpenClaw agents for Ingestion and Verification.
2. **ArmorClaw Guardrails:** Hardcoded Express.js middleware that intercepts AI intent payloads and checks for:
   * **Cryptographic Provenance:** Rejects news sourced from social media or blogs; requires verified `sec.gov` links.
   * **Asset Whitelisting:** Prevents the AI from hallucinating or trading unauthorized assets (e.g., Meme-coins).
   * **Blast Radius Limits:** Blocks trades that exceed maximum risk tolerance.
3. **Live Execution:** Fully integrated with the Alpaca Paper Trading API.
4. **Real-Time Audit Dashboard:** A React frontend featuring micro-interactions and real-time MongoDB polling to visualize the AI's pipeline and intercepted attacks.

---

## 🛠️ Tech Stack
* **Frontend:** React, Tailwind CSS, Vite
* **Backend:** Node.js, Express
* **Database:** MongoDB Atlas
* **AI & Integration:** OpenClaw SDK, Alpaca Trade API
* **Deployment:** Vercel (Serverless Functions)

---

## 💻 Local Setup Instructions

### Prerequisites
* Node.js (v18+)
* A MongoDB cluster (or local instance)
* An Alpaca Paper Trading Account & API Keys
* An OpenAI API Key (for OpenClaw agents)

### 1. Clone the Repository
```bash
git clone [https://github.com/Krish30p/deepshield-finops.git](https://github.com/Krish30p/deepshield-finops.git)
cd deepshield-finops
