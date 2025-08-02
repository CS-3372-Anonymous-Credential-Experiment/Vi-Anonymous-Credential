use num_bigint::BigUint;
use ark_bls12_381::{Bls12_381, G1Projective, G2Projective};
use ark_ec::pairing::PairingOutput;
#[derive(Clone)]
pub struct BBParams {
    pub q: BigUint,                                     // Explicit group order
    pub g: G1Projective,                                // Generator of G1
    pub g2: G2Projective,                               // Generator of G2
    pub gt: PairingOutput<Bls12_381>,                   // e(g1, g2) 
}