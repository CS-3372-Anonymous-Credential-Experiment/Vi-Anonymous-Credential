pragma circom 2.0.0;

// NOTE: This is a *skeleton* to start with. We'll fill in the byte->bit and SHA packing
// gadgets in later steps. For now this defines the public/ signal layout we will use.
include "/home/accumulator/Vi-Anonymous-Credential/circomlib/circuits/sha256/sha256.circom";
include "/home/accumulator/Vi-Anonymous-Credential/circomlib/circuits/poseidon.circom";

template GenZKP_Strong() {
    // --- public inputs (hash words and scalar outputs) ---
    signal input Cx_hash_words[8];
    signal input Cw_hash_words[8];
    signal input Csigma_hash_words[8];
    signal input Crho_hash_words[8];

    signal input x_sigma;
    signal input x_rho;

    // ---  witness scalars ---
    signal  input x;
    signal  input l;
    signal  input sigma;
    signal  input rho;

    // ---  serialized point bytes (BLS12-381 G1 uncompressed = 96 bytes) ---
    var POINT_BYTES = 96;
    signal  Cx_bytes[POINT_BYTES];
    signal  Cw_bytes[POINT_BYTES];
    signal  Csigma_bytes[POINT_BYTES];
    signal  Crho_bytes[POINT_BYTES];

    // Poseidon binding for x (cheap in-circuit hash) -> Hx public
    component poseX = Poseidon(1);
    poseX.inputs[0] <== x;
    signal Hx;
    Hx <== poseX.out;

    // TODO: later: convert bytes -> bits, run SHA256, pack into 8x32 words and assert equality.

    // enforce the scalar relations (we will keep these here as constraints)
    x_sigma === x * sigma;
    x_rho === x * rho;

    // public outputs: the C*_hash_words, x_sigma, x_rho, and Hx are exposed implicitly
}

component main = GenZKP_Strong();
