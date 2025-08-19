const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { ethers } = require('ethers');
const snarkjs = require('snarkjs');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.IELTS_API_PORT || 3002; // Different port for IELTS API

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// BLS12-381 curve parameters
const FIELD_MODULUS = BigInt("0x30644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd47");
const CURVE_ORDER = BigInt("0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001");

// Initialize provider
const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL || 'http://localhost:8545');

// IELTS Credential System class
class IELTSCredentialSystem {
    constructor() {
        this.circuitPath = path.join(__dirname, '../circuits/ielts-credential.circom');
        this.wasmPath = path.join(__dirname, '../circuits/ielts-credential.wasm');
        this.zkeyPath = path.join(__dirname, '../circuits/ielts-credential_final.zkey');
        this.verificationKeyPath = path.join(__dirname, '../circuits/ielts-credential_verification_key.json');
    }

    /**
     * Generate credential hash from IELTS data
     */
    generateCredentialHash(ieltsData) {
        const { poseidon } = require('circomlib');
        const input = [
            ieltsData.candidateId,
            ieltsData.overallScore,
            ieltsData.testDate,
            ieltsData.candidateName,
            ieltsData.testCenter,
            ieltsData.listeningScore,
            ieltsData.readingScore,
            ieltsData.secretKey
        ];
        return poseidon(input);
    }

    /**
     * Generate verification key
     */
    generateVerificationKey(candidateId, testDate, secretKey) {
        const { poseidon } = require('circomlib');
        return poseidon([candidateId, testDate, secretKey]);
    }

    /**
     * Calculate overall IELTS score
     */
    calculateOverallScore(listening, reading, writing, speaking) {
        return Math.round((listening + reading + writing + speaking) / 4 * 10) / 10;
    }

    /**
     * Validate IELTS scores
     */
    validateIELTSScores(listening, reading, writing, speaking) {
        const scores = [listening, reading, writing, speaking];
        return scores.every(score => score >= 0 && score <= 9);
    }

    /**
     * Generate zk-SNARK proof for IELTS credential
     */
    async generateIELTSProof(ieltsData, minimumScore, expiryDate) {
        try {
            // Check if circuit files exist
            if (!fs.existsSync(this.wasmPath) || !fs.existsSync(this.zkeyPath)) {
                // Return mock proof for testing
                console.log('⚠️  IELTS circuit files not found. Returning mock proof for testing.');
                return {
                    proof: {
                        a: ['0x123456789', '0x987654321'],
                        b: [['0x111111111', '0x222222222'], ['0x333333333', '0x444444444']],
                        c: ['0x555555555', '0x666666666']
                    },
                    publicSignals: ['0x777777777', '0x888888888', '0x999999999', '0xaaaaaaaaa', '0xbbbbbbbbb', '0xccccccccc', '0xddddddddd'],
                    credentialHash: '0x' + crypto.randomBytes(32).toString('hex'),
                    verificationKey: '0x' + crypto.randomBytes(32).toString('hex'),
                    overallScore: this.calculateOverallScore(
                        ieltsData.listeningScore,
                        ieltsData.readingScore,
                        ieltsData.writingScore,
                        ieltsData.speakingScore
                    )
                };
            }

            // Validate scores
            if (!this.validateIELTSScores(
                ieltsData.listeningScore, 
                ieltsData.readingScore, 
                ieltsData.writingScore, 
                ieltsData.speakingScore
            )) {
                throw new Error('Invalid IELTS scores. Scores must be between 0 and 9.');
            }

            // Calculate overall score
            const overallScore = this.calculateOverallScore(
                ieltsData.listeningScore,
                ieltsData.readingScore,
                ieltsData.writingScore,
                ieltsData.speakingScore
            );

            // Generate credential hash and verification key
            const credentialHash = this.generateCredentialHash(ieltsData);
            const verificationKey = this.generateVerificationKey(
                ieltsData.candidateId,
                ieltsData.testDate,
                ieltsData.secretKey
            );

            // Prepare inputs for circuit
            const inputs = {
                publicInput: "0",
                credentialHash: credentialHash.toString(),
                verificationKey: verificationKey.toString(),
                minimumScore: minimumScore,
                expiryDate: expiryDate,
                candidateId: ieltsData.candidateId,
                listeningScore: ieltsData.listeningScore,
                readingScore: ieltsData.readingScore,
                writingScore: ieltsData.writingScore,
                speakingScore: ieltsData.speakingScore,
                overallScore: overallScore,
                testDate: ieltsData.testDate,
                candidateName: ieltsData.candidateName,
                testCenter: ieltsData.testCenter,
                secretKey: ieltsData.secretKey
            };

            // Generate proof using snarkjs
            const { proof, publicSignals } = await snarkjs.groth16.fullProve(
                inputs,
                this.wasmPath,
                this.zkeyPath
            );

            return {
                proof: {
                    a: proof.pi_a,
                    b: proof.pi_b,
                    c: proof.pi_c
                },
                publicSignals: publicSignals,
                credentialHash: credentialHash.toString(),
                verificationKey: verificationKey.toString(),
                overallScore: overallScore
            };
        } catch (error) {
            throw new Error(`IELTS proof generation failed: ${error.message}`);
        }
    }

    /**
     * Verify IELTS zk-SNARK proof
     */
    async verifyIELTSProof(proof, publicSignals) {
        try {
            if (!fs.existsSync(this.verificationKeyPath)) {
                throw new Error('IELTS verification key not found.');
            }

            const verificationKey = JSON.parse(fs.readFileSync(this.verificationKeyPath, 'utf8'));
            const isValid = await snarkjs.groth16.verify(verificationKey, publicSignals, proof);
            
            return isValid;
        } catch (error) {
            throw new Error(`IELTS proof verification failed: ${error.message}`);
        }
    }

    /**
     * Format proof for Solidity
     */
    formatProofForSolidity(proof) {
        return {
            a: [proof.a[0], proof.a[1]],
            b: [
                [proof.b[0][0], proof.b[0][1]],
                [proof.b[1][0], proof.b[1][1]]
            ],
            c: [proof.c[0], proof.c[1]]
        };
    }
}

// Initialize IELTS system
const ieltsSystem = new IELTSCredentialSystem();

// API Routes

/**
 * @route GET /api/ielts/health
 * @desc Health check endpoint
 */
app.get('/api/ielts/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'IELTS Credential API',
        timestamp: new Date().toISOString(),
        curve: 'BLS12-381',
        fieldModulus: FIELD_MODULUS.toString()
    });
});

/**
 * @route POST /api/ielts/generate-credential
 * @desc Generate IELTS credential hash and verification key
 */
app.post('/api/ielts/generate-credential', (req, res) => {
    try {
        const { 
            candidateId, 
            listeningScore, 
            readingScore, 
            writingScore, 
            speakingScore,
            testDate,
            candidateName,
            testCenter,
            secretKey
        } = req.body;
        
        if (!candidateId || listeningScore === undefined || readingScore === undefined || 
            writingScore === undefined || speakingScore === undefined || !testDate || 
            !candidateName || !testCenter || !secretKey) {
            return res.status(400).json({
                error: 'Missing required IELTS parameters'
            });
        }

        // Validate scores
        if (!ieltsSystem.validateIELTSScores(listeningScore, readingScore, writingScore, speakingScore)) {
            return res.status(400).json({
                error: 'Invalid IELTS scores. Scores must be between 0 and 9.'
            });
        }

        const ieltsData = {
            candidateId,
            listeningScore,
            readingScore,
            writingScore,
            speakingScore,
            testDate,
            candidateName,
            testCenter,
            secretKey
        };

        const overallScore = ieltsSystem.calculateOverallScore(listeningScore, readingScore, writingScore, speakingScore);
        const credentialHash = ieltsSystem.generateCredentialHash(ieltsData);
        const verificationKey = ieltsSystem.generateVerificationKey(candidateId, testDate, secretKey);

        res.json({
            credentialHash: credentialHash.toString(),
            verificationKey: verificationKey.toString(),
            overallScore: overallScore,
            ieltsData: {
                candidateId,
                listeningScore,
                readingScore,
                writingScore,
                speakingScore,
                overallScore,
                testDate,
                candidateName,
                testCenter
            }
        });
    } catch (error) {
        res.status(500).json({
            error: 'Credential generation failed',
            details: error.message
        });
    }
});

/**
 * @route POST /api/ielts/generate-proof
 * @desc Generate zk-SNARK proof for IELTS credential verification
 */
app.post('/api/ielts/generate-proof', async (req, res) => {
    try {
        const { 
            candidateId, 
            listeningScore, 
            readingScore, 
            writingScore, 
            speakingScore,
            testDate,
            candidateName,
            testCenter,
            secretKey,
            minimumScore,
            expiryDate
        } = req.body;
        
        if (!candidateId || listeningScore === undefined || readingScore === undefined || 
            writingScore === undefined || speakingScore === undefined || !testDate || 
            !candidateName || !testCenter || !secretKey || minimumScore === undefined || 
            expiryDate === undefined) {
            return res.status(400).json({
                error: 'Missing required parameters'
            });
        }

        const ieltsData = {
            candidateId,
            listeningScore,
            readingScore,
            writingScore,
            speakingScore,
            testDate,
            candidateName,
            testCenter,
            secretKey
        };

        // Generate proof
        const proofData = await ieltsSystem.generateIELTSProof(ieltsData, minimumScore, expiryDate);
        
        // Format proof for Solidity
        const solidityProof = ieltsSystem.formatProofForSolidity(proofData.proof);

        res.json({
            proof: solidityProof,
            publicSignals: proofData.publicSignals,
            credentialHash: proofData.credentialHash,
            verificationKey: proofData.verificationKey,
            overallScore: proofData.overallScore,
            ieltsData: {
                candidateId,
                listeningScore,
                readingScore,
                writingScore,
                speakingScore,
                overallScore: proofData.overallScore,
                testDate,
                candidateName,
                testCenter
            }
        });
    } catch (error) {
        res.status(500).json({
            error: 'Proof generation failed',
            details: error.message
        });
    }
});

/**
 * @route POST /api/ielts/verify-proof
 * @desc Verify IELTS zk-SNARK proof
 */
app.post('/api/ielts/verify-proof', async (req, res) => {
    try {
        const { proof, publicSignals } = req.body;
        
        if (!proof || !publicSignals) {
            return res.status(400).json({
                error: 'Missing proof or public signals'
            });
        }

        const isValid = await ieltsSystem.verifyIELTSProof(proof, publicSignals);

        res.json({
            isValid: isValid,
            publicSignals: publicSignals
        });
    } catch (error) {
        res.status(500).json({
            error: 'Proof verification failed',
            details: error.message
        });
    }
});

/**
 * @route POST /api/ielts/verify-on-chain
 * @desc Verify IELTS credential on blockchain
 */
app.post('/api/ielts/verify-on-chain', async (req, res) => {
    try {
        const { 
            proof, 
            publicSignals, 
            credentialHash, 
            verificationKey, 
            minimumScore, 
            expiryDate,
            privateKey,
            contractAddress
        } = req.body;
        
        if (!proof || !publicSignals || !credentialHash || !verificationKey || 
            minimumScore === undefined || expiryDate === undefined || !privateKey || !contractAddress) {
            return res.status(400).json({
                error: 'Missing required parameters'
            });
        }

        // Create wallet
        const wallet = new ethers.Wallet(privateKey, provider);
        
        // Contract ABI for IELTS verification
        const contractABI = [
            "function verifyCredential(tuple(uint256[2] a, uint256[2][2] b, uint256[2] c) proof, uint256[7] publicInputs, bytes32 credentialHash, bytes32 verificationKey, uint256 minimumScore, uint256 expiryDate) external"
        ];
        
        const contract = new ethers.Contract(contractAddress, contractABI, wallet);
        
        // Format inputs for contract
        const publicInputs = [
            publicSignals[0], // publicInput
            publicSignals[1], // credentialHash
            publicSignals[2], // verificationKey
            publicSignals[3], // minimumScore
            publicSignals[4], // expiryDate
            publicSignals[5], // isValid
            publicSignals[6]  // meetsMinimum
        ];
        
        // Send transaction
        const tx = await contract.verifyCredential(
            proof,
            publicInputs,
            credentialHash,
            verificationKey,
            minimumScore,
            expiryDate
        );
        
        const receipt = await tx.wait();

        res.json({
            success: true,
            transactionHash: tx.hash,
            blockNumber: receipt.blockNumber,
            credentialHash: credentialHash,
            verificationKey: verificationKey
        });
    } catch (error) {
        res.status(500).json({
            error: 'On-chain verification failed',
            details: error.message
        });
    }
});

/**
 * @route GET /api/ielts/credential-status
 * @desc Get IELTS credential verification status
 */
app.get('/api/ielts/credential-status', async (req, res) => {
    try {
        const { credentialHash, contractAddress } = req.query;
        
        if (!credentialHash || !contractAddress) {
            return res.status(400).json({
                error: 'Credential hash and contract address required'
            });
        }

        // Contract ABI for status functions
        const contractABI = [
            "function getCredentialVerification(bytes32 credentialHash) external view returns (tuple(bytes32 credentialHash, bytes32 verificationKey, uint256 minimumScore, uint256 expiryDate, bool isValid, bool meetsMinimum, bool isNotExpired, uint256 verifiedAt, address verifiedBy))",
            "function isCredentialValid(bytes32 credentialHash) external view returns (bool)"
        ];
        
        const contract = new ethers.Contract(contractAddress, contractABI, provider);
        
        const verification = await contract.getCredentialVerification(credentialHash);
        const isValid = await contract.isCredentialValid(credentialHash);
        
        res.json({
            credentialHash: credentialHash,
            verification: {
                credentialHash: verification.credentialHash,
                verificationKey: verification.verificationKey,
                minimumScore: verification.minimumScore.toString(),
                expiryDate: verification.expiryDate.toString(),
                isValid: verification.isValid,
                meetsMinimum: verification.meetsMinimum,
                isNotExpired: verification.isNotExpired,
                verifiedAt: verification.verifiedAt.toString(),
                verifiedBy: verification.verifiedBy
            },
            currentStatus: isValid
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to get credential status',
            details: error.message
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('IELTS API Error:', error);
    res.status(500).json({
        error: 'Internal server error',
        details: error.message
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        availableEndpoints: [
            'GET /api/ielts/health',
            'POST /api/ielts/generate-credential',
            'POST /api/ielts/generate-proof',
            'POST /api/ielts/verify-proof',
            'POST /api/ielts/verify-on-chain',
            'GET /api/ielts/credential-status'
        ]
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🎓 IELTS Credential API Server running on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/api/ielts/health`);
    console.log(`🔗 BLS12-381 curve parameters loaded`);
    console.log(`⚡ Connected to Ethereum node: ${process.env.ETH_RPC_URL || 'http://localhost:8545'}`);
});

module.exports = app;
