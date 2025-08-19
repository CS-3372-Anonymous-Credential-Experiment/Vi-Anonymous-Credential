// Test script to verify network functionality
console.log("=== Testing Private Ethereum Network ===");

// 1. Check network info
console.log("\n1. Network Information:");
console.log("Network ID:", net.version);
console.log("Current block:", eth.blockNumber);
console.log("Syncing:", eth.syncing);

// 2. Check pre-funded accounts
console.log("\n2. Pre-funded Accounts:");
var accounts = [
    "0x0000000000000000000000000000000000000001",
    "0x0000000000000000000000000000000000000002",
    "0x0000000000000000000000000000000000000003"
];

for (var i = 0; i < accounts.length; i++) {
    var balance = eth.getBalance(accounts[i]);
    console.log("Account", i+1, ":", accounts[i], "Balance:", web3.fromWei(balance, "ether"), "ETH");
}

// 3. Test gas price
console.log("\n3. Gas Information:");
var gasPrice = eth.gasPrice;
console.log("Gas Price:", web3.fromWei(gasPrice, "gwei"), "Gwei");

// 4. Test transaction pool
console.log("\n4. Transaction Pool:");
var txPool = txpool.status;
console.log("Pending:", txPool.pending);
console.log("Queued:", txPool.queued);

// 5. Test RPC methods
console.log("\n5. RPC Method Test:");
try {
    var block = eth.getBlock("latest");
    console.log("Latest block hash:", block.hash);
    console.log("Block timestamp:", new Date(block.timestamp * 1000));
} catch (error) {
    console.log("Error getting latest block:", error.message);
}

console.log("\n=== Network Test Completed ===");
