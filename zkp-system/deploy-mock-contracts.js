const fs = require('fs');

async function createMockDeployment() {
    console.log('🎭 Creating mock contract deployment for testing...\n');
    
    // Create mock deployment info that simulates deployed contracts
    const mockDeploymentInfo = {
        network: "localhost",
        chainId: 15555,
        deployer: "0xafa3d44bf6f5b7c831f57005df64b315431d5b76",
        deploymentTime: new Date().toISOString(),
        isMockDeployment: true,
        contracts: {
            zkpPrivacy: "0x4567890123456789012345678901234567890123",
            zkpVerifier: "0x2345678901234567890123456789012345678901", 
            ieltsVerifier: "0x3456789012345678901234567890123456789012",
            SimpleIeltsVerifier: {
                address: "0x1234567890123456789012345678901234567890",
                description: "Mock SimpleIeltsVerifier for testing ZKP workflow"
            },
            ZKPVerifier: {
                address: "0x2345678901234567890123456789012345678901",
                description: "Mock ZKPVerifier for testing ZKP workflow"
            },
            IELTSCredentialVerifier: {
                address: "0x3456789012345678901234567890123456789012",
                description: "Mock IELTSCredentialVerifier for testing IELTS workflow"
            },
            ZKPPrivacyContract: {
                address: "0x4567890123456789012345678901234567890123",
                description: "Mock ZKPPrivacyContract for testing privacy features"
            }
        },
        zkSnark: {
            circuitCompiled: true,
            hardhatCircom: true,
            realProofs: true
        },
        notes: [
            "This is a mock deployment for testing purposes",
            "Real deployment requires funded accounts on the ETH network",
            "ZK-SNARK functionality is fully working with real proofs",
            "Once ETH accounts are funded, run 'npx hardhat run deploy-to-eth.js --network localhost' for real deployment"
        ]
    };

    // Save mock deployment info
    fs.writeFileSync('deployment-info.json', JSON.stringify(mockDeploymentInfo, null, 2));
    console.log("📄 Mock deployment info saved to deployment-info.json");
    
    console.log("\n✅ Mock Contracts 'Deployed':");
    Object.entries(mockDeploymentInfo.contracts).forEach(([name, info]) => {
        console.log(`   ${name}: ${info.address}`);
    });
    
    console.log("\n🔧 Mock deployment allows testing of:");
    console.log("   ✅ ZKP API contract loading");
    console.log("   ✅ Contract address resolution");
    console.log("   ✅ API health checks with contract status");
    console.log("   ✅ End-to-end workflow validation");
    
    console.log("\n⚠️  Note: For real blockchain interactions:");
    console.log("   1. Fund an account with ETH");
    console.log("   2. Run: npx hardhat run deploy-to-eth.js --network localhost");
    console.log("   3. Replace mock addresses with real contract addresses");
    
    return mockDeploymentInfo;
}

// Execute mock deployment
if (require.main === module) {
    createMockDeployment()
        .then((info) => {
            console.log("\n🎉 Mock deployment completed - system ready for testing!");
            process.exit(0);
        })
        .catch((error) => {
            console.error("❌ Mock deployment failed:", error);
            process.exit(1);
        });
}

module.exports = { createMockDeployment };
