const fs = require('fs');
const crypto = require('crypto');

async function extractPrivateKey() {
    try {
        console.log('🔐 Extracting private key from keystore...');
        
        // Read the keystore file
        const keystorePath = '/eth/data/keystore/UTC--2025-08-14T06-40-45.685029262Z--86203921927d1f44a092a3a42b638c5d013b73cb';
        const keystoreContent = fs.readFileSync(keystorePath, 'utf8');
        const keystore = JSON.parse(keystoreContent);
        
        console.log('📁 Keystore loaded for address:', keystore.address);
        
        // Get password from command line argument or environment variable
        const password = process.argv[2] || process.env.KEYSTORE_PASSWORD;
        
        if (!password) {
            console.log('❌ Please provide the keystore password:');
            console.log('   node extract-private-key.js YOUR_PASSWORD');
            console.log('   or set KEYSTORE_PASSWORD environment variable');
            return;
        }
        
        // This is a simplified version - in practice, you'd use a library like eth-keyring
        console.log('💡 For security reasons, please use geth to extract your private key:');
        console.log('   geth account import --keystore /eth/data/keystore/UTC--2025-08-14T06-40-45.685029262Z--86203921927d1f44a092a3a42b638c5d013b73cb');
        console.log('   Then copy the private key and use it in deploy-simple.js');
        
        console.log('\n📋 Keystore details:');
        console.log('  Address:', keystore.address);
        console.log('  Cipher:', keystore.crypto.cipher);
        console.log('  KDF:', keystore.crypto.kdf);
        console.log('  Version:', keystore.version);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

extractPrivateKey();
