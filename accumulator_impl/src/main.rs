use ark_std::UniformRand;
use ark_bls12_381::{ G1Projective, G2Projective};
use ark_ec::CurveGroup;
use accumulator_impl::helper::compute_pairing;

fn main() {
    let mut rng = rand::thread_rng();

    let z = G1Projective::rand(&mut rng).into_affine();
    let j = G2Projective::rand(&mut rng).into_affine();

    let result = compute_pairing(z, j);
    println!("e(z, j) = {:?}", result);
}