# Quick Start Guide - ZKP System with IELTS Credential Verification

## 🚀 Quick Setup

### 1. Prerequisites
- Node.js (v16 or higher)
- npm (v8 or higher)
- Git

### 2. Setup the System

#### Option A: Full Setup (Requires circom)
```bash
# Navigate to the ZKP system directory
cd zkp-system

# Run the full setup script (this will handle everything)
./setup.sh
```

#### Option B: Simple Setup (For testing without circom)
```bash
# Navigate to the ZKP system directory
cd zkp-system

# Run the simple setup script (no circom required)
npm run setup-simple

# Install dependencies
npm install --legacy-peer-deps
```

The setup script will:
- ✅ Check Node.js and npm installation
- ✅ Create .env file with default configuration
- ✅ Install all dependencies
- ✅ Set up ZKP circuits
- ✅ Set up IELTS credential circuits
- ✅ Generate test data and proofs

### 3. Start the APIs

#### Option A: Full ZKP APIs (Requires circom)
```bash
# Terminal 1: Start main ZKP API
npm run start-api

# Terminal 2: Start IELTS API
npm run start-ielts-api
```

#### Option B: Simple APIs (For testing without circom)
```bash
# Terminal 1: Start simple ZKP API
npm run start-simple-api

# Terminal 2: Start simple IELTS API
npm run start-simple-ielts-api
```

### 4. Test the System

```bash
# Run comprehensive automation test
node test-automation.js

# Test main ZKP functionality
npm test

# Test IELTS credential verification
npm run test:ielts

# Run complete automation example
npm run run-ielts-automation
```

## 📡 API Endpoints

### Main ZKP API (Port 3001)
- Health: `GET http://localhost:3001/api/zkp/health`
- Generate Commitment: `POST http://localhost:3001/api/zkp/generate-commitment`
- Generate Proof: `POST http://localhost:3001/api/zkp/generate-proof`
- Verify Proof: `POST http://localhost:3001/api/zkp/verify-proof`

### IELTS API (Port 3002)
- Health: `GET http://localhost:3002/api/ielts/health`
- Generate Credential: `POST http://localhost:3002/api/ielts/generate-credential`
- Generate Proof: `POST http://localhost:3002/api/ielts/generate-proof`
- Verify Proof: `POST http://localhost:3002/api/ielts/verify-proof`

## 🧪 Quick Test

### Test IELTS Credential Generation

```bash
curl -X POST http://localhost:3002/api/ielts/generate-credential \
  -H "Content-Type: application/json" \
  -d '{
    "candidateId": "TEST_001",
    "listeningScore": 7.5,
    "readingScore": 8.0,
    "writingScore": 7.0,
    "speakingScore": 8.5,
    "testDate": 1640995200,
    "candidateName": "Test Candidate",
    "testCenter": "Test Center",
    "secretKey": "0x123456789"
  }'
```

### Test Health Check

```bash
curl http://localhost:3001/api/zkp/health
curl http://localhost:3002/api/ielts/health
```

## 🔧 Troubleshooting

### If setup fails:

1. **Dependency Issues:**
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Circuit Compilation Issues:**
   ```bash
   # Install circom globally
   npm install -g circom
   
   # Then run setup again
   ./setup.sh
   ```

3. **Port Already in Use:**
   ```bash
   # Check what's using the ports
   lsof -i :3001
   lsof -i :3002
   
   # Kill the processes or change ports in .env
   ```

### Common Issues:

- **"bls12-381 not found"**: Fixed in latest version, uses circomlib instead
- **"poseidon-hash not found"**: Fixed in latest version, uses circomlib instead
- **Circuit compilation fails**: Make sure circom is installed globally

## 📚 Next Steps

After successful setup:

1. **Read the Documentation:**
   - `README.md` - Main documentation
   - `IELTS_AUTOMATION.md` - IELTS-specific features
   - `INTEGRATION.md` - Integration guide

2. **Explore Examples:**
   - `examples/integration-example.js` - General ZKP example
   - `examples/ielts-automation-example.js` - IELTS automation

3. **Deploy to Production:**
   - Update .env with production values
   - Deploy smart contracts
   - Set up proper security measures

## 🆘 Need Help?

- Check the troubleshooting section above
- Review the logs in the terminal
- Check the API health endpoints
- Create an issue on GitHub

The system is now ready for development and testing! 🎉
