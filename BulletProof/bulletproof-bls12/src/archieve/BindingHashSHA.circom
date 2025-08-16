// pragma circom 2.0.0;
include "/home/accumulator/Vi-Anonymous-Credential/circomlib/circuits/sha256/sha256.circom"; // For the SHA-256 hash function
include "/home/accumulator/Vi-Anonymous-Credential/circomlib/circuits/bitify.circom"; // For Num2Bits (field element to bits) and Bits2Num (bits to field element)

// N_FR: The number of field elements in the fr_elements array.
// TOTAL_INPUT_BITS_CONST: The total number of bits that will be fed into SHA-256.
// This circuit computes SHA-256 hash of (mapped_com_254 || fr_elements[0]...N_FR-1 || nonce)
// and proves that it matches a public 'hash' input.
template BindHash_SHA256(N_FR, TOTAL_INPUT_BITS_CONST) { // Added TOTAL_INPUT_BITS_CONST as a template parameter
    // Public Input: The expected SHA-256 hash output (as a field element).
    signal input hash;
    
    // Public Input: An initial commitment value (BN254 field element).
    signal input mapped_com_254;
    
    // Public Input: An array of N_FR BN254 field elements.
    signal input fr_elements[N_FR];
    
    // Private Input: A private nonce (BN254 field element).
    signal private input nonce;

    // Output: A signal that is 1 if the computed hash matches the target hash, 0 otherwise.
    signal output valid;

    // --- Parameters for bit conversion ---
    // A BN254 field element fits within 254 bits. We use 254 bits for consistency.
    var bitsPerFieldElement = 254; 

    // We no longer calculate totalInputBits as a 'var' here, 
    // as it's passed directly as TOTAL_INPUT_BITS_CONST.
    // However, for verification/commenting, its value is 
    // (1 + N_FR + 1) * bitsPerFieldElement;

    // --- Convert each field element input to its bit representation ---

    // 1. Convert mapped_com_254 to bits
    component mappedComBits = Num2Bits(bitsPerFieldElement);
    mappedComBits.in <== mapped_com_254;

    // 2. Convert each fr_element to bits
    component frElementsBits[N_FR];
    for (var i = 0; i < N_FR; i++) {
        frElementsBits[i] = Num2Bits(bitsPerFieldElement);
        frElementsBits[i].in <== fr_elements[i];
    }

    // 3. Convert nonce to bits
    component nonceBits = Num2Bits(bitsPerFieldElement);
    nonceBits.in <== nonce;

    // --- Concatenate all bit arrays into one large array for SHA-256 ---
    // The size of this array must match TOTAL_INPUT_BITS_CONST.
    signal allInputBits[TOTAL_INPUT_BITS_CONST]; 
    var currentBitIndex = 0;

    // Add bits from mapped_com_254
    for (var i = 0; i < bitsPerFieldElement; i++) {
        allInputBits[currentBitIndex + i] <== mappedComBits.out[i];
    }
    currentBitIndex += bitsPerFieldElement;

    // Add bits from each fr_element
    for (var i = 0; i < N_FR; i++) {
        for (var j = 0; j < bitsPerFieldElement; j++) {
            allInputBits[currentBitIndex + j] <== frElementsBits[i].out[j];
        }
        currentBitIndex += bitsPerFieldElement;
    }

    // Add bits from nonce
    for (var i = 0; i < bitsPerFieldElement; i++) {
        allInputBits[currentBitIndex + i] <== nonceBits.out[i];
    }

    // --- Instantiate the SHA-256 hashing component ---
    // Now passing TOTAL_INPUT_BITS_CONST, which is a template parameter
    // and thus guaranteed to be a compile-time constant.
    component sha256_hasher = Sha256(TOTAL_INPUT_BITS_CONST);
    for (var i = 0; i < TOTAL_INPUT_BITS_CONST; i++) {
        sha256_hasher.in[i] <== allInputBits[i];
    }

    // --- Convert SHA-256 output (256 bits) back to a single field element ---
    component sha256OutputNum = Bits2Num(256); // Output length of SHA-256 is 256 bits
    for (var i = 0; i < 256; i++) {
        sha256OutputNum.in[i] <== sha256_hasher.out[i];
    }
    signal computed_h <== sha256OutputNum.out;


    // --- Check equality with the target hash ---
    signal isEqual;
    isEqual <== (computed_h === hash);

    valid <== isEqual;
}

// Instantiate the main circuit.
// Calculate TOTAL_INPUT_BITS_CONST directly here.
// N_FR = 20
// totalInputElements = 1 (mapped_com_254) + 20 (fr_elements) + 1 (nonce) = 22
// bitsPerFieldElement = 254
// TOTAL_INPUT_BITS_CONST = 22 * 254 = 5588
component main = BindHash_SHA256(20, 5588); 
