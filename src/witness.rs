use ark_bls12_381::{Fr, G1Projective, Bls12_381};
use bbs_plus::signature::SignatureG1;
use crate::commitment::Commitment;
#[derive(Clone, Debug)]
pub struct Witness {
    pub x: Fr, // this values was stored by Issuer & holder, I: for revokation & H for generate the ZKP
    pub c_x: Commitment,
    pub w_x_t: G1Projective,
    pub sig: SignatureG1<Bls12_381>,
}