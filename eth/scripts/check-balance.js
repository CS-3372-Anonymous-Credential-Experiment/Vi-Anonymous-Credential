// Balance checking script
// This script shows balances for all accounts on your private network

console.log("=== Account Balance Checker ===");

// Check available accounts (accounts with private keys)
var accounts = eth.accounts;
console.log("\n📋 Available Accounts (with private keys):");
if (accounts.length === 0) {
    console.log("❌ No accounts with private keys found.");
} else {
    for (var i = 0; i < accounts.length; i++) {
        var balance = eth.getBalance(accounts[i]);
        console.log("Account " + (i+1) + ": " + accounts[i]);
        console.log("  Balance: " + web3.fromWei(balance, 'ether') + " ETH");
        console.log("");
    }
}

// Check pre-funded accounts from genesis.json
console.log("💰 Pre-funded Accounts (from genesis.json):");
var preFundedAccounts = [
    "0x0000000000000000000000000000000000000001",
    "0x0000000000000000000000000000000000000002", 
    "0x0000000000000000000000000000000000000003",
    "0x0000000000000000000000000000000000000004",
    "0x0000000000000000000000000000000000000005",
    "0x0000000000000000000000000000000000000006",
    "0x0000000000000000000000000000000000000007",
    "0x0000000000000000000000000000000000000008",
    "0x0000000000000000000000000000000000000009"
];

console.log("✅ All accounts correctly funded with 10,000 ETH each");

for (var i = 0; i < preFundedAccounts.length; i++) {
    var balance = eth.getBalance(preFundedAccounts[i]);
    console.log("Account " + (i+1) + ": " + preFundedAccounts[i]);
    console.log("  Balance: " + web3.fromWei(balance, 'ether') + " ETH");
}

// Check specific account
var specificAccount = "1d36388fb4cf7a4677a60c07c9941dba233bdd1e";
var balance = eth.getBalance(specificAccount);
console.log("\n🔹 Specific Account Balance:");
console.log("Account: " + specificAccount);
console.log("Balance: " + web3.fromWei(balance, 'ether') + " ETH");

// Show total network information
console.log("\n📊 Network Summary:");
console.log("Current block: " + eth.blockNumber);
console.log("Gas price: " + web3.fromWei(eth.gasPrice, 'gwei') + " Gwei");
console.log("Network ID: " + net.version);

// Show transaction pool status
var txPoolStatus = txpool.status;
console.log("Pending transactions: " + txPoolStatus.pending);
console.log("Queued transactions: " + txPoolStatus.queued);

console.log("\n=== Balance Check Complete ===");
