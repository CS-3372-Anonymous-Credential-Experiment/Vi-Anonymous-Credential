const { ethers } = require('ethers');
const fs = require('fs');

async function deployContracts() {
    try {
        console.log('🚀 Deploying ZKP Contracts with Funded Accounts...');
        
        // Connect to local Ethereum node
        const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
        
        // Use one of the funded accounts
        // You can replace this with the actual private key from your keystore
        const privateKey = '0x0000000000000000000000000000000000000000000000000000000000000001'; // Replace with actual private key
        const wallet = new ethers.Wallet(privateKey, provider);
        
        console.log('👤 Deploying with account:', wallet.address);
        
        // Check balance
        const balance = await provider.getBalance(wallet.address);
        console.log('💰 Balance:', ethers.utils.formatEther(balance), 'ETH');
        
        if (balance.isZero()) {
            console.log('❌ Account has no ETH balance. Cannot deploy contracts.');
            console.log('💡 Please replace the private key with the correct one from your keystore.');
            return;
        }
        
        // Read compiled contract artifacts
        const zkpPrivacyArtifact = require('./artifacts/contracts/ZKPPrivacyContract.sol/ZKPPrivacyContract.json');
        const zkpVerifierArtifact = require('./artifacts/contracts/ZKPVerifier.sol/ZKPVerifier.json');
        const ieltsVerifierArtifact = require('./artifacts/contracts/IELTSCredentialVerifier.sol/IELTSCredentialVerifier.json');
        
        // Deploy ZKPPrivacyContract
        console.log('\n📦 Deploying ZKPPrivacyContract...');
        const zkpPrivacyFactory = new ethers.ContractFactory(
            zkpPrivacyArtifact.abi,
            zkpPrivacyArtifact.bytecode,
            wallet
        );
        const zkpPrivacy = await zkpPrivacyFactory.deploy();
        await zkpPrivacy.deployed();
        console.log('✅ ZKPPrivacyContract deployed to:', zkpPrivacy.address);
        
        // Deploy ZKPVerifier
        console.log('\n📦 Deploying ZKPVerifier...');
        const zkpVerifierFactory = new ethers.ContractFactory(
            zkpVerifierArtifact.abi,
            zkpVerifierArtifact.bytecode,
            wallet
        );
        const zkpVerifier = await zkpVerifierFactory.deploy();
        await zkpVerifier.deployed();
        console.log('✅ ZKPVerifier deployed to:', zkpVerifier.address);
        
        // Deploy IELTSCredentialVerifier
        console.log('\n📦 Deploying IELTSCredentialVerifier...');
        const ieltsVerifierFactory = new ethers.ContractFactory(
            ieltsVerifierArtifact.abi,
            ieltsVerifierArtifact.bytecode,
            wallet
        );
        const ieltsVerifier = await ieltsVerifierFactory.deploy();
        await ieltsVerifier.deployed();
        console.log('✅ IELTSCredentialVerifier deployed to:', ieltsVerifier.address);
        
        // Test deposit functionality
        console.log('\n🧪 Testing deposit functionality...');
        const testCommitment = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('test-commitment'));
        const depositTx = await zkpPrivacy.deposit(testCommitment, { value: ethers.utils.parseEther('1.0') });
        await depositTx.wait();
        console.log('✅ Test deposit successful (1 ETH)');
        
        // Save deployment info
        const deploymentInfo = {
            network: 'localhost',
            chainId: 15555,
            deployer: wallet.address,
            contracts: {
                zkpPrivacy: zkpPrivacy.address,
                zkpVerifier: zkpVerifier.address,
                ieltsVerifier: ieltsVerifier.address
            },
            timestamp: new Date().toISOString(),
            testCommitment: testCommitment
        };
        
        fs.writeFileSync('deployment-info.json', JSON.stringify(deploymentInfo, null, 2));
        console.log('\n📄 Deployment info saved to deployment-info.json');
        
        console.log('\n🎉 Deployment completed successfully!');
        console.log('\n📋 Contract Addresses:');
        console.log('  ZKPPrivacyContract:', zkpPrivacy.address);
        console.log('  ZKPVerifier:', zkpVerifier.address);
        console.log('  IELTSCredentialVerifier:', ieltsVerifier.address);
        console.log('\n🔗 Network: http://localhost:8545 (Chain ID: 15555)');
        
        return deploymentInfo;
        
    } catch (error) {
        console.error('❌ Deployment failed:', error.message);
        throw error;
    }
}

deployContracts()
    .then((deploymentInfo) => {
        console.log('\n✅ All contracts deployed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Deployment failed:', error);
        process.exit(1);
    });
