
# 🛡️ Content Verification System (Blockchain + Web3 + MongoDB + Pinata IPFS Server)

A decentralized content verification system built with **Solidity, Remix, Ganache, MongoDB, Node.js/Express, and Vite + React**.
The system allows users to **verify content hashes on-chain** and query whether a piece of content has been previously verified.

---

## 📂 Project Structure

```
project-root/
│── backend/               # Node.js + Express server
│   ├── server.js          # Backend entry point
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   └── config/            # Mongo connection config
│
│── frontend/              # React + Vite client
│   ├── src/
│   │   ├── components/    # React components (Dashboard, Forms, etc.)
│   │   └── main.jsx       # React entry point
│   └── vite.config.js     # Vite config
│
│── VerificationSystem.sol    # Solidity Smart Contracts
|── .gitignore
│── .env                   # Environment variables
│── package.json
└── README.md
```

---

## ⚡ Smart Contract (Solidity)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract VerificationSystem {
    struct VerifiedItem {
        bytes32 contentHash;
        string ipfsCid; // store IPFS CID as string
        uint256 timestamp;
    }

    mapping(bytes32 => bool) private verifiedHashes;
    mapping(address => VerifiedItem[]) private userHistory;

    event ContentVerified(
        bytes32 indexed contentHash,
        string ipfsCid,
        address indexed verifier,
        uint256 timestamp
    );

    function verifyContent(bytes32 _contentHash, string memory _ipfsCid) public {
        require(!verifiedHashes[_contentHash], "Content already verified");
        verifiedHashes[_contentHash] = true;

        VerifiedItem memory item = VerifiedItem({
            contentHash: _contentHash,
            ipfsCid: _ipfsCid,
            timestamp: block.timestamp
        });

        userHistory[msg.sender].push(item);

        emit ContentVerified(_contentHash, _ipfsCid, msg.sender, block.timestamp);
    }

    function isVerified(bytes32 _contentHash) public view returns (bool) {
        return verifiedHashes[_contentHash];
    }

    function getUserHistory(address user) public view returns (VerifiedItem[] memory) {
        return userHistory[user];
    }
}

```

---

## ⚙️ Tech Stack

* **Frontend**: React (Vite) + TailwindCSS + Ethers.js
* **Backend**: Node.js + Express + MongoDB
* **Blockchain**: Solidity (Remix IDE + Ganache local blockchain)
* **Database**: MongoDB (for storing metadata & user interactions)

---

## 🔧 Setup & Installation

### 1️⃣ Clone Repo

```bash
git clone https://github.com/your-username/content-verification-system.git
cd content-verification-system
```

### 2️⃣ Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:

```
MONGO_URI=mongodb://localhost:27017/verification
PORT=5000
```

Run backend:

```bash
npm run dev
```

### 3️⃣ Smart Contract Deployment (Remix + Ganache)

1. Open **Remix IDE** in browser.
2. Copy `VerificationSystem.sol` into Remix.
3. Connect Remix to **Ganache** (local blockchain).
4. Deploy contract → copy the deployed contract **address** + **ABI**.

---

### 4️⃣ Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/`:

```
VITE_CONTRACT_ADDRESS=0xYourDeployedAddressHere
VITE_CONTRACT_ABI=[{"inputs":[{"internalType":"bytes32","name":"_contentHash","type":"bytes32"}], "name":"verifyContent", "outputs":[], "stateMutability":"nonpayable", "type":"function"}, {"inputs":[{"internalType":"bytes32","name":"_contentHash","type":"bytes32"}], "name":"isVerified","outputs":[{"internalType":"bool","name":"","type":"bool"}], "stateMutability":"view","type":"function"}]
```

Run frontend:

```bash
npm run dev
```

---

## 🚀 Usage

* Enter content → system hashes it (keccak256).
* Click **Verify** → transaction sent to Ganache via MetaMask.
* Verified hashes are stored on-chain.
* `isVerified` can be queried to check authenticity.
* Backend (MongoDB) logs metadata and requests.

---

## 🛠️ Future Enhancements

* ✅ Deploy on a public testnet (Goerli/Sepolia)
* ✅ Add JWT-based authentication
* ✅ Implement IPFS for content storage
* ✅ Create a dashboard for admins to monitor verification stats

---

## 📜 License

MIT License © 2025
