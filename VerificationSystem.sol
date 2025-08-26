// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract VerificationSystem {
    mapping(bytes32 => bool) private verifiedHashes;

    event ContentVerified(bytes32 indexed contentHash, address indexed verifier);

    function verifyContent(bytes32 _contentHash) public {
        require(!verifiedHashes[_contentHash], "Content already verified");
        verifiedHashes[_contentHash] = true;
        emit ContentVerified(_contentHash, msg.sender);
    }

    function isVerified(bytes32 _contentHash) public view returns (bool) {
        return verifiedHashes[_contentHash];
    }
}