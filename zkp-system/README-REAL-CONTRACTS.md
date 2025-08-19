# ZKP System with Real Smart Contracts

This is a comprehensive Zero-Knowledge Proof (ZKP) system with real smart contracts deployed on your private Ethereum network.

## 🏗️ Architecture

### Smart Contracts
1. **ZKPPrivacyContract** - Main privacy contract for anonymous transactions
2. **ZKPVerifier** - ZK-SNARK proof verification contract
3. **IELTSCredentialVerifier** - Credential verification using ZKPs

### ZKP Circuit
- **main.circom** - Main ZK-SNARK circuit for commitment and nullifier verification
- Uses Poseidon hash function for efficient ZKP operations
- Supports BLS12-381 curve for proof generation and verification

## 📋 Prerequisites

- Node.js v18+
- Your private Ethereum node running on `http://localhost:8545`
- Your account with ETH balance for deployment

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Compile Smart Contracts
```bash
npx hardhat compile
```

### 3. Extract Your Private Key
You need to extract your private key from the keystore file to deploy contracts:

```bash
# Option 1: Use geth (recommended)
geth account import --keystore /eth/data/keystore/UTC--2025-08-14T06-40-45.685029262Z--86203921927d1f44a092a3a42b638c5d013b73cb

# Option 2: Use the extraction script
node extract-private-key.js YOUR_PASSWORD
```

### 4. Deploy Contracts
```bash
# Edit deploy-simple.js and replace YOUR_PRIVATE_KEY_HERE with your actual private key
node deploy-simple.js
```

### 5. Start ZKP API Server
```bash
npm run start-api
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file:
```env
ETH_RPC_URL=http://localhost:8545
ZKP_API_PORT=3001
DEPLOYER_PRIVATE_KEY=your_private_key_here
CONTRACT_ADDRESSES={"zkpPrivacy":"0x...","zkpVerifier":"0x...","ieltsVerifier":"0x..."}
```

### Network Configuration
- **Network**: Localhost
- **Chain ID**: 15555
- **RPC URL**: http://localhost:8545
- **Your Account**: 0x86203921927d1f44a092a3a42B638C5D013B73CB

## 📡 API Endpoints

### ZKP Operations
- `POST /api/zkp/generate-commitment` - Generate commitment from secret inputs
- `POST /api/zkp/generate-proof` - Generate ZK-SNARK proof
- `POST /api/zkp/verify-proof` - Verify ZK-SNARK proof
- `GET /api/zkp/health` - Health check

### Smart Contract Operations
- `POST /api/contract/deposit` - Deposit funds with commitment
- `POST /api/contract/withdraw` - Withdraw funds using ZK proof
- `GET /api/contract/balance` - Get contract balance

## 🔐 Security Features

### Privacy Features
- **Commitment Scheme**: Hides transaction amounts and recipients
- **Nullifier System**: Prevents double-spending while maintaining privacy
- **Zero-Knowledge Proofs**: Proves validity without revealing secrets

### Smart Contract Security
- **Reentrancy Protection**: Prevents reentrancy attacks
- **Access Control**: Owner-only functions for critical operations
- **Pausable**: Emergency pause functionality
- **Input Validation**: Comprehensive input validation

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
node test-eth-integration.js
```

### Manual Testing
```bash
# Test commitment generation
curl -X POST http://localhost:3001/api/zkp/generate-commitment \
  -H "Content-Type: application/json" \
  -d '{"secret":"123","salt":"456","amount":"100"}'

# Test deposit
curl -X POST http://localhost:3001/api/contract/deposit \
  -H "Content-Type: application/json" \
  -d '{"commitment":"0x...","amount":"1.0"}'
```

## 📊 Contract Addresses

After deployment, your contracts will be deployed at:
- **ZKPPrivacyContract**: `0x...` (main privacy contract)
- **ZKPVerifier**: `0x...` (proof verification)
- **IELTSCredentialVerifier**: `0x...` (credential verification)

## 🔄 ZKP Workflow

1. **Commitment Generation**: User creates commitment from secret inputs
2. **Deposit**: User deposits funds with commitment to smart contract
3. **Proof Generation**: User generates ZK-SNARK proof proving knowledge of secrets
4. **Withdrawal**: User withdraws funds using proof and nullifier

## 🛠️ Development

### Adding New Circuits
1. Create new `.circom` file in `circuits/`
2. Update `scripts/setup-circuit.js`
3. Compile and generate new verification keys

### Adding New Smart Contracts
1. Create new `.sol` file in `contracts/`
2. Update deployment scripts
3. Add API endpoints for contract interaction

## 📝 Deployment Info

Deployment information is saved to `deployment-info.json`:
```json
{
  "network": "localhost",
  "chainId": 15555,
  "deployer": "0x86203921927d1f44a092a3a42B638C5D013B73CB",
  "contracts": {
    "zkpPrivacy": "0x...",
    "zkpVerifier": "0x...",
    "ieltsVerifier": "0x..."
  },
  "timestamp": "2025-08-14T...",
  "testCommitment": "0x..."
}
```

## 🚨 Troubleshooting

### Common Issues
1. **Insufficient Funds**: Ensure your account has ETH for deployment
2. **Private Key Issues**: Verify your private key is correct
3. **Network Connection**: Ensure Ethereum node is running on port 8545
4. **Contract Compilation**: Check Solidity version compatibility

### Debug Commands
```bash
# Check account balance
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0x86203921927d1f44a092a3a42B638C5D013B73CB","latest"],"id":1}'

# Check network status
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

## 📚 Resources

- [Circom Documentation](https://docs.circom.io/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Ethers.js Documentation](https://docs.ethers.io/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.
