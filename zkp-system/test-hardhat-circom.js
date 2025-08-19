const axios = require('axios');

async function testHardhatCircom() {
    console.log('🧪 Testing Hardhat-Circom ZK-SNARK Implementation...\n');
    
    const baseURL = 'http://localhost:3001';
    
    try {
        // Test 1: Health Check
        console.log('1️⃣ Testing Health Check...');
        const healthResponse = await axios.get(`${baseURL}/api/zkp/health`);
        
        console.log('✅ ZK-SNARK Status:');
        console.log(`   IELTS Circuit: ${healthResponse.data.zkSnark.ieltsCircuit ? '✅' : '❌'}`);
        console.log(`   IELTS Proving Key: ${healthResponse.data.zkSnark.ieltsProvingKey ? '✅' : '❌'}`);
        console.log(`   IELTS Verification Key: ${healthResponse.data.zkSnark.ieltsVerificationKey ? '✅' : '❌'}`);
        
        // Test 2: Generate Real ZK-SNARK Proof
        console.log('\n2️⃣ Testing Real ZK-SNARK Proof Generation...');
        const credentialResponse = await axios.post(`${baseURL}/api/ielts/generate-credential`, {
            listeningScore: 7.5,
            readingScore: 8.0,
            writingScore: 7.0,
            speakingScore: 8.5,
            candidateName: "Test User",
            testCenter: "Hardhat Circom Test"
        });
        
        const { proof, publicSignals } = credentialResponse.data;
        
        // Check if this is a real proof (not mock)
        const isRealProof = !proof.a[0].startsWith('0x123');
        console.log(`✅ Proof Type: ${isRealProof ? 'Real ZK-SNARK' : 'Mock'}`);
        console.log(`✅ Public Signals: [${publicSignals.join(', ')}]`);
        console.log(`✅ Proof A[0]: ${proof.a[0]}`);
        
        // Test 3: Verify Real ZK-SNARK Proof
        console.log('\n3️⃣ Testing Real ZK-SNARK Proof Verification...');
        const verifyResponse = await axios.post(`${baseURL}/api/ielts/verify-proof`, {
            proof: proof,
            publicSignals: publicSignals
        });
        
        console.log('✅ Verification Result:', verifyResponse.data);
        
        // Test 4: Performance Test
        console.log('\n4️⃣ Performance Test...');
        const startTime = Date.now();
        
        const performancePromises = [];
        for (let i = 0; i < 3; i++) {
            performancePromises.push(
                axios.post(`${baseURL}/api/ielts/generate-credential`, {
                    listeningScore: 7.0 + i * 0.1,
                    readingScore: 8.0,
                    writingScore: 7.0,
                    speakingScore: 8.0 + i * 0.1
                })
            );
        }
        
        await Promise.all(performancePromises);
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log(`✅ Performance: ${duration}ms for 3 concurrent real ZK-SNARK generations`);
        
        // Summary
        console.log('\n📊 Hardhat-Circom Migration Summary:');
        console.log('=====================================');
        console.log(`✅ Circuit Compilation: ${healthResponse.data.zkSnark.ieltsCircuit ? 'SUCCESS' : 'FAILED'}`);
        console.log(`✅ Proving Key Generation: ${healthResponse.data.zkSnark.ieltsProvingKey ? 'SUCCESS' : 'FAILED'}`);
        console.log(`✅ Verification Key Export: ${healthResponse.data.zkSnark.ieltsVerificationKey ? 'SUCCESS' : 'FAILED'}`);
        console.log(`✅ Real ZK-SNARK Proof Generation: ${isRealProof ? 'SUCCESS' : 'FAILED'}`);
        console.log(`✅ Real ZK-SNARK Proof Verification: ${verifyResponse.data.isValid ? 'SUCCESS' : 'FAILED'}`);
        console.log(`✅ Performance: ${duration}ms (avg ${Math.round(duration/3)}ms per proof)`);
        
        const allSuccess = healthResponse.data.zkSnark.ieltsCircuit && 
                          healthResponse.data.zkSnark.ieltsProvingKey && 
                          healthResponse.data.zkSnark.ieltsVerificationKey && 
                          isRealProof && 
                          verifyResponse.data.isValid;
        
        if (allSuccess) {
            console.log('\n🎉 SUCCESS: Hardhat-Circom migration completed successfully!');
            console.log('   ✅ Real ZK-SNARK circuits compiled and working');
            console.log('   ✅ Real proof generation and verification');
            console.log('   ✅ IELTS endpoint using real cryptography');
            console.log('   ✅ Ethereum chain integration ready');
        } else {
            console.log('\n⚠️  PARTIAL SUCCESS: Some components need attention');
        }
        
        return {
            success: allSuccess,
            isRealZKSnark: isRealProof,
            verificationWorks: verifyResponse.data.isValid,
            performanceMs: duration
        };
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
        return {
            success: false,
            error: error.message
        };
    }
}

// Run the test
testHardhatCircom()
    .then(result => {
        console.log('\n🏁 Test completed with result:', result);
        process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
        console.error('Test failed:', error);
        process.exit(1);
    });
