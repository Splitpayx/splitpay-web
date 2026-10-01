# SplitPay

> Automated, trustless collaborative payment distribution powered by Stellar and Soroban smart contracts.

[![GitHub](https://img.shields.io/badge/GitHub-Splitpayx-24292e?style=flat&logo=github)](https://github.com/Splitpayx)
[![Next.js](https://img.shields.io/badge/Next.js-16.3.5-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Stellar](https://img.shields.io/badge/Stellar-Testnet-black?style=flat&logo=stellar)](https://stellar.org/)
[![Soroban](https://img.shields.io/badge/Soroban-Smart_Contract-purple?style=flat)](https://soroban.stellar.org/)
[![Vitest](https://img.shields.io/badge/Vitest-Passing-brightgreen?style=flat&logo=vitest)](https://vitest.dev/)

**GitHub Organisation:** [github.com/Splitpayx](https://github.com/Splitpayx)

| Repository | Description |
|---|---|
| [splitpay-web](https://github.com/Splitpayx/splitpay-web) ← *this repo* | Primary web application (Next.js) |
| [splitpay-contract](https://github.com/Splitpayx/splitpay-contract) | Soroban smart contract — on-chain pool & distribution logic |
| [splitpay-mobile](https://github.com/Splitpayx/splitpay-mobile) | React Native mobile application |
| [splitpay-sdk](https://github.com/Splitpayx/splitpay-sdk) | Shared client SDK |

---

## ⚡ Overview

**SplitPay** is a non-custodial decentralized application (dApp) built on **Stellar** that enables automated, mathematically verified split payments among collaborators, agencies, DAOs, and freelancers. 

Unlike traditional platforms relying on centralized payment processors or custodial escrow accounts, SplitPay uses **Soroban smart contracts as the sole financial and organizational authority**. Incoming funds are atomically transferred and distributed to verified recipient addresses in a single blockchain transaction.

---

## 🔑 Core Features

- **Decentralized Pools**: Create and manage customizable payment pools with multi-party splits verified on-chain.
- **Strict Basis Points (BPS) Accounting**: All member allocations are specified in basis points ($10,000\text{ BPS} = 100.00\%$). The smart contract strictly enforces that the sum of shares must equal exactly 10,000 BPS before any pool can be deployed or updated.
- **Deterministic Remainder Policy**: For odd amounts where integer division leaves remainder stroops, SplitPay applies an exact zero-loss policy—assigning remainder units to the primary pool recipient (index `0`).
- **Non-Custodial Wallet Integration**: Native support for **Freighter Wallet** browser extension alongside instant **Testnet Dev Keypairs** with on-demand **Friendbot** funding.
- **Atomic Two-Step Settlement Engine**: Payments are recorded on-chain (`create_payment`) and atomically executed (`settle_payment`) with real-time transaction lifecycle tracking modals.
- **Stellar Asset Contract (SAC) Support**: Configurable with native XLM SAC or any custom SAC token contract on Stellar Testnet.
- **Production-Grade Next.js Architecture**: Single full-stack Next.js application utilizing the App Router, Tailwind CSS, Lucide icons, and zero legacy backend dependencies.

---

## 🏗️ Architecture

```text
SplitPay Web App (Next.js 16 App Router)
├── /dashboard              - Overview of pools, activity, and Stellar balance
├── /pools                  - List, search, and monitor active pools
│   ├── /new                - Interactive pool creator with live 10,000 BPS validator
│   ├── /[id]               - Detailed pool inspect with on-chain shares & explorer links
│   └── /[id]/settings      - Admin pool controls (add/remove member, shares, status)
├── /payments               - Historical transaction logs & distribution records
│   ├── /new                - Payment initiator with live split preview calculator
│   └── /[id]               - Immutable settlement details & per-member receipt
├── /wallet                 - Balance inspector, key export, and Friendbot funding
└── /settings               - RPC endpoints, network configuration, and contract targets

Blockchain Integration Layer
├── lib/stellar/rpc.ts      - Horizon RPC queries & Soroban transaction polling
├── lib/contract/splitpay.ts- Typed client for all 13 Soroban smart contract methods
├── lib/wallet/             - WalletContext with Freighter & Dev Keypair signing
└── lib/validation/         - 10,000 BPS integrity rules & Stellar address validators
```

---

## 📜 Soroban Smart Contract Reference

SplitPay connects to an immutable Soroban smart contract deployed on the Stellar Testnet:

| Parameter | Value |
| :--- | :--- |
| **Network** | Stellar Testnet |
| **RPC Endpoint** | `https://soroban-testnet.stellar.org` |
| **Horizon RPC** | `https://horizon-testnet.stellar.org` |
| **Contract ID** | `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC` |
| **Native XLM SAC** | `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC` |
| **Network Passphrase** | `Test SDF Network ; September 2015` |

### Supported Contract Methods
1. `create_pool(owner, asset, members)`
2. `get_pool(pool_id)`
3. `get_pool_members(pool_id)`
4. `add_member(owner, pool_id, member, share_bps)`
5. `remove_member(owner, pool_id, member)`
6. `update_member_share(owner, pool_id, member, new_share_bps)`
7. `set_pool_status(owner, pool_id, status)`
8. `create_payment(payer, pool_id, amount)`
9. `settle_payment(caller, payment_id)`
10. `get_payment(payment_id)`
11. `get_distributions(payment_id)`
12. `get_payment_count()`
13. `get_pool_count()`

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18.18 or higher (v20+ recommended)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)
- [Freighter Wallet](https://www.freighter.app/) extension (optional, dev keypairs supported out of the box)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Splitpayx/splitpay-web.git
   cd splitpay-web
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_STELLAR_NETWORK=TESTNET
   NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
   NEXT_PUBLIC_STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
   NEXT_PUBLIC_SPLITPAY_CONTRACT_ID=CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC
   NEXT_PUBLIC_NATIVE_ASSET_CONTRACT=CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC
   ```

4. **Start the local development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Verification

The suite includes unit tests for the 10,000 basis points rule, integer division remainder policies, and address formatting:

```bash
# Run unit tests via Vitest
npm test

# Run Next.js production build
npm run build
```

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Blockchain SDK**: [@stellar/stellar-sdk](https://www.npmjs.com/package/@stellar/stellar-sdk)
- **Wallet Provider**: [@stellar/freighter-api](https://www.npmjs.com/package/@stellar/freighter-api)
- **Unit Testing**: [Vitest](https://vitest.dev/)

---

## 👤 Author

- **SAMKIEL** — [@samkiell](https://github.com/samkiell) | [hello@samkiel.dev](mailto:hello@samkiel.dev)

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
