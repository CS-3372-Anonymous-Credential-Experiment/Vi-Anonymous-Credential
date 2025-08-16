extern crate rand;
extern crate curve25519_dalek;
extern crate merlin;
extern crate bulletproofs_bls;
extern crate bls12_381;

use rand::thread_rng;
// use curve25519_dalek::scalar::Scalar;
use merlin::Transcript;
use std::fs::File;
use serde_json::{json};
use accumulator_impl::helper::*;
use bulletproofs_bls12::helper::fr_to_decimal_string;
use bulletproofs_bls12::helper::fr_vec_to_decimal_array;
use bulletproofs_bls12::helper::fr_to_le_bytes_32;
use bulletproofs_bls12::helper::MiMCParameters;
use bulletproofs_bls::{BulletproofGens, PedersenGens, RangeProof};
use ark_sponge::poseidon::PoseidonSponge;
use bulletproofs_bls::inner_types::Scalar;
use rand_core::OsRng;
use crate::rand::RngCore;
use ark_ff::fields::PrimeField;
use subtle::CtOption;
use ark_bn254::Fr as FrBN;
use ark_ff::UniformRand;
use bulletproofs_bls12::helper::hash_range_nonce;
use bulletproofs_bls12::helper::yeild_MiMCParameter;
use bulletproofs_bls12::helper::hash_range_nonce_mimc;
use ark_bls12_381::{G1Projective, Fr as FrBLS, G1Affine};
use std::ops::Mul;
use ark_serialize::CanonicalSerialize;
use ark_ec::CurveGroup;
use bulletproofs_bls::inner_types::G1Projective as G1Bls;
use std::io::Cursor;
use ark_sponge::CryptographicSponge;
use bulletproofs_bls12::check::check;
use sha2::{Sha256, Digest};


pub fn example_proof_1_vals() {
    let secret_value = 23u64;   // actual age (proof age >=20)
    let mut rng = thread_rng();

    // Prepare the commitment
    let g = G1Projective::rand(&mut rng);
    let commitment_secret = g.mul(FrBLS::from(secret_value)); 
    let mut commitment_bytes = Vec::new(); // vec::Vec<u8>
    commitment_secret.into_affine().serialize_uncompressed(&mut commitment_bytes).unwrap(); 

    println!("Type of commitment_bytes: {}", std::any::type_name_of_val(&commitment_bytes));
    let threshold = 20u64;
    let proved_val =  secret_value.wrapping_sub(threshold); // returns 0 instead of underflow
    

    let pc_gens = PedersenGens::default();
    let bp_gens = BulletproofGens::new(64,1);

    let mut csprng = OsRng;

    let blinding: Scalar = loop {
            // 1️⃣ Fill 32 bytes randomly
            let mut bytes = [0u8; 32];
            csprng.fill_bytes(&mut bytes);

            // 2️⃣ Convert to CtOption<Scalar>
            let blinding= Scalar::from_be_bytes(&bytes);

            // 3️⃣ Check if valid
            if blinding.is_some().unwrap_u8() == 1 {
                // 4️⃣ Unwrap safely and break the loop
                break blinding.unwrap();
            }
            // else: bytes invalid, loop again
        };
   
    let mut prover_transcript = Transcript::new(b"carolina");
    let (proof, committed_value) = RangeProof::prove_single(
        &bp_gens,
        &pc_gens,
        &mut prover_transcript,
        proved_val,
        &blinding,
        8,
    ).expect("Single Proof creation failed");

    // println!("the range proof {:?}",proof);
    println!("Type of proof: {}", std::any::type_name_of_val(&proof));
    let mut verifier_transcript = Transcript::new(b"carolina"); // if this was clone this was fail

    let result = proof.verify_single(
        &bp_gens,
        &pc_gens,
        &mut verifier_transcript,
        &committed_value,
        8
    );


    println!("Verification result: {:?}", result);

    if result.is_ok() {
        // println!("Single Proof verified successfully! Age >= 20 proven.");
        // // Generating the Nonce (BN-254 Fr)
        // let nonce: FrBN = FrBN::rand(&mut rng);
        // let hash_range_nonce_pr = hash_range_nonce(&proof, &nonce, &commitment_bytes); 
        // println!("the hashing {:?}",hash_range_nonce_pr );
        // // Doing the Poseidon Hashing (Proof , Nonce) to BN-254 Fr
        
    } else {
        println!("Proof rejected! Age is below threshold.");
        // Return no hashing
    }
}

pub fn get_bp_gens( gens_capacity: usize, party_capacity: usize) ->  BulletproofGens {
    let bp_gens = BulletproofGens::new(gens_capacity,party_capacity); // usuall set to 64, and a power of 2^k (k can be any)
    bp_gens
}

pub fn get_pc_gens() ->  PedersenGens {
    let pc_gens = PedersenGens::default();
    pc_gens
}

pub fn transcript_from_label(label: &str) -> Transcript {
    let mut transcript = Transcript::new(b"default"); // temporary static label
    transcript.append_message(b"label", label.as_bytes());
    transcript
}

pub fn get_range_proof( 
    secret: u64, threshold: u64,  prover_transcript: &mut Transcript, n: usize, 
    bp_gens : &BulletproofGens, pc_gens: &PedersenGens ) -> (RangeProof, G1Bls)
{

    let mut csprng = OsRng;
    let blinding: Scalar = loop {
            // 1️⃣ Fill 32 bytes randomly
            let mut bytes = [0u8; 32];
            csprng.fill_bytes(&mut bytes);

            // 2️⃣ Convert to CtOption<Scalar>
            let blinding= Scalar::from_be_bytes(&bytes);

            // 3️⃣ Check if valid
            if blinding.is_some().unwrap_u8() == 1 {
                // 4️⃣ Unwrap safely and break the loop
                break blinding.unwrap();
            }
            // else: bytes invalid, loop again
    };

    let proved_val =  secret.wrapping_sub(threshold); // returns 0 instead of underflow
    
    let (proof, committed_value) = RangeProof::prove_single(
        bp_gens,
        pc_gens,
        prover_transcript,
        proved_val,
        &blinding,
        n,
    ).expect("Single Proof creation failed");

    (proof, committed_value)
}

pub fn verify_range_proof (proof : RangeProof, verifier_transcript: &mut Transcript, n: usize, &committed_value: &G1Bls, bp_gens : &BulletproofGens, pc_gens: &PedersenGens ) -> bool {
    let result = proof.verify_single(
        bp_gens,
        pc_gens,
        verifier_transcript,
        &committed_value,
        n
    );
    if result.is_ok() {
        println!("Single Proof verified successfully!");
        true
    } else {
        println!("Proof rejected!");
        false
    }   



}

pub fn verifies_off_chain(
    proof: &RangeProof,
    verifier_transcript: &mut Transcript, 
    n: usize,
    committed_value: &G1Bls, 
    bp_gens: &BulletproofGens,
    pc_gens: &PedersenGens, 
    commitment_secret: &G1Projective,
    mimc_params: & MiMCParameters<FrBN>,
) -> (FrBN, FrBN, RangeProof, Vec<u8>) // (nonce, hash, proof, commitment_bytes)
{
    if verify_range_proof(proof.clone(), verifier_transcript, n, committed_value, bp_gens, pc_gens) {
        println!("Success");
        let mut commitment_bytes = Vec::new();
        commitment_secret
            .into_affine()
            .serialize_uncompressed(&mut commitment_bytes)
            .unwrap();

        let mut rng = rand::thread_rng();
        let nonce: FrBN = FrBN::rand(&mut rng);
        let hash_range_nonce_pr = hash_range_nonce_mimc(&proof, &nonce, &commitment_bytes,mimc_params); // FIX WITH MiMC

        (nonce, hash_range_nonce_pr, proof.clone(), commitment_bytes)
    } else {
        // Return "empty" values
        println!("Failure");
        (
            FrBN::from(0u64),          // nonce = 0
            FrBN::from(0u64),          // hash = 0
            proof.clone(),             // empty proof
            Vec::new(),                // empty byte vec
        )
    }
}

pub fn example_multi_message() {
    // Generators for Pedersen commitments
    let pc_gens = PedersenGens::default();

    // Generators for Bulletproofs, valid for proofs up to 64 bits
    let mut csprng = OsRng;
    let number_msg = 4; // let this be power of 2 (to have success proof)
    let bp_gens = BulletproofGens::new(64,16);

    let mut msg_values: Vec<u64> = Vec::new(); // the message // proof all the values in range 0 to 2^32
    msg_values.push(19u64);
    msg_values.push(15_112_004u64); // DOB
    msg_values.push(21u64);          // Age
    msg_values.push(75u64);          // Score
   
    let mut blind_values = Vec::<Scalar>::new(); // the message 
    for _ in 0..number_msg {
        let blinding: Scalar = loop {
            // 1️⃣ Fill 32 bytes randomly
            let mut bytes = [0u8; 32];
            csprng.fill_bytes(&mut bytes);

            // 2️⃣ Convert to CtOption<Scalar>
            let blinding= Scalar::from_be_bytes(&bytes);

            // 3️⃣ Check if valid
            if blinding.is_some().unwrap_u8() == 1 {
                // 4️⃣ Unwrap safely and break the loop
                break blinding.unwrap();
            }
            // else: bytes invalid, loop again
        };
        blind_values.push(blinding);
    }
   
    // // Create a transcript for the proof
    let mut prover_transcript = Transcript::new(b"carolina");
 
    let msg_values_slice:  &[u64] = &msg_values;
    let blind_values_slice: &[Scalar] = &blind_values;
    
    let (proof, committed_value) = RangeProof::prove_multiple(
        &bp_gens,
        &pc_gens,
        &mut prover_transcript,
        msg_values_slice,  
        blind_values_slice, 
        32,
    ).expect("Proof creation failed");

    // Verify the proof
    
    let mut verifier_transcript = Transcript::new(b"carolina"); // if this was clone this was fail

    assert!(proof.verify_multiple(
        &bp_gens,
        &pc_gens,
        &mut verifier_transcript,
        &committed_value,
        32
    ).is_ok());

    println!("Proof verified successfully!");

    // bulletproof_one_vals();

}

fn main_test() {
    // check();
    // let k  = FrBN::from(64u64);
    // let yeild_MiMCParameter(k, 20, 20);
}


fn main() {
    let bp_gens = get_bp_gens(64, 1);
    let mut rng = thread_rng();
    let secret = 20u64;
    let threshold = 19u64; // if secret > threshold
    let pc_gens = get_pc_gens();
    let labels = "Caroline";
    let n: usize = 8; // set the usize = 8 (2^8 - 1)
    let mut prover_transcript = transcript_from_label(&labels);
    let (proof, commited_values_proof) = get_range_proof(
        secret,
        threshold,
        &mut prover_transcript,
        n,
        &bp_gens,
        &pc_gens
    );
    let g = G1Projective::rand(&mut rng); // takes from issuer
    let commitment_secret = g.mul(FrBLS::from(secret)); 
    let num_inputs = 25; // 20 Fr from proof + 1  nonce + 4 from commitment
    let num_outputs = 1;
    let k = FrBN::from(0); // for seeding
    let mimc_params = yeild_MiMCParameter(k, num_inputs, num_outputs);
    
    let mut verifier_transcript = transcript_from_label(&labels);
    let (nonce, hash, _, commitment_bytes ) = verifies_off_chain(
        &proof,
        &mut verifier_transcript,
        n,
        &commited_values_proof,
        &bp_gens,
        &pc_gens,
        &commitment_secret ,
        &mimc_params   
    );

    
    // // Try to reconstruct (testing)
    let mut range_proof_bytes :Vec<u8> = proof.to_bytes();

    // Convert the Range-Proof bytes to Field Element
    let mut fr_elements = Vec::new();
    let mut fr_elements_bytes = Vec::new();
    let mut cursor = Cursor::new(&range_proof_bytes);
        
    while (cursor.position() as usize + 32) <= range_proof_bytes.len() {
        // Take the next 32 bytes
        let chunk = &range_proof_bytes[cursor.position() as usize .. cursor.position() as usize + 32];

        // Convert them to a field element (BN254)
        let x_bn = FrBN::from_le_bytes_mod_order(chunk);
        fr_elements.push(x_bn);
        let x_bn_bytes = fr_to_le_bytes_32(&x_bn); 
        fr_elements_bytes.extend_from_slice(&x_bn_bytes);

        // Move the cursor forward by 32 bytes
        cursor.set_position(cursor.position() + 32);
    }
    // let old_lenght =fr_elements.len();
    // println!("the lenght of fr_elements {:?}",fr_elements.len() );
    let mapped_com_254 = map_bls_to_bn254(&commitment_bytes);
    // fr_elements.extend(mapped_com_254.0.0.iter().map(|x| FrBN::from(*x)));
    // println!("the lenght of fr_elements from commitment {:?}",fr_elements.len() - old_lenght );
    // fr_elements.push(nonce);
    
    let mut vec_comm_fr = Vec::new();
    vec_comm_fr.extend(mapped_com_254.0.0.iter().map(|x| FrBN::from(*x)));
    let hash_mimc = hash_range_nonce_mimc(&proof, &nonce, &commitment_bytes, &mimc_params);
    println!("the hash_mimc == the hash from verifier {:?}",hash_mimc == hash);

    // // Save as decimal array for circom/arkworks input
    let file = File::create("public_input.json").expect("Unable to create file");
    
    let fr_vec_dec = fr_vec_to_decimal_array(&fr_elements);
    let fr_vec_com_dec = fr_vec_to_decimal_array(&vec_comm_fr);
    // // println!("{:?}", fr_vec_dec);
    serde_json::to_writer_pretty(
        &file,
        &serde_json::json!({
            "commitment_bytes": fr_vec_com_dec,
            "hash" : fr_to_decimal_string(&hash),
            "proof": fr_vec_dec,
            "k": fr_to_decimal_string(&k),
        }),
    ).expect("Unable to create file");

    let private_file = File::create("private_input.json").expect("Unable to create file");
    serde_json::to_writer_pretty(
        &private_file,
        &serde_json::json!({
            "nonce": fr_to_decimal_string(&nonce),
            
        }),
    ).expect("Unable to create file");
    // Public Data: 
        // Commitment_Bytes
        // Range Proof Bytes
        // Hash(Commitment_Bytes, Range Proof Bytes, Nonce )
    // Private Data
        // Nonce

        

}


