use bbs_plus::prelude::SecretKey;
use num_bigint::BigUint;
use ark_bls12_381::{
    Fr,
    g1::{G1_GENERATOR_X, G1_GENERATOR_Y},
    G1Affine, G1Projective
};
use rand::thread_rng;
use sha2::{Sha256};
use num_bigint::RandBigInt;
use ark_ec::AffineRepr;
use ark_ff::PrimeField;
use std::ops::Mul;

#[allow(dead_code)]
pub struct Issuer {
    q: BigUint, // Security Parameter
    sk: SecretKey<Fr>,
    tau: BigUint, // Trapdoor values (secret)
    pub g1: G1Projective,

}

impl Issuer { // Assume the issuer can work with Groth-Sahai Commitment (which now is not support) 
    // currently: all the secret x shall be stored off-chain & accepting the risk of linkability on user's identity trade-off 
    // for revocability with perdersen commitment
    pub fn new() -> Self { // Initialization
        let g1_affine = G1Affine::new_unchecked(G1_GENERATOR_X, G1_GENERATOR_Y);
        let g1 = g1_affine.into_group(); // Into G1Projective
        let q = BigUint::from(Fr::MODULUS);  // get the security parameter = 2 * 128 = 256 bits
        let mut rng = thread_rng();
        let seed_big = rng.gen_biguint_below(&q);
        let seed_bytes = seed_big.to_bytes_le();
        let sk = SecretKey::<Fr>::generate_using_seed::<Sha256>(&seed_bytes);
        // geneerate the tau
        let tau = rng.gen_biguint_below(&q); // Sample from field Z_q

        Self {
            q: q,
            sk: sk,
            tau: tau,
            g1:g1
        }

    }
    pub fn get_com_key(&self) -> (G1Projective, G1Projective) {
        let g = self.g1;
        let tau_fr = Fr::from_le_bytes_mod_order(&self.tau.to_bytes_le());
        let h = g.mul(tau_fr);
        (g, h)
    }
    pub fn get_tau_fr(&self) -> Fr {
        Fr::from_le_bytes_mod_order(&self.tau.to_bytes_le())
    }
}


