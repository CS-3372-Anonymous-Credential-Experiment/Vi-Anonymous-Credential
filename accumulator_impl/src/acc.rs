use bls12_381::{G1Projective, G2Projective, Scalar, pairing, Gt};
use ff::Field;
use group::{Group, Curve};
use rand::thread_rng;

pub struct ECAccumulator {
    pub sk: Scalar,
    pub j: G2Projective,
    pub alpha: G1Projective,
    pub g1: G1Projective,
    pub g2: G2Projective,
    pub g: G1Projective,
    pub h: G1Projective,
    pub k: G1Projective,
    pub z: G1Projective,
    pub e_z_g2: Gt,
    pub e_z_j: Gt,
}

impl ECAccumulator {
    pub fn setup() -> Self {
        let mut rng = thread_rng();
        let sk = Scalar::random(&mut rng);
        let g1 = G1Projective::generator();
        let g2 = G2Projective::generator();
        let j = g2 * sk;
        let u0 = Scalar::random(&mut rng);
        let alpha = g1 * u0;
        let g = G1Projective::random(&mut rng);
        let h = G1Projective::random(&mut rng);
        let k = G1Projective::random(&mut rng);
        let z = G1Projective::random(&mut rng);
        let e_z_g2 = pairing(&z.to_affine(), &g2.to_affine());
        let e_z_j = pairing(&z.to_affine(), &j.to_affine());

        ECAccumulator {
            sk,
            j,
            alpha,
            g1,
            g2,
            g,
            h,
            k,
            z,
            e_z_g2,
            e_z_j,
        }
    }

    pub fn gen_witness(&self, x: Scalar) -> G1Projective {
        let x_sk_inv = (x + self.sk).invert().expect("x + sk invertible");
        self.alpha * x_sk_inv
    }

    pub fn del(&self, x: Scalar) -> (G1Projective, Scalar) {
        let delta = x + self.sk;
        let inv = delta.invert().expect("x + sk invertible");
        let new_alpha = self.alpha * inv;
        (new_alpha, delta)
    }

    pub fn verify_witness(&self, x: Scalar, witness: G1Projective) -> bool {
        let lhs = pairing(&self.alpha.to_affine(), &self.g2.to_affine());
        let g2xj = self.g2 * x + self.j;
        let rhs = pairing(&witness.to_affine(), &g2xj.to_affine());
        lhs == rhs
    }

    pub fn update_witness(
        &self,
        old_witness: G1Projective,
        x: Scalar,
        delta: Scalar,
        new_alpha: G1Projective,
    ) -> G1Projective {
        let term1 = old_witness - new_alpha;
        let term2_inv = (delta - x).invert().expect("delta - x invertible");
        term1 * term2_inv
    }
}