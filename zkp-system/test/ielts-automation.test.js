const { expect } = require('chai');
const axios = require('axios');
const crypto = require('crypto');

// Test configuration
const IELTS_API_BASE_URL = 'http://localhost:3002/api/ielts';
const TEST_CANDIDATE_ID = 'CANDIDATE_001';
const TEST_CANDIDATE_NAME = 'John Doe';
const TEST_TEST_CENTER = 'British Council London';

describe('IELTS Credential ZKP Automation Tests', () => {
    let testSecretKey, testCredentialHash, testVerificationKey, testProof, testPublicSignals;

    before(async () => {
        // Generate test secret key
        testSecretKey = crypto.randomBytes(32).toString('hex');
    });

    describe('IELTS API Health Check', () => {
        it('should return healthy status for IELTS API', async () => {
            const response = await axios.get(`${IELTS_API_BASE_URL}/health`);
            expect(response.status).to.equal(200);
            expect(response.data.status).to.equal('healthy');
            expect(response.data.service).to.equal('IELTS Credential API');
            expect(response.data.curve).to.equal('BLS12-381');
        });
    });

    describe('IELTS Credential Generation', () => {
        it('should generate valid IELTS credential', async () => {
            const ieltsData = {
                candidateId: TEST_CANDIDATE_ID,
                listeningScore: 7.5,
                readingScore: 8.0,
                writingScore: 7.0,
                speakingScore: 8.5,
                testDate: Math.floor(Date.now() / 1000), // Current timestamp
                candidateName: TEST_CANDIDATE_NAME,
                testCenter: TEST_TEST_CENTER,
                secretKey: testSecretKey
            };

            const response = await axios.post(`${IELTS_API_BASE_URL}/generate-credential`, ieltsData);

            expect(response.status).to.equal(200);
            expect(response.data.credentialHash).to.be.a('string');
            expect(response.data.verificationKey).to.be.a('string');
            expect(response.data.overallScore).to.be.a('number');
            expect(response.data.overallScore).to.be.closeTo(7.8, 0.1); // (7.5+8.0+7.0+8.5)/4 = 7.75

            testCredentialHash = response.data.credentialHash;
            testVerificationKey = response.data.verificationKey;
        });

        it('should reject invalid IELTS scores', async () => {
            const invalidIeltsData = {
                candidateId: TEST_CANDIDATE_ID,
                listeningScore: 10.0, // Invalid: above 9
                readingScore: 8.0,
                writingScore: 7.0,
                speakingScore: 8.5,
                testDate: Math.floor(Date.now() / 1000),
                candidateName: TEST_CANDIDATE_NAME,
                testCenter: TEST_TEST_CENTER,
                secretKey: testSecretKey
            };

            try {
                await axios.post(`${IELTS_API_BASE_URL}/generate-credential`, invalidIeltsData);
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.response.status).to.equal(400);
                expect(error.response.data.error).to.include('Invalid IELTS scores');
            }
        });

        it('should reject missing required parameters', async () => {
            const incompleteData = {
                candidateId: TEST_CANDIDATE_ID,
                listeningScore: 7.5,
                // Missing other required fields
            };

            try {
                await axios.post(`${IELTS_API_BASE_URL}/generate-credential`, incompleteData);
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.response.status).to.equal(400);
                expect(error.response.data.error).to.include('Missing required IELTS parameters');
            }
        });
    });

    describe('IELTS ZKP Proof Generation', () => {
        it('should generate valid zk-SNARK proof for IELTS credential', async () => {
            const ieltsData = {
                candidateId: TEST_CANDIDATE_ID,
                listeningScore: 7.5,
                readingScore: 8.0,
                writingScore: 7.0,
                speakingScore: 8.5,
                testDate: Math.floor(Date.now() / 1000),
                candidateName: TEST_CANDIDATE_NAME,
                testCenter: TEST_TEST_CENTER,
                secretKey: testSecretKey
            };

            const proofData = {
                ...ieltsData,
                minimumScore: 6.5, // Minimum required score
                expiryDate: Math.floor(Date.now() / 1000) + (2 * 365 * 24 * 60 * 60) // 2 years from now
            };

            const response = await axios.post(`${IELTS_API_BASE_URL}/generate-proof`, proofData);

            expect(response.status).to.equal(200);
            expect(response.data.proof).to.be.an('object');
            expect(response.data.proof.a).to.be.an('array');
            expect(response.data.proof.b).to.be.an('array');
            expect(response.data.proof.c).to.be.an('array');
            expect(response.data.publicSignals).to.be.an('array');
            expect(response.data.credentialHash).to.be.a('string');
            expect(response.data.verificationKey).to.be.a('string');
            expect(response.data.overallScore).to.be.a('number');

            testProof = response.data.proof;
            testPublicSignals = response.data.publicSignals;
        });

        it('should generate proof for different minimum score requirements', async () => {
            const testCases = [
                { minimumScore: 6.0, expectedValid: true },
                { minimumScore: 7.0, expectedValid: true },
                { minimumScore: 8.0, expectedValid: false }, // Overall score is 7.8
                { minimumScore: 9.0, expectedValid: false }
            ];

            for (const testCase of testCases) {
                const ieltsData = {
                    candidateId: TEST_CANDIDATE_ID,
                    listeningScore: 7.5,
                    readingScore: 8.0,
                    writingScore: 7.0,
                    speakingScore: 8.5,
                    testDate: Math.floor(Date.now() / 1000),
                    candidateName: TEST_CANDIDATE_NAME,
                    testCenter: TEST_TEST_CENTER,
                    secretKey: testSecretKey,
                    minimumScore: testCase.minimumScore,
                    expiryDate: Math.floor(Date.now() / 1000) + (2 * 365 * 24 * 60 * 60)
                };

                const response = await axios.post(`${IELTS_API_BASE_URL}/generate-proof`, ieltsData);
                expect(response.status).to.equal(200);
                
                // The proof should be generated regardless of whether it meets the minimum
                expect(response.data.proof).to.be.an('object');
            }
        });
    });

    describe('IELTS ZKP Proof Verification', () => {
        it('should verify valid IELTS proof', async () => {
            const response = await axios.post(`${IELTS_API_BASE_URL}/verify-proof`, {
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
                await axios.post(`${IELTS_API_BASE_URL}/verify-proof`, {
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
                await axios.post(`${IELTS_API_BASE_URL}/verify-proof`, {
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

    describe('IELTS Credential Scenarios', () => {
        it('should handle expired credentials', async () => {
            const ieltsData = {
                candidateId: TEST_CANDIDATE_ID,
                listeningScore: 7.5,
                readingScore: 8.0,
                writingScore: 7.0,
                speakingScore: 8.5,
                testDate: Math.floor(Date.now() / 1000) - (3 * 365 * 24 * 60 * 60), // 3 years ago
                candidateName: TEST_CANDIDATE_NAME,
                testCenter: TEST_TEST_CENTER,
                secretKey: testSecretKey,
                minimumScore: 6.5,
                expiryDate: Math.floor(Date.now() / 1000) - (1 * 365 * 24 * 60 * 60) // Expired 1 year ago
            };

            const response = await axios.post(`${IELTS_API_BASE_URL}/generate-proof`, ieltsData);
            expect(response.status).to.equal(200);
            
            // Proof should be generated but will indicate expired status
            expect(response.data.proof).to.be.an('object');
        });

        it('should handle different IELTS score combinations', async () => {
            const scoreCombinations = [
                { listening: 9.0, reading: 9.0, writing: 9.0, speaking: 9.0, expected: 9.0 },
                { listening: 6.5, reading: 6.5, writing: 6.5, speaking: 6.5, expected: 6.5 },
                { listening: 7.0, reading: 8.0, writing: 6.5, speaking: 7.5, expected: 7.25 },
                { listening: 5.5, reading: 6.0, writing: 5.0, speaking: 6.5, expected: 5.75 }
            ];

            for (const combination of scoreCombinations) {
                const ieltsData = {
                    candidateId: TEST_CANDIDATE_ID,
                    listeningScore: combination.listening,
                    readingScore: combination.reading,
                    writingScore: combination.writing,
                    speakingScore: combination.speaking,
                    testDate: Math.floor(Date.now() / 1000),
                    candidateName: TEST_CANDIDATE_NAME,
                    testCenter: TEST_TEST_CENTER,
                    secretKey: testSecretKey,
                    minimumScore: 6.0,
                    expiryDate: Math.floor(Date.now() / 1000) + (2 * 365 * 24 * 60 * 60)
                };

                const response = await axios.post(`${IELTS_API_BASE_URL}/generate-proof`, ieltsData);
                expect(response.status).to.equal(200);
                expect(response.data.overallScore).to.be.closeTo(combination.expected, 0.1);
            }
        });
    });

    describe('IELTS Credential Status', () => {
        it('should get credential status', async () => {
            const testContractAddress = '0x1234567890123456789012345678901234567890';
            
            const response = await axios.get(`${IELTS_API_BASE_URL}/credential-status`, {
                params: { 
                    credentialHash: testCredentialHash,
                    contractAddress: testContractAddress
                }
            });

            expect(response.status).to.equal(200);
            expect(response.data.credentialHash).to.equal(testCredentialHash);
            expect(response.data.verification).to.be.an('object');
        });

        it('should fail without required parameters', async () => {
            try {
                await axios.get(`${IELTS_API_BASE_URL}/credential-status`);
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.response.status).to.equal(400);
                expect(error.response.data.error).to.include('Credential hash and contract address required');
            }
        });
    });

    describe('End-to-End IELTS Workflow', () => {
        it('should complete full IELTS credential verification workflow', async () => {
            // 1. Generate IELTS credential
            const ieltsData = {
                candidateId: TEST_CANDIDATE_ID,
                listeningScore: 7.5,
                readingScore: 8.0,
                writingScore: 7.0,
                speakingScore: 8.5,
                testDate: Math.floor(Date.now() / 1000),
                candidateName: TEST_CANDIDATE_NAME,
                testCenter: TEST_TEST_CENTER,
                secretKey: testSecretKey
            };

            const credentialResponse = await axios.post(`${IELTS_API_BASE_URL}/generate-credential`, ieltsData);
            expect(credentialResponse.status).to.equal(200);

            // 2. Generate proof
            const proofResponse = await axios.post(`${IELTS_API_BASE_URL}/generate-proof`, {
                ...ieltsData,
                minimumScore: 6.5,
                expiryDate: Math.floor(Date.now() / 1000) + (2 * 365 * 24 * 60 * 60)
            });
            expect(proofResponse.status).to.equal(200);

            // 3. Verify proof
            const verifyResponse = await axios.post(`${IELTS_API_BASE_URL}/verify-proof`, {
                proof: proofResponse.data.proof,
                publicSignals: proofResponse.data.publicSignals
            });
            expect(verifyResponse.status).to.equal(200);
            expect(verifyResponse.data.isValid).to.be.true;

            console.log('✅ IELTS credential verification workflow completed successfully');
        });
    });

    describe('IELTS Performance Tests', () => {
        it('should generate credentials within reasonable time', async () => {
            const startTime = Date.now();
            
            const ieltsData = {
                candidateId: TEST_CANDIDATE_ID,
                listeningScore: 7.5,
                readingScore: 8.0,
                writingScore: 7.0,
                speakingScore: 8.5,
                testDate: Math.floor(Date.now() / 1000),
                candidateName: TEST_CANDIDATE_NAME,
                testCenter: TEST_TEST_CENTER,
                secretKey: testSecretKey
            };

            await axios.post(`${IELTS_API_BASE_URL}/generate-credential`, ieltsData);

            const endTime = Date.now();
            const duration = endTime - startTime;
            
            expect(duration).to.be.lessThan(1000); // Should complete within 1 second
            console.log(`IELTS credential generation took ${duration}ms`);
        });

        it('should handle concurrent credential generation', async () => {
            const requests = Array(3).fill().map((_, index) => {
                const ieltsData = {
                    candidateId: `CANDIDATE_${index + 1}`,
                    listeningScore: 7.0 + (index * 0.5),
                    readingScore: 7.5 + (index * 0.3),
                    writingScore: 6.5 + (index * 0.4),
                    speakingScore: 7.2 + (index * 0.6),
                    testDate: Math.floor(Date.now() / 1000),
                    candidateName: `Candidate ${index + 1}`,
                    testCenter: `Test Center ${index + 1}`,
                    secretKey: crypto.randomBytes(32).toString('hex')
                };

                return axios.post(`${IELTS_API_BASE_URL}/generate-credential`, ieltsData);
            });

            const startTime = Date.now();
            const responses = await Promise.all(requests);
            const endTime = Date.now();
            const duration = endTime - startTime;

            responses.forEach(response => {
                expect(response.status).to.equal(200);
            });

            expect(duration).to.be.lessThan(3000); // Should complete within 3 seconds
            console.log(`Concurrent IELTS credential generation took ${duration}ms`);
        });
    });

    describe('IELTS Error Handling', () => {
        it('should handle invalid endpoints', async () => {
            try {
                await axios.get(`${IELTS_API_BASE_URL}/invalid-endpoint`);
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.response.status).to.equal(404);
                expect(error.response.data.error).to.equal('Endpoint not found');
            }
        });

        it('should handle malformed JSON', async () => {
            try {
                await axios.post(`${IELTS_API_BASE_URL}/generate-credential`, 'invalid json', {
                    headers: { 'Content-Type': 'application/json' }
                });
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.response.status).to.equal(400);
            }
        });

        it('should handle out-of-range scores', async () => {
            const invalidScores = [
                { listening: -1, reading: 7.0, writing: 7.0, speaking: 7.0 },
                { listening: 10.0, reading: 7.0, writing: 7.0, speaking: 7.0 },
                { listening: 7.0, reading: -0.5, writing: 7.0, speaking: 7.0 },
                { listening: 7.0, reading: 7.0, writing: 9.5, speaking: 7.0 }
            ];

            for (const scores of invalidScores) {
                const ieltsData = {
                    candidateId: TEST_CANDIDATE_ID,
                    listeningScore: scores.listening,
                    readingScore: scores.reading,
                    writingScore: scores.writing,
                    speakingScore: scores.speaking,
                    testDate: Math.floor(Date.now() / 1000),
                    candidateName: TEST_CANDIDATE_NAME,
                    testCenter: TEST_TEST_CENTER,
                    secretKey: testSecretKey
                };

                try {
                    await axios.post(`${IELTS_API_BASE_URL}/generate-credential`, ieltsData);
                    expect.fail('Should have thrown an error for invalid scores');
                } catch (error) {
                    expect(error.response.status).to.equal(400);
                    expect(error.response.data.error).to.include('Invalid IELTS scores');
                }
            }
        });
    });
});
