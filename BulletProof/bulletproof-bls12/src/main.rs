extern crate rand;
extern crate curve25519_dalek;
extern crate merlin;
extern crate bulletproofs_bls;
extern crate bls12_381;

// Standard library
use std::fs::File;
use std::io::Cursor;
use std::ops::Mul;

// External crates
use rand::thread_rng;
use ark_ff::{PrimeField, UniformRand};
use ark_bn254::Fr as FrBN;
use ark_bls12_381::{G1Projective, Fr as FrBLS};

// Local crate modules (bulletproofs_bls12)
use bulletproofs_bls12::helper::{
    fr_to_decimal_string,
    fr_vec_to_decimal_array,
    fr_to_le_bytes_32,
    hash_range_nonce_mimc,
};
use bulletproofs_bls12::MiMC::yeild_MiMC_Parameter; // if needed
use bulletproofs_bls12::bulletproof::{
    get_bp_gens,
    get_pc_gens,
    transcript_from_label,
    get_range_proof,
    verifies_off_chain,
};
use accumulator_impl::helper::*; // if still needed
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
    let mimc_params = yeild_MiMC_Parameter(k, num_inputs, num_outputs);
    
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
    let range_proof_bytes :Vec<u8> = proof.to_bytes();

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
  
    let mapped_com_254 = map_bls_to_bn254(&commitment_bytes);
   
    
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


