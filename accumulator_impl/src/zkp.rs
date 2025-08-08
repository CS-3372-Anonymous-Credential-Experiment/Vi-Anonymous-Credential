// use bls12_381::{G1Projective, G2Projective, Scalar, pairing, Gt};
// use group::{Curve, GroupEncoding};
// use ff::Field;
// use sha2::{Digest, Sha256};
// use rand::thread_rng;
// use std::ops::Neg;

// pub struct ZKProof {
//     pub c: Scalar,
//     pub s_x: Scalar,
//     pub s_l: Scalar,
//     pub s_sigma: Scalar,
//     pub s_rho: Scalar,
//     pub s_xsigma: Scalar,
//     pub s_xrho: Scalar,
//     pub c_w: G1Projective,
//     pub c_sigma: G1Projective,
//     pub c_rho: G1Projective,
// }

// pub fn commit(g: &G1Projective, h: &G1Projective, x: Scalar, l: Scalar) -> G1Projective {
//     g * x + h * l
// }

// pub fn hash_gt(gt: &Gt) -> Vec<u8> {
//     let mut hasher = Sha256::new();
//     hasher.update(format!("{:?}", gt).as_bytes());
//     hasher.finalize().to_vec()
// }

// pub fn gen_zkp(
//     g: &G1Projective,
//     h: &G1Projective,
//     k: &G1Projective,
//     z: &G1Projective,
//     g2: &G2Projective,
//     j: &G2Projective,
//     alpha: &G1Projective,
//     e_z_g2: &Gt,
//     e_z_j: &Gt,
//     x: Scalar,
//     l: Scalar,
//     witness: &G1Projective,
// ) -> (G1Projective, ZKProof) {
//     let mut rng = thread_rng();
//     let commitment = commit(g, h, x, l);
//     let sigma = Scalar::random(&mut rng);
//     let rho = Scalar::random(&mut rng);
//     let v_x = Scalar::random(&mut rng);
//     let v_l = Scalar::random(&mut rng);
//     let v_sigma = Scalar::random(&mut rng);
//     let v_rho = Scalar::random(&mut rng);
//     let v_xsigma = Scalar::random(&mut rng);
//     let v_xrho = Scalar::random(&mut rng);

//     let c_w = witness + z * (sigma + rho);
//     let c_sigma = h * sigma;
//     let c_rho = k * rho;
//     let t_sigma = h * v_sigma;
//     let t_rho = k * v_rho;
//     let t_sigma_prime = c_sigma * v_x + h * v_xsigma.neg();
//     let t_rho_prime = c_rho * v_x + k * v_xrho.neg();
//     let e_cw_g2 = pairing(&c_w.to_affine(), &g2.to_affine());
//     let e_cw_j = pairing(&c_w.to_affine(), &j.to_affine());
//     let y = pairing(&alpha.to_affine(), &g2.to_affine()) - e_cw_j;
//     let t_o = y * v_l + e_cw_g2 * v_x + e_z_g2 * (v_xsigma + v_xrho).neg() + e_z_j * (v_sigma + v_rho).neg();

//     let mut hasher = Sha256::new();
//     hasher.update(g.to_affine().to_bytes());
//     hasher.update(h.to_affine().to_bytes());
//     hasher.update(k.to_affine().to_bytes());
//     hasher.update(z.to_affine().to_bytes());
//     hasher.update(g2.to_affine().to_bytes());
//     hasher.update(j.to_affine().to_bytes());
//     hasher.update(alpha.to_affine().to_bytes());
//     hasher.update(commitment.to_affine().to_bytes());
//     hasher.update(c_w.to_affine().to_bytes());
//     hasher.update(c_sigma.to_affine().to_bytes());
//     hasher.update(c_rho.to_affine().to_bytes());
//     hasher.update(t_sigma.to_affine().to_bytes());
//     hasher.update(t_rho.to_affine().to_bytes());
//     hasher.update(t_sigma_prime.to_affine().to_bytes());
//     hasher.update(t_rho_prime.to_affine().to_bytes());
//     hasher.update(hash_gt(&t_o));
//     let hash = hasher.finalize();
//     let mut wide = [0u8; 64];
//     wide[..32].copy_from_slice(&hash);
//     let c = Scalar::from_bytes_wide(&wide);

//     let s_x = v_x - c * x;
//     let s_l = v_l - c * l;
//     let s_sigma = v_sigma - c * sigma;
//     let s_rho = v_rho - c * rho;
//     let s_xsigma = v_xsigma - c * (x * sigma);
//     let s_xrho = v_xrho - c * (x * rho);

//     (
//         commitment,
//         ZKProof {
//             c,
//             s_x,
//             s_l,
//             s_sigma,
//             s_rho,
//             s_xsigma,
//             s_xrho,
//             c_w,
//             c_sigma,
//             c_rho,
//         },
//     )
// }

// pub fn verify_zkp(
//     g: &G1Projective,
//     h: &G1Projective,
//     k: &G1Projective,
//     z: &G1Projective,
//     g2: &G2Projective,
//     j: &G2Projective,
//     alpha: &G1Projective,
//     e_z_g2: &Gt,
//     e_z_j: &Gt,
//     commitment: &G1Projective,
//     proof: &ZKProof,
// ) -> bool {
//     let t_sigma = proof.c_sigma * proof.c + h * proof.s_sigma;
//     let t_rho = proof.c_rho * proof.c + k * proof.s_rho;
//     let t_sigma_prime = proof.c_sigma * proof.s_x + h * proof.s_xsigma.neg();
//     let t_rho_prime = proof.c_rho * proof.s_x + k * proof.s_xrho.neg();
//     let e_cw_g2 = pairing(&proof.c_w.to_affine(), &g2.to_affine());
//     let e_cw_j = pairing(&proof.c_w.to_affine(), &j.to_affine());
//     let y = pairing(&alpha.to_affine(), &g2.to_affine()) - e_cw_j;
//     let t_o = y * proof.c + e_cw_g2 * proof.s_x + e_z_g2 * (proof.s_xsigma + proof.s_xrho).neg() + e_z_j * (proof.s_sigma + proof.s_rho).neg();

//     let mut hasher = Sha256::new();
//     hasher.update(g.to_affine().to_bytes());
//     hasher.update(h.to_affine().to_bytes());
//     hasher.update(k.to_affine().to_bytes());
//     hasher.update(z.to_affine().to_bytes());
//     hasher.update(g2.to_affine().to_bytes());
//     hasher.update(j.to_affine().to_bytes());
//     hasher.update(alpha.to_affine().to_bytes());
//     hasher.update(commitment.to_affine().to_bytes());
//     hasher.update(proof.c_w.to_affine().to_bytes());
//     hasher.update(proof.c_sigma.to_affine().to_bytes());
//     hasher.update(proof.c_rho.to_affine().to_bytes());
//     hasher.update(t_sigma.to_affine().to_bytes());
//     hasher.update(t_rho.to_affine().to_bytes());
//     hasher.update(t_sigma_prime.to_affine().to_bytes());
//     hasher.update(t_rho_prime.to_affine().to_bytes());
//     hasher.update(hash_gt(&t_o));
//     let hash = hasher.finalize();
//     let mut wide = [0u8; 64];
//     wide[..32].copy_from_slice(&hash);
//     let expected_c = Scalar::from_bytes_wide(&wide);

//     proof.c == expected_c
// }