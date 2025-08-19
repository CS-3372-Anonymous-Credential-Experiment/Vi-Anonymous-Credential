const { ethers } = require('ethers');
const fs = require('fs');
require('dotenv').config();
const path = require('path'); // Added missing import for path

async function deployContract() {
    try {
        console.log('🚀 Deploying ZKP Verifier Contract...');
        
        // Initialize provider
        const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL || 'http://localhost:8545');
        
        // Get deployer account
        const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
        if (!privateKey) {
            throw new Error('DEPLOYER_PRIVATE_KEY environment variable not set');
        }
        
        const wallet = new ethers.Wallet(privateKey, provider);
        console.log('📡 Connected to network:', await provider.getNetwork());
        console.log('👤 Deployer address:', wallet.address);
        
        // Read contract bytecode and ABI
        const contractPath = path.join(__dirname, '../contracts/ZKPVerifier.sol');
        if (!fs.existsSync(contractPath)) {
            throw new Error('ZKPVerifier.sol not found. Please compile contracts first.');
        }
        
        // For now, we'll use a simplified deployment
        // In production, use Hardhat or Truffle for compilation
        const contractABI = [
            "constructor()",
            "function deposit(bytes32 commitment) external payable",
            "function verifyAndWithdraw(tuple(uint256[2] a, uint256[2][2] b, uint256[2] c) proof, uint256[2] input, bytes32 nullifier, address payable recipient, uint256 amount) external"
        ];
        
        // Deploy contract
        const contractFactory = new ethers.ContractFactory(contractABI, [], wallet);
        const contract = await contractFactory.deploy();
        await contract.waitForDeployment();
        
        const contractAddress = await contract.getAddress();
        console.log('✅ Contract deployed at:', contractAddress);
        
        // Save deployment info
        const deploymentInfo = {
            contractAddress: contractAddress,
            deployer: wallet.address,
            network: (await provider.getNetwork()).name,
            timestamp: new Date().toISOString()
        };
        
        fs.writeFileSync('deployment.json', JSON.stringify(deploymentInfo, null, 2));
        console.log('📄 Deployment info saved to deployment.json');
        
        return contractAddress;
    } catch (error) {
        console.error('❌ Deployment failed:', error.message);
        throw error;
    }
}

if (require.main === module) {
    deployContract()
        .then(address => {
            console.log('\n🎉 Deployment completed successfully!');
            console.log('Contract address:', address);
        })
        .catch(error => {
            console.error('Deployment failed:', error);
            process.exit(1);
        });
}

module.exports = { deployContract };
