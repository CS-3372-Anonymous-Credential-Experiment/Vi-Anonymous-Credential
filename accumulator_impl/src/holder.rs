use crate::credential::Credential;
use ark_bls12_381::Fr;
use ark_bls12_381::{G1Projective, G2Projective, Bls12_381};
use bbs_plus::prelude::*;
use crate::helper::*;
use rand::thread_rng;
use ark_std::UniformRand;
use std::ops::Mul;

pub struct Holder {
    cred: Credential,
    // Issuer sign [C(x_val), message] - C(x_val) : Perdersent Commitment

}

impl Holder {
    pub fn new(cred: Credential) -> Self {
        
        Self {cred: cred}
    }

    pub fn get_cred(&self) -> &Credential {
        &self.cred
    }


    // g, h is the public parameter from issuer
    pub fn verify_mem(&self ,
        g: &G1Projective, 
        h: &G1Projective, 
        pk: &PublicKeyG2<Bls12_381>,
        param: &SignatureParamsG1<Bls12_381>,
        alpha: &G1Projective,
        g2: &G2Projective,
        j: &G2Projective,
    ) -> bool {
        let (_cx_point, cx_fr) = compute_commitment_and_field(&self.cred.get_x_val(),g, h, &self.cred.get_r());
        let mut message = self.cred.get_message().clone();  // Vec<Fr>
        message.push(cx_fr);
        let is_valid = self.cred.get_signature().verify(&message, pk.clone(), param.clone()).is_ok();
        if is_valid {
            println!("✅ Signature is valid over X || Cx");
        } else {
            println!("❌ Signature verification failed");
            return false
        }

        return verify_witness(alpha, &self.cred.get_x_val(), self.cred.get_witness(), g2, j);

    }

    pub fn batch_update_witness(&mut self, updates: &[(G1Projective, Fr)]) {
        self.cred.batch_update_witness(updates);
    }

    pub fn update_witness(&mut self, delta: Fr, new_alpha: G1Projective) {
        self.cred.update_witness(delta, new_alpha);
    }


    pub fn prepare_ZKP(&self, 
        g: &G1Projective, 
        h: &G1Projective, 
        k: &G1Projective,
        z: &G1Projective
    ) -> (G1Projective, G1Projective, G1Projective, G1Projective, Fr, Fr, Fr, Fr) {
        let mut rng = thread_rng();
        let sigma = Fr::rand(& mut rng);
        let rho = Fr::rand(&mut rng);

        let Cw = self.cred.get_witness() + z.mul(sigma + rho);
        let Csigma = h.mul(sigma);
        let Crho = k.mul(rho);
        let (Cx_point, Cx_fr) = compute_commitment_and_field(&self.cred.get_x_val(),g, h, &self.cred.get_r());
        let x_times_sig = *self.cred.get_x_val() * sigma;
        let x_times_rho = *self.cred.get_x_val() * rho;

        (Cw, Csigma, Crho, Cx_point, x_times_sig, x_times_rho, sigma, rho)
    }
}   