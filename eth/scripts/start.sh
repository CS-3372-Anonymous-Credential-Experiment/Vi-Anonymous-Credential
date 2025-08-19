#!/bin/bash

# Start script for private Ethereum network
set -e

echo "Starting Private Ethereum Network for Research..."

DATA_DIR="/eth/data"
GENESIS_FILE="/eth/genesis.json"
PASSWORD_FILE="/eth/password.txt"
COINBASE_FILE="$DATA_DIR/keystore/coinbase"

# Initialize blockchain if not exists
if [ ! -d "$DATA_DIR" ]; then
    echo "Initializing blockchain..."
    geth --datadir "$DATA_DIR" init "$GENESIS_FILE"
fi

# Create coinbase account if doesn't exist
if [ ! -f "$COINBASE_FILE" ]; then
    echo "Creating coinbase account..."
    echo "password123" > "$PASSWORD_FILE"
    geth --datadir "$DATA_DIR" account new --password "$PASSWORD_FILE" > /eth/coinbase.txt
    COINBASE=$(grep -o '0x[a-fA-F0-9]\{40\}' /eth/coinbase.txt)
    echo "$COINBASE" > "$COINBASE_FILE"
else
    COINBASE=$(cat "$COINBASE_FILE")
fi

echo "Coinbase account: $COINBASE"

# Build unlock string for pre-funded accounts 0x1 -> 0x10
UNLOCK_ADDRESSES=$(seq -f "0x%040g" 1 16 | tr '\n' ',' | sed 's/,$//')
echo "Unlocking pre-funded accounts: $UNLOCK_ADDRESSES"

# Start Geth node
exec geth \
    --datadir "$DATA_DIR" \
    --networkid 15555 \
    --http \
    --http.addr "0.0.0.0" \
    --http.port 8545 \
    --http.api "eth,net,web3,personal,txpool,admin,debug,miner" \
    --http.corsdomain "*" \
    --ws \
    --ws.addr "0.0.0.0" \
    --ws.port 8546 \
    --ws.api "eth,net,web3,personal,txpool,admin,debug,miner" \
    --ws.origins "*" \
    --allow-insecure-unlock \
    --unlock "$COINBASE,$UNLOCK_ADDRESSES" \
    --password "$PASSWORD_FILE" \
    --mine \
    --miner.threads 1 \
    --nodiscover \
    --maxpeers 0 \
    --verbosity 3 \
    --gcmode archive \
    --syncmode full
