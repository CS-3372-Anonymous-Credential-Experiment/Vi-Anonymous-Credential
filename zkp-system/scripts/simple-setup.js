const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🔧 Setting up ZKP System (Simple Mode)...');

// Create necessary directories
const dirs = [
    'circuits',
    'build',
    'keys',
    'proofs',
    'ielts-data',
    'logs'
];

dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
    }
});

// Create .env file if it doesn't exist
if (!fs.existsSync('.env')) {
    console.log('📝 Creating .env file...');
    const envContent = `# ZKP System Environment Configuration

# Ethereum Network Configuration
ETH_RPC_URL=http://localhost:8545
DEPLOYER_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# ZKP API Configuration
ZKP_API_PORT=3001
ZKP_API_URL=http://localhost:3001

# IELTS API Configuration
IELTS_API_PORT=3002
IELTS_API_URL=http://localhost:3002

# Security Configuration
JWT_SECRET=your_jwt_secret_here_change_this_in_production
API_KEY=your_api_key_here_change_this_in_production

# Logging Configuration
LOG_LEVEL=info
NODE_ENV=development
`;
    
    fs.writeFileSync('.env', envContent);
    console.log('✅ .env file created');
} else {
    console.log('✅ .env file already exists');
}

// Create sample test data
console.log('📊 Creating sample test data...');

const sampleIELTSData = [
    {
        candidateId: "CANDIDATE_001",
        listeningScore: 7.5,
        readingScore: 8.0,
        writingScore: 7.0,
        speakingScore: 8.5,
        overallScore: 7.8,
        testDate: Math.floor(Date.now() / 1000),
        candidateName: "John Doe",
        testCenter: "British Council London",
        secretKey: crypto.randomBytes(32).toString('hex')
    },
    {
        candidateId: "CANDIDATE_002",
        listeningScore: 8.0,
        readingScore: 7.5,
        writingScore: 8.5,
        speakingScore: 7.0,
        overallScore: 7.8,
        testDate: Math.floor(Date.now() / 1000),
        candidateName: "Jane Smith",
        testCenter: "IDP Australia",
        secretKey: crypto.randomBytes(32).toString('hex')
    }
];

fs.writeFileSync('ielts-data/sample-credentials.json', JSON.stringify(sampleIELTSData, null, 2));
console.log('✅ Sample IELTS data created');

// Create mock circuit files for testing
console.log('🔧 Creating mock circuit files for testing...');

const mockFiles = [
    'circuits/main.wasm',
    'circuits/main_final.zkey',
    'circuits/verification_key.json',
    'circuits/ielts-credential.wasm',
    'circuits/ielts-credential_final.zkey',
    'circuits/ielts-credential_verification_key.json'
];

mockFiles.forEach(file => {
    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, JSON.stringify({ mock: true, file: file, timestamp: Date.now() }));
        console.log(`✅ Created mock file: ${file}`);
    }
});

console.log('\n🎉 Simple setup completed successfully!');
console.log('\n📋 What was created:');
console.log('  - .env file with default configuration');
console.log('  - Sample IELTS test data');
console.log('  - Mock circuit files for testing');
console.log('  - All necessary directories');

console.log('\n🚀 Next steps:');
console.log('  1. Install dependencies: npm install --legacy-peer-deps');
console.log('  2. Start the main ZKP API: npm run start-api');
console.log('  3. Start the IELTS API: npm run start-ielts-api');
console.log('  4. Run tests: npm test');
console.log('  5. Run IELTS tests: npm run test:ielts');

console.log('\n⚠️  Note: This is a simple setup for testing.');
console.log('   For full ZKP functionality, you need to:');
console.log('   1. Install circom: npm install -g circom');
console.log('   2. Run full setup: ./setup.sh');

console.log('\n📡 API Endpoints:');
console.log('  Main ZKP API: http://localhost:3001');
console.log('  IELTS API: http://localhost:3002');
