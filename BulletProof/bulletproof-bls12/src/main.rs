extern crate rand;
extern crate curve25519_dalek;
extern crate merlin;
extern crate bulletproofs_bls;
extern crate bls12_381;

use rand::thread_rng;
// use curve25519_dalek::scalar::Scalar;
use merlin::Transcript;
use bulletproofs_bls::{BulletproofGens, PedersenGens, RangeProof};
use bulletproofs_bls::inner_types::Scalar;
use rand_core::OsRng;
use crate::rand::RngCore;
use subtle::CtOption;
// use blstrs_plus::Scalar;

pub fn bulletproof_one_vals() {
    let secret_value = 16u64;   // actual age (proof age >=20)
    let threshold = 20u64;
    let proved_val =  secret_value.wrapping_sub(threshold); // returns 0 instead of underflow
    println!("{:?}",proved_val);
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

    println!("the range proof {:?}",proof);
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
        // Doing the Poseid
        println!("Single Proof verified successfully! Age >= 20 proven.");
    } else {
        println!("Proof rejected! Age is below threshold.");
    }
}



fn main() {
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

    bulletproof_one_vals();

}