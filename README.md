# 🌌 AetherView: Unified Web3 Discovery Dashboard

**AetherView** is a premium, full-stack Web3 portfolio dashboard designed to provide a holistic view of any Ethereum wallet. Built for the Alchemy University Certification, it unifies ERC-20 token tracking and NFT gallery exploration into a single, high-performance interface.

![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Alchemy](https://img.shields.io/badge/Alchemy-SDK-blue?style=for-the-badge)
![Chakra](https://img.shields.io/badge/chakra-%234ED1C5.svg?style=for-the-badge&logo=chakraui&logoColor=white)

---

## 🚀 The Vision
**Problem**: Web3 users often struggle with "fragmented data," needing to visit multiple explorers and marketplaces just to see what they own.
**Solution**: R-etherView provides a "Single Source of Truth." By leveraging the **Alchemy SDK**, we fetch fungible tokens, non-fungible collectibles, and resolve complex ENS names in one unified request.

## ✨ Key Features
- **🎯 Unified Sync**: Fetches both ERC-20 balances and NFT metadata in parallel using `Promise.allSettled`.
- **🆔 ENS Resolution**: Full support for `.eth` names (e.g., `vitalik.eth`) with real-time resolution for a seamless UX.
- **📄 Export to CSV**: Professional-grade functionality allowing users to export their entire token portfolio for accounting or tracking.
- **💎 Glassmorphism UI**: A high-end, dark-mode-first design featuring background blurs, interactive gradients, and smooth `framer-motion` animations.
- **🖼️ Smart NFT Gallery**: Clickable NFT cards that link directly to OpenSea, featuring floor price detection and spam-verification help.

## 🛠️ Tech Stack
- **Frontend**: React (Vite)
- **Styling**: Chakra UI + Glassmorphism
- **Web3 Interface**: Alchemy SDK
- **Wallet Connection**: RainbowKit + Wagmi
- **Animations**: Framer Motion
- **Deployment**: Vercel

## ⚙️ Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Omotayo21/nft-indexer.git
   cd nft-indexer
   ```

2. **Install Dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   VITE_ALCHEMY_API_KEY=your_alchemy_api_key
   ```

4. **Run Locally**
   ```bash
   npm run dev
   ```

## 🎥 Certification Presentation
- **Problem Statement**: "Fragmented wallet visibility in Web3."
- **Creative Solution**: "Unified parallel indexing with professional CSV export capabilities."
- **Impact**: Provides a portfolio-ready asset that showcases both developer skill and user-centric design.

---

Built by [Omotayo](https://github.com/Omotayo21) as part of the Alchemy University Certification.
