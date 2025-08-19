# ZKP System with BLS12-381 and zk-SNARKs

A comprehensive Zero-Knowledge Proof (ZKP) system using zk-SNARKs with BLS12-381 elliptic curve, integrated with Ethereum smart contracts and AWS Lambda.

## 🚀 Features

- **zk-SNARK Proof Generation**: Using Circom circuits with BLS12-381 curve
- **Smart Contract Integration**: Solidity contracts for proof verification
- **REST API**: Express.js server for ZKP operations
- **AWS Lambda Support**: Serverless ZKP operations
- **Privacy-Preserving Transactions**: Commitment and nullifier scheme
- **BLS12-381 Curve**: Industry-standard elliptic curve for ZKP

## 📁 Project Structure

```
zkp-system/
├── circuits/           # Circom circuit definitions
├── contracts/          # Solidity smart contracts
├── api/               # Express.js API server
├── lambda/            # AWS Lambda functions
├── scripts/           # Setup and deployment scripts
├── test/              # Test files
└── docs/              # Documentation
```

## 🛠️ Installation

1. **Clone and navigate to the ZKP system directory:**
```bash
cd zkp-system
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp env.example .env
# Edit .env with your configuration
```

4. **Set up the ZKP circuit:**
```bash
npm run setup-circuit
```

## 🔧 Setup

### 1. Circuit Setup

The system uses Circom to define and compile ZKP circuits:

```bash
# Compile the circuit
npm run compile

# Set up proving and verification keys
npm run setup

# Contribute to the trusted setup
npm run contribute

# Export verification key
npm run export-verifier
```

### 2. Smart Contract Deployment

Deploy the ZKP verifier contract:

```bash
# Set your private key in .env
export DEPLOYER_PRIVATE_KEY=your_private_key

# Deploy the contract
npm run deploy-contract
```

### 3. API Server

Start the ZKP API server:

```bash
npm run start-api
```

The API will be available at `http://localhost:3001`

## 📡 API Endpoints

### Health Check
```bash
GET /api/zkp/health
```

### Generate Commitment
```bash
POST /api/zkp/generate-commitment
{
  "secret": "123456789",
  "salt": "987654321", 
  "amount": "100"
}
```

### Generate Proof
```bash
POST /api/zkp/generate-proof
{
  "secret": "123456789",
  "salt": "987654321",
  "amount": "100",
  "recipient": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
}
```

### Verify Proof
```bash
POST /api/zkp/verify-proof
{
  "proof": { /* proof object */ },
  "publicSignals": [ /* public signals */ ]
}
```

### Deposit Funds
```bash
POST /api/zkp/deposit
{
  "commitment": "0x...",
  "amount": "1.0",
  "privateKey": "0x...",
  "contractAddress": "0x..."
}
```

### Withdraw Funds
```bash
POST /api/zkp/withdraw
{
  "proof": { /* proof object */ },
  "publicSignals": [ /* public signals */ ],
  "nullifier": "0x...",
  "recipient": "0x...",
  "amount": "1.0",
  "privateKey": "0x...",
  "contractAddress": "0x..."
}
```

## 🔐 ZKP Workflow

### 1. Commitment Phase
```javascript
// Generate commitment from secret, salt, and amount
const commitment = zkpSystem.generateCommitment(secret, salt, amount);
const nullifier = zkpSystem.generateNullifier(secret);

// Deposit funds with commitment
await deposit(commitment, amount, privateKey, contractAddress);
```

### 2. Proof Generation
```javascript
// Generate zk-SNARK proof
const proofData = await zkpSystem.generateProof({
    secret,
    salt,
    amount,
    recipient,
    publicInput: "0"
});
```

### 3. Withdrawal
```javascript
// Verify proof and withdraw funds
await withdraw(
    proofData.proof,
    proofData.publicSignals,
    nullifier,
    recipient,
    amount,
    privateKey,
    contractAddress
);
```

## 🐑 AWS Lambda Integration

The system includes Lambda functions for serverless ZKP operations:

```javascript
// Lambda event structure
{
  "action": "generate_proof",
  "data": {
    "secret": "123456789",
    "salt": "987654321",
    "amount": "100",
    "recipient": "0x..."
  }
}
```

### Deploy Lambda Function

1. **Build the Lambda package:**
```bash
npm run lambda-build
```

2. **Deploy to AWS:**
```bash
aws lambda create-function \
  --function-name zkp-system \
  --runtime nodejs18.x \
  --handler lambda/zkp-lambda.handler \
  --zip-file fileb://lambda-package.zip
```

## 🧪 Testing

Run the test suite:

```bash
npm test
```

### Manual Testing

1. **Test commitment generation:**
```bash
curl -X POST http://localhost:3001/api/zkp/generate-commitment \
  -H "Content-Type: application/json" \
  -d '{"secret":"123","salt":"456","amount":"100"}'
```

2. **Test proof generation:**
```bash
curl -X POST http://localhost:3001/api/zkp/generate-proof \
  -H "Content-Type: application/json" \
  -d '{"secret":"123","salt":"456","amount":"100","recipient":"0x..."}'
```

## 🔒 Security Considerations

- **Private Keys**: Never expose private keys in code or logs
- **Trusted Setup**: Use the provided trusted setup or generate your own
- **Circuit Security**: Audit the Circom circuit before production use
- **API Security**: Implement proper authentication and rate limiting
- **Network Security**: Use HTTPS in production

## 📊 Performance

- **Proof Generation**: ~2-5 seconds (depends on circuit complexity)
- **Proof Verification**: ~100-500ms
- **Gas Cost**: ~200k-500k gas for verification
- **Lambda Cold Start**: ~1-3 seconds

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ETH_RPC_URL` | Ethereum RPC endpoint | `http://localhost:8545` |
| `ZKP_API_PORT` | API server port | `3001` |
| `DEPLOYER_PRIVATE_KEY` | Contract deployer private key | Required |
| `JWT_SECRET` | JWT signing secret | Required |

### Circuit Parameters

- **Field Modulus**: BLS12-381 prime field
- **Curve**: BLS12-381 elliptic curve
- **Hash Function**: Poseidon hash
- **Proof System**: Groth16 zk-SNARK

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
- Create an issue on GitHub
- Check the documentation
- Review the test examples

## 🔗 Related Projects

- [Circom](https://github.com/iden3/circom) - Circuit compiler
- [snarkjs](https://github.com/iden3/snarkjs) - zk-SNARK implementation
- [Ethers.js](https://github.com/ethers-io/ethers.js) - Ethereum library
- [BLS12-381](https://github.com/zkcrypto/bls12_381) - Elliptic curve
