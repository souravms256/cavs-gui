# CAVS – Content Authenticity & Verification System

A **Python + Blockchain prototype** for authenticating and verifying digital content.
It ensures **integrity, ownership, and traceability** using cryptographic signatures, decentralized storage (IPFS), and blockchain anchoring.

---

## 🚀 Features

* 📂 Canonicalize files + metadata
* 🔒 Compute **SHA-256 content hash**
* ✍️ Sign with **Ed25519 cryptography**
* 🌐 Store metadata on **IPFS** (mock client → replace with `nft.storage` / `web3.storage`)
* ⛓️ Anchor hashes on **EVM-compatible blockchain** (Ethereum, Polygon, etc.)
* ⚡ REST API with **FastAPI** for anchoring & verification
* 🛡️ Content **revocation support**

---

## 🛠️ Project Structure

```
CAVS/
│── cavs/
│   ├── __init__.py
│   ├── api.py            # FastAPI endpoints
│   ├── anchor.py         # Blockchain anchoring logic
│   ├── ipfs_client.py    # Mock IPFS client
│   ├── signer.py         # Ed25519 signing + verification
│   └── utils.py          # Hashing + canonicalization
│
│── contracts/
│   └── ContentAnchor.sol  # Solidity smart contract
│
│── requirements.txt       # Python dependencies
│── README.md              # Documentation
```

---

## ⚡ Quickstart

### 1️⃣ Setup Environment

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2️⃣ Run FastAPI Service

```bash
uvicorn cavs.api:app --reload
```

Service will be live at 👉 [http://127.0.0.1:8000](http://127.0.0.1:8000)

---

## 📜 Smart Contract – `contracts/ContentAnchor.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ContentAnchor {
    struct Record {
        bytes32 contentHash;
        string metadataURI;
        address creator;
        uint256 timestamp;
        bool revoked;
    }

    mapping(bytes32 => Record) public records;

    event Anchored(bytes32 indexed contentHash, address indexed creator, string metadataURI, uint256 timestamp);
    event Revoked(bytes32 indexed contentHash, address indexed by, uint256 timestamp);

    function anchorContent(bytes32 contentHash, string calldata metadataURI) external {
        require(records[contentHash].timestamp == 0, "Already anchored");
        records[contentHash] = Record(contentHash, metadataURI, msg.sender, block.timestamp, false);
        emit Anchored(contentHash, msg.sender, metadataURI, block.timestamp);
    }

    function revokeContent(bytes32 contentHash) external {
        require(records[contentHash].timestamp != 0, "Not anchored");
        records[contentHash].revoked = true;
        emit Revoked(contentHash, msg.sender, block.timestamp);
    }

    function getRecord(bytes32 contentHash) external view returns (Record memory) {
        return records[contentHash];
    }
}
```

---

## 📡 API Endpoints

### `POST /anchor`

* Upload + sign + anchor content
* Example request:

```json
{
  "file_path": "docs/article.pdf",
  "metadata": { "author": "Alice", "title": "Blockchain Paper" }
}
```

### `GET /verify/{content_hash}`

* Verify hash → blockchain record + revocation status

---

## 🔮 Next Steps

* ✅ Replace mock IPFS with **real nft.storage / web3.storage**
* ✅ Deploy contract to **Ethereum / Polygon testnet**
* ✅ Add **frontend dashboard** for journalists & researchers
* ✅ Support **AI-generated content detection**

---

## 📌 Requirements (`requirements.txt`)

```
fastapi
uvicorn
pydantic
cryptography
web3
ipfshttpclient
```

---

## ✨ Use Cases

* Journalism – Prevent **fake news**
* Research – Validate **original scientific data**
* Media – Protect **creators’ rights**
* Governance – Ensure **document integrity**

---

👉 With this, you have a working **Python MVP + Smart Contract** ready to extend into production.

---

