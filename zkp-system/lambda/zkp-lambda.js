const axios = require('axios');
const crypto = require('crypto');

// Configuration
const ZKP_API_URL = process.env.ZKP_API_URL || 'http://localhost:3001';
const ETH_RPC_URL = process.env.ETH_RPC_URL || 'http://localhost:8545';

/**
 * AWS Lambda handler for ZKP operations
 */
exports.handler = async (event) => {
    try {
        console.log('Lambda triggered with event:', JSON.stringify(event));
        
        const { action, data } = event;
        
        switch (action) {
            case 'generate_commitment':
                return await generateCommitment(data);
            case 'generate_proof':
                return await generateProof(data);
            case 'verify_proof':
                return await verifyProof(data);
            case 'deposit':
                return await deposit(data);
            case 'withdraw':
                return await withdraw(data);
            case 'contract_status':
                return await getContractStatus(data);
            default:
                return {
                    statusCode: 400,
                    body: JSON.stringify({
                        error: 'Invalid action',
                        availableActions: [
                            'generate_commitment',
                            'generate_proof',
                            'verify_proof',
                            'deposit',
                            'withdraw',
                            'contract_status'
                        ]
                    })
                };
        }
    } catch (error) {
        console.error('Lambda error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Lambda execution failed',
                details: error.message
            })
        };
    }
};

/**
 * Generate commitment from secret, salt, and amount
 */
async function generateCommitment(data) {
    try {
        const { secret, salt, amount } = data;
        
        if (!secret || !salt || amount === undefined) {
            throw new Error('Missing required parameters: secret, salt, amount');
        }
        
        const response = await axios.post(`${ZKP_API_URL}/api/zkp/generate-commitment`, {
            secret,
            salt,
            amount
        });
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                data: response.data
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Commitment generation failed',
                details: error.message
            })
        };
    }
}

/**
 * Generate zk-SNARK proof
 */
async function generateProof(data) {
    try {
        const { secret, salt, amount, recipient, publicInput } = data;
        
        if (!secret || !salt || amount === undefined || !recipient) {
            throw new Error('Missing required parameters');
        }
        
        const response = await axios.post(`${ZKP_API_URL}/api/zkp/generate-proof`, {
            secret,
            salt,
            amount,
            recipient,
            publicInput
        });
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                data: response.data
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Proof generation failed',
                details: error.message
            })
        };
    }
}

/**
 * Verify zk-SNARK proof
 */
async function verifyProof(data) {
    try {
        const { proof, publicSignals } = data;
        
        if (!proof || !publicSignals) {
            throw new Error('Missing proof or public signals');
        }
        
        const response = await axios.post(`${ZKP_API_URL}/api/zkp/verify-proof`, {
            proof,
            publicSignals
        });
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                data: response.data
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Proof verification failed',
                details: error.message
            })
        };
    }
}

/**
 * Deposit funds with commitment
 */
async function deposit(data) {
    try {
        const { commitment, amount, privateKey, contractAddress } = data;
        
        if (!commitment || !amount || !privateKey || !contractAddress) {
            throw new Error('Missing required parameters');
        }
        
        const response = await axios.post(`${ZKP_API_URL}/api/zkp/deposit`, {
            commitment,
            amount,
            privateKey,
            contractAddress
        });
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                data: response.data
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Deposit failed',
                details: error.message
            })
        };
    }
}

/**
 * Withdraw funds using zk-SNARK proof
 */
async function withdraw(data) {
    try {
        const { 
            proof, 
            publicSignals, 
            nullifier, 
            recipient, 
            amount, 
            privateKey, 
            contractAddress 
        } = data;
        
        if (!proof || !publicSignals || !nullifier || !recipient || !amount || !privateKey || !contractAddress) {
            throw new Error('Missing required parameters');
        }
        
        const response = await axios.post(`${ZKP_API_URL}/api/zkp/withdraw`, {
            proof,
            publicSignals,
            nullifier,
            recipient,
            amount,
            privateKey,
            contractAddress
        });
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                data: response.data
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Withdrawal failed',
                details: error.message
            })
        };
    }
}

/**
 * Get smart contract status
 */
async function getContractStatus(data) {
    try {
        const { contractAddress } = data;
        
        if (!contractAddress) {
            throw new Error('Contract address required');
        }
        
        const response = await axios.get(`${ZKP_API_URL}/api/zkp/contract-status`, {
            params: { contractAddress }
        });
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                data: response.data
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Failed to get contract status',
                details: error.message
            })
        };
    }
}

/**
 * Helper function to generate random secret
 */
function generateRandomSecret() {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Helper function to generate random salt
 */
function generateRandomSalt() {
    return crypto.randomBytes(16).toString('hex');
}

/**
 * Example usage functions for testing
 */
exports.generateRandomCommitment = async () => {
    const secret = generateRandomSecret();
    const salt = generateRandomSalt();
    const amount = Math.floor(Math.random() * 1000) + 1;
    
    const response = await axios.post(`${ZKP_API_URL}/api/zkp/generate-commitment`, {
        secret,
        salt,
        amount
    });
    
    return {
        secret,
        salt,
        amount,
        commitment: response.data.commitment,
        nullifier: response.data.nullifier
    };
};

exports.testZKPFlow = async (privateKey, contractAddress, recipient) => {
    try {
        // 1. Generate random commitment
        const commitmentData = await exports.generateRandomCommitment();
        
        // 2. Deposit funds
        const depositResult = await deposit({
            commitment: commitmentData.commitment,
            amount: commitmentData.amount,
            privateKey,
            contractAddress
        });
        
        // 3. Generate proof
        const proofResult = await generateProof({
            secret: commitmentData.secret,
            salt: commitmentData.salt,
            amount: commitmentData.amount,
            recipient,
            publicInput: "0"
        });
        
        // 4. Withdraw funds
        const withdrawResult = await withdraw({
            proof: JSON.parse(proofResult.body).data.proof,
            publicSignals: JSON.parse(proofResult.body).data.publicSignals,
            nullifier: commitmentData.nullifier,
            recipient,
            amount: commitmentData.amount,
            privateKey,
            contractAddress
        });
        
        return {
            commitment: commitmentData,
            deposit: JSON.parse(depositResult.body).data,
            proof: JSON.parse(proofResult.body).data,
            withdraw: JSON.parse(withdrawResult.body).data
        };
    } catch (error) {
        throw new Error(`ZKP flow test failed: ${error.message}`);
    }
};
