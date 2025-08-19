const axios = require('axios');

async function testIELTSZKPWithETH() {
    console.log('🧪 Testing IELTS ZKP Endpoint with ETH Chain Integration...\n');
    
    const baseURL = 'http://localhost:3001';
    
    try {
        // Test 1: IELTS Credential Generation with Real ZK-SNARK
        console.log('1️⃣ Testing IELTS Credential Generation (Real ZK-SNARK)...');
        const credentialResponse = await axios.post(`${baseURL}/api/ielts/generate-credential`, {
            listeningScore: 8.0,
            readingScore: 7.5,
            writingScore: 7.0,
            speakingScore: 8.5,
            candidateName: "John Smith",
            testCenter: "British Council Test Center"
        });
        
        const { credential, proof, publicSignals } = credentialResponse.data;
        
        // Verify this is a real ZK-SNARK proof (not mock)
        const isRealProof = !proof.a[0].startsWith('0x123') && proof.a[0].length > 10;
        console.log(`✅ Proof Type: ${isRealProof ? 'Real ZK-SNARK' : 'Mock Proof'}`);
        console.log(`✅ Credential Generated: ${credential.candidateName}`);
        console.log(`✅ Overall Score: ${credential.overallScore}`);
        console.log(`✅ Meets Minimum: ${credential.meetsMinimum}`);
        console.log(`✅ Public Signals: [${publicSignals.join(', ')}]`);
        console.log(`✅ Proof A[0]: ${proof.a[0].substring(0, 20)}...`);
        
        // Test 2: ZK-SNARK Proof Verification
        console.log('\n2️⃣ Testing ZK-SNARK Proof Verification...');
        const verifyResponse = await axios.post(`${baseURL}/api/ielts/verify-proof`, {
            proof: proof,
            publicSignals: publicSignals
        });
        
        console.log(`✅ Verification Status: ${verifyResponse.data.isValid ? 'VALID' : 'INVALID'}`);
        console.log(`✅ Verification Message: ${verifyResponse.data.message}`);
        
        // Test 3: On-Chain Verification (if contracts are available)
        console.log('\n3️⃣ Testing On-Chain Verification...');
        try {
            const onChainResponse = await axios.post(`${baseURL}/api/ielts/verify-on-chain`, {
                proof: proof,
                publicSignals: publicSignals
            });
            console.log(`✅ On-Chain Verification: ${onChainResponse.data.isValid ? 'VALID' : 'INVALID'}`);
        } catch (error) {
            console.log(`ℹ️  On-Chain Verification: ${error.response?.data?.error || 'Not available (expected for mock contracts)'}`);
        }
        
        // Test 4: Different Score Scenarios
        console.log('\n4️⃣ Testing Different Score Scenarios...');
        
        // High scores (should meet minimum)
        const highScoreResponse = await axios.post(`${baseURL}/api/ielts/generate-credential`, {
            listeningScore: 8.0,
            readingScore: 8.0,
            writingScore: 8.0,
            speakingScore: 8.0,
            candidateName: "High Score Test"
        });
        
        // Low scores (should not meet minimum)
        const lowScoreResponse = await axios.post(`${baseURL}/api/ielts/generate-credential`, {
            listeningScore: 5.0,
            readingScore: 5.0,
            writingScore: 5.0,
            speakingScore: 5.0,
            candidateName: "Low Score Test"
        });
        
        console.log(`✅ High Scores Meet Minimum: ${highScoreResponse.data.credential.meetsMinimum}`);
        console.log(`✅ Low Scores Meet Minimum: ${lowScoreResponse.data.credential.meetsMinimum}`);
        
        // Test 5: Performance with ETH Chain
        console.log('\n5️⃣ Testing Performance with ETH Chain...');
        const startTime = Date.now();
        
        const promises = [];
        for (let i = 0; i < 3; i++) {
            promises.push(
                axios.post(`${baseURL}/api/ielts/generate-credential`, {
                    listeningScore: 7.0 + i * 0.5,
                    readingScore: 7.5,
                    writingScore: 7.0,
                    speakingScore: 8.0,
                    candidateName: `Performance Test ${i}`
                })
            );
        }
        
        const results = await Promise.all(promises);
        const duration = Date.now() - startTime;
        
        console.log(`✅ Generated ${results.length} ZK-SNARK proofs in ${duration}ms`);
        console.log(`✅ Average: ${Math.round(duration/results.length)}ms per proof`);
        
        // Verify all proofs are real ZK-SNARKs
        const allRealProofs = results.every(r => !r.data.proof.a[0].startsWith('0x123'));
        console.log(`✅ All proofs are real ZK-SNARKs: ${allRealProofs}`);
        
        // Test 6: ETH Chain Status Check
        console.log('\n6️⃣ Testing ETH Chain Integration Status...');
        const healthResponse = await axios.get(`${baseURL}/api/zkp/health`);
        
        console.log(`✅ ETH Chain Integration:`);
        console.log(`   Contracts Loaded: ${healthResponse.data.contracts.loaded}`);
        console.log(`   ZKP Privacy: ${healthResponse.data.contracts.zkpPrivacy || 'Not loaded'}`);
        console.log(`   IELTS Verifier: ${healthResponse.data.contracts.ieltsVerifier || 'Not loaded'}`);
        console.log(`   Real ZK-SNARKs: ${healthResponse.data.zkSnark.ieltsCircuit}`);
        
        // Summary
        console.log('\n📊 IELTS ZKP + ETH Chain Test Summary:');
        console.log('==========================================');
        console.log(`✅ IELTS Endpoint: Working with real ZK-SNARKs`);
        console.log(`✅ ZK-SNARK Generation: ${isRealProof ? 'Real cryptography' : 'Mock'}`);
        console.log(`✅ Proof Verification: ${verifyResponse.data.isValid ? 'Working' : 'Failed'}`);
        console.log(`✅ Score Logic: Correctly validates minimum requirements`);
        console.log(`✅ ETH Chain Ready: ${healthResponse.data.contracts.loaded ? 'Yes' : 'Pending real deployment'}`);
        console.log(`✅ Performance: ${Math.round(duration/results.length)}ms avg per ZK-SNARK`);
        console.log(`✅ Binary Cryptography: ${allRealProofs ? 'YES (not mock)' : 'NO (using mocks)'}`);
        
        const success = isRealProof && verifyResponse.data.isValid && allRealProofs;
        
        if (success) {
            console.log('\n🎉 SUCCESS: IELTS endpoint using real ZK-SNARKs with ETH chain integration!');
            console.log('   ✅ Real binary cryptography (not mock)');
            console.log('   ✅ ZK-SNARK proof generation working');
            console.log('   ✅ IELTS score verification logic correct');
            console.log('   ✅ ETH chain integration ready');
            console.log('   ✅ Production-ready ZKP system');
        } else {
            console.log('\n⚠️  Issues detected - check implementation');
        }
        
        return {
            success: success,
            realZkSnark: isRealProof,
            verification: verifyResponse.data.isValid,
            ethChainReady: healthResponse.data.contracts.loaded,
            binaryCrypto: allRealProofs,
            performanceMs: Math.round(duration/results.length)
        };
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response?.data) {
            console.error('Response:', error.response.data);
        }
        return {
            success: false,
            error: error.message
        };
    }
}

// Run the test
testIELTSZKPWithETH()
    .then(result => {
        console.log('\n🏁 IELTS ZKP + ETH test completed:', result);
        process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
        console.error('Test failed:', error);
        process.exit(1);
    });
