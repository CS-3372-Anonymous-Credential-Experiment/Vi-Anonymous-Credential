use ark_ff::fields::PrimeField;
use ark_bls12_381::{Bls12_381, G1Affine, G2Affine, G1Projective, G2Projective, Fr};
use ark_ec::pairing::{Pairing, PairingOutput};
use ark_ec::{CurveGroup};
use sha2::{Digest, Sha256}; // to map commitment -> Fr
use bbs_plus::setup::{SignatureParamsG1,KeypairG2};
use rand::thread_rng;
use std::ops::Mul;
use ark_serialize::{CanonicalSerialize};

pub fn compute_pairing(
    z: G1Affine,
    j: G2Affine,
) -> PairingOutput<Bls12_381> {
    Bls12_381::pairing(z, j)
}


// Holder computes:
//   Cx_point = g * x + h * r (g^x + h ^r)
// then derives a field element Cx_fr = HashToFr(serialize(Cx_point))
pub fn compute_commitment_and_field(x: &Fr, g: &G1Projective, h: &G1Projective, r: &Fr) -> (G1Projective, Fr) {
    // let mut rng = OsRng;
    // let r = Fr::rand(&mut rng);                 // blinding
    let cx_point = g.mul(x) + h.mul(r);        // Pedersen commitment in G1

    // Serialize the group point (to bytes) and hash to field
    let mut bytes = Vec::new();
    cx_point.into_affine().serialize_uncompressed(&mut bytes).unwrap(); // byte array (needs ark-serialize trait)
    let hash = Sha256::digest(&bytes);
    let cx_fr = Fr::from_le_bytes_mod_order(&hash);

    (cx_point, cx_fr) // send cx_fr for verification
}

pub fn verify_witness(alpha: &G1Projective,
    x: &Fr,
    witness: &G1Projective,
    g2: &G2Projective,
    j: &G2Projective

    ) -> bool {
        let lhs = Bls12_381::pairing(alpha.into_affine(), g2.into_affine());
        let g2xj = (*g2 * x) + j;
        let rhs = Bls12_381::pairing(witness.into_affine(), g2xj.into_affine());
        lhs == rhs
}

pub fn generate_bbs_param_keypair() -> (SignatureParamsG1::<Bls12_381>, KeypairG2::<Bls12_381>){

    let mut rng = thread_rng();
    let _message_count = 6; // X and Cx
    // X:  [Name, DOB, Age, Score, Candidate_ID]
    // Cx: commitment of x
    // total message: 6 = 5 + 1

    let _message_count = 6;
    let params = SignatureParamsG1::<Bls12_381>::generate_using_rng(&mut rng, _message_count);

    // Generate the KeyPair (SK-G1, PK-G2): sk: x , pk: g2^x
    let keypair_g2 = KeypairG2::<Bls12_381>::generate_using_rng(&mut rng, &params);

    // How to extract the sk and pk
    // sk = keypair_g2.secret_key;
    // pk = keypair_g2.public_key;

    return (params, keypair_g2);
}


pub fn print_type_of<T>(_: &T) {
    println!("{}", std::any::type_name::<T>());
}

