const { ethers } = require('ethers');
const axios = require('axios');

async function testEthIntegration() {
    try {
        console.log('🧪 Testing ZKP + Ethereum Integration...');
        
        // Test ZKP API
        console.log('\n1. Testing ZKP API...');
        const zkpResponse = await axios.post('http://localhost:3001/api/zkp/generate-commitment', {
            secret: "123",
            salt: "456", 
            amount: "100"
        });
        
        console.log('✅ ZKP Commitment generated:', zkpResponse.data.commitment);
        console.log('✅ ZKP Nullifier generated:', zkpResponse.data.nullifier);
        
        // Test Ethereum RPC
        console.log('\n2. Testing Ethereum RPC...');
        const ethResponse = await axios.post('http://localhost:8545', {
            jsonrpc: '2.0',
            method: 'eth_blockNumber',
            params: [],
            id: 1
        }, {
            headers: { 'Content-Type': 'application/json' }
        });
        
        console.log('✅ Ethereum block number:', ethResponse.data.result);
        
        // Test account balance
        const balanceResponse = await axios.post('http://localhost:8545', {
            jsonrpc: '2.0',
            method: 'eth_getBalance',
            params: ['0x0000000000000000000000000000000000000001', 'latest'],
            id: 1
        }, {
            headers: { 'Content-Type': 'application/json' }
        });
        
        const balance = ethers.utils.formatEther(balanceResponse.data.result);
        console.log('✅ Pre-funded account balance:', balance, 'ETH');
        
        // Test gas price
        const gasResponse = await axios.post('http://localhost:8545', {
            jsonrpc: '2.0',
            method: 'eth_gasPrice',
            params: [],
            id: 1
        }, {
            headers: { 'Content-Type': 'application/json' }
        });
        
        const gasPrice = ethers.utils.formatUnits(gasResponse.data.result, 'gwei');
        console.log('✅ Current gas price:', gasPrice, 'Gwei');
        
        console.log('\n🎉 Integration test completed successfully!');
        console.log('\n📋 Summary:');
        console.log('  - ZKP API: ✅ Working');
        console.log('  - Ethereum RPC: ✅ Working');
        console.log('  - Pre-funded accounts: ✅ Available');
        console.log('  - Gas pricing: ✅ Working');
        
        return {
            zkpCommitment: zkpResponse.data.commitment,
            zkpNullifier: zkpResponse.data.nullifier,
            ethBlockNumber: ethResponse.data.result,
            accountBalance: balance,
            gasPrice: gasPrice
        };
        
    } catch (error) {
        console.error('❌ Integration test failed:', error.message);
        throw error;
    }
}

testEthIntegration()
    .then(result => {
        console.log('\n📊 Test Results:', JSON.stringify(result, null, 2));
    })
    .catch(error => {
        console.error('Test failed:', error);
        process.exit(1);
    });
