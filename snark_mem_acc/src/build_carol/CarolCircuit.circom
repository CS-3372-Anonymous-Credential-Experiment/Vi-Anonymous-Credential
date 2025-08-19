// CarolEquality.circom
// pragma circom 2.1.5;

// Enforces six equalities: lhs[i] == rhs[i]
template EqualityPairs(n) {
    signal input lhs[n];
    signal input rhs[n];

    // constraints
    for (var i = 0; i < n; i++) {
        lhs[i] === rhs[i];
    }
}

// Top-level component exposing 12 public inputs
template CarolEquality() {
    // 12 public inputs
    signal input term_1_lhs_hash;
    signal input term_1_rhs_hash;
    signal input term_2_lhs_hash;
    signal input term_2_rhs_hash;
    signal input term_3_lhs_hash;
    signal input term_3_rhs_hash;
    signal input term_4_lhs_hash;
    signal input term_4_rhs_hash;
    signal input term_5_lhs_hash;
    signal input term_5_rhs_hash;
    signal input term_6_lhs_hash;
    signal input term_6_rhs_hash;

    // instantiate EqualityPairs
    component eqs = EqualityPairs(6);

    // wire named signals to array inputs
    eqs.lhs[0] <== term_1_lhs_hash;  eqs.rhs[0] <== term_1_rhs_hash;
    eqs.lhs[1] <== term_2_lhs_hash;  eqs.rhs[1] <== term_2_rhs_hash;
    eqs.lhs[2] <== term_3_lhs_hash;  eqs.rhs[2] <== term_3_rhs_hash;
    eqs.lhs[3] <== term_4_lhs_hash;  eqs.rhs[3] <== term_4_rhs_hash;
    eqs.lhs[4] <== term_5_lhs_hash;  eqs.rhs[4] <== term_5_rhs_hash;
    eqs.lhs[5] <== term_6_lhs_hash;  eqs.rhs[5] <== term_6_rhs_hash;
}

// expose all 12 signals as public inputs
component main = CarolEquality();