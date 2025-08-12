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

    // --- witness scalars ---
    signal input x;
    signal input l;
    signal input sigma;
    signal input rho;

    // --- serialized point bytes ---
    signal input Cx_bytes[96];
    signal input Cw_bytes[96];
    signal input Csigma_bytes[96];
    signal input Crho_bytes[96];

    // Poseidon binding for x (cheap in-circuit hash) -> Hx public
    component poseX = Poseidon(1);
    poseX.inputs[0] <== x;
    signal Hx;
    Hx <== poseX.out;

    // enforce the scalar relations
    x_sigma === x * sigma;
    x_rho === x * rho;
}

component main = GenZKP_Strong();
