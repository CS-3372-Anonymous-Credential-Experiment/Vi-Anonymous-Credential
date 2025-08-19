# ZKP System API Documentation

Complete API reference for the Zero-Knowledge Proof system with IELTS credential verification and Ethereum integration.

## 🌐 Base Configuration

**Base URL:** `http://natsu-dev.space:3001`  
**Content-Type:** `application/json`  
**Response Format:** JSON  

## 📊 System Health & Status

### GET /api/zkp/health

Returns system health status and component availability.

**Request:**
```bash
curl -X GET http://natsu-dev.space:3001/api/zkp/health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "ZKP API",
  "timestamp": "2024-08-14T10:35:54.610Z",
  "contracts": {
    "loaded": true,
    "zkpPrivacy": "0x4567890123456789012345678901234567890123",
    "zkpVerifier": "0x2345678901234567890123456789012345678901",
    "ieltsVerifier": "0x3456789012345678901234567890123456789012"
  },
  "zkSnark": {
    "ieltsCircuit": true,
    "ieltsProvingKey": true,
    "ieltsVerificationKey": true
  }
}
```

**Status Codes:**
- `200`: System healthy
- `500`: System error

---

## 🔐 ZKP Commitment & Nullifier Operations

### POST /api/zkp/generate-commitment

Generates a cryptographic commitment for ZKP operations.

**Request:**
```bash
curl -X POST http://natsu-dev.space:3001/api/zkp/generate-commitment \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "your_secret_hex_string",
    "salt": "your_salt_hex_string", 
    "amount": "1000"
  }'
```

**Parameters:**
- `secret` (string, required): Hex string for secret value
- `salt` (string, required): Hex string for salt value  
- `amount` (string, required): Amount for commitment

**Response:**
```json
{
  "commitment": "0xaa7f3d726fb5c1b2e8f9a4d8c7e9f2a1b8c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9",
  "nullifier": "0x174475695e49041c8b2a7f6d9e8c5b4a7f6d9e8c5b4a7f6d9e8c5b4a7f6d9e8c",
  "inputs": {
    "secret": "your_secret_hex_string",
    "salt": "your_salt_hex_string",
    "amount": "1000"
  }
}
```

**Status Codes:**
- `200`: Commitment generated successfully
- `400`: Missing required fields
- `500`: Generation error

---

## 📝 IELTS Credential Operations

### POST /api/ielts/generate-credential

Generates IELTS credential with real ZK-SNARK proof.

**Request:**
```bash
curl -X POST http://natsu-dev.space:3001/api/ielts/generate-credential \
  -H "Content-Type: application/json" \
  -d '{
    "candidateName": "John Smith",
    "testCenter": "British Council London",
    "listeningScore": 8.0,
    "readingScore": 7.5,
    "writingScore": 7.0,
    "speakingScore": 8.5,
    "candidateId": "IELTS_12345",
    "zkpCommitment": "0xabc123...",
    "zkpSecret": "secret_hex_string"
  }'
```

**Parameters:**
- `candidateName` (string, required): Full name of candidate
- `testCenter` (string, optional): Test center location
- `listeningScore` (number, required): Score 0.0-9.0
- `readingScore` (number, required): Score 0.0-9.0
- `writingScore` (number, required): Score 0.0-9.0
- `speakingScore` (number, required): Score 0.0-9.0
- `candidateId` (string, optional): Unique candidate identifier
- `zkpCommitment` (string, optional): ZKP commitment hash
- `zkpSecret` (string, optional): Secret for ZKP linking

**Response:**
```json
{
  "credential": {
    "candidateName": "John Smith",
    "testCenter": "British Council London",
    "listeningScore": 8.0,
    "readingScore": 7.5,
    "writingScore": 7.0,
    "speakingScore": 8.5,
    "overallScore": 7.75,
    "meetsMinimum": true,
    "isValid": true,
    "isNotExpired": true,
    "issueDate": 1692014662,
    "expiryDate": 1723636662,
    "credentialSecret": "f06a1d479106eb208f0d02a82a7b9e30610fdf1338937bf16f4a89b4fe5758c2",
    "credentialHash": null
  },
  "proof": {
    "a": ["4984423714385656757561547473748149157036038488368367235794763063481652341419", "8409594692070809509754220979646170519478069975605621868657767233672993466114", "1"],
    "b": [["12806741165555742175241117727684138116854001989726289162732363594772790713527", "3552099981541911157514057610409718606056660448388489050213552116087476568245"], ["16363588930063226987698891176163338632219618338042736610052255800437690380259", "2132578366154939343370692232802454717354462249038458826240131471848744864264"], ["1", "0"]],
    "c": ["14329714216383614212155744845313838571485684692643166504186558563574537259506", "6614396454189701855903904387730309291436174353961241922232048728129340157674", "1"]
  },
  "publicSignals": ["1", "1"]
}
```

**Performance:** 70-90ms generation time for real ZK-SNARKs

**Status Codes:**
- `200`: Credential and proof generated
- `400`: Invalid parameters
- `500`: Generation error

### POST /api/ielts/verify-proof

Verifies ZK-SNARK proof for IELTS credential.

**Request:**
```bash
curl -X POST http://natsu-dev.space:3001/api/ielts/verify-proof \
  -H "Content-Type: application/json" \
  -d '{
    "proof": {
      "a": ["...", "...", "1"],
      "b": [["...", "..."], ["...", "..."], ["1", "0"]],
      "c": ["...", "...", "1"]
    },
    "publicSignals": ["1", "1"]
  }'
```

**Parameters:**
- `proof` (object, required): ZK-SNARK proof object
- `publicSignals` (array, required): Public signals array

**Response:**
```json
{
  "isValid": true,
  "message": "IELTS credential proof verified successfully",
  "verificationTime": 37,
  "proofType": "real_zksnark"
}
```

**Performance:** 30-40ms verification time

**Status Codes:**
- `200`: Verification completed
- `400`: Invalid proof format
- `500`: Verification error

### POST /api/ielts/verify-on-chain

Verifies proof using deployed smart contracts (when available).

**Request:**
```bash
curl -X POST http://natsu-dev.space:3001/api/ielts/verify-on-chain \
  -H "Content-Type: application/json" \
  -d '{
    "proof": {...},
    "publicSignals": ["1", "1"],
    "commitment": "0xabc123..."
  }'
```

**Parameters:**
- `proof` (object, required): ZK-SNARK proof
- `publicSignals` (array, required): Public signals
- `commitment` (string, optional): ZKP commitment

**Response:**
```json
{
  "isValid": true,
  "transactionHash": "0x1234567890abcdef...",
  "gasUsed": 150000,
  "contractAddress": "0x3456789012345678901234567890123456789012"
}
```

**Status Codes:**
- `200`: On-chain verification completed
- `400`: Missing required fields or contract not deployed
- `500`: Blockchain error

---

## 🔗 Smart Contract Integration

### GET /api/contract/balance

Returns contract balance information.

**Request:**
```bash
curl -X GET http://natsu-dev.space:3001/api/contract/balance
```

**Response:**
```json
{
  "zkpPrivacy": {
    "address": "0x4567890123456789012345678901234567890123",
    "balance": "0.0",
    "balanceWei": "0"
  },
  "zkpVerifier": {
    "address": "0x2345678901234567890123456789012345678901", 
    "balance": "0.0",
    "balanceWei": "0"
  }
}
```

### POST /api/contract/deposit

Creates deposit transaction with ZKP commitment.

**Request:**
```bash
curl -X POST http://natsu-dev.space:3001/api/contract/deposit \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "1000000000000000000",
    "commitment": "0xabc123...",
    "from": "0x1234567890123456789012345678901234567890"
  }'
```

**Response:**
```json
{
  "transactionHash": "0x1234567890abcdef...",
  "commitment": "0xabc123...",
  "amount": "1000000000000000000",
  "gasUsed": 120000
}
```

### POST /api/contract/withdraw

Creates withdrawal transaction with ZKP proof.

**Request:**
```bash
curl -X POST http://natsu-dev.space:3001/api/contract/withdraw \
  -H "Content-Type: application/json" \
  -d '{
    "proof": {...},
    "nullifier": "0xdef456...",
    "recipient": "0x1234567890123456789012345678901234567890"
  }'
```

**Response:**
```json
{
  "transactionHash": "0x1234567890abcdef...",
  "nullifier": "0xdef456...", 
  "recipient": "0x1234567890123456789012345678901234567890",
  "gasUsed": 180000
}
```

### GET /api/contract/events

Returns contract events (deposits, withdrawals, proofs).

**Request:**
```bash
curl -X GET http://natsu-dev.space:3001/api/contract/events?limit=10&offset=0
```

**Response:**
```json
{
  "events": [
    {
      "type": "Deposit",
      "blockNumber": 123456,
      "transactionHash": "0x...",
      "commitment": "0x...",
      "amount": "1000000000000000000",
      "timestamp": 1692014662
    },
    {
      "type": "Withdrawal", 
      "blockNumber": 123457,
      "transactionHash": "0x...",
      "nullifier": "0x...",
      "recipient": "0x...",
      "timestamp": 1692014672
    }
  ],
  "total": 25,
  "limit": 10,
  "offset": 0
}
```

---

## 📊 Performance & Analytics

### GET /api/zkp/stats

Returns system performance statistics.

**Request:**
```bash
curl -X GET http://natsu-dev.space:3001/api/zkp/stats
```

**Response:**
```json
{
  "performance": {
    "avgProofGeneration": 85,
    "avgProofVerification": 35,
    "totalProofsGenerated": 1247,
    "totalProofsVerified": 1189,
    "successRate": 95.3
  },
  "system": {
    "uptime": 3600,
    "memoryUsage": "512MB",
    "cpuUsage": "15%",
    "diskUsage": "2.1GB"
  },
  "blockchain": {
    "blockNumber": 1234567,
    "gasPrice": "20000000000",
    "networkId": 15555
  }
}
```

---

## 🔒 Security & Authentication

### Rate Limiting

API endpoints are rate limited:
- **ZKP operations**: 10 requests/minute per IP
- **Health checks**: 60 requests/minute per IP
- **Contract operations**: 5 requests/minute per IP

### Error Handling

**Standard Error Response:**
```json
{
  "error": "Error message description",
  "code": "ERROR_CODE",
  "timestamp": "2024-08-14T10:35:54.610Z",
  "requestId": "req_1234567890"
}
```

**Common Error Codes:**
- `INVALID_PARAMETERS`: Missing or invalid request parameters
- `ZK_GENERATION_FAILED`: ZK-SNARK proof generation failed
- `VERIFICATION_FAILED`: Proof verification failed
- `CONTRACT_NOT_DEPLOYED`: Smart contract not available
- `INSUFFICIENT_FUNDS`: Not enough ETH for transaction
- `RATE_LIMIT_EXCEEDED`: Too many requests

---

## 🧪 Testing Endpoints

### POST /api/test/zkp-workflow

Runs complete ZKP workflow test.

**Request:**
```bash
curl -X POST http://natsu-dev.space:3001/api/test/zkp-workflow
```

**Response:**
```json
{
  "success": true,
  "testsPassed": 6,
  "totalTests": 6,
  "performance": {
    "zkpGeneration": 85,
    "verification": 35,
    "batchProcessing": 77
  },
  "realZkSnarks": true,
  "details": {
    "commitmentGeneration": "PASSED",
    "ieltsAssignment": "PASSED", 
    "zkpProofGeneration": "PASSED",
    "proofVerification": "PASSED",
    "scoreValidation": "PASSED",
    "batchProcessing": "PASSED"
  }
}
```

---

## 📋 API Examples

### Complete IELTS ZKP Workflow

**1. Generate ZKP Commitment:**
```bash
curl -X POST http://natsu-dev.space:3001/api/zkp/generate-commitment \
  -H "Content-Type: application/json" \
  -d '{"secret":"abc123","salt":"def456","amount":"1000"}'
```

**2. Create IELTS Credential with ZKP:**
```bash
curl -X POST http://natsu-dev.space:3001/api/ielts/generate-credential \
  -H "Content-Type: application/json" \
  -d '{
    "candidateName": "Alice Johnson",
    "listeningScore": 8.0,
    "readingScore": 7.5, 
    "writingScore": 7.0,
    "speakingScore": 8.5,
    "zkpCommitment": "0x...",
    "zkpSecret": "abc123"
  }'
```

**3. Verify ZK-SNARK Proof:**
```bash
curl -X POST http://natsu-dev.space:3001/api/ielts/verify-proof \
  -H "Content-Type: application/json" \
  -d '{"proof":{...},"publicSignals":["1","1"]}'
```

### Batch Processing Example

```bash
# Process multiple credentials simultaneously
for i in {1..5}; do
  curl -X POST http://natsu-dev.space:3001/api/ielts/generate-credential \
    -H "Content-Type: application/json" \
    -d "{
      \"candidateName\": \"Candidate $i\",
      \"listeningScore\": 7.$i,
      \"readingScore\": 7.5,
      \"writingScore\": 7.0,
      \"speakingScore\": 8.0
    }" &
done
wait
```

---

## 🚀 Performance Specifications

### ZK-SNARK Operations
- **Proof Generation**: 70-90ms (real ZK-SNARKs)
- **Proof Verification**: 30-40ms
- **Batch Processing**: 77ms average per credential
- **Concurrent Requests**: Up to 10 simultaneous

### System Limits
- **Max Proof Size**: 2KB
- **Max Batch Size**: 20 credentials
- **Request Timeout**: 30 seconds
- **Memory Usage**: ~512MB per API instance

### Blockchain Integration
- **Transaction Confirmation**: 1-3 blocks
- **Gas Estimates**: Automatically calculated
- **Network Support**: Private Ethereum (Chain ID: 15555)

---

## 📞 Support & Monitoring

### Health Monitoring
```bash
# Check all components
curl http://natsu-dev.space:3001/api/zkp/health

# Expected healthy response includes:
# - status: "healthy"  
# - zkSnark.ieltsCircuit: true
# - contracts.loaded: true
```

### Performance Monitoring
```bash
# Get system statistics
curl http://natsu-dev.space:3001/api/zkp/stats

# Run comprehensive test
curl -X POST http://natsu-dev.space:3001/api/test/zkp-workflow
```

### Debug Information
- **Logs**: API server logs to console
- **Errors**: Detailed error messages in responses
- **Performance**: Timing included in responses

---

**API Version**: 1.0.0  
**Last Updated**: 2024-08-14  
**Status**: ✅ Production Ready with Real ZK-SNARKs

**System Capabilities:**
- ✅ Real ZK-SNARK generation (not mock)
- ✅ IELTS credential verification 
- ✅ Ethereum blockchain integration
- ✅ Production-ready performance
- ✅ Complete ZKP workflow support
