const axios = require('axios');
const crypto = require('crypto');
const { ethers } = require('ethers');

// Configuration
const IELTS_API_BASE_URL = 'http://localhost:3002/api/ielts';
const ETH_RPC_URL = 'http://localhost:8545';

// IELTS Credential Automation Example
class IELTSCredentialAutomation {
    constructor() {
        this.provider = new ethers.JsonRpcProvider(ETH_RPC_URL);
        this.ieltsApiUrl = IELTS_API_BASE_URL;
    }

    /**
     * Complete IELTS credential verification automation
     */
    async runCompleteAutomation() {
        console.log('🎓 Starting IELTS Credential Verification Automation...\n');

        try {
            // 1. Check IELTS API health
            await this.checkHealth();

            // 2. Generate test IELTS data
            const testData = this.generateTestIELTSData();
            console.log('📊 Generated test IELTS data:', testData);

            // 3. Generate credential
            const credentialData = await this.generateCredential(testData);
            console.log('🔐 Generated credential:', credentialData.credentialHash);

            // 4. Generate proof for different scenarios
            const proofResults = await this.generateProofsForScenarios(testData);
            console.log('🔍 Generated proofs for different scenarios');

            // 5. Verify proofs
            const verificationResults = await this.verifyProofs(proofResults);
            console.log('✅ Verified all proofs');

            // 6. Simulate on-chain verification
            await this.simulateOnChainVerification(proofResults[0]);

            // 7. Run performance benchmarks
            await this.runPerformanceBenchmarks();

            console.log('\n🎉 IELTS Credential Automation completed successfully!');

        } catch (error) {
            console.error('❌ IELTS automation failed:', error.message);
            throw error;
        }
    }

    /**
     * Check IELTS API health
     */
    async checkHealth() {
        console.log('🏥 Checking IELTS API health...');
        const response = await axios.get(`${this.ieltsApiUrl}/health`);
        
        if (response.data.status === 'healthy') {
            console.log('✅ IELTS API is healthy');
            console.log(`   Service: ${response.data.service}`);
            console.log(`   Curve: ${response.data.curve}`);
        } else {
            throw new Error('IELTS API is not healthy');
        }
    }

    /**
     * Generate test IELTS data
     */
    generateTestIELTSData() {
        return {
            candidateId: 'CANDIDATE_AUTOMATION_001',
            listeningScore: 7.5,
            readingScore: 8.0,
            writingScore: 7.0,
            speakingScore: 8.5,
            testDate: Math.floor(Date.now() / 1000),
            candidateName: 'Jane Smith',
            testCenter: 'British Council London',
            secretKey: crypto.randomBytes(32).toString('hex')
        };
    }

    /**
     * Generate IELTS credential
     */
    async generateCredential(data) {
        console.log('🔐 Generating IELTS credential...');
        const response = await axios.post(`${this.ieltsApiUrl}/generate-credential`, data);

        return response.data;
    }

    /**
     * Generate proofs for different scenarios
     */
    async generateProofsForScenarios(ieltsData) {
        console.log('🔍 Generating proofs for different scenarios...');
        
        const scenarios = [
            {
                name: 'University Admission (6.5 minimum)',
                minimumScore: 6.5,
                expiryDate: Math.floor(Date.now() / 1000) + (2 * 365 * 24 * 60 * 60), // 2 years
                expectedValid: true
            },
            {
                name: 'Graduate Program (7.0 minimum)',
                minimumScore: 7.0,
                expiryDate: Math.floor(Date.now() / 1000) + (2 * 365 * 24 * 60 * 60),
                expectedValid: true
            },
            {
                name: 'PhD Program (8.0 minimum)',
                minimumScore: 8.0,
                expiryDate: Math.floor(Date.now() / 1000) + (2 * 365 * 24 * 60 * 60),
                expectedValid: false // Overall score is 7.8
            },
            {
                name: 'Expired Credential',
                minimumScore: 6.5,
                expiryDate: Math.floor(Date.now() / 1000) - (1 * 365 * 24 * 60 * 60), // 1 year ago
                expectedValid: false
            }
        ];

        const results = [];

        for (const scenario of scenarios) {
            console.log(`   Testing scenario: ${scenario.name}`);
            
            const proofData = {
                ...ieltsData,
                minimumScore: scenario.minimumScore,
                expiryDate: scenario.expiryDate
            };

            const response = await axios.post(`${this.ieltsApiUrl}/generate-proof`, proofData);
            
            results.push({
                scenario: scenario.name,
                proof: response.data.proof,
                publicSignals: response.data.publicSignals,
                credentialHash: response.data.credentialHash,
                verificationKey: response.data.verificationKey,
                overallScore: response.data.overallScore,
                expectedValid: scenario.expectedValid
            });
        }

        return results;
    }

    /**
     * Verify all generated proofs
     */
    async verifyProofs(proofResults) {
        console.log('✅ Verifying all proofs...');
        
        const results = [];

        for (const proofResult of proofResults) {
            console.log(`   Verifying proof for: ${proofResult.scenario}`);
            
            const response = await axios.post(`${this.ieltsApiUrl}/verify-proof`, {
                proof: proofResult.proof,
                publicSignals: proofResult.publicSignals
            });

            results.push({
                scenario: proofResult.scenario,
                isValid: response.data.isValid,
                expectedValid: proofResult.expectedValid,
                overallScore: proofResult.overallScore
            });

            console.log(`     Expected: ${proofResult.expectedValid}, Actual: ${response.data.isValid}`);
        }

        return results;
    }

    /**
     * Simulate on-chain verification
     */
    async simulateOnChainVerification(proofResult) {
        console.log('📋 Simulating on-chain verification...');
        
        // This would normally interact with a deployed smart contract
        // For this example, we'll just show what the interaction would look like
        
        const onChainVerification = {
            scenario: proofResult.scenario,
            credentialHash: proofResult.credentialHash,
            verificationKey: proofResult.verificationKey,
            proof: proofResult.proof,
            publicSignals: proofResult.publicSignals,
            gasEstimate: '~300,000 gas',
            estimatedCost: '~0.003 ETH (at 10 Gwei)'
        };

        console.log('📄 On-chain verification simulation:');
        console.log('   Scenario:', onChainVerification.scenario);
        console.log('   Credential Hash:', onChainVerification.credentialHash);
        console.log('   Gas Estimate:', onChainVerification.gasEstimate);
        console.log('   Estimated Cost:', onChainVerification.estimatedCost);
    }

    /**
     * Run performance benchmarks
     */
    async runPerformanceBenchmarks() {
        console.log('\n⚡ Running performance benchmarks...');
        
        // Benchmark 1: Credential generation
        console.log('   Benchmarking credential generation...');
        const credentialTimes = [];
        
        for (let i = 0; i < 5; i++) {
            const startTime = Date.now();
            
            const testData = this.generateTestIELTSData();
            await this.generateCredential(testData);
            
            const endTime = Date.now();
            credentialTimes.push(endTime - startTime);
        }

        const avgCredentialTime = credentialTimes.reduce((a, b) => a + b, 0) / credentialTimes.length;
        console.log(`     Average credential generation time: ${avgCredentialTime.toFixed(2)}ms`);

        // Benchmark 2: Proof generation
        console.log('   Benchmarking proof generation...');
        const proofTimes = [];
        
        for (let i = 0; i < 3; i++) {
            const startTime = Date.now();
            
            const testData = this.generateTestIELTSData();
            const proofData = {
                ...testData,
                minimumScore: 6.5,
                expiryDate: Math.floor(Date.now() / 1000) + (2 * 365 * 24 * 60 * 60)
            };
            
            await axios.post(`${this.ieltsApiUrl}/generate-proof`, proofData);
            
            const endTime = Date.now();
            proofTimes.push(endTime - startTime);
        }

        const avgProofTime = proofTimes.reduce((a, b) => a + b, 0) / proofTimes.length;
        console.log(`     Average proof generation time: ${avgProofTime.toFixed(2)}ms`);

        // Benchmark 3: Concurrent operations
        console.log('   Benchmarking concurrent operations...');
        const concurrentStartTime = Date.now();
        
        const concurrentRequests = Array(3).fill().map((_, index) => {
            const testData = {
                candidateId: `CONCURRENT_${index + 1}`,
                listeningScore: 7.0 + (index * 0.5),
                readingScore: 7.5 + (index * 0.3),
                writingScore: 6.5 + (index * 0.4),
                speakingScore: 7.2 + (index * 0.6),
                testDate: Math.floor(Date.now() / 1000),
                candidateName: `Concurrent Candidate ${index + 1}`,
                testCenter: `Test Center ${index + 1}`,
                secretKey: crypto.randomBytes(32).toString('hex')
            };
            
            return axios.post(`${this.ieltsApiUrl}/generate-credential`, testData);
        });

        await Promise.all(concurrentRequests);
        
        const concurrentEndTime = Date.now();
        const concurrentDuration = concurrentEndTime - concurrentStartTime;
        console.log(`     Concurrent operations time: ${concurrentDuration}ms`);

        console.log('\n📊 Performance Summary:');
        console.log(`   Credential Generation: ${avgCredentialTime.toFixed(2)}ms avg`);
        console.log(`   Proof Generation: ${avgProofTime.toFixed(2)}ms avg`);
        console.log(`   Concurrent Operations: ${concurrentDuration}ms for 3 operations`);
    }

    /**
     * Test with different IELTS score combinations
     */
    async testScoreCombinations() {
        console.log('\n🎯 Testing different IELTS score combinations...');
        
        const scoreCombinations = [
            { name: 'Perfect Score', scores: [9.0, 9.0, 9.0, 9.0], expected: 9.0 },
            { name: 'High Score', scores: [8.5, 8.0, 7.5, 8.0], expected: 8.0 },
            { name: 'Average Score', scores: [7.0, 6.5, 6.0, 7.5], expected: 6.75 },
            { name: 'Low Score', scores: [5.5, 6.0, 5.0, 6.5], expected: 5.75 },
            { name: 'Mixed Score', scores: [8.0, 6.5, 7.5, 7.0], expected: 7.25 }
        ];

        for (const combination of scoreCombinations) {
            console.log(`   Testing: ${combination.name}`);
            
            const testData = {
                candidateId: `SCORE_TEST_${combination.name.replace(/\s+/g, '_')}`,
                listeningScore: combination.scores[0],
                readingScore: combination.scores[1],
                writingScore: combination.scores[2],
                speakingScore: combination.scores[3],
                testDate: Math.floor(Date.now() / 1000),
                candidateName: `Score Test ${combination.name}`,
                testCenter: 'Automation Test Center',
                secretKey: crypto.randomBytes(32).toString('hex')
            };

            const credentialData = await this.generateCredential(testData);
            console.log(`     Overall Score: ${credentialData.overallScore} (Expected: ${combination.expected})`);
            
            // Test if it meets different minimum requirements
            const minimums = [6.0, 6.5, 7.0, 7.5, 8.0];
            for (const minimum of minimums) {
                const meetsMinimum = credentialData.overallScore >= minimum;
                console.log(`     Meets ${minimum} minimum: ${meetsMinimum}`);
            }
        }
    }

    /**
     * Test error scenarios
     */
    async testErrorScenarios() {
        console.log('\n🚨 Testing error scenarios...');
        
        const errorScenarios = [
            {
                name: 'Invalid Listening Score',
                data: { listeningScore: 10.0, readingScore: 7.0, writingScore: 7.0, speakingScore: 7.0 },
                expectedError: 'Invalid IELTS scores'
            },
            {
                name: 'Negative Score',
                data: { listeningScore: -1, readingScore: 7.0, writingScore: 7.0, speakingScore: 7.0 },
                expectedError: 'Invalid IELTS scores'
            },
            {
                name: 'Missing Required Fields',
                data: { candidateId: 'TEST', listeningScore: 7.0 },
                expectedError: 'Missing required IELTS parameters'
            }
        ];

        for (const scenario of errorScenarios) {
            console.log(`   Testing: ${scenario.name}`);
            
            try {
                const testData = {
                    candidateId: 'ERROR_TEST',
                    listeningScore: 7.0,
                    readingScore: 7.0,
                    writingScore: 7.0,
                    speakingScore: 7.0,
                    testDate: Math.floor(Date.now() / 1000),
                    candidateName: 'Error Test',
                    testCenter: 'Error Test Center',
                    secretKey: crypto.randomBytes(32).toString('hex'),
                    ...scenario.data
                };

                await axios.post(`${this.ieltsApiUrl}/generate-credential`, testData);
                console.log(`     ❌ Expected error but got success`);
            } catch (error) {
                if (error.response && error.response.data.error.includes(scenario.expectedError)) {
                    console.log(`     ✅ Correctly caught error: ${scenario.expectedError}`);
                } else {
                    console.log(`     ❌ Unexpected error: ${error.message}`);
                }
            }
        }
    }
}

// Run the automation example
async function main() {
    const automation = new IELTSCredentialAutomation();
    
    try {
        await automation.runCompleteAutomation();
        await automation.testScoreCombinations();
        await automation.testErrorScenarios();
        
        console.log('\n🎯 IELTS Credential Automation completed successfully!');
        console.log('\n📚 Key Features Demonstrated:');
        console.log('   ✅ ZKP-based credential verification');
        console.log('   ✅ Privacy-preserving score validation');
        console.log('   ✅ Multiple verification scenarios');
        console.log('   ✅ Performance benchmarking');
        console.log('   ✅ Error handling and validation');
        console.log('   ✅ On-chain verification simulation');
        
    } catch (error) {
        console.error('\n❌ IELTS automation failed:', error.message);
        process.exit(1);
    }
}

// Run if this file is executed directly
if (require.main === module) {
    main();
}

module.exports = IELTSCredentialAutomation;
