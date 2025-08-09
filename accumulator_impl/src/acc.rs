use ark_bls12_381::{G1Projective, Fr};
use ark_ff::PrimeField;
use ark_ff::Field;
use rand::thread_rng;
use num_bigint::{BigUint, RandBigInt};
use bbs_plus::prelude::SecretKey;
use std::ops::Mul;



pub struct ECAccumulator {
    pub alpha: G1Projective, // the accumulated value
    pub deltas: Vec<Fr> // List of revoked x (revoked credential)
}

impl ECAccumulator {
    pub fn new(g1: &G1Projective) -> Self {
        let q = BigUint::from(Fr::MODULUS);
        let mut rng = thread_rng();
        let u_0 = rng.gen_biguint_below(&q);
        let u_0_fr = Fr::from_le_bytes_mod_order(&u_0.to_bytes_le());

        // Multiply directly on projective point (preferred)
        let alpha_0 = *g1 * u_0_fr;

        let deltas = Vec::new();

        ECAccumulator { alpha: alpha_0, deltas }
    }

    pub fn update_acc(&mut self, x: &Fr, sk: &SecretKey<Fr>) {
        // Compute inverse as raw field element (Fp)
        let sum = *x + sk.0;
        let inv = sum.inverse().unwrap();        
        // Convert raw field element into Fr

        self.deltas.push(*x);
        self.alpha = self.alpha.mul(inv);
    }
    
    pub fn gen_witness(&self, x: &Fr, sk: &SecretKey<Fr>) -> G1Projective {
        let sum = *x + sk.0;
        let inv = sum.inverse().unwrap();
        self.alpha.mul(inv)
    }

    pub fn get_alpha(&self) -> &G1Projective {
        &self.alpha
    }

    pub fn get_deltas(&self) -> &Vec<Fr> {
        &self.deltas
    }
   
}