// AWS Lambda function example for connecting to VPS Ethereum node
// This demonstrates the VPS + Lambda architecture

const https = require('https');
const http = require('http');

// Configuration - replace with your VPS IP/domain
const VPS_RPC_URL = 'http://YOUR_VPS_IP:8545';

// Example Lambda handler
exports.handler = async (event) => {
    try {
        console.log('Lambda triggered with event:', JSON.stringify(event));
        
        // 1. Get current gas price from VPS node
        const gasPrice = await getRPCCall('eth_gasPrice', []);
        console.log('Current gas price:', gasPrice);
        
        // 2. Get current block number
        const blockNumber = await getRPCCall('eth_blockNumber', []);
        console.log('Current block:', parseInt(blockNumber, 16));
        
        // 3. Get account balance (example with pre-funded account)
        const balance = await getRPCCall('eth_getBalance', [
            '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
            'latest'
        ]);
        console.log('Account balance:', balance);
        
        // 4. Example: Build and sign transaction (simplified)
        const txParams = {
            from: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
            to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
            value: '0x16345785d8a0000', // 0.1 ETH
            gas: '0x5208', // 21000
            gasPrice: gasPrice,
            nonce: await getRPCCall('eth_getTransactionCount', [
                '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
                'latest'
            ])
        };
        
        // 5. Send transaction to VPS
        // Note: In production, sign the transaction in Lambda before sending
        const txHash = await getRPCCall('eth_sendTransaction', [txParams]);
        console.log('Transaction sent:', txHash);
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                gasPrice: gasPrice,
                blockNumber: parseInt(blockNumber, 16),
                transactionHash: txHash
            })
        };
        
    } catch (error) {
        console.error('Lambda error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                error: error.message
            })
        };
    }
};

// Helper function to make RPC calls to VPS
async function getRPCCall(method, params) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            jsonrpc: '2.0',
            method: method,
            params: params,
            id: 1
        });
        
        const url = new URL(VPS_RPC_URL);
        const options = {
            hostname: url.hostname,
            port: url.port || 8545,
            path: '/',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    if (response.error) {
                        reject(new Error(response.error.message));
                    } else {
                        resolve(response.result);
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });
        
        req.on('error', (e) => {
            reject(e);
        });
        
        req.write(postData);
        req.end();
    });
}

// Example deployment package.json
/*
{
  "name": "ethereum-lambda",
  "version": "1.0.0",
  "description": "Lambda function for Ethereum VPS interaction",
  "main": "lambda-example.js",
  "dependencies": {
    "ethers": "^6.0.0"
  }
}
*/
