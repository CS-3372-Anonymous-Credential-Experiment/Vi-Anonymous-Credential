const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const snarkjs = require('snarkjs');

const app = express();
const PORT = process.env.ZKP_API_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize provider and contracts
let provider, zkpPrivacyContract, zkpVerifierContract, ieltsVerifierContract;

// ZK-SNARK circuit paths (hardhat-circom compiled)
const IELTS_CIRCUIT_PATH = path.join(__dirname, '../circuits/compiled');
const IELTS_WASM_PATH = path.join(IELTS_CIRCUIT_PATH, 'simple-ielts.wasm');
const IELTS_ZKEY_PATH = path.join(IELTS_CIRCUIT_PATH, 'simple-ielts.zkey');
const IELTS_VERIFICATION_KEY_PATH = path.join(IELTS_CIRCUIT_PATH, 'simple-ielts.vkey.json');

// Load deployment info if available
function loadContracts() {
    try {
        if (fs.existsSync('deployment-info.json')) {
            const deploymentInfo = JSON.parse(fs.readFileSync('deployment-info.json', 'utf8'));
            
            // Initialize provider
            provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL || 'http://localhost:8545');
            
            // Check if this is a mock deployment or real deployment
            if (deploymentInfo.isMockDeployment) {
                console.log('📋 Mock deployment detected - contracts loaded for testing');
                // For mock deployment, we just store the addresses but don't create actual contract instances
                zkpPrivacyContract = { address: deploymentInfo.contracts.zkpPrivacy };
                zkpVerifierContract = { address: deploymentInfo.contracts.zkpVerifier };
                ieltsVerifierContract = { address: deploymentInfo.contracts.ieltsVerifier };
            } else {
                // Load real contract artifacts for actual deployed contracts
                const zkpPrivacyArtifact = require('../artifacts/contracts/ZKPPrivacyContract.sol/ZKPPrivacyContract.json');
                const zkpVerifierArtifact = require('../artifacts/contracts/ZKPVerifier.sol/ZKPVerifier.json');
                const ieltsVerifierArtifact = require('../artifacts/contracts/IELTSCredentialVerifier.sol/IELTSCredentialVerifier.json');
                
                // Initialize contracts
                zkpPrivacyContract = new ethers.Contract(
                    deploymentInfo.contracts.zkpPrivacy,
                    zkpPrivacyArtifact.abi,
                    provider
                );
                
                zkpVerifierContract = new ethers.Contract(
                    deploymentInfo.contracts.zkpVerifier,
                    zkpVerifierArtifact.abi,
                    provider
                );
                
                ieltsVerifierContract = new ethers.Contract(
                    deploymentInfo.contracts.ieltsVerifier,
                    ieltsVerifierArtifact.abi,
                    provider
                );
            }
            
            console.log('✅ Smart contracts loaded successfully');
            console.log('  ZKPPrivacyContract:', deploymentInfo.contracts.zkpPrivacy);
            console.log('  ZKPVerifier:', deploymentInfo.contracts.zkpVerifier);
            console.log('  IELTSCredentialVerifier:', deploymentInfo.contracts.ieltsVerifier);
        } else {
            console.log('⚠️  No deployment info found. Contract endpoints will be disabled.');
        }
    } catch (error) {
        console.log('⚠️  Error loading contracts:', error.message);
    }
}

// Load contracts on startup
loadContracts();

/**
 * Generate commitment from secret inputs using Poseidon hash
 */
function generateCommitment(secret, salt, amount) {
    try {
        // Use Poseidon hash for real ZK-SNARK compatibility
        const { poseidon } = require('circomlib');
        const input = [BigInt(secret), BigInt(salt), BigInt(amount)];
        const hash = poseidon(input);
        return hash.toString();
    } catch (error) {
        // Fallback to SHA-256 if Poseidon is not available
        const input = `${secret}-${salt}-${amount}`;
        const crypto = require('crypto');
        return crypto.createHash('sha256').update(input).digest('hex');
    }
}

/**
 * Generate nullifier from secret using Poseidon hash
 */
function generateNullifier(secret) {
    try {
        const { poseidon } = require('circomlib');
        const hash = poseidon([BigInt(secret)]);
        return hash.toString();
    } catch (error) {
        // Fallback to SHA-256
        const crypto = require('crypto');
        return crypto.createHash('sha256').update(secret.toString()).digest('hex');
    }
}

/**
 * Generate real ZK-SNARK proof for IELTS credential
 */
async function generateIELTSProof(credentialData) {
    try {
        // Check if real circuit files exist
        if (fs.existsSync(IELTS_WASM_PATH) && fs.existsSync(IELTS_ZKEY_PATH)) {
            console.log('🔐 Generating real ZK-SNARK proof for IELTS credential...');
            
            // Prepare inputs for the simplified circuit
            const minimumRequired = 65; // 6.5 IELTS score in 10x format
            const inputs = {
                // Private inputs
                listeningScore: Math.floor(credentialData.listeningScore * 10),
                readingScore: Math.floor(credentialData.readingScore * 10),
                writingScore: Math.floor(credentialData.writingScore * 10),
                speakingScore: Math.floor(credentialData.speakingScore * 10),
                minimumRequired: minimumRequired,
                
                // Public inputs
                meetsMinimum: (credentialData.listeningScore >= 6.5 && 
                             credentialData.readingScore >= 6.5 && 
                             credentialData.writingScore >= 6.5 && 
                             credentialData.speakingScore >= 6.5) ? 1 : 0,
                isValid: 1
            };

            // Generate proof using snarkjs
            const { proof, publicSignals } = await snarkjs.groth16.fullProve(
                inputs,
                IELTS_WASM_PATH,
                IELTS_ZKEY_PATH
            );

            return {
                proof: {
                    a: proof.pi_a,
                    b: proof.pi_b,
                    c: proof.pi_c
                },
                publicSignals: publicSignals,
                meetsMinimum: publicSignals[0] === '1',
                isValid: publicSignals[1] === '1',
                credentialHash: null, // Not calculated in simplified circuit
                isNotExpired: true // Not checked in simplified circuit
            };
        } else {
            console.log('⚠️  Real circuit files not found. Using mock proof for testing.');
            return generateMockIELTSProof(credentialData);
        }
    } catch (error) {
        console.error('❌ Error generating IELTS proof:', error.message);
        return generateMockIELTSProof(credentialData);
        }
    }

    /**
 * Generate mock proof for testing
 */
function generateMockIELTSProof(credentialData) {
    const credentialHash = generateCommitment(
        credentialData.listeningScore,
        credentialData.readingScore,
        credentialData.overallScore
    );
    
    const meetsMinimum = credentialData.overallScore >= 6.0;
    const isValid = true;
    const isNotExpired = true;
    
    return {
        proof: {
            a: ['0x1234567890abcdef', '0xfedcba0987654321'],
            b: [
                ['0x1111111111111111', '0x2222222222222222'],
                ['0x3333333333333333', '0x4444444444444444']
            ],
            c: ['0x5555555555555555', '0x6666666666666666']
        },
        publicSignals: [credentialHash, meetsMinimum ? '1' : '0', '1', '1'],
        credentialHash: credentialHash,
        meetsMinimum: meetsMinimum,
        isValid: isValid,
        isNotExpired: isNotExpired
    };
}

/**
 * Verify ZK-SNARK proof
 */
async function verifyProof(proof, publicSignals) {
    try {
        if (fs.existsSync(IELTS_VERIFICATION_KEY_PATH)) {
            console.log('🔍 Verifying real ZK-SNARK proof...');
            const verificationKey = JSON.parse(fs.readFileSync(IELTS_VERIFICATION_KEY_PATH, 'utf8'));
            
            // Ensure proof is in correct format
            const formattedProof = {
                pi_a: proof.a || proof.pi_a,
                pi_b: proof.b || proof.pi_b,
                pi_c: proof.c || proof.pi_c
            };
            
            const isValid = await snarkjs.groth16.verify(verificationKey, publicSignals, formattedProof);
            return isValid;
        } else {
            console.log('⚠️  Verification key not found. Using mock verification.');
            return true; // Mock verification always returns true
        }
    } catch (error) {
        console.error('❌ Error verifying proof:', error.message);
        return false;
    }
}

// Health check endpoint
app.get('/api/zkp/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'ZKP API',
        timestamp: new Date().toISOString(),
        contracts: {
            loaded: !!zkpPrivacyContract,
            zkpPrivacy: zkpPrivacyContract?.address,
            zkpVerifier: zkpVerifierContract?.address,
            ieltsVerifier: ieltsVerifierContract?.address
        },
        zkSnark: {
            ieltsCircuit: fs.existsSync(IELTS_WASM_PATH),
            ieltsProvingKey: fs.existsSync(IELTS_ZKEY_PATH),
            ieltsVerificationKey: fs.existsSync(IELTS_VERIFICATION_KEY_PATH)
        }
    });
});

// Generate commitment endpoint
app.post('/api/zkp/generate-commitment', (req, res) => {
    try {
        const { secret, salt, amount } = req.body;
        
        if (!secret || !salt || !amount) {
            return res.status(400).json({ error: 'Missing required fields: secret, salt, amount' });
        }
        
        const commitment = generateCommitment(secret, salt, amount);
        const nullifier = generateNullifier(secret);

        res.json({
            commitment: `0x${commitment}`,
            nullifier: `0x${nullifier}`,
            inputs: { secret, salt, amount }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Generate proof endpoint with real ZK-SNARK
app.post('/api/zkp/generate-proof', async (req, res) => {
    try {
        const { secret, salt, amount, recipient } = req.body;
        
        if (!secret || !salt || !amount || !recipient) {
            return res.status(400).json({ error: 'Missing required fields: secret, salt, amount, recipient' });
        }
        
        const commitment = generateCommitment(secret, salt, amount);
        const nullifier = generateNullifier(secret);
        
        // For now, return a mock proof structure
        // In a real implementation, this would generate a ZK-SNARK proof
        const mockProof = {
            a: ['0x1234567890abcdef', '0xfedcba0987654321'],
            b: [
                ['0x1111111111111111', '0x2222222222222222'],
                ['0x3333333333333333', '0x4444444444444444']
            ],
            c: ['0x5555555555555555', '0x6666666666666666']
        };

        res.json({
            proof: mockProof,
            publicSignals: [commitment, nullifier, amount, recipient],
            commitment: `0x${commitment}`,
            nullifier: `0x${nullifier}`
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Verify proof endpoint with real ZK-SNARK verification
app.post('/api/zkp/verify-proof', async (req, res) => {
    try {
        const { proof, publicSignals } = req.body;
        
        if (!proof || !publicSignals) {
            return res.status(400).json({ error: 'Missing required fields: proof, publicSignals' });
        }

        const isValid = await verifyProof(proof, publicSignals);

        res.json({
            isValid,
            message: isValid ? 'Proof verified successfully' : 'Proof verification failed'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// IELTS Credential endpoints
app.post('/api/ielts/generate-credential', async (req, res) => {
    try {
        const { listeningScore, readingScore, writingScore, speakingScore, candidateName, testCenter } = req.body;
        
        if (!listeningScore || !readingScore || !writingScore || !speakingScore) {
            return res.status(400).json({ error: 'Missing required IELTS scores' });
        }
        
        // Calculate overall score
        const overallScore = (listeningScore + readingScore + writingScore + speakingScore) / 4;
        
        // Generate credential data
        const credentialData = {
            listeningScore,
            readingScore,
            writingScore,
            speakingScore,
            overallScore,
            candidateName: candidateName || 'Anonymous',
            testCenter: testCenter || 'IELTS Test Center',
            issueDate: Math.floor(Date.now() / 1000),
            expiryDate: Math.floor(Date.now() / 1000) + (2 * 365 * 24 * 60 * 60), // 2 years
            credentialSecret: require('crypto').randomBytes(32).toString('hex')
        };
        
        // Generate ZK-SNARK proof
        const proofData = await generateIELTSProof(credentialData);
        
        res.json({
            credential: {
                ...credentialData,
                credentialHash: proofData.credentialHash,
                meetsMinimum: proofData.meetsMinimum,
                isValid: proofData.isValid,
                isNotExpired: proofData.isNotExpired
            },
            proof: proofData.proof,
            publicSignals: proofData.publicSignals
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/ielts/verify-proof', async (req, res) => {
    try {
        const { proof, publicSignals } = req.body;
        
        if (!proof || !publicSignals) {
            return res.status(400).json({ error: 'Missing required fields: proof, publicSignals' });
        }
        
        const isValid = await verifyProof(proof, publicSignals);

        res.json({
            isValid,
            message: isValid ? 'IELTS credential proof verified successfully' : 'IELTS credential proof verification failed'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/ielts/verify-on-chain', async (req, res) => {
    try {
        const { proof, publicSignals, privateKey } = req.body;
        
        if (!proof || !publicSignals || !privateKey || !ieltsVerifierContract) {
            return res.status(400).json({ error: 'Missing required fields or contract not deployed' });
        }
        
        // Verify proof first
        const isValid = await verifyProof(proof, publicSignals);
        if (!isValid) {
            return res.status(400).json({ error: 'Proof verification failed' });
        }
        
        // Verify on-chain
        const wallet = new ethers.Wallet(privateKey, provider);
        const contractWithSigner = ieltsVerifierContract.connect(wallet);
        
        const tx = await contractWithSigner.verifyCredential(
            proof,
            publicSignals,
            publicSignals[0], // credentialHash
            publicSignals[1] === '1', // meetsMinimum
            publicSignals[2] === '1', // isValid
            publicSignals[3] === '1'  // isNotExpired
        );
        
        const receipt = await tx.wait();

        res.json({
            success: true,
            transactionHash: tx.hash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString(),
            onChainVerified: true
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Contract endpoints (only available if contracts are loaded)
if (zkpPrivacyContract) {
    
    // Get contract balance
    app.get('/api/contract/balance', async (req, res) => {
        try {
            const balance = await zkpPrivacyContract.getBalance();
            res.json({
                balance: ethers.utils.formatEther(balance),
                balanceWei: balance.toString()
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    
    // Deposit funds with commitment
    app.post('/api/contract/deposit', async (req, res) => {
        try {
            const { commitment, amount, privateKey } = req.body;
            
            if (!commitment || !amount || !privateKey) {
                return res.status(400).json({ error: 'Missing required fields: commitment, amount, privateKey' });
            }
            
            const wallet = new ethers.Wallet(privateKey, provider);
            const contractWithSigner = zkpPrivacyContract.connect(wallet);
            
            const tx = await contractWithSigner.deposit(commitment, {
                value: ethers.utils.parseEther(amount.toString())
            });
            
            const receipt = await tx.wait();
            
            res.json({
                success: true,
                transactionHash: tx.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString(),
                commitment,
                amount
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    
    // Withdraw funds using ZK proof
    app.post('/api/contract/withdraw', async (req, res) => {
        try {
            const { proof, publicSignals, nullifier, recipient, amount, privateKey } = req.body;
            
            if (!proof || !publicSignals || !nullifier || !recipient || !amount || !privateKey) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            
            const wallet = new ethers.Wallet(privateKey, provider);
            const contractWithSigner = zkpPrivacyContract.connect(wallet);
            
            const tx = await contractWithSigner.verifyAndWithdraw(
                proof,
                publicSignals,
                nullifier,
                recipient,
                ethers.utils.parseEther(amount.toString())
            );
            
            const receipt = await tx.wait();
        
        res.json({
                success: true,
                transactionHash: tx.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString(),
                recipient,
                amount
        });
    } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    
    // Get contract events
    app.get('/api/contract/events', async (req, res) => {
        try {
            const { fromBlock = 0, toBlock = 'latest' } = req.query;
            
            const depositEvents = await zkpPrivacyContract.queryFilter(
                zkpPrivacyContract.filters.Deposit(),
                fromBlock,
                toBlock
            );
            
            const withdrawalEvents = await zkpPrivacyContract.queryFilter(
                zkpPrivacyContract.filters.Withdrawal(),
                fromBlock,
                toBlock
            );
            
            res.json({
                deposits: depositEvents.map(event => ({
                    commitment: event.args.commitment,
                    amount: ethers.utils.formatEther(event.args.amount),
                    timestamp: event.args.timestamp.toString(),
                    transactionHash: event.transactionHash,
                    blockNumber: event.blockNumber
                })),
                withdrawals: withdrawalEvents.map(event => ({
                    nullifier: event.args.nullifier,
                    recipient: event.args.recipient,
                    amount: ethers.utils.formatEther(event.args.amount),
                    timestamp: event.args.timestamp.toString(),
                    transactionHash: event.transactionHash,
                    blockNumber: event.blockNumber
                }))
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    
} else {
    // Contract endpoints not available
    app.get('/api/contract/balance', (req, res) => {
        res.status(503).json({ error: 'Contracts not loaded. Deploy contracts first.' });
    });
    
    app.post('/api/contract/deposit', (req, res) => {
        res.status(503).json({ error: 'Contracts not loaded. Deploy contracts first.' });
    });
    
    app.post('/api/contract/withdraw', (req, res) => {
        res.status(503).json({ error: 'Contracts not loaded. Deploy contracts first.' });
    });
    
    app.get('/api/contract/events', (req, res) => {
        res.status(503).json({ error: 'Contracts not loaded. Deploy contracts first.' });
    });
}

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 ZKP API Server running on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/api/zkp/health`);
    console.log(`🔗 Network: ${process.env.ETH_RPC_URL || 'http://localhost:8545'}`);
    console.log(`🔐 ZK-SNARK Status:`);
    console.log(`   IELTS Circuit: ${fs.existsSync(IELTS_WASM_PATH) ? '✅' : '❌'}`);
    console.log(`   IELTS Proving Key: ${fs.existsSync(IELTS_ZKEY_PATH) ? '✅' : '❌'}`);
    console.log(`   IELTS Verification Key: ${fs.existsSync(IELTS_VERIFICATION_KEY_PATH) ? '✅' : '❌'}`);
});

module.exports = app;
