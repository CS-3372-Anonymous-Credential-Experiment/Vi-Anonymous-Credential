use accumulator_impl::credential::Credential;
use ark_bls12_381::Fr
use ark_bls12_381::G1Projective
use bbs_plus::prelude::*;
use rand::rngs::OsRng;
use ark_ecc::Group;
use ark_ff::Field;
use accumulator_impl::helper::*;

pub struct Holder {
    cred: Credential,
    // Issuer sign [C(x_val), message] - C(x_val) : Perdersent Commitment

}

impl Holder {
    pub fn new(cred: Credential) -> Self {
        
        Self {cred: cred}
    }


    // g, h is the public parameter from issuer
    pub fn verify_mem(&self , acc_val: &G1Projective, 
        g: &G1Projective, 
        h: &G1Projective, 
        pk: &PublicKeyG2<Bls12_381>,
        param: &SignatureParamsG1<Bls12_381>,
        alpha: &G1Projective,
        g2: &G2Projective,
        j: &G2Projective,
    ) -> bool {
        cx_point, cx_fr = compute_commitment_and_field(&self.cred.get_x_val(),g, h, &self.get_r());
        let message = vec![self.cred.get_message(), cx_fr];
        let result = self.cred.signature.verify(&message, pk).is_ok();
        if is_valid {
            println!("✅ Signature is valid over X || Cx");
        } else {
            println!("❌ Signature verification failed");
            return False
        }

        return verify_witness(alpha, &self.x, self.cred.get_witness(), g2, j);

    }

    pub fn batch_update_witness(&mut self, updates: &[(G1Projective, Fr)]) {
        self.cred.batch_update_witness(updates);
    }

    pub fn update_witness(&mut self, delta: Fr, new_alpha: G1Projective) {
        self.cred.update_witness(delta, new_alpha);
    }
}