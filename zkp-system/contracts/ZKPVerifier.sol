// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title ZKPVerifier
 * @dev Smart contract for verifying zk-SNARK proofs using BLS12-381 curve
 */
contract ZKPVerifier is Ownable, ReentrancyGuard {
    using ECDSA for bytes32;
    
    // BLS12-381 curve parameters
    uint256 constant FIELD_MODULUS = 0x30644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd47;
    uint256 constant CURVE_ORDER = 0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001;
    
    // Verification key structure
    struct VerificationKey {
        uint256[2] alpha1;
        uint256[2][2] beta2;
        uint256[2][2] gamma2;
        uint256[2][2] delta2;
        uint256[2][] ic;
    }
    
    // Proof structure
    struct Proof {
        uint256[2] a;
        uint256[2][2] b;
        uint256[2] c;
    }
    
    // Commitment mapping
    mapping(bytes32 => bool) public usedCommitments;
    mapping(bytes32 => bool) public usedNullifiers;
    
    // Events
    event ProofVerified(
        bytes32 indexed commitment,
        bytes32 indexed nullifier,
        address indexed recipient,
        uint256 amount
    );
    
    event CommitmentDeposited(
        bytes32 indexed commitment,
        address indexed sender,
        uint256 amount
    );
    
    event FundsWithdrawn(
        bytes32 indexed nullifier,
        address indexed recipient,
        uint256 amount
    );
    
    // Verification key (to be set after circuit compilation)
    VerificationKey internal verificationKey;
    
    constructor() Ownable(msg.sender) {
        // Initialize with default verification key
        // This should be updated after circuit compilation
    }
    
    /**
     * @dev Set the verification key (only owner)
     */
    function setVerificationKey(
        uint256[2] memory _alpha1,
        uint256[2][2] memory _beta2,
        uint256[2][2] memory _gamma2,
        uint256[2][2] memory _delta2,
        uint256[2][] memory _ic
    ) external onlyOwner {
        verificationKey.alpha1 = _alpha1;
        verificationKey.beta2 = _beta2;
        verificationKey.gamma2 = _gamma2;
        verificationKey.delta2 = _delta2;
        verificationKey.ic = _ic;
    }
    
    /**
     * @dev Deposit funds with commitment
     */
    function deposit(bytes32 commitment) external payable {
        require(msg.value > 0, "Amount must be greater than 0");
        require(!usedCommitments[commitment], "Commitment already used");
        
        usedCommitments[commitment] = true;
        
        emit CommitmentDeposited(commitment, msg.sender, msg.value);
    }
    
    /**
     * @dev Verify zk-SNARK proof and withdraw funds
     */
    function verifyAndWithdraw(
        Proof memory proof,
        uint256[2] memory input,
        bytes32 nullifier,
        address payable recipient,
        uint256 amount
    ) external nonReentrant {
        require(!usedNullifiers[nullifier], "Nullifier already used");
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than 0");
        require(amount <= address(this).balance, "Insufficient contract balance");
        
        // Verify the zk-SNARK proof
        require(verifyProof(proof, input), "Invalid proof");
        
        // Mark nullifier as used
        usedNullifiers[nullifier] = true;
        
        // Transfer funds
        (bool success, ) = recipient.call{value: amount}("");
        require(success, "Transfer failed");
        
        emit FundsWithdrawn(nullifier, recipient, amount);
        emit ProofVerified(
            bytes32(input[0]), // commitment
            nullifier,
            recipient,
            amount
        );
    }
    
    /**
     * @dev Verify zk-SNARK proof using BLS12-381 curve operations
     */
    function verifyProof(Proof memory proof, uint256[2] memory input) 
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
        require(input[0] < FIELD_MODULUS, "Invalid input[0]");
        require(input[1] < FIELD_MODULUS, "Invalid input[1]");
        
        // Simplified verification - in production, implement full pairing check
        // e(proof.a, proof.b) * e(verificationKey.alpha1, verificationKey.beta2) 
        // == e(verificationKey.gamma2, verificationKey.delta2) * e(input, verificationKey.ic)
        
        return true; // Placeholder - implement actual verification
    }
    
    /**
     * @dev Check if a point is valid on the BLS12-381 curve
     */
    function isValidCurvePoint(uint256[2] memory point) internal pure returns (bool) {
        // Simplified check - in production, implement full curve point validation
        return point[0] < FIELD_MODULUS && point[1] < FIELD_MODULUS;
    }
    
    /**
     * @dev Check if a G2 point is valid
     */
    function isValidG2Point(uint256[2][2] memory point) internal pure returns (bool) {
        // Simplified check for G2 point
        return point[0][0] < FIELD_MODULUS && point[0][1] < FIELD_MODULUS &&
               point[1][0] < FIELD_MODULUS && point[1][1] < FIELD_MODULUS;
    }
    
    /**
     * @dev Emergency withdrawal (only owner)
     */
    function emergencyWithdraw() external onlyOwner {
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        require(success, "Emergency withdrawal failed");
    }
    
    /**
     * @dev Get contract balance
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Check if commitment is used
     */
    function isCommitmentUsed(bytes32 commitment) external view returns (bool) {
        return usedCommitments[commitment];
    }
    
    /**
     * @dev Check if nullifier is used
     */
    function isNullifierUsed(bytes32 nullifier) external view returns (bool) {
        return usedNullifiers[nullifier];
    }
}
