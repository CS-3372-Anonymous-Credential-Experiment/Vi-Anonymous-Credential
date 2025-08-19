#!/bin/bash

# Setup script for private Ethereum network
set -e

echo "Setting up Private Ethereum Network..."

# Create password file
echo "password123" > /eth/password.txt

# Initialize if needed
if [ ! -d "/eth/data/geth" ]; then
    echo "Initializing blockchain with genesis block..."
    geth --datadir /eth/data init /eth/genesis.json
fi

echo "Setup completed successfully!"
