// Simple transaction sending script
// This script demonstrates how to send transactions on your private network

console.log("=== Transaction Sending Script ===");

// Check available accounts
var accounts = eth.accounts;
console.log("Available accounts:", accounts);

if (accounts.length === 0) {
    console.log("❌ No accounts available. Cannot send transactions.");
    console.log("Note: In this PoS setup, you need to create accounts first.");
    console.log("You can use the pre-funded accounts from genesis.json:");
    console.log("Account 1: 0x0000000000000000000000000000000000000001");
    console.log("Account 2: 0x0000000000000000000000000000000000000002");
    console.log("Account 3: 0x0000000000000000000000000000000000000003");
    quit();
}

// Get the first account
var fromAccount = accounts[0];
console.log("Using account:", fromAccount);

// Check balance
var balance = eth.getBalance(fromAccount);
console.log("Account balance:", web3.fromWei(balance, 'ether'), "ETH");

// Create a transaction
var transaction = {
    from: fromAccount,
    to: "0x0000000000000000000000000000000000000002", // Send to pre-funded account 2
    value: web3.toWei(0.1, 'ether'), // Send 0.1 ETH
    gas: 21000, // Standard gas limit for ETH transfer
    gasPrice: eth.gasPrice || web3.toWei(1, 'gwei')
};

console.log("Transaction details:");
console.log("From:", transaction.from);
console.log("To:", transaction.to);
console.log("Value:", web3.fromWei(transaction.value, 'ether'), "ETH");
console.log("Gas:", transaction.gas);
console.log("Gas Price:", web3.fromWei(transaction.gasPrice, 'gwei'), "Gwei");

// Send the transaction
console.log("\nSending transaction...");
try {
    var txHash = eth.sendTransaction(transaction);
    console.log("✅ Transaction sent successfully!");
    console.log("Transaction hash:", txHash);
    
    // Wait for transaction to be mined
    console.log("Waiting for transaction to be mined...");
    admin.sleep(3);
    
    // Check transaction receipt
    var receipt = eth.getTransactionReceipt(txHash);
    if (receipt) {
        console.log("✅ Transaction mined!");
        console.log("Block number:", receipt.blockNumber);
        console.log("Gas used:", receipt.gasUsed);
    } else {
        console.log("⏳ Transaction pending...");
    }
    
} catch (error) {
    console.log("❌ Transaction failed:", error.message);
    console.log("This might be because the account is not unlocked.");
    console.log("In a real setup, you would unlock the account first.");
}

console.log("\n=== Script completed ===");
