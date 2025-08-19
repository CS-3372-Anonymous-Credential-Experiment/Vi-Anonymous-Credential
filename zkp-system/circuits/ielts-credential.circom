pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";

// `minimumScore` and `currentTimestamp` are public values for the circuit
template IELTSCredentialVerifier(minimumScore, currentTimestamp) {
    // ---------------------
    // Public inputs (visible to the verifier)
    // ---------------------
    signal input credentialHash;
    signal input meetsMinimum;
    signal input isValid;
    signal input isNotExpired;
    
    // ---------------------
    // Private inputs (known only to the prover)
    // ---------------------
    signal input listeningScore;
    signal input readingScore;
    signal input writingScore;
    signal input speakingScore;
    signal input overallScore;
    signal input credentialSecret;
    signal input issueDate;
    signal input expiryDatePrivate;

    // ---------------------
    // Components
    // ---------------------
    component hasher = Poseidon(8);
    component overallComparator = GreaterEqThan(32);
    component listeningComparator = GreaterEqThan(32);
    component readingComparator = GreaterEqThan(32);
    component writingComparator = GreaterEqThan(32);
    component speakingComparator = GreaterEqThan(32);
    component dateComparator = LessThan(32);

    // ---------------------
    // Compute average score (enforced via multiplication)
    // ---------------------
    signal totalScore;
    totalScore <== listeningScore + readingScore + writingScore + speakingScore;
    totalScore === overallScore * 4;

    // ---------------------
    // Minimum score checks
    // ---------------------
    listeningComparator.in[0] <== listeningScore;
    listeningComparator.in[1] <== minimumScore;

    readingComparator.in[0] <== readingScore;
    readingComparator.in[1] <== minimumScore;

    writingComparator.in[0] <== writingScore;
    writingComparator.in[1] <== minimumScore;

    speakingComparator.in[0] <== speakingScore;
    speakingComparator.in[1] <== minimumScore;

    overallComparator.in[0] <== overallScore;
    overallComparator.in[1] <== minimumScore;

    signal t1;
    t1 <== listeningComparator.out * readingComparator.out;
    signal t2;
    t2 <== t1 * writingComparator.out;
    signal bandsMeet;
    bandsMeet <== t2 * speakingComparator.out;
    signal overallMeet;
    overallMeet <== overallComparator.out;
    meetsMinimum === bandsMeet * overallMeet;

    // ---------------------
    // Expiry check
    // ---------------------
    dateComparator.in[0] <== currentTimestamp;
    dateComparator.in[1] <== expiryDatePrivate;
    isNotExpired === dateComparator.out;

    // ---------------------
    // Credential validity (placeholder)
    // ---------------------
    isValid === 1;

    // ---------------------
    // Poseidon hash of credential
    // ---------------------
    hasher.inputs[0] <== listeningScore;
    hasher.inputs[1] <== readingScore;
    hasher.inputs[2] <== writingScore;
    hasher.inputs[3] <== speakingScore;
    hasher.inputs[4] <== overallScore;
    hasher.inputs[5] <== credentialSecret;
    hasher.inputs[6] <== issueDate;
    hasher.inputs[7] <== expiryDatePrivate;

    credentialHash === hasher.out;
}

// ---------------------
// Main component
// ---------------------
component main { public [credentialHash, meetsMinimum, isValid, isNotExpired] } = IELTSCredentialVerifier(6, 1755106800);