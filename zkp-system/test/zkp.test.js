const { expect } = require('chai');
const axios = require('axios');
const crypto = require('crypto');

// Test configuration
const API_BASE_URL = 'http://localhost:3001/api/zkp';
const TEST_ACCOUNT = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6';

describe('ZKP System Tests', () => {
    let testSecret, testSalt, testAmount, testCommitment, testNullifier;

    before(async () => {
        // Generate test data
        testSecret = crypto.randomBytes(32).toString('hex');
        testSalt = crypto.randomBytes(16).toString('hex');
        testAmount = Math.floor(Math.random() * 1000) + 1;
    });

    describe('Health Check', () => {
        it('should return healthy status', async () => {
            const response = await axios.get(`${API_BASE_URL}/health`);
            expect(response.status).to.equal(200);
            expect(response.data.status).to.equal('healthy');
            expect(response.data.service).to.equal('ZKP API');
            expect(response.data.curve).to.equal('BLS12-381');
        });
    });

    describe('Commitment Generation', () => {
        it('should generate commitment and nullifier', async () => {
            const response = await axios.post(`${API_BASE_URL}/generate-commitment`, {
                secret: testSecret,
                salt: testSalt,
                amount: testAmount
            });

            expect(response.status).to.equal(200);
            expect(response.data.commitment).to.be.a('string');
            expect(response.data.nullifier).to.be.a('string');
            expect(response.data.secret).to.equal(testSecret);
            expect(response.data.salt).to.equal(testSalt);
            expect(response.data.amount).to.equal(testAmount);

            testCommitment = response.data.commitment;
            testNullifier = response.data.nullifier;
        });

        it('should fail with missing parameters', async () => {
            try {
                await axios.post(`${API_BASE_URL}/generate-commitment`, {
                    secret: testSecret
                    // Missing salt and amount
                });
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.response.status).to.equal(400);
                expect(error.response.data.error).to.include('Missing required parameters');
            }
        });
    });

    describe('Proof Generation', () => {
        it('should generate zk-SNARK proof', async () => {
            const response = await axios.post(`${API_BASE_URL}/generate-proof`, {
                secret: testSecret,
                salt: testSalt,
                amount: testAmount,
                recipient: TEST_ACCOUNT,
                publicInput: "0"
            });

            expect(response.status).to.equal(200);
            expect(response.data.proof).to.be.an('object');
            expect(response.data.proof.a).to.be.an('array');
            expect(response.data.proof.b).to.be.an('array');
            expect(response.data.proof.c).to.be.an('array');
            expect(response.data.publicSignals).to.be.an('array');
            expect(response.data.commitment).to.equal(testCommitment);
            expect(response.data.nullifier).to.equal(testNullifier);
        });

        it('should fail with missing parameters', async () => {
            try {
                await axios.post(`${API_BASE_URL}/generate-proof`, {
                    secret: testSecret
                    // Missing other parameters
                });
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.response.status).to.equal(400);
                expect(error.response.data.error).to.include('Missing required parameters');
            }
        });
    });

    describe('Proof Verification', () => {
        let testProof, testPublicSignals;

        before(async () => {
            // Generate a proof for verification testing
            const response = await axios.post(`${API_BASE_URL}/generate-proof`, {
                secret: testSecret,
                salt: testSalt,
                amount: testAmount,
                recipient: TEST_ACCOUNT,
                publicInput: "0"
            });

            testProof = response.data.proof;
            testPublicSignals = response.data.publicSignals;
        });

        it('should verify valid proof', async () => {
            const response = await axios.post(`${API_BASE_URL}/verify-proof`, {
                proof: testProof,
                publicSignals: testPublicSignals
            });

            expect(response.status).to.equal(200);
            expect(response.data.isValid).to.be.true;
        });

        it('should reject invalid proof', async () => {
            const invalidProof = {
                ...testProof,
                a: ['0', '0'] // Invalid proof
            };

            try {
                await axios.post(`${API_BASE_URL}/verify-proof`, {
                    proof: invalidProof,
                    publicSignals: testPublicSignals
                });
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.response.status).to.equal(500);
            }
        });

        it('should fail with missing parameters', async () => {
            try {
                await axios.post(`${API_BASE_URL}/verify-proof`, {
                    proof: testProof
                    // Missing publicSignals
                });
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.response.status).to.equal(400);
                expect(error.response.data.error).to.include('Missing proof or public signals');
            }
        });
    });

    describe('Contract Status', () => {
        it('should get contract status', async () => {
            const testContractAddress = '0x1234567890123456789012345678901234567890';
            
            const response = await axios.get(`${API_BASE_URL}/contract-status`, {
                params: { contractAddress: testContractAddress }
            });

            expect(response.status).to.equal(200);
            expect(response.data.contractAddress).to.equal(testContractAddress);
            expect(response.data.balance).to.be.a('string');
            expect(response.data.balanceWei).to.be.a('string');
        });

        it('should fail without contract address', async () => {
            try {
                await axios.get(`${API_BASE_URL}/contract-status`);
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.response.status).to.equal(400);
                expect(error.response.data.error).to.include('Contract address required');
            }
        });
    });

    describe('End-to-End Workflow', () => {
        it('should complete full ZKP workflow', async () => {
            // This test would require a deployed contract and real private keys
            // For now, we'll test the individual components work together
            
            // 1. Generate commitment
            const commitmentResponse = await axios.post(`${API_BASE_URL}/generate-commitment`, {
                secret: testSecret,
                salt: testSalt,
                amount: testAmount
            });
            expect(commitmentResponse.status).to.equal(200);

            // 2. Generate proof
            const proofResponse = await axios.post(`${API_BASE_URL}/generate-proof`, {
                secret: testSecret,
                salt: testSalt,
                amount: testAmount,
                recipient: TEST_ACCOUNT,
                publicInput: "0"
            });
            expect(proofResponse.status).to.equal(200);

            // 3. Verify proof
            const verifyResponse = await axios.post(`${API_BASE_URL}/verify-proof`, {
                proof: proofResponse.data.proof,
                publicSignals: proofResponse.data.publicSignals
            });
            expect(verifyResponse.status).to.equal(200);
            expect(verifyResponse.data.isValid).to.be.true;

            console.log('✅ End-to-end workflow completed successfully');
        });
    });

    describe('Error Handling', () => {
        it('should handle invalid endpoints', async () => {
            try {
                await axios.get(`${API_BASE_URL}/invalid-endpoint`);
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.response.status).to.equal(404);
                expect(error.response.data.error).to.equal('Endpoint not found');
            }
        });

        it('should handle malformed JSON', async () => {
            try {
                await axios.post(`${API_BASE_URL}/generate-commitment`, 'invalid json', {
                    headers: { 'Content-Type': 'application/json' }
                });
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.response.status).to.equal(400);
            }
        });
    });
});

// Performance tests
describe('ZKP Performance Tests', () => {
    it('should generate commitment within reasonable time', async () => {
        const startTime = Date.now();
        
        await axios.post(`${API_BASE_URL}/generate-commitment`, {
            secret: crypto.randomBytes(32).toString('hex'),
            salt: crypto.randomBytes(16).toString('hex'),
            amount: Math.floor(Math.random() * 1000) + 1
        });

        const endTime = Date.now();
        const duration = endTime - startTime;
        
        expect(duration).to.be.lessThan(1000); // Should complete within 1 second
        console.log(`Commitment generation took ${duration}ms`);
    });

    it('should handle concurrent requests', async () => {
        const requests = Array(5).fill().map(() => 
            axios.post(`${API_BASE_URL}/generate-commitment`, {
                secret: crypto.randomBytes(32).toString('hex'),
                salt: crypto.randomBytes(16).toString('hex'),
                amount: Math.floor(Math.random() * 1000) + 1
            })
        );

        const startTime = Date.now();
        const responses = await Promise.all(requests);
        const endTime = Date.now();
        const duration = endTime - startTime;

        responses.forEach(response => {
            expect(response.status).to.equal(200);
        });

        expect(duration).to.be.lessThan(5000); // Should complete within 5 seconds
        console.log(`Concurrent requests took ${duration}ms`);
    });
});
