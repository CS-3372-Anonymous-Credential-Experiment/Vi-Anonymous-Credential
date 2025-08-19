#!/bin/bash

# Custom entrypoint for private Ethereum network
set -e

echo "Starting Private Ethereum Network Entrypoint..."

# Execute the start script
exec /eth/scripts/start.sh
