#!/bin/bash

echo "🚀 Starting ZKP System with BLS12-381..."

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

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install || {
        echo "⚠️  Some dependencies failed to install. Trying with legacy peer deps..."
        npm install --legacy-peer-deps
    }
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp env.example .env
    echo "📝 Please edit .env file with your configuration before continuing."
    echo "   Required: DEPLOYER_PRIVATE_KEY, ETH_RPC_URL"
    read -p "Press Enter after editing .env file..."
fi

# Check if circuit files exist
if [ ! -f "circuits/main_final.zkey" ]; then
    echo "🔧 Setting up ZKP circuit..."
    node scripts/setup-circuit.js
fi

# Check if API server is already running
if curl -s http://localhost:3001/api/zkp/health > /dev/null; then
    echo "✅ ZKP API server is already running on port 3001"
else
    echo "🌐 Starting ZKP API server..."
    npm run start-api &
    API_PID=$!
    
    # Wait for server to start
    echo "⏳ Waiting for API server to start..."
    for i in {1..30}; do
        if curl -s http://localhost:3001/api/zkp/health > /dev/null; then
            echo "✅ ZKP API server started successfully!"
            break
        fi
        sleep 1
    done
    
    if [ $i -eq 30 ]; then
        echo "❌ Failed to start API server"
        kill $API_PID 2>/dev/null
        exit 1
    fi
fi

echo ""
echo "🎉 ZKP System is ready!"
echo ""
echo "📡 API Endpoints:"
echo "  Health Check: http://localhost:3001/api/zkp/health"
echo "  Generate Commitment: POST http://localhost:3001/api/zkp/generate-commitment"
echo "  Generate Proof: POST http://localhost:3001/api/zkp/generate-proof"
echo "  Verify Proof: POST http://localhost:3001/api/zkp/verify-proof"
echo "  Deposit: POST http://localhost:3001/api/zkp/deposit"
echo "  Withdraw: POST http://localhost:3001/api/zkp/withdraw"
echo "  Contract Status: GET http://localhost:3001/api/zkp/contract-status"
echo ""
echo "🧪 Run tests: npm test"
echo "📚 Documentation: README.md"
echo ""
echo "Press Ctrl+C to stop the server"

# Keep script running and handle cleanup
trap 'echo ""; echo "🛑 Stopping ZKP System..."; kill $API_PID 2>/dev/null; exit 0' INT

# Wait for interrupt
wait
