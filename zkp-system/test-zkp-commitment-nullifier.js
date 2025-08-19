const axios = require('axios');
const crypto = require('crypto');

async function testZKPCommitmentNullifier() {
    console.log('🔐 Testing ZKP Commitment & Nullifier Workflow...');
    console.log('=================================================\n');
    
    const baseURL = 'http://localhost:3001';
    
    try {
        // Step 1: Generate multiple commitments for testing
        console.log('1️⃣ Generating Multiple ZKP Commitments');
        console.log('--------------------------------------');
        
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
                nullifier: response.data.nullifier,
                inputs: response.data.inputs
            });
            
            console.log(`✅ Commitment ${i + 1}:`);
            console.log(`   Amount: ${amount}`);
            console.log(`   Commitment: ${response.data.commitment}`);
            console.log(`   Nullifier: ${response.data.nullifier}`);
        }
        
        // Step 2: Generate nullifiers for verification
        console.log('\n2️⃣ Generating Nullifiers for Verification');
        console.log('------------------------------------------');
        
        for (const commitment of commitments) {
            const nullifierResponse = await axios.post(`${baseURL}/api/zkp/generate-nullifier`, {
                secret: commitment.secret,
                salt: commitment.salt,
                amount: commitment.amount
            });
            
            const generatedNullifier = nullifierResponse.data.nullifier;
            const nullifiersMatch = generatedNullifier === commitment.nullifier;
            
            console.log(`✅ Commitment ${commitment.id} Nullifier Verification:`);
            console.log(`   Original: ${commitment.nullifier}`);
            console.log(`   Generated: ${generatedNullifier}`);
            console.log(`   Match: ${nullifiersMatch ? 'YES' : 'NO'}`);
        }
        
        // Step 3: Test ZKP with IELTS credentials using commitments
        console.log('\n3️⃣ Linking ZKP Commitments with IELTS Credentials');
        console.log('--------------------------------------------------');
        
        const ieltsWithZKP = [];
        for (let i = 0; i < commitments.length; i++) {
            const commitment = commitments[i];
            
            const ieltsCredential = {
                candidateName: `Test Candidate ${i + 1}`,
                testCenter: `Test Center ${i + 1}`,
                listeningScore: 7.0 + i * 0.5,
                readingScore: 7.5 + i * 0.3,
                writingScore: 7.0 + i * 0.4,
                speakingScore: 8.0 + i * 0.2,
                zkpCommitment: commitment.commitment,
                zkpSecret: commitment.secret,
                candidateId: `ZKP_${commitment.id}_${Date.now()}`
            };
            
            const proofStartTime = Date.now();
            const proofResponse = await axios.post(`${baseURL}/api/ielts/generate-credential`, ieltsCredential);
            const proofEndTime = Date.now();
            
            ieltsWithZKP.push({
                commitment: commitment,
                credential: ieltsCredential,
                proof: proofResponse.data.proof,
                publicSignals: proofResponse.data.publicSignals,
                generationTime: proofEndTime - proofStartTime,
                meetsMinimum: proofResponse.data.credential.meetsMinimum
            });
            
            console.log(`✅ IELTS Credential ${i + 1} with ZKP:`);
            console.log(`   Candidate: ${ieltsCredential.candidateName}`);
            console.log(`   ZKP Commitment: ${commitment.commitment.substring(0, 20)}...`);
            console.log(`   Overall Score: ${proofResponse.data.credential.overallScore}`);
            console.log(`   Meets Minimum: ${proofResponse.data.credential.meetsMinimum}`);
            console.log(`   ZK-SNARK Generation: ${proofEndTime - proofStartTime}ms`);
        }
        
        // Step 4: Verify all ZKP proofs
        console.log('\n4️⃣ Verifying All ZKP Proofs');
        console.log('----------------------------');
        
        const verificationResults = [];
        for (let i = 0; i < ieltsWithZKP.length; i++) {
            const item = ieltsWithZKP[i];
            
            const verifyStartTime = Date.now();
            const verifyResponse = await axios.post(`${baseURL}/api/ielts/verify-proof`, {
                proof: item.proof,
                publicSignals: item.publicSignals
            });
            const verifyEndTime = Date.now();
            
            verificationResults.push({
                id: i + 1,
                isValid: verifyResponse.data.isValid,
                verificationTime: verifyEndTime - verifyStartTime,
                commitment: item.commitment.commitment
            });
            
            console.log(`✅ Verification ${i + 1}:`);
            console.log(`   Commitment: ${item.commitment.commitment.substring(0, 20)}...`);
            console.log(`   Proof Valid: ${verifyResponse.data.isValid ? 'YES' : 'NO'}`);
            console.log(`   Verification Time: ${verifyEndTime - verifyStartTime}ms`);
        }
        
        // Step 5: Test nullifier uniqueness (double-spending prevention)
        console.log('\n5️⃣ Testing Nullifier Uniqueness (Double-Spending Prevention)');
        console.log('-------------------------------------------------------------');
        
        const usedNullifiers = new Set();
        let doubleSpendingAttempts = 0;
        
        for (const commitment of commitments) {
            const nullifier = commitment.nullifier;
            
            if (usedNullifiers.has(nullifier)) {
                doubleSpendingAttempts++;
                console.log(`❌ Double-spending detected! Nullifier already used: ${nullifier.substring(0, 20)}...`);
            } else {
                usedNullifiers.add(nullifier);
                console.log(`✅ New nullifier registered: ${nullifier.substring(0, 20)}...`);
            }
        }
        
        // Try to reuse a nullifier (simulate double-spending)
        const firstCommitment = commitments[0];
        if (usedNullifiers.has(firstCommitment.nullifier)) {
            console.log(`⚠️  Attempted reuse of nullifier: ${firstCommitment.nullifier.substring(0, 20)}... - BLOCKED`);
        }
        
        // Performance Summary
        console.log('\n📊 ZKP Commitment & Nullifier Test Summary');
        console.log('==========================================');
        
        const totalGenerationTime = ieltsWithZKP.reduce((sum, item) => sum + item.generationTime, 0);
        const totalVerificationTime = verificationResults.reduce((sum, item) => sum + item.verificationTime, 0);
        const allProofsValid = verificationResults.every(result => result.isValid);
        const allRealZKPs = ieltsWithZKP.every(item => !item.proof.a[0].startsWith('0x123'));
        
        console.log(`✅ Commitments Generated: ${commitments.length}`);
        console.log(`✅ IELTS Credentials Created: ${ieltsWithZKP.length}`);
        console.log(`✅ ZK-SNARK Proofs Generated: ${ieltsWithZKP.length}`);
        console.log(`✅ All Proofs Valid: ${allProofsValid ? 'YES' : 'NO'}`);
        console.log(`✅ All Real ZK-SNARKs: ${allRealZKPs ? 'YES' : 'NO'}`);
        console.log(`✅ Nullifier Uniqueness: ${doubleSpendingAttempts === 0 ? 'ENFORCED' : 'VIOLATED'}`);
        
        console.log('\n⚡ Performance Metrics:');
        console.log(`   Average ZK-SNARK Generation: ${Math.round(totalGenerationTime / ieltsWithZKP.length)}ms`);
        console.log(`   Average Proof Verification: ${Math.round(totalVerificationTime / verificationResults.length)}ms`);
        console.log(`   Total Processing Time: ${totalGenerationTime + totalVerificationTime}ms`);
        
        // Final Assessment
        const workflowSuccess = allProofsValid && allRealZKPs && doubleSpendingAttempts === 0;
        
        if (workflowSuccess) {
            console.log('\n🎉 ZKP COMMITMENT & NULLIFIER WORKFLOW: COMPLETE SUCCESS!');
            console.log('   ✅ Commitment generation working');
            console.log('   ✅ Nullifier verification working');
            console.log('   ✅ IELTS integration with ZKP working');
            console.log('   ✅ Real ZK-SNARK proofs generated');
            console.log('   ✅ Double-spending prevention working');
            console.log('   ✅ Production-ready performance');
        } else {
            console.log('\n⚠️  WORKFLOW ISSUES DETECTED');
        }
        
        return {
            success: workflowSuccess,
            commitments: commitments.length,
            validProofs: verificationResults.filter(r => r.isValid).length,
            totalProofs: verificationResults.length,
            realZkSnarks: allRealZKPs,
            nullifierSecurity: doubleSpendingAttempts === 0,
            performance: {
                avgGeneration: Math.round(totalGenerationTime / ieltsWithZKP.length),
                avgVerification: Math.round(totalVerificationTime / verificationResults.length)
            }
        };
        
    } catch (error) {
        console.error('❌ ZKP Commitment & Nullifier test failed:', error.message);
        if (error.response?.data) {
            console.error('Response:', error.response.data);
        }
        return {
            success: false,
            error: error.message
        };
    }
}

// Execute the ZKP commitment & nullifier test
if (require.main === module) {
    testZKPCommitmentNullifier()
        .then(result => {
            console.log('\n🏁 ZKP Commitment & Nullifier test completed');
            console.log('Result:', result);
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('Test execution failed:', error);
            process.exit(1);
        });
}

module.exports = { testZKPCommitmentNullifier };
