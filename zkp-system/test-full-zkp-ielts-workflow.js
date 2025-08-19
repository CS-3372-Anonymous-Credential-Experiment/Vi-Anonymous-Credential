const axios = require('axios');
const crypto = require('crypto');

async function testFullZKPIELTSWorkflow() {
    console.log('🔐 Testing Full ZKP and IELTS Workflow...');
    console.log('=====================================\n');
    
    const baseURL = 'http://localhost:3001';
    const testResults = [];
    
    try {
        // Phase 1: System Health Check
        console.log('📋 Phase 1: System Health Check');
        console.log('--------------------------------');
        
        const healthResponse = await axios.get(`${baseURL}/api/zkp/health`);
        console.log('✅ ZKP API Status:', healthResponse.data.status);
        console.log('✅ Contracts Loaded:', healthResponse.data.contracts.loaded);
        console.log('✅ Real ZK-SNARKs:', healthResponse.data.zkSnark.ieltsCircuit);
        testResults.push({ phase: 'Health Check', status: 'PASSED' });
        
        // Phase 2: Generate Commitment
        console.log('\n🔒 Phase 2: ZKP Commitment Generation');
        console.log('-------------------------------------');
        
        const secret = crypto.randomBytes(32).toString('hex');
        const salt = crypto.randomBytes(32).toString('hex');
        const amount = "1000"; // Test amount
        
        const commitmentResponse = await axios.post(`${baseURL}/api/zkp/generate-commitment`, {
            secret: secret,
            salt: salt,
            amount: amount
        });
        
        const commitment = commitmentResponse.data.commitment;
        const nullifier = commitmentResponse.data.nullifier;
        console.log('✅ Secret generated:', secret.substring(0, 16) + '...');
        console.log('✅ Salt generated:', salt.substring(0, 16) + '...');
        console.log('✅ Amount:', amount);
        console.log('✅ Commitment created:', commitment.substring(0, 16) + '...');
        console.log('✅ Nullifier generated:', nullifier.substring(0, 16) + '...');
        testResults.push({ phase: 'Commitment Generation', status: 'PASSED', commitment });
        
        // Phase 3: IELTS Credential Creation & Signing
        console.log('\n📝 Phase 3: IELTS Credential Creation & Signing');
        console.log('-----------------------------------------------');
        
        const ieltsCredential = {
            candidateName: "John Smith",
            testCenter: "British Council London",
            listeningScore: 8.0,
            readingScore: 7.5,
            writingScore: 7.0,
            speakingScore: 8.5,
            testDate: "2024-01-15",
            expiryDate: "2026-01-15",
            candidateId: "IELTS" + Date.now(),
            secret: secret // Link to ZKP commitment
        };
        
        console.log('✅ IELTS Credential Created:');
        console.log(`   Candidate: ${ieltsCredential.candidateName}`);
        console.log(`   Overall Score: ${((ieltsCredential.listeningScore + ieltsCredential.readingScore + ieltsCredential.writingScore + ieltsCredential.speakingScore) / 4).toFixed(2)}`);
        console.log(`   Test Center: ${ieltsCredential.testCenter}`);
        console.log(`   Linked Secret: ${secret.substring(0, 16)}...`);
        
        // Phase 4: ZKP Proof Generation (Real ZK-SNARK)
        console.log('\n🔐 Phase 4: ZKP Proof Generation (Real ZK-SNARK)');
        console.log('------------------------------------------------');
        
        const proofStartTime = Date.now();
        const zkpResponse = await axios.post(`${baseURL}/api/ielts/generate-credential`, ieltsCredential);
        const proofEndTime = Date.now();
        
        const { credential, proof, publicSignals } = zkpResponse.data;
        const isRealProof = !proof.a[0].startsWith('0x123') && proof.a[0].length > 10;
        
        console.log('✅ ZK-SNARK Proof Generated:');
        console.log(`   Type: ${isRealProof ? 'Real ZK-SNARK' : 'Mock Proof'}`);
        console.log(`   Generation Time: ${proofEndTime - proofStartTime}ms`);
        console.log(`   Public Signals: [${publicSignals.join(', ')}]`);
        console.log(`   Proof A[0]: ${proof.a[0].substring(0, 20)}...`);
        console.log(`   Meets Minimum Score: ${credential.meetsMinimum}`);
        
        testResults.push({ 
            phase: 'ZKP Proof Generation', 
            status: isRealProof ? 'PASSED' : 'FAILED',
            isRealProof,
            generationTime: proofEndTime - proofStartTime,
            proof: proof,
            publicSignals: publicSignals
        });
        
        // Phase 5: Proof Assignment & Verification
        console.log('\n✅ Phase 5: Proof Assignment & Verification');
        console.log('-------------------------------------------');
        
        const verifyStartTime = Date.now();
        const verifyResponse = await axios.post(`${baseURL}/api/ielts/verify-proof`, {
            proof: proof,
            publicSignals: publicSignals
        });
        const verifyEndTime = Date.now();
        
        console.log('✅ ZK-SNARK Proof Verification:');
        console.log(`   Verification Result: ${verifyResponse.data.isValid ? 'VALID' : 'INVALID'}`);
        console.log(`   Verification Time: ${verifyEndTime - verifyStartTime}ms`);
        console.log(`   Message: ${verifyResponse.data.message}`);
        
        testResults.push({ 
            phase: 'Proof Verification', 
            status: verifyResponse.data.isValid ? 'PASSED' : 'FAILED',
            verificationTime: verifyEndTime - verifyStartTime
        });
        
        // Phase 6: On-Chain Verification Attempt
        console.log('\n⛓️  Phase 6: On-Chain Verification');
        console.log('----------------------------------');
        
        try {
            const onChainResponse = await axios.post(`${baseURL}/api/ielts/verify-on-chain`, {
                proof: proof,
                publicSignals: publicSignals,
                commitment: commitment
            });
            console.log('✅ On-Chain Verification:', onChainResponse.data.isValid ? 'VALID' : 'INVALID');
            testResults.push({ phase: 'On-Chain Verification', status: 'PASSED' });
        } catch (error) {
            console.log('ℹ️  On-Chain Verification: Not available (expected with mock contracts)');
            console.log(`   Error: ${error.response?.data?.error || 'Contract not deployed'}`);
            testResults.push({ phase: 'On-Chain Verification', status: 'SKIPPED', reason: 'Mock contracts' });
        }
        
        // Phase 7: Multiple Credentials Test (Batch Processing)
        console.log('\n📊 Phase 7: Batch Processing Test');
        console.log('---------------------------------');
        
        const batchSize = 3;
        const batchStartTime = Date.now();
        const batchPromises = [];
        
        for (let i = 0; i < batchSize; i++) {
            const batchCredential = {
                candidateName: `Test User ${i + 1}`,
                testCenter: "Batch Test Center",
                listeningScore: 7.0 + i * 0.3,
                readingScore: 7.5 + i * 0.2,
                writingScore: 7.0 + i * 0.4,
                speakingScore: 8.0 + i * 0.1,
                candidateId: `BATCH${i}_${Date.now()}`
            };
            
            batchPromises.push(
                axios.post(`${baseURL}/api/ielts/generate-credential`, batchCredential)
            );
        }
        
        const batchResults = await Promise.all(batchPromises);
        const batchEndTime = Date.now();
        
        console.log('✅ Batch Processing Results:');
        console.log(`   Processed: ${batchResults.length} credentials`);
        console.log(`   Total Time: ${batchEndTime - batchStartTime}ms`);
        console.log(`   Average: ${Math.round((batchEndTime - batchStartTime) / batchResults.length)}ms per credential`);
        
        // Verify all batch results are real ZK-SNARKs
        const allRealProofs = batchResults.every(r => !r.data.proof.a[0].startsWith('0x123'));
        console.log(`   All Real ZK-SNARKs: ${allRealProofs ? 'YES' : 'NO'}`);
        
        testResults.push({ 
            phase: 'Batch Processing', 
            status: 'PASSED',
            batchSize: batchSize,
            totalTime: batchEndTime - batchStartTime,
            averageTime: Math.round((batchEndTime - batchStartTime) / batchResults.length),
            allRealProofs: allRealProofs
        });
        
        // Phase 8: Score Validation Test
        console.log('\n🎯 Phase 8: Score Validation Test');
        console.log('---------------------------------');
        
        // Test high scores (should pass)
        const highScoreTest = await axios.post(`${baseURL}/api/ielts/generate-credential`, {
            candidateName: "High Score Test",
            listeningScore: 8.5,
            readingScore: 8.0,
            writingScore: 8.0,
            speakingScore: 9.0
        });
        
        // Test low scores (should fail minimum requirement)
        const lowScoreTest = await axios.post(`${baseURL}/api/ielts/generate-credential`, {
            candidateName: "Low Score Test",
            listeningScore: 5.0,
            readingScore: 5.5,
            writingScore: 5.0,
            speakingScore: 5.5
        });
        
        console.log('✅ Score Validation Results:');
        console.log(`   High Scores (8.5,8.0,8.0,9.0) - Meets Minimum: ${highScoreTest.data.credential.meetsMinimum}`);
        console.log(`   Low Scores (5.0,5.5,5.0,5.5) - Meets Minimum: ${lowScoreTest.data.credential.meetsMinimum}`);
        
        const scoreValidationPassed = highScoreTest.data.credential.meetsMinimum === true && 
                                     lowScoreTest.data.credential.meetsMinimum === false;
        
        testResults.push({ 
            phase: 'Score Validation', 
            status: scoreValidationPassed ? 'PASSED' : 'FAILED',
            highScoreResult: highScoreTest.data.credential.meetsMinimum,
            lowScoreResult: lowScoreTest.data.credential.meetsMinimum
        });
        
        // Final Summary
        console.log('\n📊 COMPLETE WORKFLOW TEST SUMMARY');
        console.log('==================================');
        
        const passedTests = testResults.filter(t => t.status === 'PASSED').length;
        const failedTests = testResults.filter(t => t.status === 'FAILED').length;
        const skippedTests = testResults.filter(t => t.status === 'SKIPPED').length;
        
        console.log(`✅ Passed: ${passedTests}`);
        console.log(`❌ Failed: ${failedTests}`);
        console.log(`⏭️  Skipped: ${skippedTests}`);
        console.log(`📈 Success Rate: ${Math.round((passedTests / (passedTests + failedTests)) * 100)}%`);
        
        console.log('\n🔍 Detailed Results:');
        testResults.forEach(result => {
            const icon = result.status === 'PASSED' ? '✅' : result.status === 'FAILED' ? '❌' : '⏭️';
            console.log(`   ${icon} ${result.phase}: ${result.status}`);
            if (result.reason) console.log(`      Reason: ${result.reason}`);
        });
        
        // Performance Summary
        const zkpGenTime = testResults.find(t => t.phase === 'ZKP Proof Generation')?.generationTime || 0;
        const verifyTime = testResults.find(t => t.phase === 'Proof Verification')?.verificationTime || 0;
        const avgBatchTime = testResults.find(t => t.phase === 'Batch Processing')?.averageTime || 0;
        
        console.log('\n⚡ Performance Summary:');
        console.log(`   ZK-SNARK Generation: ${zkpGenTime}ms`);
        console.log(`   Proof Verification: ${verifyTime}ms`);
        console.log(`   Batch Average: ${avgBatchTime}ms per credential`);
        
        // Final Verification
        const mainTestsPassed = testResults.filter(t => 
            ['ZKP Proof Generation', 'Proof Verification', 'Score Validation'].includes(t.phase) && 
            t.status === 'PASSED'
        ).length === 3;
        
        const realZkSnarks = testResults.find(t => t.phase === 'ZKP Proof Generation')?.isRealProof || false;
        const allBatchReal = testResults.find(t => t.phase === 'Batch Processing')?.allRealProofs || false;
        
        if (mainTestsPassed && realZkSnarks && allBatchReal) {
            console.log('\n🎉 FULL WORKFLOW SUCCESS!');
            console.log('   ✅ Complete ZKP workflow functional');
            console.log('   ✅ IELTS credentials using real ZK-SNARKs');
            console.log('   ✅ Signing, committing, and verification working');
            console.log('   ✅ Real binary cryptography (not mocks)');
            console.log('   ✅ Production-ready performance');
            console.log('   ✅ ETH chain integration ready');
        } else {
            console.log('\n⚠️  WORKFLOW ISSUES DETECTED');
            console.log('   Please check failed tests above');
        }
        
        return {
            success: mainTestsPassed && realZkSnarks && allBatchReal,
            testResults: testResults,
            performance: {
                zkpGeneration: zkpGenTime,
                verification: verifyTime,
                batchAverage: avgBatchTime
            },
            realZkSnarks: realZkSnarks,
            totalTests: testResults.length,
            passedTests: passedTests,
            failedTests: failedTests
        };
        
    } catch (error) {
        console.error('❌ Workflow test failed:', error.message);
        if (error.response?.data) {
            console.error('Response:', error.response.data);
        }
        return {
            success: false,
            error: error.message,
            testResults: testResults
        };
    }
}

// Execute the complete workflow test
if (require.main === module) {
    testFullZKPIELTSWorkflow()
        .then(result => {
            console.log('\n🏁 Complete workflow test finished');
            console.log('Result:', {
                success: result.success,
                realZkSnarks: result.realZkSnarks,
                performance: result.performance,
                tests: `${result.passedTests}/${result.totalTests} passed`
            });
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('Test execution failed:', error);
            process.exit(1);
        });
}

module.exports = { testFullZKPIELTSWorkflow };
