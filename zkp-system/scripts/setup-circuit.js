const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up ZKP Circuit with BLS12-381...');

// Create necessary directories
const dirs = [
    'circuits',
    'build',
    'keys',
    'proofs'
];

dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
    }
});

// Download trusted setup if not exists
const potPath = 'pot12_final.ptau';
if (!fs.existsSync(potPath)) {
    console.log('📥 Downloading trusted setup (Powers of Tau)...');
    try {
        execSync('wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_12.ptau -O pot12_final.ptau', { stdio: 'inherit' });
        console.log('✅ Trusted setup downloaded');
    } catch (error) {
        console.log('⚠️  Failed to download trusted setup. Please download manually:');
        console.log('wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_12.ptau -O pot12_final.ptau');
    }
}

// Compile circuit
console.log('🔨 Compiling circuit...');
try {
    // Try using global circom first
    execSync('circom circuits/main.circom --r1cs --wasm --sym --c', { stdio: 'inherit' });
    console.log('✅ Circuit compiled successfully');
} catch (error) {
    try {
        // Fallback to npx
        execSync('npx circom circuits/main.circom --r1cs --wasm --sym --c', { stdio: 'inherit' });
        console.log('✅ Circuit compiled successfully');
    } catch (npxError) {
        console.error('❌ Circuit compilation failed. Please install circom:');
        console.error('   npm install -g circom');
        console.error('   Error:', npxError.message);
        process.exit(1);
    }
}

// Generate zKey
console.log('🔑 Generating zKey...');
try {
    execSync('npx snarkjs groth16 setup circuits/main_c.r1cs pot12_final.ptau circuits/main_c_0000.zkey', { stdio: 'inherit' });
    console.log('✅ zKey generated');
} catch (error) {
    console.error('❌ zKey generation failed:', error.message);
    process.exit(1);
}

// Contribute to zKey (phase 2)
console.log('🎲 Contributing to zKey (Phase 2)...');
try {
    execSync('npx snarkjs zkey contribute circuits/main_c_0000.zkey circuits/main_c_final.zkey', { stdio: 'inherit' });
    console.log('✅ zKey contribution completed');
} catch (error) {
    console.error('❌ zKey contribution failed:', error.message);
    process.exit(1);
}

// Export verification key
console.log('🔐 Exporting verification key...');
try {
    execSync('npx snarkjs zkey export verificationkey circuits/main_c_final.zkey circuits/verification_key.json', { stdio: 'inherit' });
    console.log('✅ Verification key exported');
} catch (error) {
    console.error('❌ Verification key export failed:', error.message);
    process.exit(1);
}

// Generate Solidity verifier
console.log('📄 Generating Solidity verifier...');
try {
    execSync('npx snarkjs zkey export solidityverifier circuits/main_c_final.zkey contracts/Verifier.sol', { stdio: 'inherit' });
    console.log('✅ Solidity verifier generated');
} catch (error) {
    console.error('❌ Solidity verifier generation failed:', error.message);
    process.exit(1);
}

// Create test inputs
console.log('🧪 Creating test inputs...');

// For testing purposes, use simple values
// In a real implementation, these would be calculated using Poseidon hash
const testInputs = {
    secret: "123456789",
    salt: "987654321",
    amount: "100",
    recipient: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    publicInput: "0",
    commitment: "123456789", // Will be calculated by circuit
    nullifier: "987654321"   // Will be calculated by circuit
};

fs.writeFileSync('test-inputs.json', JSON.stringify(testInputs, null, 2));
console.log('✅ Test inputs created');

// Generate test proof
console.log('🔍 Generating test proof...');
try {
    execSync('npx snarkjs groth16 fullprove test-inputs.json circuits/main_c_js/main_c.wasm circuits/main_c_final.zkey', { stdio: 'inherit' });
    console.log('✅ Test proof generated');
} catch (error) {
    console.error('❌ Test proof generation failed:', error.message);
    process.exit(1);
}

// Verify test proof
console.log('✅ Verifying test proof...');
try {
    execSync('npx snarkjs groth16 verify circuits/verification_key.json public.json proof.json', { stdio: 'inherit' });
    console.log('✅ Test proof verified successfully');
} catch (error) {
    console.error('❌ Test proof verification failed:', error.message);
    process.exit(1);
}

console.log('\n🎉 ZKP Circuit setup completed successfully!');
console.log('\n📋 Generated files:');
console.log('  - circuits/main.r1cs (R1CS constraint system)');
console.log('  - circuits/main.wasm (WASM circuit)');
console.log('  - circuits/main_final.zkey (Proving key)');
console.log('  - circuits/verification_key.json (Verification key)');
console.log('  - contracts/Verifier.sol (Solidity verifier)');
console.log('  - proof.json (Test proof)');
console.log('  - public.json (Public inputs)');

console.log('\n🚀 Next steps:');
console.log('  1. Deploy the ZKPVerifier contract');
console.log('  2. Start the API server: npm run start-api');
console.log('  3. Test the system with the provided endpoints');

console.log('\n📚 API Endpoints:');
console.log('  - POST /api/zkp/generate-commitment');
console.log('  - POST /api/zkp/generate-proof');
console.log('  - POST /api/zkp/verify-proof');
console.log('  - POST /api/zkp/deposit');
console.log('  - POST /api/zkp/withdraw');
console.log('  - GET /api/zkp/contract-status');
