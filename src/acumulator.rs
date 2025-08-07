// mod bb_params;
// mod credential;
// mod commitment;
// mod witness;


use ark_bls12_381::{
    Bls12_381,
    Fr,
    g1::{G1_GENERATOR_X, G1_GENERATOR_Y},
    g2::{G2_GENERATOR_X, G2_GENERATOR_Y},
    G1Affine, G2Affine, G1Projective, G2Projective
};
use ark_serialize::CanonicalSerialize;
use bbs_plus::prelude::SignatureParamsG1;
use bbs_plus::prelude::SecretKey;
use bbs_plus::signature::SignatureG1;
use ark_ec::{pairing::Pairing};
use ark_ec::CurveGroup;
use ark_ff::{PrimeField, UniformRand};
use num_bigint::{BigUint, RandBigInt};
use rand::thread_rng;
use ark_ec::AffineRepr;
use ark_ff::BigInteger;
// use ark_ec::pairing::PairingOutput;
use ark_ff::Field;
use std::ops::Mul;
use sha2::Sha256;
use sha2::Digest;
use std::collections::HashMap;  // Added import


use crate::bb_params::*;
use crate::credential::*;
use crate::commitment::*;
use crate::witness::*;


/// Generate bilinear group parameters: (g ∈ G1, g2 ∈ G2, gt = e(g, g2), q = |Fr|)
pub fn bi_linear_generator() -> BBParams {
    // MODULUS is a BigInt, convert to BigUint
    let q = BigUint::from(Fr::MODULUS);

    // G1: Create point from (x, y)
    let g1_affine = G1Affine::new_unchecked(G1_GENERATOR_X, G1_GENERATOR_Y);
    let g = g1_affine.into_group(); // Into G1Projective

    // G2: Create point from (x, y)
    let g2_affine = G2Affine::new_unchecked(G2_GENERATOR_X, G2_GENERATOR_Y);
    let g2 = g2_affine.into_group(); // Into G2Projective

    let gt = Bls12_381::pairing(&g, &g2);

    BBParams { q, g, g2, gt }
}

// Implement the Perdersent commitment for hidding data
fn commit_to_x(x: &Fr, h: &G1Projective) -> Commitment {
    let mut rng = thread_rng();
    let r = Fr::rand(&mut rng);
    let g = G1Affine::new_unchecked(G1_GENERATOR_X, G1_GENERATOR_Y).into_group(); // assumes G is public
    let commitment = g.mul(x) + h.mul(r); // g^x * h^r (g, h in G1) <x is the messae, r for the randomess>

    Commitment {
        value: commitment,
        blinding: r,
    }
}


/// Accumulator struct
pub struct Accumulator {
    pub acc_val: G1Projective,
    pub parameter: Option<BBParams>,
    pub j_pub: Option<G2Projective>,
    pub issued_x: HashMap<String, Fr>, // Maps a credential ID to its x value (in actual this was a database)
}

impl Accumulator {
    pub fn new() -> Self { // the constructor - but not for use
            let g1_affine = G1Affine::new_unchecked(G1_GENERATOR_X, G1_GENERATOR_Y);
            let g = g1_affine.into_group(); // Into G1Projective
            Self {
                
                acc_val: g,
                parameter: None,
                j_pub: None,
                issued_x: HashMap::new(),
            }
    }
    
    pub fn acc_gen(&mut self, sk: Fr, _n: usize) { // Initialize the acc_gen to actual use
        let bp_para = bi_linear_generator();
        self.parameter = Some(bp_para);

        let mut rng = thread_rng();

        // j_pub = g2^sk ∈ G2
        let g2 = self.parameter.as_ref().unwrap().g2;
        let j = g2 * sk;

        // Sample u_0 ∈ [0, q)
        let u_0 = rng.gen_biguint_below(&self.parameter.as_ref().unwrap().q);
        let u_0_fr = Fr::from_le_bytes_mod_order(&u_0.to_bytes_le());

        // acc = g^u_0 ∈ G1
        let g = self.parameter.as_ref().unwrap().g;
        self.acc_val = g * u_0_fr;

        self.j_pub = Some(j);
    }
    
    pub fn gen_wit(&mut self, sk: &SecretKey<Fr>, credential: Credential, h: &G1Projective) 
    -> Witness {
            // (a) Sample x ∈ D / sk
            let mut rng = thread_rng();
            let x = loop {
                let candidate = Fr::rand(&mut rng);
                let sum = candidate + sk.0;
                if !sum.0.is_zero() {
                    break candidate;
                }
                // else continue looping
            };

            // (b) Commit to x
            let commitment = commit_to_x(&x, h);
            let c_x = commitment.value;

            // (c) Gen non-membership witness w_{x|t}
            let sum = x + sk.0;
            let inv = sum.inverse().unwrap();
            let w_x_t = self.acc_val.mul(inv);            

            // // (d) Sign over messages || c_x
            let mut combined_msgs = credential.messages.clone(); // Vec<BigUnit>
            let c_x_bytes = c_x.into_affine().x.0.to_bytes_be();
            let c_x_fr = Fr::from_be_bytes_mod_order(&c_x_bytes);
            combined_msgs.push(c_x_fr);

            let message_count = combined_msgs.len() as u32;
            let params = SignatureParamsG1::<Bls12_381>::generate_using_rng(&mut rng, message_count).try_into().unwrap();
            let sig = SignatureG1::new(&mut rng, &combined_msgs, sk, &params).unwrap();

            // Example: associate x with a credential ID = hash(sig)
            let mut hasher = Sha256::new();
            let mut sig_bytes = vec![];
            credential.signature.serialize_compressed(&mut sig_bytes).unwrap();
            hasher.update(sig_bytes);
            let hash = hasher.finalize();
            let cred_id = format!(
                "cred_{}",
                hash[..4].iter().map(|b| format!("{:02x}", b)).collect::<String>()
            );
            self.issued_x.insert(cred_id, x);

            // // (e) Return the witness
            let witness = Witness{
                x: x,
                c_x: commitment,
                w_x_t: w_x_t,
                sig: sig.clone()
            };
           
            return witness
        }

    
    // remove an accumulated values - send the updated message for each holder to re-calculate their witness
    
    pub fn del(&mut self, sk: &SecretKey<Fr>, revoke_cred: Credential) -> Fr {

            // Serialize the signature
            let mut hasher = Sha256::new();
            let mut sig_bytes = vec![];
            revoke_cred.signature.serialize_compressed(&mut sig_bytes).unwrap();
            hasher.update(sig_bytes);
            let hash = hasher.finalize();
            let cred_id = format!(
                "cred_{}",
                hash[..4].iter().map(|b| format!("{:02x}", b)).collect::<String>()
            );

            // Get x associated with this credential
            let delta = *self.get_x_by_id(&cred_id).unwrap();
            // let delta = self.issued_x.get(&cred_id).unwrap(); // Option<&Fr>
            // the delta shall be stored in some-where for all un-update valid holder still work
            let sum = delta + sk.0;
            let inv = sum.inverse().unwrap();

            // Update accumulator
            self.acc_val = self.acc_val.mul(inv);

            return delta;
    }
    
    fn get_x_by_id(&self, cred_id: &str) -> Option<&Fr> {
        self.issued_x.get(cred_id)
    }
    
    pub fn get_acc_val(&self) -> G1Projective {
        self.acc_val
    }
    
    pub fn get_j_pub(&self) -> G2Projective {
        self.j_pub.expect("j_pub is not initialized")
    }
    
    pub fn get_parameter(&self) -> BBParams {
        self.parameter.clone().expect("Parameter of accumulator not been setup")
    }

    
    }

