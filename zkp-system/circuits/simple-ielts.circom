pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/comparators.circom";

template SimpleIELTS() {
    // Public inputs
    signal input meetsMinimum;
    signal input isValid;
    
    // Private inputs
    signal input listeningScore;
    signal input readingScore;
    signal input writingScore;
    signal input speakingScore;
    signal input minimumRequired;
    
    // Components
    component listeningComparator = GreaterEqThan(8);
    component readingComparator = GreaterEqThan(8);
    component writingComparator = GreaterEqThan(8);
    component speakingComparator = GreaterEqThan(8);
    
    // Minimum score checks
    listeningComparator.in[0] <== listeningScore;
    listeningComparator.in[1] <== minimumRequired;
    
    readingComparator.in[0] <== readingScore;
    readingComparator.in[1] <== minimumRequired;
    
    writingComparator.in[0] <== writingScore;
    writingComparator.in[1] <== minimumRequired;
    
    speakingComparator.in[0] <== speakingScore;
    speakingComparator.in[1] <== minimumRequired;
    
    // Check if all scores meet minimum requirement
    signal t1;
    t1 <== listeningComparator.out * readingComparator.out;
    signal t2;
    t2 <== t1 * writingComparator.out;
    signal allMeet;
    allMeet <== t2 * speakingComparator.out;
    
    meetsMinimum === allMeet;
    isValid === 1;
}

component main { public [meetsMinimum, isValid] } = SimpleIELTS();
