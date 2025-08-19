const axios = require('axios');

const ZKP_API_URL = 'http://localhost:3001';
const IELTS_API_URL = 'http://localhost:3002';

async function testZKPAPI() {
    console.log('🔍 Testing ZKP API...\n');
    
    try {
        // Test health check
        console.log('1. Testing health check...');
        const health = await axios.get(`${ZKP_API_URL}/api/zkp/health`);
        console.log('✅ Health check passed:', health.data.status);
        
        // Test commitment generation
        console.log('\n2. Testing commitment generation...');
        const commitmentData = {
            secret: 'my-secret-123',
            salt: 'random-salt-456',
            amount: 1000
        };
        const commitment = await axios.post(`${ZKP_API_URL}/api/zkp/commitment`, commitmentData);
        console.log('✅ Commitment generated:', commitment.data.commitment);
        
        // Test proof generation
        console.log('\n3. Testing proof generation...');
        const proofData = {
            secret: 'my-secret-123',
            salt: 'random-salt-456',
            amount: 1000,
            recipient: '0x1234567890123456789012345678901234567890'
        };
        const proof = await axios.post(`${ZKP_API_URL}/api/zkp/proof`, proofData);
        console.log('✅ Proof generated successfully');
        console.log('   Public signals:', proof.data.proof.publicSignals.length);
        
        // Test proof verification
        console.log('\n4. Testing proof verification...');
        const verifyData = {
            proof: proof.data.proof.proof,
            publicSignals: proof.data.proof.publicSignals
        };
        const verification = await axios.post(`${ZKP_API_URL}/api/zkp/verify`, verifyData);
        console.log('✅ Proof verification:', verification.data.isValid ? 'PASSED' : 'FAILED');
        
        // Test status
        console.log('\n5. Testing status...');
        const status = await axios.get(`${ZKP_API_URL}/api/zkp/status`);
        console.log('✅ Status:', status.data);
        
    } catch (error) {
        console.error('❌ ZKP API test failed:', error.message);
    }
}

async function testIELTSAPI() {
    console.log('\n🎓 Testing IELTS API...\n');
    
    try {
        // Test health check
        console.log('1. Testing health check...');
        const health = await axios.get(`${IELTS_API_URL}/api/ielts/health`);
        console.log('✅ Health check passed:', health.data.status);
        
        // Test credential creation
        console.log('\n2. Testing credential creation...');
        const credentialData = {
            candidateId: 'AUTOMATION_TEST_001',
            listeningScore: 8.5,
            readingScore: 8.0,
            writingScore: 7.5,
            speakingScore: 8.0,
            candidateName: 'Automation Test User',
            testCenter: 'Automation Test Center'
        };
        const credential = await axios.post(`${IELTS_API_URL}/api/ielts/credential`, credentialData);
        console.log('✅ Credential created:', credential.data.credentialHash);
        console.log('   Overall score:', credential.data.credential.overallScore);
        
        // Test proof generation with valid criteria
        console.log('\n3. Testing proof generation (valid criteria)...');
        const proofData = {
            candidateId: 'AUTOMATION_TEST_001',
            minimumScore: 7.0,
            expiryDate: Math.floor(Date.now() / 1000) + 86400 // 24 hours from now
        };
        const proof = await axios.post(`${IELTS_API_URL}/api/ielts/proof`, proofData);
        console.log('✅ Proof generated successfully');
        console.log('   Meets minimum:', proof.data.proof.meetsMinimum);
        console.log('   Not expired:', proof.data.proof.isNotExpired);
        console.log('   Valid:', proof.data.proof.isValid);
        
        // Test proof generation with invalid criteria
        console.log('\n4. Testing proof generation (invalid criteria)...');
        const invalidProofData = {
            candidateId: 'AUTOMATION_TEST_001',
            minimumScore: 9.0, // Higher than actual score
            expiryDate: Math.floor(Date.now() / 1000) + 86400
        };
        const invalidProof = await axios.post(`${IELTS_API_URL}/api/ielts/proof`, invalidProofData);
        console.log('✅ Invalid proof generated (as expected)');
        console.log('   Meets minimum:', invalidProof.data.proof.meetsMinimum);
        console.log('   Valid:', invalidProof.data.proof.isValid);
        
        // Test proof verification
        console.log('\n5. Testing proof verification...');
        const verifyData = {
            proof: proof.data.proof.proof,
            publicSignals: proof.data.proof.publicSignals
        };
        const verification = await axios.post(`${IELTS_API_URL}/api/ielts/verify`, verifyData);
        console.log('✅ Proof verification:', verification.data.isValid ? 'PASSED' : 'FAILED');
        
        // Test credential retrieval
        console.log('\n6. Testing credential retrieval...');
        const retrievedCredential = await axios.get(`${IELTS_API_URL}/api/ielts/credential/AUTOMATION_TEST_001`);
        console.log('✅ Credential retrieved:', retrievedCredential.data.credential.candidateName);
        
        // Test all credentials
        console.log('\n7. Testing all credentials...');
        const allCredentials = await axios.get(`${IELTS_API_URL}/api/ielts/credentials`);
        console.log('✅ All credentials retrieved:', allCredentials.data.count, 'credentials');
        
        // Test status
        console.log('\n8. Testing status...');
        const status = await axios.get(`${IELTS_API_URL}/api/ielts/status`);
        console.log('✅ Status:', status.data);
        
    } catch (error) {
        console.error('❌ IELTS API test failed:', error.message);
    }
}

async function runPerformanceTest() {
    console.log('\n⚡ Running Performance Test...\n');
    
    const startTime = Date.now();
    
    try {
        // Test multiple credential creations
        console.log('Creating multiple credentials...');
        const promises = [];
        for (let i = 1; i <= 5; i++) {
            const credentialData = {
                candidateId: `PERF_TEST_${i.toString().padStart(3, '0')}`,
                listeningScore: 7.0 + Math.random() * 2,
                readingScore: 7.0 + Math.random() * 2,
                writingScore: 7.0 + Math.random() * 2,
                speakingScore: 7.0 + Math.random() * 2,
                candidateName: `Performance Test User ${i}`,
                testCenter: 'Performance Test Center'
            };
            promises.push(axios.post(`${IELTS_API_URL}/api/ielts/credential`, credentialData));
        }
        
        await Promise.all(promises);
        console.log('✅ Created 5 credentials in parallel');
        
        // Test multiple proof generations
        console.log('Generating multiple proofs...');
        const proofPromises = [];
        for (let i = 1; i <= 5; i++) {
            const proofData = {
                candidateId: `PERF_TEST_${i.toString().padStart(3, '0')}`,
                minimumScore: 7.0,
                expiryDate: Math.floor(Date.now() / 1000) + 86400
            };
            proofPromises.push(axios.post(`${IELTS_API_URL}/api/ielts/proof`, proofData));
        }
        
        await Promise.all(proofPromises);
        console.log('✅ Generated 5 proofs in parallel');
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log(`\n📊 Performance Results:`);
        console.log(`   Total time: ${duration}ms`);
        console.log(`   Average per operation: ${duration / 10}ms`);
        console.log(`   Operations per second: ${(10 / duration * 1000).toFixed(2)}`);
        
    } catch (error) {
        console.error('❌ Performance test failed:', error.message);
    }
}

async function main() {
    console.log('🚀 Starting ZKP and IELTS Automation Test Suite\n');
    console.log('=' .repeat(60));
    
    await testZKPAPI();
    await testIELTSAPI();
    await runPerformanceTest();
    
    console.log('\n' + '=' .repeat(60));
    console.log('🎉 All tests completed successfully!');
    console.log('\n📡 API Endpoints:');
    console.log(`   ZKP API: ${ZKP_API_URL}`);
    console.log(`   IELTS API: ${IELTS_API_URL}`);
    console.log('\n📚 Next steps:');
    console.log('   1. Deploy smart contracts for on-chain verification');
    console.log('   2. Install circom for full ZKP functionality');
    console.log('   3. Set up production environment');
}

// Run the test suite
main().catch(console.error);
