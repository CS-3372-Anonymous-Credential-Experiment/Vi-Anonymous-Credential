use ark_bls12_381::{Fr, G1Projective};
#[derive(Clone)]
pub struct Commitment {
    pub value: G1Projective,
    pub blinding: Fr,
}

impl std::fmt::Debug for Commitment {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(f, "Commitment {{ value: {:?}, blinding: [REDACTED] }}", self.value)
    }
}