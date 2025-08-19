// API Examples for Private Ethereum Network
// These examples demonstrate common RPC interactions

// Using ethers.js
const { ethers } = require('ethers');

async function apiExamples() {
    // Connect to the network
    const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
    
    // 1. Basic Network Info
    console.log('=== Network Information ===');
    const blockNumber = await provider.getBlockNumber();
    const network = await provider.getNetwork();
    console.log('Current block:', blockNumber);
    console.log('Network:', network);
    
    // 2. Account Balance
    console.log('\n=== Account Balance ===');
    const balance = await provider.getBalance('0x0000000000000000000000000000000000000001');
    console.log('Balance:', ethers.utils.formatEther(balance), 'ETH');
    
    // 3. Gas Price
    console.log('\n=== Gas Information ===');
    const gasPrice = await provider.getGasPrice();
    console.log('Gas Price:', ethers.utils.formatUnits(gasPrice, 'gwei'), 'Gwei');
    
    // 4. Send Transaction
    console.log('\n=== Transaction Example ===');
    // Create wallet (replace with your private key in production)
    const wallet = new ethers.Wallet('0x...private key...', provider);
    
    const tx = {
        to: "0x0000000000000000000000000000000000000002",
        value: ethers.utils.parseEther("0.1"),
        gasLimit: 21000,
        gasPrice: gasPrice
    };
    
    try {
        const txResponse = await wallet.sendTransaction(tx);
        console.log('Transaction hash:', txResponse.hash);
        
        // Wait for confirmation
        const receipt = await txResponse.wait();
        console.log('Transaction confirmed in block:', receipt.blockNumber);
    } catch (error) {
        console.error('Transaction failed:', error.message);
    }
    
    // 5. Smart Contract Interaction
    console.log('\n=== Smart Contract Example ===');
    const contractABI = [
        "function getValue() view returns (uint256)",
        "function setValue(uint256 value)"
    ];
    const contractAddress = "0x...contract address...";
    const contract = new ethers.Contract(contractAddress, contractABI, provider);
    
    try {
        const value = await contract.getValue();
        console.log('Contract value:', value.toString());
    } catch (error) {
        console.error('Contract call failed:', error.message);
    }
    
    // 6. Event Listening
    console.log('\n=== Event Listening Example ===');
    provider.on('block', (blockNumber) => {
        console.log('New block:', blockNumber);
    });
    
    // 7. Transaction Pool
    console.log('\n=== Transaction Pool Example ===');
    const txPool = await provider.send('txpool_status', []);
    console.log('Pending transactions:', txPool.pending);
    console.log('Queued transactions:', txPool.queued);
    
    // 8. Block Information
    console.log('\n=== Block Information Example ===');
    const block = await provider.getBlock('latest');
    console.log('Latest block:', {
        number: block.number,
        hash: block.hash,
        timestamp: new Date(block.timestamp * 1000),
        transactions: block.transactions.length
    });
    
    // 9. Account Nonce
    console.log('\n=== Account Nonce Example ===');
    const nonce = await provider.getTransactionCount(wallet.address);
    console.log('Current nonce:', nonce);
    
    // 10. Gas Estimation
    console.log('\n=== Gas Estimation Example ===');
    const gasEstimate = await provider.estimateGas({
        to: "0x0000000000000000000000000000000000000002",
        value: ethers.utils.parseEther("0.1")
    });
    console.log('Estimated gas:', gasEstimate.toString());
}

// WebSocket Example
const WebSocket = require('ws');

function websocketExample() {
    const ws = new WebSocket('ws://localhost:8546');
    
    ws.on('open', () => {
        // Subscribe to new blocks
        ws.send(JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_subscribe',
            params: ['newHeads'],
            id: 1
        }));
        
        // Subscribe to pending transactions
        ws.send(JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_subscribe',
            params: ['newPendingTransactions'],
            id: 2
        }));
    });
    
    ws.on('message', (data) => {
        const response = JSON.parse(data);
        if (response.method === 'eth_subscription') {
            if (response.params.subscription === '0x1') {
                console.log('New block:', response.params.result.number);
            } else if (response.params.subscription === '0x2') {
                console.log('Pending transaction:', response.params.result);
            }
        }
    });
    
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
}

// Raw JSON-RPC Examples
const axios = require('axios');

async function rawJsonRpcExamples() {
    const rpcUrl = 'http://localhost:8545';
    
    async function rpcCall(method, params = []) {
        const response = await axios.post(rpcUrl, {
            jsonrpc: '2.0',
            method: method,
            params: params,
            id: 1
        });
        return response.data.result;
    }
    
    // Examples of raw JSON-RPC calls
    console.log('\n=== Raw JSON-RPC Examples ===');
    
    // Get block number
    const blockNumber = await rpcCall('eth_blockNumber');
    console.log('Block number:', parseInt(blockNumber, 16));
    
    // Get balance
    const balance = await rpcCall('eth_getBalance', [
        '0x0000000000000000000000000000000000000001',
        'latest'
    ]);
    console.log('Balance:', parseInt(balance, 16));
    
    // Get network version
    const networkVersion = await rpcCall('net_version');
    console.log('Network version:', networkVersion);
}

// Error Handling Example
async function errorHandlingExample() {
    const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
    
    try {
        // Try to get a non-existent block
        await provider.getBlock(999999999);
    } catch (error) {
        console.error('Expected error:', error.message);
    }
    
    try {
        // Try to send transaction without gas
        const tx = { to: "0x1234..." };
        await provider.sendTransaction(tx);
    } catch (error) {
        console.error('Expected error:', error.message);
    }
}

// Run examples
async function runExamples() {
    try {
        await apiExamples();
        websocketExample();
        await rawJsonRpcExamples();
        await errorHandlingExample();
    } catch (error) {
        console.error('Example execution failed:', error);
    }
}

runExamples();
