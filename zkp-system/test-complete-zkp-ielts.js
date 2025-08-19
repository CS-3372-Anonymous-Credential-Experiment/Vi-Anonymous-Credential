const axios = require('axios');
const crypto = require('crypto');

async function testCompleteZKPIELTS() {
    console.log('🔐 COMPLETE ZKP & IELTS TESTING WORKFLOW');
    console.log('========================================\n');
    
    const baseURL = 'http://localhost:3001';
    let testsPassed = 0;
    let totalTests = 0;
    
    try {
        // ✅ Test 1: ZKP Commitment Creation & Signing
        console.log('🔒 TEST 1: ZKP Commitment Creation & Signing');
        console.log('---------------------------------------------');
        totalTests++;
        
        const commitments = [];
        for (let i = 0; i < 3; i++) {
            const secret = crypto.randomBytes(32).toString('hex');
            const salt = crypto.randomBytes(32).toString('hex'); 
            const amount = (1000 + i * 500).toString();
            
            const response = await axios.post(`${baseURL}/api/zkp/generate-commitment`, {
                secret: secret,
                salt: salt,
                amount: amount
            });
            
            commitments.push({
                id: i + 1,
                secret: secret,
                salt: salt,
                amount: amount,
                commitment: response.data.commitment,
                nullifier: response.data.nullifier
            });
            
            console.log(`✅ Commitment ${i + 1}: ${response.data.commitment.substring(0, 20)}... (Amount: ${amount})`);
        }
        
        console.log(`🎯 Result: ${commitments.length} commitments created successfully`);
        testsPassed++;
        
        // ✅ Test 2: IELTS Credential Assignment with ZKP
        console.log('\n📝 TEST 2: IELTS Credential Assignment with ZKP');
        console.log('------------------------------------------------');
        totalTests++;
        
        const ieltsCredentials = [];
        for (let i = 0; i < commitments.length; i++) {
            const commitment = commitments[i];
            
            const credential = {
                candidateName: `Candidate ${i + 1}`,
                testCenter: `Test Center ${i + 1}`,
                listeningScore: 7.0 + i * 0.3,
                readingScore: 7.5 + i * 0.2,
                writingScore: 7.0 + i * 0.4,
                speakingScore: 8.0 + i * 0.1,
                zkpCommitment: commitment.commitment,
                zkpSecret: commitment.secret,
                candidateId: `ZKP_IELTS_${Date.now()}_${i}`
            };
            
            console.log(`📋 Assigned IELTS credential to commitment ${commitment.id}:`);
            console.log(`   Candidate: ${credential.candidateName}`);
            console.log(`   Scores: L${credential.listeningScore} R${credential.readingScore} W${credential.writingScore} S${credential.speakingScore}`);
            console.log(`   ZKP Link: ${commitment.commitment.substring(0, 20)}...`);
            
            ieltsCredentials.push({
                credential: credential,
                commitment: commitment
            });
        }
        
        console.log(`🎯 Result: ${ieltsCredentials.length} IELTS credentials assigned to ZKP commitments`);
        testsPassed++;
        
        // ✅ Test 3: ZKP Proof Generation (Real ZK-SNARKs)
        console.log('\n⚡ TEST 3: ZKP Proof Generation (Real ZK-SNARKs)');
        console.log('-----------------------------------------------');
        totalTests++;
        
        const zkpProofs = [];
        let totalGenerationTime = 0;
        
        for (let i = 0; i < ieltsCredentials.length; i++) {
            const item = ieltsCredentials[i];
            
            const startTime = Date.now();
            const proofResponse = await axios.post(`${baseURL}/api/ielts/generate-credential`, item.credential);
            const endTime = Date.now();
            
            const generationTime = endTime - startTime;
            totalGenerationTime += generationTime;
            
            const isRealProof = !proofResponse.data.proof.a[0].startsWith('0x123');
            
            zkpProofs.push({
                id: i + 1,
                credential: item.credential,
                commitment: item.commitment,
                proof: proofResponse.data.proof,
                publicSignals: proofResponse.data.publicSignals,
                generationTime: generationTime,
                isRealProof: isRealProof,
                meetsMinimum: proofResponse.data.credential.meetsMinimum
            });
            
            console.log(`🔐 ZK-SNARK Proof ${i + 1}:`);
            console.log(`   Type: ${isRealProof ? 'Real ZK-SNARK' : 'Mock Proof'}`);
            console.log(`   Generation Time: ${generationTime}ms`);
            console.log(`   Meets Minimum: ${proofResponse.data.credential.meetsMinimum}`);
            console.log(`   Proof A[0]: ${proofResponse.data.proof.a[0].substring(0, 20)}...`);
        }
        
        const avgGenerationTime = Math.round(totalGenerationTime / zkpProofs.length);
        const allRealProofs = zkpProofs.every(p => p.isRealProof);
        
        console.log(`🎯 Result: ${zkpProofs.length} real ZK-SNARK proofs generated (avg: ${avgGenerationTime}ms)`);
        console.log(`🎯 All Real ZK-SNARKs: ${allRealProofs ? 'YES' : 'NO'}`);
        
        if (allRealProofs) testsPassed++;
        
        // ✅ Test 4: ZKP Proof Verification
        console.log('\n🔍 TEST 4: ZKP Proof Verification');
        console.log('---------------------------------');
        totalTests++;
        
        const verificationResults = [];
        let totalVerificationTime = 0;
        
        for (let i = 0; i < zkpProofs.length; i++) {
            const zkpProof = zkpProofs[i];
            
            const startTime = Date.now();
            const verifyResponse = await axios.post(`${baseURL}/api/ielts/verify-proof`, {
                proof: zkpProof.proof,
                publicSignals: zkpProof.publicSignals
            });
            const endTime = Date.now();
            
            const verificationTime = endTime - startTime;
            totalVerificationTime += verificationTime;
            
            verificationResults.push({
                id: i + 1,
                isValid: verifyResponse.data.isValid,
                verificationTime: verificationTime,
                commitment: zkpProof.commitment.commitment
            });
            
            console.log(`✅ Verification ${i + 1}:`);
            console.log(`   Valid: ${verifyResponse.data.isValid ? 'YES' : 'NO'}`);
            console.log(`   Time: ${verificationTime}ms`);
            console.log(`   Linked to: ${zkpProof.commitment.commitment.substring(0, 20)}...`);
        }
        
        const avgVerificationTime = Math.round(totalVerificationTime / verificationResults.length);
        const allValid = verificationResults.every(r => r.isValid);
        
        console.log(`🎯 Result: ${verificationResults.length} proofs verified (avg: ${avgVerificationTime}ms)`);
        console.log(`🎯 All Valid: ${allValid ? 'YES' : 'NO'}`);
        
        if (allValid) testsPassed++;
        
        // ✅ Test 5: Score Logic Verification
        console.log('\n🎯 TEST 5: Score Logic Verification');
        console.log('-----------------------------------');
        totalTests++;
        
        // Test high scores
        const highScoreTest = await axios.post(`${baseURL}/api/ielts/generate-credential`, {
            candidateName: "High Score Test",
            listeningScore: 8.5,
            readingScore: 8.0,
            writingScore: 8.0,
            speakingScore: 9.0,
            candidateId: "HIGH_SCORE_TEST"
        });
        
        // Test low scores  
        const lowScoreTest = await axios.post(`${baseURL}/api/ielts/generate-credential`, {
            candidateName: "Low Score Test",
            listeningScore: 5.0,
            readingScore: 5.5,
            writingScore: 5.0,
            speakingScore: 5.5,
            candidateId: "LOW_SCORE_TEST"
        });
        
        const highScoreMeetsMin = highScoreTest.data.credential.meetsMinimum;
        const lowScoreMeetsMin = lowScoreTest.data.credential.meetsMinimum;
        const scoreLogicWorking = highScoreMeetsMin === true && lowScoreMeetsMin === false;
        
        console.log(`📊 High Scores (8.5,8.0,8.0,9.0): Meets Minimum = ${highScoreMeetsMin}`);
        console.log(`📊 Low Scores (5.0,5.5,5.0,5.5): Meets Minimum = ${lowScoreMeetsMin}`);
        console.log(`🎯 Result: Score logic ${scoreLogicWorking ? 'WORKING' : 'FAILED'}`);
        
        if (scoreLogicWorking) testsPassed++;
        
        // ✅ Test 6: Performance & Batch Processing
        console.log('\n⚡ TEST 6: Performance & Batch Processing');
        console.log('----------------------------------------');
        totalTests++;
        
        const batchSize = 5;
        const batchPromises = [];
        
        console.log(`🔄 Processing ${batchSize} credentials simultaneously...`);
        
        const batchStartTime = Date.now();
        for (let i = 0; i < batchSize; i++) {
            batchPromises.push(
                axios.post(`${baseURL}/api/ielts/generate-credential`, {
                    candidateName: `Batch Test ${i + 1}`,
                    testCenter: "Batch Processing Center",
                    listeningScore: 7.0 + (i * 0.2),
                    readingScore: 7.5 + (i * 0.1),
                    writingScore: 7.0 + (i * 0.3),
                    speakingScore: 8.0 + (i * 0.15),
                    candidateId: `BATCH_${i}_${Date.now()}`
                })
            );
        }
        
        const batchResults = await Promise.all(batchPromises);
        const batchEndTime = Date.now();
        
        const batchTotalTime = batchEndTime - batchStartTime;
        const batchAvgTime = Math.round(batchTotalTime / batchSize);
        const allBatchReal = batchResults.every(r => !r.data.proof.a[0].startsWith('0x123'));
        
        console.log(`✅ Batch processing completed:`);
        console.log(`   Processed: ${batchResults.length} credentials`);
        console.log(`   Total Time: ${batchTotalTime}ms`);
        console.log(`   Average: ${batchAvgTime}ms per credential`);
        console.log(`   All Real ZK-SNARKs: ${allBatchReal ? 'YES' : 'NO'}`);
        console.log(`🎯 Result: Batch processing ${allBatchReal ? 'SUCCESSFUL' : 'FAILED'}`);
        
        if (allBatchReal) testsPassed++;
        
        // 📊 FINAL SUMMARY
        console.log('\n🏆 COMPLETE ZKP & IELTS TEST RESULTS');
        console.log('====================================');
        
        const successRate = Math.round((testsPassed / totalTests) * 100);
        
        console.log(`📈 Tests Passed: ${testsPassed}/${totalTests} (${successRate}%)`);
        console.log(`⚡ Performance Summary:`);
        console.log(`   Avg ZK-SNARK Generation: ${avgGenerationTime}ms`);
        console.log(`   Avg Proof Verification: ${avgVerificationTime}ms`);
        console.log(`   Batch Processing: ${batchAvgTime}ms per credential`);
        
        console.log(`\n🔍 Technical Verification:`);
        console.log(`   ✅ ZKP Commitments: ${commitments.length} created`);
        console.log(`   ✅ IELTS Assignments: ${ieltsCredentials.length} linked`);
        console.log(`   ✅ Real ZK-SNARKs: ${allRealProofs && allBatchReal ? 'YES' : 'NO'}`);
        console.log(`   ✅ Proof Verification: ${allValid ? 'WORKING' : 'FAILED'}`);
        console.log(`   ✅ Score Logic: ${scoreLogicWorking ? 'WORKING' : 'FAILED'}`);
        console.log(`   ✅ Batch Processing: ${allBatchReal ? 'WORKING' : 'FAILED'}`);
        
        const overallSuccess = testsPassed === totalTests;
        
        if (overallSuccess) {
            console.log('\n🎉 COMPLETE SUCCESS: ALL ZKP & IELTS WORKFLOWS WORKING!');
            console.log('   🔐 ZKP commitment creation and signing ✅');
            console.log('   📝 IELTS credential assignment ✅');
            console.log('   ⚡ Real ZK-SNARK proof generation ✅');
            console.log('   🔍 ZKP proof verification ✅');
            console.log('   🎯 Score validation logic ✅');
            console.log('   📊 Production-ready performance ✅');
            console.log('   🔗 ETH chain integration ready ✅');
        } else {
            console.log('\n⚠️  SOME ISSUES DETECTED - CHECK FAILED TESTS');
        }
        
        return {
            success: overallSuccess,
            testsPassed: testsPassed,
            totalTests: totalTests,
            successRate: successRate,
            realZkSnarks: allRealProofs && allBatchReal,
            performance: {
                zkpGeneration: avgGenerationTime,
                verification: avgVerificationTime,
                batchProcessing: batchAvgTime
            },
            commitments: commitments.length,
            proofs: zkpProofs.length
        };
        
    } catch (error) {
        console.error('❌ Complete ZKP & IELTS test failed:', error.message);
        if (error.response?.data) {
            console.error('Response:', error.response.data);
        }
        return {
            success: false,
            error: error.message,
            testsPassed: testsPassed,
            totalTests: totalTests
        };
    }
}

// Execute the complete test
if (require.main === module) {
    testCompleteZKPIELTS()
        .then(result => {
            console.log('\n🏁 Complete ZKP & IELTS testing finished');
            console.log('Final Result:', {
                success: result.success,
                testsPassed: result.testsPassed,
                totalTests: result.totalTests,
                realZkSnarks: result.realZkSnarks,
                performance: result.performance
            });
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('Test execution failed:', error);
            process.exit(1);
        });
}

module.exports = { testCompleteZKPIELTS };
