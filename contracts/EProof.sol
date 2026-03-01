// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * EProof — on-chain document hash registry
 *
 * Stores SHA-256 hashes of documents. Once registered, a hash is permanent
 * and tamper-proof. Anyone can verify whether a document existed at a given time.
 */
contract EProof {
    struct DocumentRecord {
        address owner;      // wallet that registered the document
        uint256 timestamp;  // block timestamp at registration
        bool exists;
    }

    // fileHash (hex string) => record
    mapping(string => DocumentRecord) private records;

    event DocumentRegistered(
        string indexed fileHash,
        address indexed owner,
        uint256 timestamp
    );

    /**
     * Register a document hash on-chain.
     * Reverts if the hash was already registered (deduplication).
     */
    function registerDocument(string calldata fileHash) external {
        require(!records[fileHash].exists, "EProof: hash already registered");
        records[fileHash] = DocumentRecord({
            owner: msg.sender,
            timestamp: block.timestamp,
            exists: true
        });
        emit DocumentRegistered(fileHash, msg.sender, block.timestamp);
    }

    /**
     * Verify whether a hash exists on-chain.
     * Returns (exists, timestamp, owner).
     */
    function verifyDocument(string calldata fileHash)
        external
        view
        returns (bool exists, uint256 timestamp, address owner)
    {
        DocumentRecord memory rec = records[fileHash];
        return (rec.exists, rec.timestamp, rec.owner);
    }
}
