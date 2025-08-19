pragma circom 2.1.6;

include "lib/poseidon.circom";
include "lib/comparators.circom";
include "lib/bitify.circom";

// Main ZKP circuit for BLS12-381 operations
template Main() {
    // Public inputs
    signal input publicInput;
    signal input commitment;
    signal input nullifier;
    
    // Private inputs
    signal input secret;
    signal input salt;
    signal input amount;
    signal input recipient;
    
    // Outputs
    signal output out;
    
    // Component instances
    component hasher = Poseidon(3);
    component lessThan = LessThan(252);
    component num2bits = Num2Bits(252);
    
    // Hash the secret and salt to create commitment
    hasher.inputs[0] <== secret;
    hasher.inputs[1] <== salt;
    hasher.inputs[2] <== amount;
    
    // Verify commitment matches
    commitment === hasher.out;
    
    // Create nullifier from secret
    component nullifierHasher = Poseidon(1);
    nullifierHasher.inputs[0] <== secret;
    nullifier === nullifierHasher.out;
    
    // Verify amount is positive
    lessThan.in[0] <== 0;
    lessThan.in[1] <== amount;
    lessThan.out === 1;
    
    // Verify amount is within reasonable bounds (2^253 - 1)
    num2bits.in <== amount;
    
    // Output the recipient address
    out <== recipient;
}

component main { public [publicInput, commitment, nullifier] } = Main();
