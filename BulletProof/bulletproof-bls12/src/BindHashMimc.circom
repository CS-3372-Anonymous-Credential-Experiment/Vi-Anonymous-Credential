// pragma circom 2.0.0

include "/home/accumulator/Vi-Anonymous-Credential/circomlib/circuits/mimcsponge.circom"; // or paste MiMCSponge + MiMCFeistel here

template TestHashCircuit(proofLen, commitLen) {
    // Inputs
    signal input proof[proofLen];       // array of proof elements
    signal input commitment_bytes[commitLen]; // commitment bytes as field elements
    signal private input nonce;                 // nonce
    signal input k;                     // MiMC key
    signal input hash;

    // Map commitment_bytes (here we assume they are already BN254 field elements)
    // In Rust you used map_bls_to_bn254, here we just input as Fr directly

    signal fr_elements[proofLen + commitLen + 1]; // final array including nonce

    var i;

    // Copy proof into fr_elements
    for (i = 0; i < proofLen; i++) {
        fr_elements[i] <== proof[i];
    }

    // Copy commitment_bytes
    for (i = 0; i < commitLen; i++) {
        fr_elements[proofLen + i] <== commitment_bytes[i];
    }

    // Append nonce
    fr_elements[proofLen + commitLen] <== nonce;

    // Hash all with MiMC sponge
    component mimc = MiMCSponge(proofLen + commitLen + 1, 220, 1);
    for (i = 0; i < proofLen + commitLen + 1; i++) {
        mimc.ins[i] <== fr_elements[i];
    }
    mimc.k <== k;

    signal output hash_out;
    hash_out <== mimc.outs[0];
}


component main = TestHashCircuit(20, 4);