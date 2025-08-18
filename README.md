# CAVS (Python MVP)

A Python-based prototype of a **Content Authenticity & Verification System (CAVS)**.

## Features
- Canonicalize files and metadata
- Compute SHA-256 content hash
- Sign with Ed25519
- Mock IPFS client (replace with nft.storage/web3.storage)
- Anchor content hashes to an EVM-compatible blockchain
- Simple FastAPI service for anchoring and verifying

## Quickstart
```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn cavs.api:app --reload

---

## 3. contracts/ContentAnchor.sol
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
