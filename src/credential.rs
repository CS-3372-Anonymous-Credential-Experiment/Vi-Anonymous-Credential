use bbs_plus::prelude::*;
use ark_bls12_381::Bls12_381;
use bbs_plus::signature::SignatureG1;
use ark_bls12_381::Fr;

#[derive(Clone)]
pub struct Credential {
    pub signature: SignatureG1<Bls12_381>, // pk in G2 
    pub messages: Vec<Fr>,
    pub issuer_pk: Option <PublicKeyG2<Bls12_381>>,
}
