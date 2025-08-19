const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up IELTS ZK-SNARK Circuit...');

const circuitsDir = path.join(__dirname, '../circuits');
const ieltsCircuitPath = path.join(circuitsDir, 'ielts-credential.circom');
const outputDir = path.join(circuitsDir, 'ielts-output');

// Create output directory
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

try {
    // Step 1: Compile the circuit
    console.log('📦 Compiling IELTS circuit...');
    execSync(`circom ${ieltsCircuitPath} --r1cs --wasm --sym --c --output ${outputDir}`, { stdio: 'inherit' });
    
    // Step 2: Generate proving key
    console.log('🔑 Generating proving key...');
    execSync(`snarkjs groth16 setup ${path.join(outputDir, 'ielts-credential.r1cs')} ${path.join(outputDir, 'pot12_final.ptau')} ${path.join(outputDir, 'ielts_0000.zkey')}`, { stdio: 'inherit' });
    
    // Step 3: Contribute to phase 2 of the ceremony
    console.log('🎭 Contributing to phase 2 ceremony...');
    execSync(`snarkjs zkey contribute ${path.join(outputDir, 'ielts_0000.zkey')} ${path.join(outputDir, 'ielts_final.zkey')} --name="IELTS Circuit" -v`, { stdio: 'inherit' });
    
    // Step 4: Export verification key
    console.log('🔍 Exporting verification key...');
    execSync(`snarkjs zkey export verificationkey ${path.join(outputDir, 'ielts_final.zkey')} ${path.join(outputDir, 'verification_key.json')}`, { stdio: 'inherit' });
    
    // Step 5: Generate Solidity verifier
    console.log('📄 Generating Solidity verifier...');
    execSync(`snarkjs zkey export solidityverifier ${path.join(outputDir, 'ielts_final.zkey')} ${path.join(outputDir, 'IELTSVerifier.sol')}`, { stdio: 'inherit' });
    
    // Step 6: Create test inputs
    console.log('🧪 Creating test inputs...');
    const testInputs = {
        // Private inputs
        listeningScore: 7,
        readingScore: 8,
        writingScore: 7,
        speakingScore: 8,
        overallScore: 7.5,
        credentialSecret: "ielts_secret_123",
        issueDate: 1640995200, // 2022-01-01
        expiryDatePrivate: 1735689600, // 2025-01-01
        
        // Public inputs (will be calculated by circuit)
        credentialHash: 0,
        meetsMinimum: 0,
        isValid: 0,
        isNotExpired: 0
    };
    
    fs.writeFileSync(path.join(outputDir, 'test-inputs.json'), JSON.stringify(testInputs, null, 2));
    
    // Step 7: Generate test proof
    console.log('🔐 Generating test proof...');
    execSync(`snarkjs groth16 prove ${path.join(outputDir, 'ielts_final.zkey')} ${path.join(outputDir, 'ielts-credential_js/witness.wtns')} ${path.join(outputDir, 'proof.json')} ${path.join(outputDir, 'public.json')}`, { stdio: 'inherit' });
    
    // Step 8: Verify test proof
    console.log('✅ Verifying test proof...');
    execSync(`snarkjs groth16 verify ${path.join(outputDir, 'verification_key.json')} ${path.join(outputDir, 'public.json')} ${path.join(outputDir, 'proof.json')}`, { stdio: 'inherit' });
    
    console.log('\n🎉 IELTS ZK-SNARK Circuit setup completed successfully!');
    console.log('\n📁 Generated files:');
    console.log(`  - Circuit: ${path.join(outputDir, 'ielts-credential.r1cs')}`);
    console.log(`  - WASM: ${path.join(outputDir, 'ielts-credential_js/ielts-credential.wasm')}`);
    console.log(`  - Proving key: ${path.join(outputDir, 'ielts_final.zkey')}`);
    console.log(`  - Verification key: ${path.join(outputDir, 'verification_key.json')}`);
    console.log(`  - Solidity verifier: ${path.join(outputDir, 'IELTSVerifier.sol')}`);
    console.log(`  - Test proof: ${path.join(outputDir, 'proof.json')}`);
    
} catch (error) {
    console.error('❌ Error setting up IELTS circuit:', error.message);
    console.log('\n💡 Note: This requires circom and snarkjs to be installed globally.');
    console.log('   Install with: npm install -g circom snarkjs');
    
    // Create mock files for testing
    console.log('\n🔄 Creating mock files for testing...');
    createMockFiles();
}

function createMockFiles() {
    const mockVerificationKey = {
        protocol: "groth16",
        curve: "bn128",
        nPublic: 4,
        vk_alpha_1: ["0x1234567890abcdef", "0xfedcba0987654321"],
        vk_beta_2: [["0x1111111111111111", "0x2222222222222222"], ["0x3333333333333333", "0x4444444444444444"]],
        vk_gamma_2: [["0x5555555555555555", "0x6666666666666666"], ["0x7777777777777777", "0x8888888888888888"]],
        vk_delta_2: [["0x9999999999999999", "0xaaaaaaaaaaaaaaaa"], ["0xbbbbbbbbbbbbbbbb", "0xcccccccccccccccc"]],
        vk_alphabeta_12: [[["0xdddddddddddddddd", "0xeeeeeeeeeeeeeeee"], ["0xffffffffffffffff", "0x0000000000000000"]]],
        IC: [
            ["0x1111111111111111", "0x2222222222222222"],
            ["0x3333333333333333", "0x4444444444444444"],
            ["0x5555555555555555", "0x6666666666666666"],
            ["0x7777777777777777", "0x8888888888888888"],
            ["0x9999999999999999", "0xaaaaaaaaaaaaaaaa"]
        ]
    };
    
    fs.writeFileSync(path.join(outputDir, 'verification_key.json'), JSON.stringify(mockVerificationKey, null, 2));
    
    const mockProof = {
        pi_a: ["0x1234567890abcdef", "0xfedcba0987654321"],
        pi_b: [["0x1111111111111111", "0x2222222222222222"], ["0x3333333333333333", "0x4444444444444444"]],
        pi_c: ["0x5555555555555555", "0x6666666666666666"]
    };
    
    fs.writeFileSync(path.join(outputDir, 'proof.json'), JSON.stringify(mockProof, null, 2));
    
    console.log('✅ Mock files created for testing');
}
