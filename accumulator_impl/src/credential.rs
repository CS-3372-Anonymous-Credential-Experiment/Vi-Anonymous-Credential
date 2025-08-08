use bbs_plus::prelude::*;
use ark_bls12_381::Bls12_381;
use bbs_plus::signature::SignatureG1;
use ark_bls12_381::Fr;
use zeroize::Zeroize;

#[derive(Clone)]
pub struct Credential {
    signature: SignatureG1<Bls12_381>, // signature = Sign(messsage, C(x_Val))
    messages: Vec<Fr>,
    x_val: Fr, // the secret values to prove if inside the accumulator
    r: Fr, // secret for yeild the Commitment
    witness: G1Projective

}

impl Credential {
    pub fn new(sig: SignatureG1<Bls12_381>, mes: Vec<Fr>, x_val: Fr, r:Fr, witness:G1Projective) -> Self {
        Self {signature: sig, messages:mes, x_val:x_val, r:r, witness:witness}
    }

    pub fn get_signature(&self) -> &SignatureG1<Bls12_381> {
        &self.signature;
    }

    pub fn get_message(&self) -> &Vec<Fr> {
        &self.messages;
    }

    pub fn get_x_val(&self) -> &Fr {
        &self.x_val;
    }

    pub fn get_witness(&self) -> &G1Projective {
        &self.witness;
    }

    pub fn get_r(&self) -> &Fr {
        &self.r;
    }

    pub fn update_witness(&mut self, delta: Fr, new_alpha: G1Projective) {

        // Equation 11 of Flamini, 2025
        let old_witness = self.witness.clone();
        let term1 = old_witness * (new_alpha).invert().expect("new_alpha invertible");
        let term2_inv = (delta - self.x).invert().expect("delta - x invertible");
        let new_witness = term * term2_inv;
        self.witness = new_witness;
    }

    pub fn batch_update_witness(
        &mut self,
        updates: &[(G1Projective, Fr)],      // Vec of (alpha_i, delta_i)
    ) {
        // Update for multiples alpha & witness - for long-outdated holder
        let mut updated_witness = self.witness.clone();

        for (i, (alpha_i, _delta_i)) in updates.iter().enumerate() {
            // Compute product of (delta_j - x) from j = i to m
            let mut prod_inv = Fr::one();
            for (_alpha_j, delta_j) in updates.iter().skip(i) {
                let term = *delta_j - self.x_val;
                prod_inv *= term.inverse().unwrap(); // assumes delta_j != x
            }

            // Multiply by alpha_i^{-1}
            let alpha_inv = alpha_i.neg(); // In group: inverse = -point for additive notation
            // In multiplicative pairing-friendly G1, we use scalar multiplication with -1:
            let alpha_inv_point = alpha_i.mul(Fr::from(-1));

            // Apply: w = w * alpha_i^{-1 * prod_inv}
            let scalar = prod_inv; // scalar in Fr
            updated_witness += alpha_inv_point.mul(scalar);
        }

        self.witness = updated_witness
    }

    pub fn destructor() {
        x_val.zeroize();
        r.zeroize();
        witness.zeroize();
        message.zeroize();
        signature.zeroize();
    }
}
