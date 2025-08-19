const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Deploying ZKP Contracts to Local Ethereum Network...");

    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("👤 Deploying contracts with account:", deployer.address);

    // Check balance
    const balance = await deployer.getBalance();
    console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");

    // Deploy ZKPPrivacyContract
    console.log("\n📦 Deploying ZKPPrivacyContract...");
    const ZKPPrivacyContract = await ethers.getContractFactory("ZKPPrivacyContract");
    const zkpPrivacy = await ZKPPrivacyContract.deploy();
    await zkpPrivacy.waitForDeployment();
    const zkpPrivacyAddress = await zkpPrivacy.getAddress();
    console.log("✅ ZKPPrivacyContract deployed to:", zkpPrivacyAddress);

    // Deploy ZKPVerifier
    console.log("\n📦 Deploying ZKPVerifier...");
    const ZKPVerifier = await ethers.getContractFactory("ZKPVerifier");
    const zkpVerifier = await ZKPVerifier.deploy();
    await zkpVerifier.waitForDeployment();
    const zkpVerifierAddress = await zkpVerifier.getAddress();
    console.log("✅ ZKPVerifier deployed to:", zkpVerifierAddress);

    // Deploy IELTSCredentialVerifier
    console.log("\n📦 Deploying IELTSCredentialVerifier...");
    const IELTSCredentialVerifier = await ethers.getContractFactory("IELTSCredentialVerifier");
    const ieltsVerifier = await IELTSCredentialVerifier.deploy();
    await ieltsVerifier.waitForDeployment();
    const ieltsVerifierAddress = await ieltsVerifier.getAddress();
    console.log("✅ IELTSCredentialVerifier deployed to:", ieltsVerifierAddress);

    // Test deposit functionality
    console.log("\n🧪 Testing deposit functionality...");
    const testCommitment = ethers.keccak256(ethers.toUtf8Bytes("test-commitment"));
    const depositTx = await zkpPrivacy.deposit(testCommitment, { value: ethers.parseEther("1.0") });
    await depositTx.wait();
    console.log("✅ Test deposit successful (1 ETH)");

    // Save deployment info
    const deploymentInfo = {
        network: "localhost",
        chainId: 15555,
        deployer: deployer.address,
        contracts: {
            zkpPrivacy: zkpPrivacyAddress,
            zkpVerifier: zkpVerifierAddress,
            ieltsVerifier: ieltsVerifierAddress
        },
        timestamp: new Date().toISOString(),
        testCommitment: testCommitment
    };

    const fs = require('fs');
    fs.writeFileSync('deployment-info.json', JSON.stringify(deploymentInfo, null, 2));
    console.log("\n📄 Deployment info saved to deployment-info.json");

    console.log("\n🎉 Deployment completed successfully!");
    console.log("\n📋 Contract Addresses:");
    console.log("  ZKPPrivacyContract:", zkpPrivacyAddress);
    console.log("  ZKPVerifier:", zkpVerifierAddress);
    console.log("  IELTSCredentialVerifier:", ieltsVerifierAddress);
    console.log("\n🔗 Network: http://localhost:8545 (Chain ID: 15555)");

    return deploymentInfo;
}

main()
    .then((deploymentInfo) => {
        console.log("\n✅ All contracts deployed successfully!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
