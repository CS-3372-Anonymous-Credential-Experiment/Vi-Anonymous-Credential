const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.IELTS_API_PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Simple hash function (mock implementation)
function simpleHash(input) {
    return crypto.createHash('sha256').update(JSON.stringify(input)).digest('hex');
}

// Mock IELTS credential system for testing
class SimpleIELTSSystem {
    constructor() {
        this.credentials = new Map();
        this.verifications = new Map();
        this.issuerPrivateKey = 'IELTS_OFFICIAL_PRIVATE_KEY_2024'; // In production, this would be securely stored
        this.issuerPublicKey = 'IELTS_OFFICIAL_PUBLIC_KEY_2024';   // In production, this would be the public key
        this.loadSampleData();
    }

    loadSampleData() {
        try {
            const samplePath = path.join(__dirname, '../ielts-data/sample-credentials.json');
            if (fs.existsSync(samplePath)) {
                const data = JSON.parse(fs.readFileSync(samplePath, 'utf8'));
                data.forEach(credential => {
                    this.credentials.set(credential.candidateId, credential);
                });
                console.log(`📊 Loaded ${data.length} sample credentials`);
            }
        } catch (error) {
            console.log('⚠️  No sample data found, starting with empty credentials');
        }
    }

    calculateOverallScore(listening, reading, writing, speaking) {
        return (listening + reading + writing + speaking) / 4;
    }

    generateCredentialHash(ieltsData) {
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
        return simpleHash(input);
    }

    generateVerificationKey(candidateId, testDate, secretKey) {
        return simpleHash([candidateId, testDate, secretKey]);
    }

    generateIssuerSignature(credentialData, issuerPrivateKey) {
        // Create a signature from the issuer's private key
        const credentialString = JSON.stringify({
            candidateId: credentialData.candidateId,
            overallScore: credentialData.overallScore,
            testDate: credentialData.testDate,
            candidateName: credentialData.candidateName,
            testCenter: credentialData.testCenter,
            issuer: 'IELTS_OFFICIAL_ISSUER'
        });
        
        // In a real implementation, this would use proper cryptographic signing
        // For now, we'll create a hash-based signature
        const signatureData = credentialString + issuerPrivateKey;
        return simpleHash(signatureData);
    }

    verifyIssuerSignature(credentialData, signature, issuerPublicKey) {
        // Verify the issuer signature
        // In a real implementation, we would use the issuer's private key to verify
        // For now, we'll regenerate the signature using our stored private key
        const expectedSignature = this.generateIssuerSignature(credentialData, this.issuerPrivateKey);
        return signature === expectedSignature;
    }

    generateIELTSProof(ieltsData, minimumScore, expiryDate) {
        const overallScore = this.calculateOverallScore(
            ieltsData.listeningScore,
            ieltsData.readingScore,
            ieltsData.writingScore,
            ieltsData.speakingScore
        );

        const meetsMinimum = overallScore >= minimumScore;
        const isNotExpired = ieltsData.testDate < expiryDate;
        const isValid = meetsMinimum && isNotExpired;

        const credentialHash = this.generateCredentialHash(ieltsData);
        const verificationKey = this.generateVerificationKey(
            ieltsData.candidateId,
            ieltsData.testDate,
            ieltsData.secretKey
        );
        
        // Generate issuer signature for the credential
        const issuerSignature = this.generateIssuerSignature(ieltsData, this.issuerPrivateKey);

        // Mock proof generation
        return {
            proof: {
                a: ['0x123456789', '0x987654321'],
                b: [['0x111111111', '0x222222222'], ['0x333333333', '0x444444444']],
                c: ['0x555555555', '0x666666666']
            },
            publicSignals: [
                simpleHash(ieltsData),
                credentialHash,
                verificationKey,
                minimumScore,
                expiryDate,
                isValid ? 1 : 0,
                meetsMinimum ? 1 : 0,
                isNotExpired ? 1 : 0
            ],
            credentialHash,
            verificationKey,
            issuerSignature,
            issuerPublicKey: this.issuerPublicKey,
            overallScore,
            meetsMinimum,
            isNotExpired,
            isValid
        };
    }

    verifyIELTSProof(proof, publicSignals) {
        // Mock verification - always return true for testing
        return true;
    }

    addCredential(credential) {
        this.credentials.set(credential.candidateId, credential);
        return this.generateCredentialHash(credential);
    }

    getCredential(candidateId) {
        return this.credentials.get(candidateId);
    }

    getAllCredentials() {
        return Array.from(this.credentials.values());
    }
}

const ieltsSystem = new SimpleIELTSSystem();

// Routes
app.get('/api/ielts/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'IELTS Credential API',
        version: '1.0.0'
    });
});

app.post('/api/ielts/credential', (req, res) => {
    try {
        const credential = req.body;
        
        if (!credential.candidateId || !credential.listeningScore || 
            !credential.readingScore || !credential.writingScore || 
            !credential.speakingScore) {
            return res.status(400).json({ error: 'Missing required credential fields' });
        }

        // Calculate overall score
        credential.overallScore = ieltsSystem.calculateOverallScore(
            credential.listeningScore,
            credential.readingScore,
            credential.writingScore,
            credential.speakingScore
        );

        // Generate secret key if not provided
        if (!credential.secretKey) {
            credential.secretKey = crypto.randomBytes(32).toString('hex');
        }

        // Set test date if not provided
        if (!credential.testDate) {
            credential.testDate = Math.floor(Date.now() / 1000);
        }

        const credentialHash = ieltsSystem.addCredential(credential);
        
        // Generate issuer signature
        const issuerSignature = ieltsSystem.generateIssuerSignature(credential, ieltsSystem.issuerPrivateKey);

        res.json({
            credentialHash,
            credential,
            issuerSignature,
            issuerPublicKey: ieltsSystem.issuerPublicKey,
            message: 'IELTS credential created successfully with issuer signature'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/ielts/proof', (req, res) => {
    try {
        const { candidateId, minimumScore, expiryDate } = req.body;
        
        if (!candidateId || minimumScore === undefined || !expiryDate) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        const credential = ieltsSystem.getCredential(candidateId);
        if (!credential) {
            return res.status(404).json({ error: 'Credential not found' });
        }

        const proof = ieltsSystem.generateIELTSProof(credential, minimumScore, expiryDate);

        res.json({
            proof,
            credential: {
                candidateId: credential.candidateId,
                overallScore: credential.overallScore,
                testDate: credential.testDate,
                candidateName: credential.candidateName,
                testCenter: credential.testCenter
            },
            message: 'IELTS proof generated successfully'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/ielts/verify', (req, res) => {
    try {
        const { proof, publicSignals } = req.body;
        
        if (!proof || !publicSignals) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        const isValid = ieltsSystem.verifyIELTSProof(proof, publicSignals);

        res.json({
            isValid,
            message: isValid ? 'IELTS proof verified successfully' : 'IELTS proof verification failed'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/ielts/verify-signature', (req, res) => {
    try {
        const { credential, signature, issuerPublicKey } = req.body;
        
        if (!credential || !signature || !issuerPublicKey) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        const isValid = ieltsSystem.verifyIssuerSignature(credential, signature, issuerPublicKey);

        res.json({
            isValid,
            message: isValid ? 'Issuer signature verified successfully' : 'Issuer signature verification failed',
            issuer: 'IELTS_OFFICIAL_ISSUER'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/ielts/credentials', (req, res) => {
    try {
        const credentials = ieltsSystem.getAllCredentials();
        res.json({
            credentials,
            count: credentials.length,
            message: 'Credentials retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/ielts/credential/:candidateId', (req, res) => {
    try {
        const { candidateId } = req.params;
        const credential = ieltsSystem.getCredential(candidateId);
        
        if (!credential) {
            return res.status(404).json({ error: 'Credential not found' });
        }

        res.json({
            credential,
            message: 'Credential retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/ielts/status', (req, res) => {
    res.json({
        status: 'running',
        credentials: ieltsSystem.credentials.size,
        verifications: ieltsSystem.verifications.size,
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🎓 IELTS API Server running on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/api/ielts/health`);
    console.log(`📊 Status: http://localhost:${PORT}/api/ielts/status`);
});

module.exports = app;
