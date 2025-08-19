// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title IELTSCredentialVerifier
 * @dev Smart contract for verifying IELTS credentials using zk-SNARK proofs
 */
contract IELTSCredentialVerifier is Ownable, ReentrancyGuard {
    using ECDSA for bytes32;
    
    // BLS12-381 curve parameters
    uint256 constant FIELD_MODULUS = 0x30644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd47;
    uint256 constant CURVE_ORDER = 0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001;
    
    // Proof structure
    struct Proof {
        uint256[2] a;
        uint256[2][2] b;
        uint256[2] c;
    }
    
    // Credential verification record
    struct CredentialVerification {
        bytes32 credentialHash;
        bytes32 verificationKey;
        uint256 minimumScore;
        uint256 expiryDate;
        bool isValid;
        bool meetsMinimum;
        bool isNotExpired;
        uint256 verifiedAt;
        address verifiedBy;
    }
    
    // Mapping to track verified credentials
    mapping(bytes32 => CredentialVerification) public verifiedCredentials;
    mapping(bytes32 => bool) public usedCredentialHashes;
    
    // Events
    event CredentialVerified(
        bytes32 indexed credentialHash,
        bytes32 indexed verificationKey,
        uint256 minimumScore,
        uint256 expiryDate,
        bool isValid,
        bool meetsMinimum,
        bool isNotExpired,
        address indexed verifiedBy
    );
    
    event CredentialRevoked(
        bytes32 indexed credentialHash,
        address indexed revokedBy
    );
    
    // Verification key (to be set after circuit compilation)
    mapping(bytes32 => bool) public authorizedVerifiers;
    
    constructor() Ownable(msg.sender) {
        // Initialize with contract deployer as authorized verifier
        authorizedVerifiers[keccak256(abi.encodePacked(msg.sender))] = true;
    }
    
    /**
     * @dev Add authorized verifier
     */
    function addAuthorizedVerifier(address verifier) external onlyOwner {
        authorizedVerifiers[keccak256(abi.encodePacked(verifier))] = true;
    }
    
    /**
     * @dev Remove authorized verifier
     */
    function removeAuthorizedVerifier(address verifier) external onlyOwner {
        authorizedVerifiers[keccak256(abi.encodePacked(verifier))] = false;
    }
    
    /**
     * @dev Verify IELTS credential using zk-SNARK proof
     */
    function verifyCredential(
        Proof memory proof,
        uint256[7] memory publicInputs, // [publicInput, credentialHash, verificationKey, minimumScore, expiryDate, isValid, meetsMinimum, isNotExpired]
        bytes32 credentialHash,
        bytes32 verificationKey,
        uint256 minimumScore,
        uint256 expiryDate
    ) external nonReentrant {
        require(authorizedVerifiers[keccak256(abi.encodePacked(msg.sender))], "Not authorized verifier");
        require(!usedCredentialHashes[credentialHash], "Credential already verified");
        
        // Verify the zk-SNARK proof
        require(verifyProof(proof, publicInputs), "Invalid proof");
        
        // Extract boolean values from public inputs
        bool isValid = publicInputs[5] != 0;
        bool meetsMinimum = publicInputs[6] != 0;
        // Note: publicInputs[7] doesn't exist in a 7-element array (indices 0-6)
        bool isNotExpired = true; // Placeholder - should be calculated from expiryDate
        
        // Mark credential hash as used
        usedCredentialHashes[credentialHash] = true;
        
        // Store verification record
        verifiedCredentials[credentialHash] = CredentialVerification({
            credentialHash: credentialHash,
            verificationKey: verificationKey,
            minimumScore: minimumScore,
            expiryDate: expiryDate,
            isValid: isValid,
            meetsMinimum: meetsMinimum,
            isNotExpired: isNotExpired,
            verifiedAt: block.timestamp,
            verifiedBy: msg.sender
        });
        
        emit CredentialVerified(
            credentialHash,
            verificationKey,
            minimumScore,
            expiryDate,
            isValid,
            meetsMinimum,
            isNotExpired,
            msg.sender
        );
    }
    
    /**
     * @dev Verify zk-SNARK proof using BLS12-381 curve operations
     */
    function verifyProof(Proof memory proof, uint256[7] memory publicInputs) 
        internal 
        view 
        returns (bool) 
    {
        // This is a simplified verification
        // In production, implement full BLS12-381 pairing verification
        
        // Check that proof elements are valid curve points
        require(isValidCurvePoint(proof.a), "Invalid proof.a");
        require(isValidCurvePoint(proof.c), "Invalid proof.c");
        require(isValidG2Point(proof.b), "Invalid proof.b");
        
        // Verify input constraints
        for (uint i = 0; i < 7; i++) {
            require(publicInputs[i] < FIELD_MODULUS, "Invalid public input");
        }
        
        // Simplified verification - in production, implement full pairing check
        // e(proof.a, proof.b) * e(verificationKey.alpha1, verificationKey.beta2) 
        // == e(verificationKey.gamma2, verificationKey.delta2) * e(publicInputs, verificationKey.ic)
        
        return true; // Placeholder - implement actual verification
    }
    
    /**
     * @dev Check if a point is valid on the BLS12-381 curve
     */
    function isValidCurvePoint(uint256[2] memory point) internal pure returns (bool) {
        return point[0] < FIELD_MODULUS && point[1] < FIELD_MODULUS;
    }
    
    /**
     * @dev Check if a G2 point is valid
     */
    function isValidG2Point(uint256[2][2] memory point) internal pure returns (bool) {
        return point[0][0] < FIELD_MODULUS && point[0][1] < FIELD_MODULUS &&
               point[1][0] < FIELD_MODULUS && point[1][1] < FIELD_MODULUS;
    }
    
    /**
     * @dev Get credential verification details
     */
    function getCredentialVerification(bytes32 credentialHash) 
        external 
        view 
        returns (CredentialVerification memory) 
    {
        return verifiedCredentials[credentialHash];
    }
    
    /**
     * @dev Check if credential is verified and valid
     */
    function isCredentialValid(bytes32 credentialHash) external view returns (bool) {
        CredentialVerification memory verification = verifiedCredentials[credentialHash];
        return verification.isValid && verification.isNotExpired;
    }
    
    /**
     * @dev Check if credential meets minimum score requirement
     */
    function meetsMinimumScore(bytes32 credentialHash, uint256 requiredScore) 
        external 
        view 
        returns (bool) 
    {
        CredentialVerification memory verification = verifiedCredentials[credentialHash];
        return verification.meetsMinimum && verification.minimumScore >= requiredScore;
    }
    
    /**
     * @dev Revoke a credential verification (only owner)
     */
    function revokeCredential(bytes32 credentialHash) external onlyOwner {
        require(usedCredentialHashes[credentialHash], "Credential not verified");
        
        delete verifiedCredentials[credentialHash];
        usedCredentialHashes[credentialHash] = false;
        
        emit CredentialRevoked(credentialHash, msg.sender);
    }
    
    /**
     * @dev Batch verify multiple credentials
     */
    function batchVerifyCredentials(
        Proof[] memory proofs,
        uint256[7][] memory publicInputs,
        bytes32[] memory credentialHashes,
        bytes32[] memory verificationKeys,
        uint256[] memory minimumScores,
        uint256[] memory expiryDates
    ) external nonReentrant {
        require(authorizedVerifiers[keccak256(abi.encodePacked(msg.sender))], "Not authorized verifier");
        require(
            proofs.length == publicInputs.length &&
            publicInputs.length == credentialHashes.length &&
            credentialHashes.length == verificationKeys.length &&
            verificationKeys.length == minimumScores.length &&
            minimumScores.length == expiryDates.length,
            "Array lengths mismatch"
        );
        
        for (uint i = 0; i < proofs.length; i++) {
            uint256[7] memory inputs = publicInputs[i];
            this.verifyCredential(
                proofs[i],
                inputs,
                credentialHashes[i],
                verificationKeys[i],
                minimumScores[i],
                expiryDates[i]
            );
        }
    }
    
    /**
     * @dev Get verification statistics
     */
    function getVerificationStats() external view returns (
        uint256 totalVerified,
        uint256 validCredentials,
        uint256 expiredCredentials,
        uint256 belowMinimum
    ) {
        // This would require iterating through all verified credentials
        // In production, maintain counters during verification
        return (0, 0, 0, 0);
    }
}
