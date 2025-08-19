use ark_ff::fields::PrimeField;
<<<<<<< HEAD
use ark_bls12_381::{Bls12_381, G1Affine, G2Affine, G1Projective, G2Projective, Fr};
=======
use ark_bls12_381::Fr as F;
use ark_bls12_381::{Bls12_381, G1Affine, G2Affine, G1Projective, G2Projective, Fr, Fq2, Fq12, Fq};
>>>>>>> origin/main
use ark_ec::pairing::{Pairing, PairingOutput};
use ark_ec::{CurveGroup};
use sha2::{Digest, Sha256}; // to map commitment -> Fr
use bbs_plus::setup::{SignatureParamsG1,KeypairG2};
use rand::thread_rng;
use std::ops::Mul;
use ark_serialize::{CanonicalSerialize};
<<<<<<< HEAD
=======
use ark_sponge::{
    poseidon::{PoseidonSponge, PoseidonConfig},
    CryptographicSponge,
};
use ark_std::One;
use ark_std::Zero;
use ark_ff::BigInteger;
use ark_bn254::Fr as FrBN;

>>>>>>> origin/main

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

<<<<<<< HEAD
=======
pub fn sha256_to_words(digest: &[u8]) -> [u32; 8] {
    assert_eq!(digest.len(), 32);
    let mut out = [0u32; 8];
    for i in 0..8 {
        let base = i*4;
        out[i] = ((digest[base] as u32) << 24)
               | ((digest[base+1] as u32) << 16)
               | ((digest[base+2] as u32) << 8)
               |  (digest[base+3] as u32);
    }
    out
}

pub fn create_poseidon_config() -> PoseidonConfig<F> {
    let full_rounds = 8;
    let partial_rounds = 57;
    let alpha = 5;
    let rate = 2;
    let capacity = 1;
    
    // The state width
    let state_size = rate + capacity; // usually 3 for example

    // Dummy round constants: ark[round][state_index]
    // For example, full_rounds + partial_rounds rounds total
    let total_rounds = full_rounds + partial_rounds;

    // Just fill with some dummy values like 1, 2, 3... cast to F
    let mut ark = Vec::with_capacity(total_rounds);
    for round in 0..total_rounds {
        let mut round_constants = Vec::with_capacity(state_size);
        for i in 0..state_size {
            round_constants.push(F::from((round * state_size + i) as u64 + 1));
        }
        ark.push(round_constants);
    }

    // Dummy MDS matrix: state_size x state_size, identity matrix here (not secure!)
    let mut mds = Vec::with_capacity(state_size);
    for i in 0..state_size {
        let mut row = Vec::with_capacity(state_size);
        for j in 0..state_size {
            if i == j {
                row.push(F::one());
            } else {
                row.push(F::zero());
            }
        }
        mds.push(row);
    }

    PoseidonConfig {
        full_rounds,
        partial_rounds,
        alpha,
        ark,
        mds,
        rate,
        capacity,
    }
}

pub fn create_poseidon_config_FrBN() -> PoseidonConfig<FrBN> {
    let full_rounds = 8;
    let partial_rounds = 57;
    let alpha = 5;
    let rate = 2;
    let capacity = 1;
    
    // The state width
    let state_size = rate + capacity; // usually 3 for example

    // Dummy round constants: ark[round][state_index]
    // For example, full_rounds + partial_rounds rounds total
    let total_rounds = full_rounds + partial_rounds;

    // Just fill with some dummy values like 1, 2, 3... cast to F
    let mut ark = Vec::with_capacity(total_rounds);
    for round in 0..total_rounds {
        let mut round_constants = Vec::with_capacity(state_size);
        for i in 0..state_size {
            round_constants.push(FrBN::from((round * state_size + i) as u64 + 1));
        }
        ark.push(round_constants);
    }

    // Dummy MDS matrix: state_size x state_size, identity matrix here (not secure!)
    let mut mds = Vec::with_capacity(state_size);
    for i in 0..state_size {
        let mut row = Vec::with_capacity(state_size);
        for j in 0..state_size {
            if i == j {
                row.push(FrBN::one());
            } else {
                row.push(FrBN::zero());
            }
        }
        mds.push(row);
    }

    PoseidonConfig {
        full_rounds,
        partial_rounds,
        alpha,
        ark,
        mds,
        rate,
        capacity,
    }
}


pub fn create_poseidon_config_fq() -> PoseidonConfig<Fq> {
    let full_rounds = 8;
    let partial_rounds = 57;
    let alpha = 5;
    let rate = 2;
    let capacity = 1;
    
    let state_size = rate + capacity;
    let total_rounds = full_rounds + partial_rounds;

    // Dummy round constants (insecure!)
    let mut ark = Vec::with_capacity(total_rounds);
    for round in 0..total_rounds {
        let mut round_constants = Vec::with_capacity(state_size);
        for i in 0..state_size {
            round_constants.push(Fq::from((round * state_size + i) as u64 + 1));
        }
        ark.push(round_constants);
    }

    // Dummy MDS matrix (identity, insecure!)
    let mut mds = Vec::with_capacity(state_size);
    for i in 0..state_size {
        let mut row = Vec::with_capacity(state_size);
        for j in 0..state_size {
            if i == j {
                row.push(Fq::one());
            } else {
                row.push(Fq::zero());
            }
        }
        mds.push(row);
    }

    PoseidonConfig {
        full_rounds,
        partial_rounds,
        alpha,
        ark,
        mds,
        rate,
        capacity,
    }
}

pub fn poseidon_hash_g1(g: &G1Projective, pos_config: &PoseidonConfig<Fr>) -> Fr {
    // Convert to affine to get x,y coordinates
    let g_affine = g.into_affine();
    let x = g_affine.x;
    let y = g_affine.y;

    // Initialize sponge for the scalar field Fr
    // let pos_config = create_poseidon_config(); 
    let mut sponge = PoseidonSponge::<Fr>::new(&pos_config);

    // Absorb field elements
    sponge.absorb(&x);
    sponge.absorb(&y);

    // Squeeze one field element as hash output
    sponge.squeeze_field_elements(1)[0]
}

pub fn poseidon_hash_g2(g: &G2Projective, pos_config: &PoseidonConfig<Fr>) -> Fr {
    // Convert to affine to get x,y coordinates
    let g_affine = g.into_affine();
    let x: &Fq2 = &g_affine.x;
    let y: &Fq2 = &g_affine.y;

    // Initialize sponge for the scalar field Fr
    // let pos_config = create_poseidon_config(); 
    let mut sponge = PoseidonSponge::<Fr>::new(&pos_config);

    // Absorb field elements
    sponge.absorb(&x.c0);
    sponge.absorb(&x.c1);
    sponge.absorb(&y.c0);
    sponge.absorb(&y.c1);

    // Squeeze one field element as hash output
    sponge.squeeze_field_elements(1)[0]
}

pub fn poseidon_hash_fq12_to_fq(fq12: &Fq12, cfg_fq: &PoseidonConfig<Fq>) -> Fq {
    let mut sponge = PoseidonSponge::<Fq>::new(cfg_fq);

    let limbs: [&Fq; 12] = [
        &fq12.c0.c0.c0, &fq12.c0.c0.c1,
        &fq12.c0.c1.c0, &fq12.c0.c1.c1,
        &fq12.c0.c2.c0, &fq12.c0.c2.c1,
        &fq12.c1.c0.c0, &fq12.c1.c0.c1,
        &fq12.c1.c1.c0, &fq12.c1.c1.c1,
        &fq12.c1.c2.c0, &fq12.c1.c2.c1,
    ];

    for e in limbs {
        sponge.absorb(e); // absorb Fq directly
    }

    sponge.squeeze_field_elements(1)[0]
}

pub fn poseidon_hash_fq12_to_fr_via_fq(
    fq12: &Fq12,
    cfg_fq: &PoseidonConfig<Fq>,
) -> Fr {
    let h_fq = poseidon_hash_fq12_to_fq(fq12, cfg_fq);
    // Canonical bytes -> reduce mod r
    let bytes = h_fq.into_bigint().to_bytes_le();
    Fr::from_le_bytes_mod_order(&bytes)
}

pub fn map_bls_to_bn254(x_bls_bytes: &[u8]) -> FrBN {
    let mut hasher = Sha256::new();
    hasher.update(x_bls_bytes);
    let hash_bytes = hasher.finalize();
    let x_bn = FrBN::from_le_bytes_mod_order(&hash_bytes);
    x_bn
}


pub fn fr_to_bytes(f: Fr) -> Vec<u8> {
    let mut bytes = Vec::new();
    f.serialize_uncompressed(&mut bytes).unwrap(); // serialize into canonical byte form
    bytes
}
>>>>>>> origin/main
