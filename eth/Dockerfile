# Private Ethereum Network for Research
FROM ethereum/client-go:latest

# Install additional tools
RUN apk add --no-cache \
    curl \
    jq \
    bash \
    vim

# Create working directory
WORKDIR /eth

# Copy genesis file
COPY genesis.json /eth/genesis.json
COPY scripts/ /eth/scripts/

# Create data directory
RUN mkdir -p /eth/data

# Initialize the blockchain with genesis
RUN geth --datadir /eth/data init /eth/genesis.json

# Expose ports
# 8545: HTTP RPC
# 8546: WebSocket RPC  
# 30303: P2P networking
# 8551: Engine API (for consensus layer)
EXPOSE 8545 8546 30303 8551

# Create accounts and setup script
COPY setup.sh /eth/setup.sh
COPY entrypoint.sh /eth/entrypoint.sh
RUN chmod +x /eth/setup.sh /eth/scripts/*.sh /eth/entrypoint.sh

# Override the entrypoint
ENTRYPOINT ["/eth/entrypoint.sh"]
