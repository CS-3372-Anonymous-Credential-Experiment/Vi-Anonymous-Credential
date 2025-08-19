const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = process.env.ZKP_API_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Simple hash function (mock implementation)
function simpleHash(input) {
    return crypto.createHash('sha256').update(JSON.stringify(input)).digest('hex');
}

// Mock ZKP system for testing
class SimpleZKPSystem {
    constructor() {
        this.commitments = new Map();
        this.nullifiers = new Set();
    }

    generateCommitment(secret, salt, amount) {
        const input = [secret, salt, amount];
        return simpleHash(input);
    }

    generateNullifier(secret) {
        return simpleHash([secret]);
    }

    generateProof(inputs) {
        // Mock proof generation
        return {
            proof: {
                a: ['0x123456789', '0x987654321'],
                b: [['0x111111111', '0x222222222'], ['0x333333333', '0x444444444']],
                c: ['0x555555555', '0x666666666']
            },
            publicSignals: [
                simpleHash(inputs),
                this.generateCommitment(inputs.secret, inputs.salt, inputs.amount),
                this.generateNullifier(inputs.secret)
            ]
        };
    }

    verifyProof(proof, publicSignals) {
        // Mock verification - always return true for testing
        return true;
    }
}

const zkpSystem = new SimpleZKPSystem();

// Routes
app.get('/api/zkp/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'ZKP API',
        version: '1.0.0'
    });
});

app.post('/api/zkp/commitment', (req, res) => {
    try {
        const { secret, salt, amount } = req.body;
        
        if (!secret || !salt || !amount) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        const commitment = zkpSystem.generateCommitment(secret, salt, amount);
        zkpSystem.commitments.set(commitment, { secret, salt, amount });

        res.json({
            commitment,
            message: 'Commitment generated successfully'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/zkp/proof', (req, res) => {
    try {
        const { secret, salt, amount, recipient } = req.body;
        
        if (!secret || !salt || !amount || !recipient) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        const inputs = { secret, salt, amount, recipient };
        const proof = zkpSystem.generateProof(inputs);

        res.json({
            proof,
            message: 'Proof generated successfully'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/zkp/verify', (req, res) => {
    try {
        const { proof, publicSignals } = req.body;
        
        if (!proof || !publicSignals) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        const isValid = zkpSystem.verifyProof(proof, publicSignals);

        res.json({
            isValid,
            message: isValid ? 'Proof verified successfully' : 'Proof verification failed'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/zkp/status', (req, res) => {
    res.json({
        status: 'running',
        commitments: zkpSystem.commitments.size,
        nullifiers: zkpSystem.nullifiers.size,
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 ZKP API Server running on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/api/zkp/health`);
    console.log(`📊 Status: http://localhost:${PORT}/api/zkp/status`);
});

module.exports = app;
