// ======================
// Accumulator modules
// ======================
use accumulator_impl::{holder::*, issuer::*, acc::*, helper::*};

// ======================
// Arkworks core crates
// ======================
use ark_bls12_381::{Bls12_381, Fr, Fq, Fq2, Fq12, G1Projective, G2Projective};
use ark_ec::CurveGroup;
use ark_ff::{Field, PrimeField, One};
use ark_serialize::{CanonicalSerialize, Write};
use ark_relations::r1cs::{ConstraintSynthesizer, ConstraintLayer};
use ark_snark::{CircuitSpecificSetupSNARK, SNARK};
use ark_groth16::{Groth16, Proof, ProvingKey, VerifyingKey, prepare_verifying_key};
use ark_std::{test_rng, UniformRand};

// ======================
// Serialization & JSON
// ======================
use serde::{Serialize, Deserialize};
use serde_json::json;
use std::fs::{self, File};

// ======================
// Cryptography & hashing
// ======================
use sha2::{Digest, Sha256};

// ======================
// Big integers & math
// ======================
use num_bigint::BigUint;
use num_traits::Num;
use std::ops::{Mul, Neg};

// ======================
// Randomness & tracing
// ======================
use rand::rngs::OsRng;
use tracing_subscriber::{layer::SubscriberExt, Registry};
use tracing_subscriber::prelude::*;

// ======================
// Local modules
// ======================
use prover::circuit::CubeCircuit;
use prover::CarolCircuit::CarolCircuit;

#[derive(Serialize, Debug, Deserialize)]
struct CircuitInput {
    Cx_hash_words: [u32; 8],
    Cw_hash_words: [u32; 8],
    Csigma_hash_words: [u32; 8],
    Crho_hash_words: [u32; 8],
    x_sigma: String,
    x_rho: String,
    x: String,
    l: String,
    sigma: String,
    rho: String,
    Cx_bytes: Vec<u8>,
    Cw_bytes: Vec<u8>,
    Csigma_bytes: Vec<u8>,
    Crho_bytes: Vec<u8>,
}


fn parse_fr(s: &str) -> Fr {
        // Parse decimal string into BigUint
        let big_uint = BigUint::from_str_radix(s, 10).expect("Failed to parse decimal string");

        // Convert BigUint to little-endian bytes
        let mut bytes = big_uint.to_bytes_le();

        // Fr expects 32 bytes, pad if needed
        bytes.resize(32, 0);

        // Convert bytes to Fr (little endian)
        Fr::from_le_bytes_mod_order(&bytes)
    }



fn test_main_1() {
   
}


fn CubicTest() -> Result<(), Box<dyn std::error::Error>> {
    let subscriber = Registry::default().with(ConstraintLayer::default());
    tracing::subscriber::set_global_default(subscriber).unwrap();
    let rng = &mut OsRng;

    // Define secret x and public y = x^3 + x + 5
    let x = Fr::from(3u64);
    let y = x * x * x + x + Fr::from(5u64);
    // println!("The value of y {:?}", y);

    // Create an instance of the circuit with witness and public input
    let circuit = CubeCircuit {
        x: Some(x),
        y: Some(y),
    };

    
    // Trusted setup (key generation)
    println!("Generating keys...");
    let (pk, vk) = Groth16::<Bls12_381>::setup(circuit.clone(), rng)?;

    // println!("the pk {:?}", pk);
    // println!("the pk {:?}", vk);
    // Create a proof
    println!("Creating proof...");
    
    let proof = Groth16::<Bls12_381>::prove(&pk, circuit, rng)?; // this broke

    println!("The proof result {:?}", proof);
    // println!("Run 2");
    //Prepare verifying key
    let pvk = prepare_verifying_key(&vk);

    // Verify proof with public input y
    let public_inputs = vec![y];

    let is_valid = Groth16::<Bls12_381>::verify_proof(&pvk, &proof, &public_inputs)?;


    println!("Proof is valid? {}", is_valid);

    Ok(())
}

fn main()  -> Result<(), Box<dyn std::error::Error>>{
    let _issuer_idp = Issuer::new();
    let _g1 = _issuer_idp.get_g1();
    // Initialize the accumulator
    let mut _acc = ECAccumulator::new(_g1);
    let (_g, _h, _k, _z) = _issuer_idp.get_g_h_k_z();
    let _pk = _issuer_idp.get_pk();
    let _g2 = _issuer_idp.get_g2();
    let _j = _issuer_idp.get_j();
    let _param = _issuer_idp.get_sig_param();


    let mut messages_2: Vec<Fr> = Vec::new();
    messages_2.push(Fr::from(20u128));
    messages_2.push(Fr::from(22_082_004u128)); // DOB
    messages_2.push(Fr::from(23u128));          // Age
    messages_2.push(Fr::from(65u128));          // Score
    messages_2.push(Fr::from(208u128)); // Candidate ID

    let _candidate_cert_2 = _issuer_idp.gen_witness_n_cred(&_acc, messages_2);


    let mut _carol = Holder::new(_candidate_cert_2);


    println!();
    println!("Start prepare the ZKP for Carol");


    let carol_x_val = _carol.get_cred().get_x_val();
    let carol_l_val =  _carol.get_cred().get_r();
    let (Cw, Csigma, Crho, Cx_point, x_times_sig, x_times_rho, sigma, rho) = _carol.prepare_ZKP(_g, _h, _k, _z);

    let pos_config = create_poseidon_config(); 
    let pos_config_fq =create_poseidon_config_fq();
    
    let (rhs_constrain_1, _)  = compute_commitment_and_field(&carol_x_val, _g, _h, carol_l_val);
    let lhs_constrain_1 = _g.mul(carol_x_val) + _h.mul(carol_l_val);
    // println!("the commitment values of Carol Cx {:?}", carol_commitment_eliptic_point);
    println!("If equal {:?}", lhs_constrain_1 == rhs_constrain_1);

    // Check the Cx =  g^x * h^r
    let rhs_constrain_1_hash = poseidon_hash_g1(&rhs_constrain_1, &pos_config);
    let lhs_constrain_1_hash = poseidon_hash_g1(&lhs_constrain_1, &pos_config);
    println!("if rhs_hash == lhs_hash {:?}", rhs_constrain_1_hash == lhs_constrain_1_hash);

    // Check C_sigma = h^sigma
    let rhs_constrain_2  = _h.mul(sigma);
    let lhs_constrain_2 = Csigma;

    let lhs_constrain_2_hash = poseidon_hash_g1(&lhs_constrain_2, &pos_config);
    let rhs_constrain_2_hash = poseidon_hash_g1(&rhs_constrain_2, &pos_config);
    println!("if rhs_hash_2 == lhs_hash_2 {:?}", lhs_constrain_2_hash == rhs_constrain_2_hash);
    // Check C_rho = k^rho
    let rhs_constrain_3 = _k.mul(rho);
    let lhs_constrain_3 = Crho;

    let rhs_constrain_3_hash = poseidon_hash_g1(&lhs_constrain_3, &pos_config);
    let lhs_constrain_3_hash = poseidon_hash_g1(&rhs_constrain_3, &pos_config);
    println!("if rhs_hash_3 == lhs_hash_3 {:?}", rhs_constrain_3_hash == lhs_constrain_3_hash);


    let x_sigma =  *carol_x_val * sigma;
    let x_rho =    *carol_x_val * rho;

    // 1 = C_sig ^x * (1/h) ^(x * sig)
    let constrain_4_lhs_hash =  poseidon_hash_g1(&(Csigma.mul(carol_x_val)), &pos_config) ;
    let constrain_4_rhs_hash = poseidon_hash_g1( &((*_h).mul(*carol_x_val * sigma)), &pos_config);
    println!("the values of constrain_4_lhs_hash == constrain_4_rhs_hash {:?}", constrain_4_lhs_hash==constrain_4_rhs_hash);


    // 1 = C_rho^x * (1/k) ^(x * rho)
    let constrain_5_lhs = Crho.mul(carol_x_val);
    let constrain_5_rhs = (*(_k)).mul( *carol_x_val * rho);
    let constrain_5_lhs_hash = poseidon_hash_g1(&(constrain_5_lhs), &pos_config) ;
    let constrain_5_rhs_hash = poseidon_hash_g1(&(constrain_5_rhs), &pos_config) ;
    println!("the values of constrain_5_lhs_hash == constrain_5_rhs_hash {:?}",constrain_5_lhs_hash == constrain_5_rhs_hash );

    /* e(alpha,g2) / e(Cw, j) = e(Cw, g2) ^ {-x} * 
                                (1/e(z,g2)) ^{(x * sig +  x * rho)} * 
                                (1/ e(z,j))^{(sig + rho)} 
    */

    
    let e_alpha_g2 = compute_pairing(_acc.get_alpha().into_affine(), _g2.into_affine());
    let e_cw_j     = compute_pairing(Cw.into_affine(), _j.into_affine());
    let e_cw_g2    = compute_pairing(Cw.into_affine(), _g2.into_affine());
    let e_z_g2     = compute_pairing(_z.into_affine(), _g2.into_affine());
    let e_z_j      = compute_pairing(_z.into_affine(), _j.into_affine());

    // Compute constrain_6_rhs_ (multiplicative inverse for subtraction)
    let constrain_6_rhs = e_alpha_g2.0 * e_cw_j.0.inverse().unwrap();

    // Negate scalars in Fr first
    let carol_x_val = carol_x_val;
    let x_sigma_x_rho   = (*carol_x_val * (sigma + rho));
    let sigma_rho_neg   = (sigma + rho);

    // Convert to BigInteger for exponentiation
    let carol_x_val_big_int     = carol_x_val.into_bigint();
    let x_sigma_x_rho_big_int   = x_sigma_x_rho.into_bigint();
    let sigma_rho_big_int       = sigma_rho_neg.into_bigint();

    // Compute lhs_ using multiplicative group operations
    let constrain_6_lhs = e_cw_g2.0.pow(carol_x_val_big_int)
                    * e_z_g2.0.inverse().unwrap().pow(x_sigma_x_rho_big_int)
                    * e_z_j.0.inverse().unwrap().pow(sigma_rho_big_int);

    // Check equality
    println!("constrain_6_rhs == constrain_6_lhs ? {:?}", constrain_6_rhs == constrain_6_lhs);

    let constrain_6_rhs_hash_fr = poseidon_hash_fq12_to_fr_via_fq(&constrain_6_rhs,&pos_config_fq);
    let constrain_6_lhs_hash_fr = poseidon_hash_fq12_to_fr_via_fq(&constrain_6_lhs,&pos_config_fq);
    println!("the constrain_6_rhs_hash_fr ==  constrain_6_lhs_hash_fr {:?}", constrain_6_rhs_hash_fr == constrain_6_lhs_hash_fr);
    
    
    // Assuming you have a CarolCircuit instance called `circuit`
    
    let circuit = CarolCircuit {
        term_1_lhs_hash: lhs_constrain_1_hash,
        term_1_rhs_hash: rhs_constrain_1_hash,
        term_2_lhs_hash: lhs_constrain_2_hash,
        term_2_rhs_hash: rhs_constrain_2_hash,
        term_3_lhs_hash: lhs_constrain_3_hash,
        term_3_rhs_hash: rhs_constrain_3_hash,
        term_4_lhs_hash: constrain_4_lhs_hash,
        term_4_rhs_hash: constrain_4_lhs_hash,
        term_5_lhs_hash: constrain_5_lhs_hash,
        term_5_rhs_hash: constrain_5_rhs_hash,
        term_6_lhs_hash: constrain_6_lhs_hash_fr,
        term_6_rhs_hash: constrain_6_rhs_hash_fr,
    };

    let public_inputs = vec![
        circuit.term_1_lhs_hash,
        circuit.term_1_rhs_hash,
        circuit.term_2_lhs_hash,
        circuit.term_2_rhs_hash,
        circuit.term_3_lhs_hash,
        circuit.term_3_rhs_hash,
        circuit.term_4_lhs_hash,
        circuit.term_4_rhs_hash,
        circuit.term_5_lhs_hash,
        circuit.term_5_rhs_hash,
        circuit.term_6_lhs_hash,
        circuit.term_6_rhs_hash,
    ];
    let rng = &mut OsRng;
    println!("Generating keys...");
    let (pk, vk) = Groth16::<Bls12_381>::setup(circuit.clone(), rng)?;

    // println!("the pk {:?}", pk);
    // println!("the pk {:?}", vk);
    // Create a proof
    println!("Creating proof...");
    
    let proof = Groth16::<Bls12_381>::prove(&pk, circuit, rng)?; // this broke

    println!("The proof result {:?}", proof);
    // println!("Run 2");
    //Prepare verifying key
    let pvk = prepare_verifying_key(&vk);

    let is_valid = Groth16::<Bls12_381>::verify_proof(&pvk, &proof, &public_inputs)?;


    println!("Proof is valid? {}", is_valid);

    Ok(())

}


