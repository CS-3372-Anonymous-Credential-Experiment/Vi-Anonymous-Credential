# Private Ethereum Network API Documentation

## RPC Endpoints

- **HTTP**: `http://localhost:8545`
- **WebSocket**: `ws://localhost:8546`
- **Network ID**: 15555
- **Chain ID**: 15555

## Authentication

Currently configured for development with no authentication. For production:
- Use HTTPS/WSS
- Implement authentication (see vps-security.md)
- Restrict access to Lambda IP ranges

## JSON-RPC Methods

### Network Status

#### eth_blockNumber
Returns the current block number.
```json
{
    "jsonrpc": "2.0",
    "method": "eth_blockNumber",
    "params": [],
    "id": 1
}
```
Response:
```json
{
    "jsonrpc": "2.0",
    "id": 1,
    "result": "0x1234" // Block number in hex
}
```

#### eth_syncing
Returns sync status.
```json
{
    "jsonrpc": "2.0",
    "method": "eth_syncing",
    "params": [],
    "id": 1
}
```
Response:
```json
{
    "jsonrpc": "2.0",
    "id": 1,
    "result": false // false when not syncing
}
```

#### net_version
Returns network ID.
```json
{
    "jsonrpc": "2.0",
    "method": "net_version",
    "params": [],
    "id": 1
}
```
Response:
```json
{
    "jsonrpc": "2.0",
    "id": 1,
    "result": "15555"
}
```

### Account Management

#### eth_accounts
Returns list of accounts.
```json
{
    "jsonrpc": "2.0",
    "method": "eth_accounts",
    "params": [],
    "id": 1
}
```

#### eth_getBalance
Get account balance.
```json
{
    "jsonrpc": "2.0",
    "method": "eth_getBalance",
    "params": [
        "0x0000000000000000000000000000000000000001",
        "latest"
    ],
    "id": 1
}
```

**Pre-funded Accounts (10,000 ETH each):**
- `0x0000000000000000000000000000000000000001`
- `0x0000000000000000000000000000000000000002`
- `0x0000000000000000000000000000000000000003`
- `0x0000000000000000000000000000000000000004`
- `0x0000000000000000000000000000000000000005`
- `0x0000000000000000000000000000000000000006`
- `0x0000000000000000000000000000000000000007`
- `0x0000000000000000000000000000000000000008`
- `0x0000000000000000000000000000000000000009`

**Note:** All pre-funded accounts contain exactly 10,000 ETH. These accounts are intended for development and testing purposes in the private network.

#### personal_newAccount
Create new account (development only).
```json
{
    "jsonrpc": "2.0",
    "method": "personal_newAccount",
    "params": ["password"],
    "id": 1
}
```

### Transaction Operations

#### eth_sendTransaction
Send transaction.
```json
{
    "jsonrpc": "2.0",
    "method": "eth_sendTransaction",
    "params": [{
        "from": "0x0000000000000000000000000000000000000001",
        "to": "0x0000000000000000000000000000000000000002",
        "value": "0x1234",
        "gas": "0x5208", // 21000
        "gasPrice": "0x3b9aca00" // 1 Gwei
    }],
    "id": 1
}
```

#### eth_sendRawTransaction
Send signed transaction.
```json
{
    "jsonrpc": "2.0",
    "method": "eth_sendRawTransaction",
    "params": ["0x...signed transaction data..."],
    "id": 1
}
```

#### eth_getTransactionByHash
Get transaction details.
```json
{
    "jsonrpc": "2.0",
    "method": "eth_getTransactionByHash",
    "params": ["0x...transaction hash..."],
    "id": 1
}
```

### Gas & Fee Estimation

#### eth_gasPrice
Get current gas price.
```json
{
    "jsonrpc": "2.0",
    "method": "eth_gasPrice",
    "params": [],
    "id": 1
}
```

#### eth_estimateGas
Estimate gas for transaction.
```json
{
    "jsonrpc": "2.0",
    "method": "eth_estimateGas",
    "params": [{
        "from": "0x0000000000000000000000000000000000000001",
        "to": "0x0000000000000000000000000000000000000002",
        "value": "0x1234"
    }],
    "id": 1
}
```

#### eth_maxPriorityFeePerGas
Get max priority fee.
```json
{
    "jsonrpc": "2.0",
    "method": "eth_maxPriorityFeePerGas",
    "params": [],
    "id": 1
}
```

### Smart Contract Interaction

#### eth_call
Call contract method (no state change).
```json
{
    "jsonrpc": "2.0",
    "method": "eth_call",
    "params": [{
        "to": "0x...contract address...",
        "data": "0x...encoded function call..."
    }, "latest"],
    "id": 1
}
```

#### eth_getCode
Get contract code.
```json
{
    "jsonrpc": "2.0",
    "method": "eth_getCode",
    "params": [
        "0x...contract address...",
        "latest"
    ],
    "id": 1
}
```

### Block Information

#### eth_getBlockByNumber
Get block by number.
```json
{
    "jsonrpc": "2.0",
    "method": "eth_getBlockByNumber",
    "params": [
        "latest",
        true  // Include transactions
    ],
    "id": 1
}
```

#### eth_getBlockByHash
Get block by hash.
```json
{
    "jsonrpc": "2.0",
    "method": "eth_getBlockByHash",
    "params": [
        "0x...",
        true  // Include transactions
    ],
    "id": 1
}
```

### Transaction Pool

#### txpool_status
Get pending transaction count.
```json
{
    "jsonrpc": "2.0",
    "method": "txpool_status",
    "params": [],
    "id": 1
}
```

#### txpool_inspect
Inspect pending transactions.
```json
{
    "jsonrpc": "2.0",
    "method": "txpool_inspect",
    "params": [],
    "id": 1
}
```

### State & Storage

#### eth_getStorageAt
Get contract storage.
```json
{
    "jsonrpc": "2.0",
    "method": "eth_getStorageAt",
    "params": [
        "0x...contract address...",
        "0x0", // Storage position
        "latest"
    ],
    "id": 1
}
```

#### eth_getTransactionCount
Get account nonce.
```json
{
    "jsonrpc": "2.0",
    "method": "eth_getTransactionCount",
    "params": [
        "0x...address...",
        "latest"
    ],
    "id": 1
}
```

### Debug & Admin (Development Only)

#### debug_traceTransaction
Trace transaction execution.
```json
{
    "jsonrpc": "2.0",
    "method": "debug_traceTransaction",
    "params": [
        "0x...transaction hash...",
        {"tracer": "callTracer"}
    ],
    "id": 1
}
```

#### admin_nodeInfo
Get node information.
```json
{
    "jsonrpc": "2.0",
    "method": "admin_nodeInfo",
    "params": [],
    "id": 1
}
```

## WebSocket Subscriptions

### New Heads (Blocks)
```javascript
// Subscribe
{
    "jsonrpc": "2.0",
    "method": "eth_subscribe",
    "params": ["newHeads"],
    "id": 1
}

// Unsubscribe
{
    "jsonrpc": "2.0",
    "method": "eth_unsubscribe",
    "params": ["0x...subscription id..."],
    "id": 1
}
```

### Logs (Events)
```javascript
{
    "jsonrpc": "2.0",
    "method": "eth_subscribe",
    "params": [
        "logs",
        {
            "address": "0x...contract address...",
            "topics": ["0x...event signature..."]
        }
    ],
    "id": 1
}
```

### Pending Transactions
```javascript
{
    "jsonrpc": "2.0",
    "method": "eth_subscribe",
    "params": ["newPendingTransactions"],
    "id": 1
}
```

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| -32700 | Parse error | Invalid JSON |
| -32600 | Invalid Request | JSON not a valid request object |
| -32601 | Method not found | Method does not exist |
| -32602 | Invalid params | Invalid method parameters |
| -32603 | Internal error | Internal JSON-RPC error |
| -32000 to -32099 | Server error | Implementation-specific errors |

## Rate Limits

- Default: No rate limiting in development
- Production: Configure in nginx (see vps-security.md)
- Recommended: 100 requests/second per IP

## Example Lambda Integration

```javascript
// Using ethers.js in Lambda
const { ethers } = require('ethers');

const provider = new ethers.providers.JsonRpcProvider('http://YOUR_VPS_IP:8545');

// Get block number
const blockNumber = await provider.getBlockNumber();

// Send transaction
const tx = {
    to: recipient,
    value: ethers.utils.parseEther("1.0"),
    gasPrice: await provider.getGasPrice()
};

const wallet = new ethers.Wallet(privateKey, provider);
const txResponse = await wallet.sendTransaction(tx);
```

## Security Notes

1. **Production Setup**:
   - Use HTTPS/WSS
   - Implement authentication
   - Configure firewall rules
   - Set up rate limiting

2. **Lambda Integration**:
   - Store private keys securely
   - Use AWS Secrets Manager
   - Implement retry logic
   - Handle errors gracefully

3. **Monitoring**:
   - Track RPC errors
   - Monitor gas prices
   - Watch transaction pool
   - Set up alerts

## Testing Tools

### 1. RPC Test
```bash
./manage.sh test-rpc
```

### 2. Curl Examples
```bash
# Get block number
curl -X POST -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
     http://localhost:8545

# Get balance
curl -X POST -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0x...","latest"],"id":1}' \
     http://localhost:8545
```

### 3. WebSocket Test
```javascript
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:8546');

ws.on('open', () => {
    ws.send(JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_subscribe',
        params: ['newHeads'],
        id: 1
    }));
});

ws.on('message', (data) => {
    console.log(JSON.parse(data));
});
```
