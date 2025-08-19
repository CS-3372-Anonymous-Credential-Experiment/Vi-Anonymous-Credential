#!/bin/bash

echo "🔧 Setting up ZKP System with IELTS Credential Verification..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# ZKP System Environment Configuration

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
EOF
    echo "✅ .env file created"
else
    echo "✅ .env file already exists"
fi

# Install circom globally if not already installed
if ! command -v circom &> /dev/null; then
    echo "📦 Installing circom globally..."
    npm install -g circom
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Check if circuit files exist
if [ ! -f "circuits/main_final.zkey" ]; then
    echo "🔧 Setting up main ZKP circuit..."
    node scripts/setup-circuit.js
else
    echo "✅ Main ZKP circuit already set up"
fi

# Check if IELTS circuit files exist
if [ ! -f "circuits/ielts-credential_final.zkey" ]; then
    echo "🎓 Setting up IELTS credential circuit..."
    node scripts/setup-ielts-circuit.js
else
    echo "✅ IELTS credential circuit already set up"
fi

echo ""
echo "🎉 ZKP System setup completed successfully!"
echo ""
echo "📚 Next steps:"
echo "  1. Start the main ZKP API: npm run start-api"
echo "  2. Start the IELTS API: npm run start-ielts-api"
echo "  3. Run tests: npm test"
echo "  4. Run IELTS tests: npm run test:ielts"
echo "  5. Run automation example: npm run run-ielts-automation"
echo ""
echo "📡 API Endpoints:"
echo "  Main ZKP API: http://localhost:3001"
echo "  IELTS API: http://localhost:3002"
echo ""
echo "🔗 Health checks:"
echo "  Main API: http://localhost:3001/api/zkp/health"
echo "  IELTS API: http://localhost:3002/api/ielts/health"
