const fs = require('fs');
const crypto = require('crypto');

// Function to decrypt keystore file properly
function decryptKeystore(keystorePath, password) {
    try {
        const keystoreContent = fs.readFileSync(keystorePath, 'utf8');
        const keystore = JSON.parse(keystoreContent);
        
        console.log('📁 Keystore loaded for address:', keystore.address);
        console.log('🔐 Attempting to decrypt with password:', password);
        
        // Extract parameters from keystore
        const { cipher, ciphertext, cipherparams, kdf, kdfparams, mac } = keystore.crypto;
        
        // Derive key using scrypt
        const derivedKey = crypto.scryptSync(password, kdfparams.salt, kdfparams.dklen, {
            N: kdfparams.n,
            r: kdfparams.r,
            p: kdfparams.p
        });
        
        // Verify MAC
        const macData = derivedKey.slice(16, 32) + ciphertext;
        const calculatedMac = crypto.createHash('sha256').update(macData).digest('hex');
        
        if (calculatedMac !== mac) {
            console.log('❌ MAC verification failed - wrong password');
            return null;
        }
        
        // Decrypt the private key
        const key = derivedKey.slice(0, 16);
        const iv = Buffer.from(cipherparams.iv, 'hex');
        const encryptedData = Buffer.from(ciphertext, 'hex');
        
        const decipher = crypto.createDecipheriv('aes-128-ctr', key, iv);
        let decrypted = decipher.update(encryptedData, null, 'hex');
        decrypted += decipher.final('hex');
        
        return `0x${decrypted}`;
        
    } catch (error) {
        console.error('❌ Error decrypting keystore:', error.message);
        return null;
    }
}

// Main function
function extractPrivateKeys() {
    console.log('🔐 Extracting Private Keys from Keystore Files...\n');
    
    // Account 1
    const keystorePath1 = '/root/eth/keystore/UTC--2025-08-14T07-01-14.859052313Z--1d36388fb4cf7a4677a60c07c9941dba233bdd1e';
    const password1 = '123123';
    
    console.log('📋 Account 1: 0x1d36388FB4Cf7A4677A60C07C9941dBA233BdD1E');
    const privateKey1 = decryptKeystore(keystorePath1, password1);
    
    if (privateKey1) {
        console.log('✅ Private Key 1:', privateKey1);
    } else {
        console.log('❌ Failed to decrypt Account 1');
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Account 2
    const keystorePath2 = '/root/eth/keystore/UTC--2025-08-14T07-02-01.671199861Z--e2d6bd760d4557a2e1d55fab7bf1035042594d53';
    const password2 = '123123';
    
    console.log('📋 Account 2: 0xE2D6Bd760D4557a2e1d55fAB7Bf1035042594D53');
    const privateKey2 = decryptKeystore(keystorePath2, password2);
    
    if (privateKey2) {
        console.log('✅ Private Key 2:', privateKey2);
    } else {
        console.log('❌ Failed to decrypt Account 2');
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('💡 Copy the private keys above and use them in deploy-final.js');
    console.log('🔒 Keep these private keys secure and never share them!');
}

extractPrivateKeys();
