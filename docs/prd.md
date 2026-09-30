# SplitPay Web PRD

## 1. Objective

Build the primary web application for SplitPay, a collaborative payment distribution platform built on Stellar.

The web application allows users to connect a Stellar wallet, create collaborative payment pools, configure members and split percentages, create payments, monitor distributions, and view on-chain activity.

The web application is a client of the SplitPay Soroban contract.

It must not become the financial source of truth.

---

# 2. Product Principle

SplitPay should make collaborative payments simple:

```text
Connect Wallet
      ↓
Create Pool
      ↓
Add Members
      ↓
Configure Splits
      ↓
Create Payment
      ↓
Fund Payment
      ↓
Soroban Contract
      ↓
Automatic Distribution
```

The user should always be able to understand:

* where money came from
* where it went
* who received what
* which transaction performed the action

---

# 3. Technology

Use:

* Next.js
* React
* TypeScript
* Tailwind CSS
* shadcn/ui where useful
* Stellar JavaScript SDK
* Stellar wallet integration appropriate for the current Stellar ecosystem
* Stellar RPC
* Soroban contract interaction

Use the current versions and current Stellar documentation.

Do not introduce Paystack into the new frontend.

Do not preserve old payment infrastructure merely for compatibility.

---

# 4. Wallet

Wallet connection is the primary authentication mechanism for blockchain functionality.

The application should support connecting a compatible Stellar wallet.

The UI should clearly display:

```text
Connected wallet
Wallet address
Network
Relevant balances
```

Wallet state should be handled cleanly.

The application must distinguish:

```text
Wallet not connected
Wallet connected
Transaction awaiting approval
Transaction submitted
Transaction confirmed
Transaction failed
```

Never expose or request private keys.

---

# 5. Application Structure

The application should contain:

```text
/
├── Landing
│
├── Dashboard
│
├── Pools
│   ├── Create Pool
│   ├── Pool Details
│   └── Manage Pool
│
├── Payments
│   ├── Create Payment
│   ├── Payment Details
│   └── Payment History
│
├── Wallet
│
└── Settings
```

---

# 6. Landing Page

The landing page should explain SplitPay simply.

Primary message:

> Collaborative payments without the manual splitting.

Explain:

* create a pool
* configure contributors
* receive payment
* automatically distribute funds

Show a clear wallet connection CTA.

Avoid excessive marketing sections.

The landing page should feel like a serious financial application, not a crypto meme product.

---

# 7. Dashboard

The dashboard should provide a concise overview.

Display:

* connected wallet
* total relevant balance
* active pools
* recent payments
* recent distributions
* pending transactions

The dashboard should prioritize useful financial information.

Avoid fake statistics.

Do not display placeholder financial numbers as if they are real.

---

# 8. Pools

Users should be able to:

* create pools
* view pools
* inspect pool members
* configure shares
* view pool status
* view pool asset
* view pool activity

A pool card should communicate:

```text
Pool name
Pool ID
Asset
Members
Status
Created date
```

---

# 9. Create Pool

Create Pool should collect:

```text
Pool name
Asset
Initial members
```

The pool name is application metadata and may remain off-chain.

The contract should receive only the data required for the on-chain pool.

After submission:

```text
User confirms wallet transaction
        ↓
Transaction submitted
        ↓
Transaction confirmed
        ↓
Pool appears in dashboard
```

---

# 10. Pool Details

Pool details should show:

```text
Pool name
Pool ID
Owner
Asset
Status
Members
Split percentages
Total distributed
Payment count
Recent activity
```

Members should display:

```text
Wallet
Share
```

Example:

```text
Alice...8F2A       60%
Bob...92BC         40%
```

---

# 11. Member Management

The owner should be able to:

* add member
* remove member
* update member share

The UI must clearly show whether the current split is valid.

Example:

```text
Alice      60%
Bob        30%
Charlie     5%

Total: 95%

Pool cannot accept payments.
```

Once:

```text
Total: 100%
```

the configuration becomes valid.

Do not rely solely on frontend validation.

The contract remains authoritative.

---

# 12. Payment Creation

Users should be able to create a payment for a pool.

Fields:

```text
Pool
Amount
Payment reference/title
```

The payment reference/title can remain off-chain metadata.

The amount and pool must correspond to the contract transaction.

Before confirmation, show a preview:

```text
Payment
100 USDC

Alice     60 USDC
Bob       40 USDC
```

The displayed calculation should match the contract's calculation.

The contract remains authoritative.

---

# 13. Payment Funding

The payment flow should make the blockchain transaction understandable.

Example:

```text
Review Payment
      ↓
Confirm in Wallet
      ↓
Submitting
      ↓
Confirming on Stellar
      ↓
Payment Settled
```

After confirmation, show:

```text
Amount
Asset
Pool
Transaction
Distribution
Recipients
```

Provide a Stellar explorer link where appropriate.

---

# 14. Payment History

Payment history should show:

```text
Payment
Pool
Amount
Asset
Status
Date
Transaction
```

Statuses may include:

```text
Pending
Confirmed
Failed
```

Do not invent confirmed states before the transaction is actually confirmed.

---

# 15. Distribution View

Each settled payment should expose its distribution.

Example:

```text
100 USDC

Alice
60 USDC
60%

Bob
40 USDC
40%
```

The UI should make it obvious that the distribution came from the SplitPay contract.

---

# 16. Wallet Page

The wallet page should show relevant Stellar assets.

At minimum:

```text
Wallet address
Network
XLM balance
Supported SplitPay asset balance
Recent transactions
```

Do not attempt to build a full wallet application.

The connected external wallet remains responsible for signing transactions.

---

# 17. Transaction UX

Every blockchain transaction must provide clear state feedback.

States:

```text
Ready
Awaiting wallet
Signing
Submitted
Confirming
Confirmed
Failed
```

The user should never be left wondering whether money moved.

Failed transactions must show an understandable error and allow retry where appropriate.

---

# 18. Network

Development should use Stellar Testnet.

The application must clearly indicate the active network during development.

Network configuration should be environment-based.

Do not hard-code production contract addresses.

Expected configuration includes:

```text
NEXT_PUBLIC_STELLAR_NETWORK
NEXT_PUBLIC_STELLAR_RPC_URL
NEXT_PUBLIC_SPLITPAY_CONTRACT_ID
NEXT_PUBLIC_EXPLORER_URL
```

Exact environment variable names may change if the implementation has a strong reason.

---

# 19. Contract Integration

The web application must interact with the deployed SplitPay contract.

The contract is authoritative for:

* pool state
* member state
* shares
* payment state
* settlement
* distributions

The frontend must not implement an alternative financial ledger.

Do not create:

```text
Frontend balance
Frontend split ledger
Frontend settlement database
```

as substitutes for blockchain state.

---

# 20. Off-Chain Metadata

Some information may require an application database later.

Examples:

```text
Pool display name
Payment title
User profile
Avatar
Notifications
Search indexes
```

If an API/database is introduced, it must not contradict on-chain financial state.

For V1, avoid adding a backend unless required.

Prefer getting the first complete flow working directly against Stellar.

---

# 21. UI Principles

The interface should be:

* clean
* technical
* trustworthy
* responsive
* fast
* minimal
* accessible

Avoid:

* excessive gradients
* excessive glass effects
* unnecessary animations
* crypto clichés
* fake financial dashboards
* fake charts
* excessive cards
* unnecessary modals

The application should feel closer to a modern financial/developer product than a typical crypto landing page.

---

# 22. Responsive Design

The application must work on:

* desktop
* tablet
* mobile browsers

Important financial information must remain readable on narrow screens.

Tables should transform appropriately rather than overflow.

---

# 23. Error Handling

Handle:

* wallet rejected
* insufficient balance
* wrong network
* contract error
* RPC failure
* transaction timeout
* transaction failure
* invalid pool
* invalid split
* unsupported asset
* unavailable contract
* disconnected wallet

Errors should be translated into useful user-facing messages.

Do not expose raw RPC errors unless useful for debugging.

---

# 24. Security

Never:

* request private keys
* store private keys
* store wallet secrets
* trust frontend calculations
* trust frontend authorization
* assume transaction success before confirmation

All financial actions must ultimately be validated by the contract.

---

# 25. Testing

Test:

### UI

* wallet disconnected
* wallet connected
* responsive layouts
* empty states
* loading states
* error states

### Contract integration

* create pool
* add member
* update share
* remove member
* create payment
* settle payment
* retrieve payment
* retrieve distribution

### Transaction states

* wallet rejection
* pending transaction
* confirmed transaction
* failed transaction

---

# 26. V1 Scope

V1 must support:

```text
Wallet connection
Dashboard
Create pool
Pool details
Member management
Share configuration
Create payment
Fund payment
Payment settlement
Distribution view
Transaction history
Wallet balances
Testnet support
```

---

# 27. V1 Non-Goals

Do not implement:

* fiat payments
* Paystack
* bank withdrawals
* custom SplitPay token
* multi-chain support
* recurring payments
* advanced analytics
* DAO governance
* lending
* yield
* social features
* complex notification systems

These belong to future versions.

---

# 28. Definition of Done

The web application is complete when a user can:

```text
Connect wallet
    ↓
Create a pool
    ↓
Add another wallet
    ↓
Configure 60/40 split
    ↓
Create payment
    ↓
Confirm transaction
    ↓
Contract settles payment
    ↓
View distribution
    ↓
View transaction
```

The entire flow must work on Stellar Testnet using real transactions.

No fake data should be required for the core flow.
