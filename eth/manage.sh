#!/bin/bash

# Management script for Private Ethereum Research Network

set -e

COMPOSE_FILE="docker-compose.yml"

show_help() {
    echo "Private Ethereum Network for VPS + Lambda Architecture (PoS)"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  start          Start the Ethereum network with RPC endpoints"
    echo "  stop           Stop the Ethereum network"
    echo "  restart        Restart the Ethereum network"
    echo "  logs           Show logs from the Ethereum node"
    echo "  status         Show network status and RPC connectivity"
    echo "  console        Connect to Geth console"
    echo "  test-rpc       Test RPC endpoints for Lambda connectivity"
    echo "  test-network   Test network functionality and accounts"
    echo "  dev-mine       Start development mining for block creation"
    echo "  reset          Reset the blockchain (WARNING: destroys all data)"
    echo "  clean          Clean up containers and volumes"
    echo ""
    echo "RPC Endpoints:"
    echo "  HTTP:      http://localhost:8545"
    echo "  WebSocket: ws://localhost:8546"
    echo "  Network:   15555 (PoS)"
    echo ""
    echo "Note: This is a PoS network. Use 'dev-mine' for development block creation."
    echo ""
}

start_network() {
    echo "Starting Private Ethereum Network for VPS + Lambda Architecture..."
    docker-compose up -d ethereum-node
    echo "Network started!"
    echo "HTTP RPC: http://localhost:8545 (for Lambda connections)"
    echo "WebSocket: ws://localhost:8546 (for Lambda connections)"
    echo "Network ID: 15555"
}

# Explorer functionality removed (requires RPC)

stop_network() {
    echo "Stopping Private Ethereum Research Network..."
    docker-compose down
}

show_logs() {
    docker-compose logs -f ethereum-node
}

show_status() {
    echo "=== VPS + Lambda Network Status ==="
    if docker ps | grep -q research-ethereum; then
        echo "✓ Ethereum node is running"
        
        # Check if RPC is responding
        if curl -s -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' http://localhost:8545 > /dev/null; then
            echo "✓ HTTP RPC endpoint responding (Lambda ready)"
            
            # Get current block number
            BLOCK=$(curl -s -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' http://localhost:8545 | jq -r '.result')
            echo "✓ Current block: $((16#${BLOCK:2}))"
            
            # Get balance of coinbase
            BALANCE=$(curl -s -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266","latest"],"id":1}' http://localhost:8545 | jq -r '.result')
            BALANCE_ETH=$(echo "scale=2; $((16#${BALANCE:2})) / 10^18" | bc -l)
            echo "✓ Coinbase balance: ${BALANCE_ETH} ETH"
            echo "✓ Network ID: 15555"
        else
            echo "✗ RPC endpoint not responding"
        fi
    else
        echo "✗ Ethereum node is not running"
    fi
}

connect_console() {
    echo "Connecting to Geth console via RPC..."
    docker exec -it research-ethereum geth attach http://localhost:8545
}

test_rpc() {
    echo "Testing RPC endpoint for Lambda connectivity..."
    echo ""
    echo "=== Testing eth_blockNumber ==="
    curl -X POST -H "Content-Type: application/json" \
         -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
         http://localhost:8545
    echo ""
    echo ""
    echo "=== Testing eth_gasPrice ==="
    curl -X POST -H "Content-Type: application/json" \
         -d '{"jsonrpc":"2.0","method":"eth_gasPrice","params":[],"id":1}' \
         http://localhost:8545
    echo ""
    echo ""
    echo "=== Testing net_version ==="
    curl -X POST -H "Content-Type: application/json" \
         -d '{"jsonrpc":"2.0","method":"net_version","params":[],"id":1}' \
         http://localhost:8545
    echo ""
}

dev_mine() {
    echo "Starting development mining for PoS network..."
    echo "This will create initial blocks and set up periodic mining."
    docker exec -it research-ethereum geth --exec 'loadScript("/eth/scripts/dev-mine.js")' attach http://localhost:8545
}

send_transaction() {
    echo "Sending test transaction..."
    docker exec -it research-ethereum geth --exec 'loadScript("/eth/scripts/send-transaction.js")' attach http://localhost:8545
}

check_balance() {
    echo "Checking account balances..."
    docker exec -it research-ethereum geth --exec 'loadScript("/eth/scripts/check-balance.js")' attach http://localhost:8545
}

test_network() {
    echo "Testing network functionality..."
    docker exec -it research-ethereum geth --exec 'loadScript("/eth/scripts/test-network.js")' attach http://localhost:8545
}

reset_blockchain() {
    echo "WARNING: This will destroy all blockchain data!"
    read -p "Are you sure? (yes/no): " confirm
    if [ "$confirm" = "yes" ]; then
        echo "Resetting blockchain..."
        docker-compose down
        docker volume rm eth_ethereum_data 2>/dev/null || true
        docker-compose up -d ethereum-node
        echo "Blockchain reset completed!"
    else
        echo "Reset cancelled."
    fi
}

clean_all() {
    echo "Cleaning up containers and volumes..."
    docker-compose down
    docker volume rm eth_ethereum_data eth_postgres_data 2>/dev/null || true
    docker system prune -f
    echo "Cleanup completed!"
}

# Make scripts executable (only if they exist)
if [ -d "scripts" ]; then
    chmod +x scripts/*.sh 2>/dev/null || true
fi

case "$1" in
    start)
        start_network
        ;;
    stop)
        stop_network
        ;;
    restart)
        stop_network
        sleep 2
        start_network
        ;;
    logs)
        show_logs
        ;;
    status)
        show_status
        ;;
    console)
        connect_console
        ;;
    test-rpc)
        test_rpc
        ;;
    dev-mine)
        dev_mine
        ;;
    send)
        send_transaction
        ;;
    balance)
        check_balance
        ;;
    test-network)
        test_network
        ;;
    reset)
        reset_blockchain
        ;;
    clean)
        clean_all
        ;;
    *)
        show_help
        ;;
esac
