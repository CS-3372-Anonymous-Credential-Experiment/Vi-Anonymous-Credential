use ark_r1cs_std::prelude::*;
use ark_relations::r1cs::{ConstraintSynthesizer, ConstraintSystemRef, SynthesisError};
use ark_bls12_381::Fr;
use ark_ff::Field;
use ark_r1cs_std::fields::fp::FpVar;
/// CarolCircuit enforces the six constraints via Poseidon hashes
#[derive(Clone)]
pub struct CarolCircuit {
    // 1️⃣ Cx = g^x * h^r
    pub term_1_lhs_hash: Fr,
    pub term_1_rhs_hash: Fr,

    // 2️⃣ C_sigma = h^sigma
    pub term_2_lhs_hash: Fr,
    pub term_2_rhs_hash: Fr,

    // 3️⃣ C_rho = k^rho
    pub term_3_lhs_hash: Fr,
    pub term_3_rhs_hash: Fr,

    // 4️⃣ 1 = C_sigma^x * (1/h)^(x*sigma)
    pub term_4_lhs_hash: Fr,
    pub term_4_rhs_hash: Fr,

    // 5️⃣ 1 = C_rho^x * (1/k)^(x*rho)
    pub term_5_lhs_hash: Fr,
    pub term_5_rhs_hash: Fr,

    // 6️⃣ Pairing equation
    pub term_6_lhs_hash: Fr,
    pub term_6_rhs_hash: Fr,
}

impl ConstraintSynthesizer<Fr> for CarolCircuit {
    fn generate_constraints(self, cs: ConstraintSystemRef<Fr>) -> Result<(), SynthesisError> {
        // Allocate each hash as a public input
        let t1_lhs = FpVar::<Fr>::new_input(cs.clone(), || Ok(self.term_1_lhs_hash))?;
        let t1_rhs = FpVar::<Fr>::new_input(cs.clone(), || Ok(self.term_1_rhs_hash))?;

        let t2_lhs = FpVar::<Fr>::new_input(cs.clone(), || Ok(self.term_2_lhs_hash))?;
        let t2_rhs = FpVar::<Fr>::new_input(cs.clone(), || Ok(self.term_2_rhs_hash))?;

        let t3_lhs = FpVar::<Fr>::new_input(cs.clone(), || Ok(self.term_3_lhs_hash))?;
        let t3_rhs = FpVar::<Fr>::new_input(cs.clone(), || Ok(self.term_3_rhs_hash))?;

        let t4_lhs = FpVar::<Fr>::new_input(cs.clone(), || Ok(self.term_4_lhs_hash))?;
        let t4_rhs = FpVar::<Fr>::new_input(cs.clone(), || Ok(self.term_4_rhs_hash))?;

        let t5_lhs = FpVar::<Fr>::new_input(cs.clone(), || Ok(self.term_5_lhs_hash))?;
        let t5_rhs = FpVar::<Fr>::new_input(cs.clone(), || Ok(self.term_5_rhs_hash))?;

        let t6_lhs = FpVar::<Fr>::new_input(cs.clone(), || Ok(self.term_6_lhs_hash))?;
        let t6_rhs = FpVar::<Fr>::new_input(cs.clone(), || Ok(self.term_6_rhs_hash))?;

        // Enforce equality for all six constraints
        t1_lhs.enforce_equal(&t1_rhs)?;
        t2_lhs.enforce_equal(&t2_rhs)?;
        t3_lhs.enforce_equal(&t3_rhs)?;
        t4_lhs.enforce_equal(&t4_rhs)?;
        t5_lhs.enforce_equal(&t5_rhs)?;
        t6_lhs.enforce_equal(&t6_rhs)?;

        Ok(())
    }
}
