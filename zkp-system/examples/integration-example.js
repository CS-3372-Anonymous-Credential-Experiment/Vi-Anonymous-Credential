const axios = require('axios');
const crypto = require('crypto');
const { ethers } = require('ethers');

// Configuration
const ZKP_API_URL = 'http://localhost:3001/api/zkp';
const ETH_RPC_URL = 'http://localhost:8545';

// Example integration with existing Ethereum network
class ZKPIntegration {
    constructor() {
        this.provider = new ethers.JsonRpcProvider(ETH_RPC_URL);
        this.zkpApiUrl = ZKP_API_URL;
    }

    /**
     * Complete ZKP workflow example
     */
    async runCompleteWorkflow() {
        console.log('🚀 Starting ZKP Integration Example...\n');

        try {
            // 1. Check ZKP API health
            await this.checkHealth();

            // 2. Generate test data
            const testData = this.generateTestData();
            console.log('📊 Generated test data:', testData);

            // 3. Generate commitment
            const commitmentData = await this.generateCommitment(testData);
            console.log('🔐 Generated commitment:', commitmentData.commitment);

            // 4. Generate proof
            const proofData = await this.generateProof(testData, commitmentData);
            console.log('🔍 Generated proof successfully');

            // 5. Verify proof
            const verificationResult = await this.verifyProof(proofData);
            console.log('✅ Proof verification result:', verificationResult.isValid);

            // 6. Simulate contract interaction (without actual deployment)
            await this.simulateContractInteraction(commitmentData, proofData);

            console.log('\n🎉 ZKP Integration Example completed successfully!');

        } catch (error) {
            console.error('❌ Integration example failed:', error.message);
            throw error;
        }
    }

    /**
     * Check ZKP API health
     */
    async checkHealth() {
        console.log('🏥 Checking ZKP API health...');
        const response = await axios.get(`${this.zkpApiUrl}/health`);
        
        if (response.data.status === 'healthy') {
            console.log('✅ ZKP API is healthy');
            console.log(`   Curve: ${response.data.curve}`);
            console.log(`   Field Modulus: ${response.data.fieldModulus.substring(0, 20)}...`);
        } else {
            throw new Error('ZKP API is not healthy');
        }
    }

    /**
     * Generate test data
     */
    generateTestData() {
        return {
            secret: crypto.randomBytes(32).toString('hex'),
            salt: crypto.randomBytes(16).toString('hex'),
            amount: Math.floor(Math.random() * 1000) + 1,
            recipient: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
        };
    }

    /**
     * Generate commitment
     */
    async generateCommitment(data) {
        console.log('🔐 Generating commitment...');
        const response = await axios.post(`${this.zkpApiUrl}/generate-commitment`, {
            secret: data.secret,
            salt: data.salt,
            amount: data.amount
        });

        return response.data;
    }

    /**
     * Generate zk-SNARK proof
     */
    async generateProof(data, commitmentData) {
        console.log('🔍 Generating zk-SNARK proof...');
        const response = await axios.post(`${this.zkpApiUrl}/generate-proof`, {
            secret: data.secret,
            salt: data.salt,
            amount: data.amount,
            recipient: data.recipient,
            publicInput: "0"
        });

        return response.data;
    }

    /**
     * Verify proof
     */
    async verifyProof(proofData) {
        console.log('✅ Verifying proof...');
        const response = await axios.post(`${this.zkpApiUrl}/verify-proof`, {
            proof: proofData.proof,
            publicSignals: proofData.publicSignals
        });

        return response.data;
    }

    /**
     * Simulate contract interaction
     */
    async simulateContractInteraction(commitmentData, proofData) {
        console.log('📋 Simulating contract interaction...');
        
        // This would normally interact with a deployed smart contract
        // For this example, we'll just show what the interaction would look like
        
        const contractInteraction = {
            deposit: {
                commitment: commitmentData.commitment,
                amount: commitmentData.amount,
                gasEstimate: '~50,000 gas'
            },
            withdraw: {
                proof: proofData.proof,
                publicSignals: proofData.publicSignals,
                nullifier: commitmentData.nullifier,
                recipient: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
                amount: commitmentData.amount,
                gasEstimate: '~200,000 gas'
            }
        };

        console.log('📄 Contract interaction simulation:');
        console.log('   Deposit transaction:', contractInteraction.deposit);
        console.log('   Withdraw transaction:', contractInteraction.withdraw);
    }

    /**
     * Performance benchmark
     */
    async runPerformanceBenchmark() {
        console.log('\n⚡ Running performance benchmark...');
        
        const iterations = 5;
        const times = [];

        for (let i = 0; i < iterations; i++) {
            const startTime = Date.now();
            
            const testData = this.generateTestData();
            await this.generateCommitment(testData);
            const proofData = await this.generateProof(testData, await this.generateCommitment(testData));
            await this.verifyProof(proofData);
            
            const endTime = Date.now();
            times.push(endTime - startTime);
            
            console.log(`   Iteration ${i + 1}: ${times[i]}ms`);
        }

        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        console.log(`📊 Average time: ${avgTime.toFixed(2)}ms`);
        console.log(`📊 Min time: ${Math.min(...times)}ms`);
        console.log(`📊 Max time: ${Math.max(...times)}ms`);
    }

    /**
     * Test with existing Ethereum accounts
     */
    async testWithExistingAccounts() {
        console.log('\n👥 Testing with existing Ethereum accounts...');
        
        try {
            // Get accounts from the Ethereum node
            const accounts = await this.provider.listAccounts();
            console.log(`📋 Found ${accounts.length} accounts`);
            
            if (accounts.length > 0) {
                const testAccount = accounts[0];
                console.log(`🧪 Using test account: ${testAccount}`);
                
                // Get account balance
                const balance = await this.provider.getBalance(testAccount);
                console.log(`💰 Account balance: ${ethers.formatEther(balance)} ETH`);
                
                // Generate test data with this account
                const testData = {
                    secret: crypto.randomBytes(32).toString('hex'),
                    salt: crypto.randomBytes(16).toString('hex'),
                    amount: Math.floor(Math.random() * 1000) + 1,
                    recipient: testAccount
                };
                
                const commitmentData = await this.generateCommitment(testData);
                console.log(`🔐 Generated commitment for account: ${commitmentData.commitment}`);
            }
        } catch (error) {
            console.log('⚠️  Could not connect to Ethereum node:', error.message);
        }
    }
}

// Run the integration example
async function main() {
    const integration = new ZKPIntegration();
    
    try {
        await integration.runCompleteWorkflow();
        await integration.runPerformanceBenchmark();
        await integration.testWithExistingAccounts();
        
        console.log('\n🎯 Integration example completed successfully!');
        console.log('\n📚 Next steps:');
        console.log('   1. Deploy the ZKPVerifier contract');
        console.log('   2. Test with real transactions');
        console.log('   3. Integrate with your application');
        
    } catch (error) {
        console.error('\n❌ Integration example failed:', error.message);
        process.exit(1);
    }
}

// Run if this file is executed directly
if (require.main === module) {
    main();
}

module.exports = ZKPIntegration;
