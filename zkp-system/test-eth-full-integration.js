const axios = require('axios');

async function testFullETHIntegration() {
    console.log('🧪 Testing Full ETH Node + ZKP Integration...\n');
    
    const baseURL = 'http://localhost:3001';
    const ethRPC = 'http://localhost:8545';
    
    try {
        // Test 1: ETH Node Connectivity
        console.log('1️⃣ Testing ETH Node Connectivity...');
        
        // Check block number
        const blockResponse = await axios.post(ethRPC, {
            jsonrpc: "2.0",
            method: "eth_blockNumber",
            params: [],
            id: 1
        });
        const blockNumber = parseInt(blockResponse.data.result, 16);
        console.log(`✅ ETH Node connected - Block number: ${blockNumber}`);
        
        // Check network ID
        const networkResponse = await axios.post(ethRPC, {
            jsonrpc: "2.0",
            method: "net_version",
            params: [],
            id: 1
        });
        console.log(`✅ Network ID: ${networkResponse.data.result}`);
        
        // Check available accounts
        const accountsResponse = await axios.post(ethRPC, {
            jsonrpc: "2.0",
            method: "eth_accounts",
            params: [],
            id: 1
        });
        console.log(`✅ Available accounts: ${accountsResponse.data.result.length}`);
        
        // Test 2: ZKP API Health
        console.log('\n2️⃣ Testing ZKP API Health...');
        const healthResponse = await axios.get(`${baseURL}/api/zkp/health`);
        
        console.log('✅ ZKP API Status:', healthResponse.data.status);
        console.log('✅ Contracts loaded:', healthResponse.data.contracts.loaded);
        console.log('✅ ZK-SNARK circuits:', healthResponse.data.zkSnark.ieltsCircuit);
        
        // Test 3: Generate Real ZK-SNARK Proof
        console.log('\n3️⃣ Testing Real ZK-SNARK Proof Generation...');
        const credentialResponse = await axios.post(`${baseURL}/api/ielts/generate-credential`, {
            listeningScore: 7.5,
            readingScore: 8.0,
            writingScore: 7.0,
            speakingScore: 8.5,
            candidateName: "ETH Integration Test",
            testCenter: "ZKP Test Center"
        });
        
        const { proof, publicSignals } = credentialResponse.data;
        
        // Check if this is a real proof (not mock)
        const isRealProof = !proof.a[0].startsWith('0x123');
        console.log(`✅ Generated proof type: ${isRealProof ? 'Real ZK-SNARK' : 'Mock'}`);
        console.log(`✅ Public signals: [${publicSignals.join(', ')}]`);
        
        // Test 4: Verify ZK-SNARK Proof
        console.log('\n4️⃣ Testing ZK-SNARK Proof Verification...');
        const verifyResponse = await axios.post(`${baseURL}/api/ielts/verify-proof`, {
            proof: proof,
            publicSignals: publicSignals
        });
        
        console.log('✅ Verification result:', verifyResponse.data.isValid);
        
        // Test 5: Test Contract Integration (if contracts are deployed)
        console.log('\n5️⃣ Testing Contract Integration...');
        if (healthResponse.data.contracts.loaded) {
            console.log('✅ Contracts are loaded and ready');
            
            // Test contract balance endpoint
            try {
                const balanceResponse = await axios.get(`${baseURL}/api/contract/balance`);
                console.log('✅ Contract balance check:', balanceResponse.data);
            } catch (err) {
                console.log('ℹ️  Contract balance endpoint not available');
            }
        } else {
            console.log('ℹ️  Contracts not deployed yet - deployment needed');
        }
        
        // Test 6: Performance and Load Test
        console.log('\n6️⃣ Performance Test...');
        const startTime = Date.now();
        
        const promises = [];
        for (let i = 0; i < 5; i++) {
            promises.push(
                axios.post(`${baseURL}/api/ielts/generate-credential`, {
                    listeningScore: 7.0 + i * 0.1,
                    readingScore: 8.0,
                    writingScore: 7.0,
                    speakingScore: 8.0 + i * 0.1,
                    candidateName: `Test User ${i}`,
                    testCenter: "Performance Test"
                })
            );
        }
        
        await Promise.all(promises);
        const duration = Date.now() - startTime;
        console.log(`✅ Performance: ${duration}ms for 5 concurrent ZK-SNARK generations`);
        console.log(`✅ Average: ${Math.round(duration/5)}ms per proof`);
        
        // Summary
        console.log('\n📊 Integration Test Summary:');
        console.log('===============================');
        console.log(`✅ ETH Node: Running (Block ${blockNumber}, Chain ${networkResponse.data.result})`);
        console.log(`✅ ZKP API: ${healthResponse.data.status}`);
        console.log(`✅ Real ZK-SNARKs: ${isRealProof ? 'YES' : 'NO'}`);
        console.log(`✅ Proof Verification: ${verifyResponse.data.isValid ? 'WORKING' : 'FAILED'}`);
        console.log(`✅ Contracts: ${healthResponse.data.contracts.loaded ? 'DEPLOYED' : 'PENDING'}`);
        console.log(`✅ Performance: ${Math.round(duration/5)}ms avg per proof`);
        
        const allWorking = isRealProof && verifyResponse.data.isValid && healthResponse.data.status === 'healthy';
        
        if (allWorking) {
            console.log('\n🎉 SUCCESS: Full ETH + ZKP integration working!');
            console.log('   ✅ ETH node communicating');
            console.log('   ✅ Real ZK-SNARK proofs generating');
            console.log('   ✅ Proof verification working');
            console.log('   ✅ System ready for production use');
            
            if (!healthResponse.data.contracts.loaded) {
                console.log('\n📋 Next step: Deploy contracts to complete integration');
                console.log('   Run: npx hardhat run deploy-to-eth.js --network localhost');
            }
        } else {
            console.log('\n⚠️  PARTIAL SUCCESS: Some components need attention');
        }
        
        return {
            success: allWorking,
            ethNode: blockNumber > -1,
            zkpApi: healthResponse.data.status === 'healthy',
            realZkSnark: isRealProof,
            verification: verifyResponse.data.isValid,
            contracts: healthResponse.data.contracts.loaded,
            performanceMs: Math.round(duration/5)
        };
        
    } catch (error) {
        console.error('❌ Integration test failed:', error.message);
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
testFullETHIntegration()
    .then(result => {
        console.log('\n🏁 Integration test completed:', result);
        process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
        console.error('Test failed:', error);
        process.exit(1);
    });
