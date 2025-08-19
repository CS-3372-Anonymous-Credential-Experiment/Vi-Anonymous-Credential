extern crate rand;
extern crate curve25519_dalek;
extern crate merlin;
extern crate bulletproofs_bls;
extern crate bls12_381;

use rand::thread_rng;
// use curve25519_dalek::scalar::Scalar;
use merlin::Transcript;





use crate::MiMC::{MiMCParameters};
use bulletproofs_bls::{BulletproofGens, PedersenGens, RangeProof};
use bulletproofs_bls::inner_types::Scalar;
use rand_core::OsRng;
// use crate::rand::RngCore;
use crate::bulletproof::rand::RngCore;

use ark_bn254::Fr as FrBN;
use ark_ff::UniformRand;
use crate::helper::hash_range_nonce_mimc;
use ark_bls12_381::{G1Projective, Fr as FrBLS};
use std::ops::Mul;
use ark_serialize::CanonicalSerialize;
use ark_ec::CurveGroup;
use bulletproofs_bls::inner_types::G1Projective as G1Bls;



/*
    For Simulate an Bulletproof with 1 message values
*/ 
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

/*
    Generate the Bulletproof Gen
*/
pub fn get_bp_gens( gens_capacity: usize, party_capacity: usize) ->  BulletproofGens {
    let bp_gens = BulletproofGens::new(gens_capacity,party_capacity); // usuall set to 64, and a power of 2^k (k can be any)
    bp_gens
}

/*
    Generating the PedersenGen Parameter for BulletProof
*/
pub fn get_pc_gens() ->  PedersenGens {
    let pc_gens = PedersenGens::default();
    pc_gens
}


/*
    Generating the Transcript from a String
    Return A Transcript Object 
*/
pub fn transcript_from_label(label: &str) -> Transcript {
    let mut transcript = Transcript::new(b"default"); // temporary static label
    transcript.append_message(b"label", label.as_bytes());
    transcript
}

/*
    Return A RangeProof for a specific threshold given the secret values
*/
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

/*
    Verify a Range Proof and Return the Bool values if the proof is hol
    Accept Verifier Transcript, the commited Values, bp, pc
    Return Boolean
*/
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

/*
    Doing the Bulletproof Off-Chain Verification and
    return a tuple (nonce, hash, proof, commitment_bytes) for doing on-chain verification
*/
pub fn verifies_off_chain(
    proof: &RangeProof,
    verifier_transcript: &mut Transcript, 
    n: usize,
    committed_value: &G1Bls, 
    bp_gens: &BulletproofGens,
    pc_gens: &PedersenGens, 
    commitment_secret: &G1Projective,
    mimc_params: & MiMCParameters<FrBN>,
) -> (FrBN, FrBN, RangeProof, Vec<u8>) 
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



/*
    Doing Multi-Message Aggregating Bulletproof Checking
*/
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

