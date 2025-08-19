# Private Ethereum Network for VPS + Lambda Architecture

A Docker-based private Ethereum network designed for VPS deployment with AWS Lambda integration. Perfect for building scalable, serverless blockchain applications.

## Architecture

- **VPS**: Runs the private Ethereum node with RPC endpoints
- **AWS Lambda**: Stateless computation and API gateway
- **Integration**: Lambda connects to VPS via HTTP/WebSocket RPC

## Features

- **Full Ethereum Node**: Complete EVM with mining and gas computation
- **RPC Endpoints**: HTTP (8545) and WebSocket (8546) for Lambda connectivity
- **Realistic Gas Mechanics**: Maintains mainnet-like gas costs for accurate research
- **Easy Mining**: Reduced difficulty for faster block production
- **Pre-funded Accounts**: 10 accounts pre-loaded with 10,000 ETH each
- **Network ID 15555**: Dedicated network for Lambda integration
- **Security Ready**: Configuration for production VPS deployment

## Quick Start

### Easy Commands (Recommended)
```bash
# Start the network
eth start

# Check status
eth status

# Test network
eth test

# Stop network
eth stop

# Show all commands
eth help
```

### Traditional Commands
```bash
# Start the network
chmod +x manage.sh
./manage.sh start

# Check status
./manage.sh status

# Test network
./manage.sh test-network

# Connect to console
./manage.sh console
```

## Network Configuration

- **Chain ID**: 15555
- **Block Time**: ~5 seconds (Clique consensus)
- **Gas Limit**: Very high for complex computations
- **Mining Difficulty**: Low for fast development
- **HTTP RPC**: http://localhost:8545 (for Lambda)
- **WebSocket**: ws://localhost:8546 (for Lambda)
- **Data Directory**: Persistent via Docker volume

## Pre-funded Accounts

The network includes 10 pre-funded accounts with 10,000 ETH each:

1. `0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266` (Coinbase/Miner)
2. `0x70997970c51812dc3a010c7d01b50e0d17dc79c8`
3. `0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc`
4. `0x90f79bf6eb2c4f870365e785982e1f101e93b906`
5. `0x15d34aaf54267db7d7c367839aaf71a00a2c6a65`
6. `0x9965507d1a55bcc2695c58ba16fb37d819b0a4dc`
7. `0x976ea74026e726554db657fa54763abd0c3a0aa9`
8. `0x14dc79964da2c08b23698b3d3cc7ca32193d9955`
9. `0x23618e81e3f5cdf7f54c3d65f7fbc0abf5b21e8f`
10. `0xa0ee7a142d267c1f36714e4a8f75612f20a79720`

## Management Commands

| Command | Description |
|---------|-------------|
| `./manage.sh start` | Start the Ethereum network with RPC endpoints |
| `./manage.sh stop` | Stop the network |
| `./manage.sh restart` | Restart the network |
| `./manage.sh status` | Show network status and RPC connectivity |
| `./manage.sh console` | Connect to Geth console |
| `./manage.sh test-rpc` | Test RPC endpoints for Lambda connectivity |
| `./manage.sh logs` | View node logs |
| `./manage.sh reset` | Reset blockchain data |
| `./manage.sh clean` | Clean up all data |

### Flow Diagram
```
User Request → API Gateway → Lambda Function → VPS Geth RPC → Blockchain
```

### Components

#### 1. VPS (This Docker Setup)
- Runs private Ethereum node with Geth
- Exposes RPC endpoints (HTTP/WebSocket)
- Handles mining and transaction processing
- Maintains blockchain state

#### 2. AWS Lambda
- Stateless transaction processing
- Gas price calculation
- Transaction signing
- API gateway integration

#### 3. Integration Points
- **RPC Calls**: Lambda → VPS via HTTP/WebSocket
- **Transaction Flow**: Sign in Lambda → Send to VPS
- **Gas Management**: Calculate in Lambda → Execute on VPS

## Lambda Integration Example

### 1. Basic RPC Connection
```javascript
// In your Lambda function
const response = await fetch('http://YOUR_VPS_IP:8545', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_gasPrice',
        params: [],
        id: 1
    })
});
```

### 2. Transaction Signing & Sending
```javascript
// Lambda calculates gas and signs transaction
const tx = {
    from: account,
    to: recipient,
    value: amount,
    gasPrice: await getGasPrice(), // From VPS RPC
    nonce: await getNonce(account) // From VPS RPC
};

// Sign transaction in Lambda (secure)
const signedTx = await wallet.signTransaction(tx);

// Send to VPS for execution
const result = await sendRawTransaction(signedTx);
```

### 3. Gas Computation
- **Estimation**: Use `eth_estimateGas` via RPC
- **Price**: Get current `eth_gasPrice` from VPS
- **Optimization**: Cache gas prices in Lambda for efficiency

## Advanced Configuration

### Custom Genesis
Edit `genesis.json` to modify:
- Gas limits
- Mining difficulty
- Pre-funded accounts
- EIP activations

### Node Settings
Modify `scripts/start.sh` to adjust:
- Mining threads
- Gas price
- RPC APIs
- Network parameters

## Troubleshooting

### Network Won't Start
```bash
./manage.sh clean
./manage.sh start
```

### RPC Not Responding
Check logs:
```bash
./manage.sh logs
```

### Reset Everything
```bash
./manage.sh reset
```

## Security for Production VPS

⚠️ **CRITICAL**: Never expose RPC endpoints publicly without proper security.

### Quick Security Setup
1. **Firewall**: Restrict port 8545/8546 to Lambda IP ranges only
2. **TLS**: Use HTTPS with proper certificates
3. **Authentication**: Implement API keys or OAuth
4. **VPC**: Deploy VPS in private subnet with Lambda

### Security Files Included
- `vps-security.md`: Complete security configuration guide
- `lambda-example.js`: Lambda function template with best practices

### Essential Security Steps
```bash
# 1. Configure firewall (example)
sudo ufw allow from LAMBDA_IP_RANGE to any port 8545

# 2. Use reverse proxy with auth
# See vps-security.md for complete nginx config

# 3. Enable TLS
sudo certbot --nginx -d your-domain.com
```

## Files Included

- `genesis.json` - Network configuration (Chain ID 15555)
- `Dockerfile` - Container setup with Geth
- `docker-compose.yml` - Service orchestration with RPC ports
- `manage.sh` - Management script with RPC testing
- `scripts/start.sh` - Node startup with RPC endpoints
- `lambda-example.js` - Complete Lambda integration example
- `vps-security.md` - Production security configuration guide
- `README.md` - This documentation

## Deployment Checklist

### VPS Setup
- [ ] Deploy Docker containers on VPS
- [ ] Configure firewall rules
- [ ] Set up reverse proxy (nginx)
- [ ] Install SSL certificate
- [ ] Test RPC connectivity

### Lambda Setup  
- [ ] Create Lambda function
- [ ] Configure VPC settings
- [ ] Set environment variables (VPS_RPC_URL)
- [ ] Test VPS connectivity
- [ ] Set up API Gateway

### Security
- [ ] Restrict RPC access to Lambda IPs only
- [ ] Enable TLS/HTTPS
- [ ] Implement authentication
- [ ] Set up monitoring
- [ ] Configure backup system

## Contributing

This research network is designed to be easily extensible. Modify the configuration files and scripts to suit your specific research needs.
