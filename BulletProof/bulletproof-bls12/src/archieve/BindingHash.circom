include "/home/accumulator/Vi-Anonymous-Credential/circomlib/circuits/poseidon.circom";

// Chained Poseidon for large input arrays
// N_FR = number of fr_elements
// CHUNK = max Poseidon arity supported minus 1 (for chaining)
template BindHash(N_FR, CHUNK) {
    // Inputs
    signal input hash;                // expected target hash
    signal input mapped_com_254;      // already in BN254
    signal input fr_elements[N_FR];   // array of BN254 elements
    signal private input nonce;       // BN254

    // Output for validation
    signal output valid;

    // Compute number of chunks
    var nChunks = ((N_FR + CHUNK - 1) - ((N_FR + CHUNK - 1) % CHUNK)) / CHUNK + ((N_FR + CHUNK - 1) % CHUNK != 0 ? 1 : 0);
    signal intermediate[nChunks]; // store intermediate hashes

    // First chunk: include mapped_com_254
    var firstChunkSize = (CHUNK < N_FR) ? CHUNK : N_FR;
    component pose0 = Poseidon(firstChunkSize + 1);
    pose0.inputs[0] <== mapped_com_254;
    for (var i = 0; i < firstChunkSize; i++) {
        pose0.inputs[i + 1] <== fr_elements[i];
    }
    intermediate[0] <== pose0.out;

    // Remaining chunks
    for (var c = 1; c < nChunks; c++) {
        var start = c*CHUNK;
        var end = ((start + CHUNK) < N_FR) ? (start + CHUNK) : N_FR;
        var size = end - start;

        component pose = Poseidon(size + 1);
        pose.inputs[0] <== intermediate[c-1]; // absorb previous
        for (var j = 0; j < size; j++) {
            pose.inputs[j+1] <== fr_elements[start + j];
        }
        intermediate[c] <== pose.out;
    }

    // Final Poseidon: absorb nonce
    component finalPose = Poseidon(2);
    finalPose.inputs[0] <== intermediate[nChunks-1];
    finalPose.inputs[1] <== nonce;

    // Connect output signals
    valid <== (finalPose.out === hash) ? 1 : 0;
}
  
// Instantiate main circuit
component main = BindHash(20, 10); // N_FR=20, CHUNK=10