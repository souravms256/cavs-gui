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
