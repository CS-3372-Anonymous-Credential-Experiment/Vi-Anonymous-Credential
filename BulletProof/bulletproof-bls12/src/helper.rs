extern crate bulletproofs_bls;
use ark_ff::fields::PrimeField;
use ark_ff::BigInteger;
use ark_bn254::Fr as FrBN;
use accumulator_impl::helper::*;
use ark_sponge::{
    poseidon::{PoseidonSponge},
    CryptographicSponge,
};

use crate::inputData::InputData;

use bulletproofs_bls::{RangeProof};
use crate::MiMC::{MiMCParameters, mimc_sponge};

use num_bigint::BigUint;
use std::io::Cursor;
use sha2::{Sha256, Digest};


/*
    This Function accept a Range-Proof, a nonce values, and the bytes of a BN-254 commitment values
    Range proof (work on BLS-12-381 field) being convert to bytes than convert to BN-254 field elements
    Nonce is a BN-254 elements
    Commitment_Bytes was the bytes form of a BN-254 field element
    Return: a BN-254 field element (a number)
*/
pub fn hash_range_nonce_poseidon(range_proof: &RangeProof, nonce: &FrBN, commitment_bytes: &Vec<u8>) -> FrBN {
    let poseidon_congfig = create_poseidon_config_FrBN();
    let mut sponge = PoseidonSponge::<FrBN>::new(&poseidon_congfig);
    let mut range_proof_bytes :Vec<u8> = range_proof.to_bytes();

    // Convert the Range-Proof bytes to Field Element
    let mut fr_elements = Vec::new();
    let mut cursor = Cursor::new(&range_proof_bytes);
        
    while (cursor.position() as usize + 32) <= range_proof_bytes.len() {
        // Take the next 32 bytes
        let chunk = &range_proof_bytes[cursor.position() as usize .. cursor.position() as usize + 32];

        // Convert them to a field element (BN254)
        let x_bn = FrBN::from_le_bytes_mod_order(chunk);
        fr_elements.push(x_bn);

        // Move the cursor forward by 32 bytes
        cursor.set_position(cursor.position() + 32);
    }

    for fe in fr_elements.iter() {
        sponge.absorb(fe);
    }

    // Map the commitment_bytes to BN_254 Fr then absorb
    let mapped_com_254 = map_bls_to_bn254(&commitment_bytes);
    sponge.absorb(&mapped_com_254);

    // 4️⃣ Absorb the nonce
    sponge.absorb(nonce);

    // 5️⃣ Squeeze a single field element as the final hash
    sponge.squeeze_field_elements(1)[0]


}


/*
    This function accept a BN-254 field elemetn to a Slice of bytes with 32 bytes long
    Ensure the byte array is exactly 32 bytes long, padding with zeros if necessary.
    This is crucial for consistent hashing with Circom's bit interpretation.
    Spport for working with hash_range_nonce_SHA
*/
pub fn fr_to_le_bytes_32(fr_element: &FrBN) -> [u8; 32] {
    let mut bytes = fr_element.into_bigint().to_bytes_le();
    
    bytes.resize(32, 0); 
    let mut fixed_bytes = [0u8; 32];
    fixed_bytes.copy_from_slice(&bytes[0..32]);
    fixed_bytes
}


/*
    Doing the SHA Hashing the Proof & nonce & Commitment_bytes
    By accepting the range_proof, nonce, commitment_bytes

*/
pub fn hash_range_nonce_SHA(range_proof: &RangeProof, nonce: &FrBN, commitment_bytes: &Vec<u8>) -> FrBN {
    let range_proof_bytes :Vec<u8> = range_proof.to_bytes();

    let mapped_com_254 = map_bls_to_bn254(&commitment_bytes);
    let mapped_com_254_bytes = fr_to_le_bytes_32(&mapped_com_254);
    let mut hasher = Sha256::new(); // 1️⃣ Initialize the SHA-256 hasher
    hasher.update(&mapped_com_254_bytes); // Absorb these bytes first

    // Convert the Range-Proof bytes to Field Element
    // and then converts each FrBN element into its 32-byte representation for SHA-256.
    let mut fr_elements_bytes_concatenated = Vec::new();
    let mut cursor = Cursor::new(&range_proof_bytes);
        
    while (cursor.position() as usize + 32) <= range_proof_bytes.len() {
        // Take the next 32 bytes
        let chunk = &range_proof_bytes[cursor.position() as usize .. cursor.position() as usize + 32];

        // Convert them to a field element (BN254)
        let x_bn = FrBN::from_le_bytes_mod_order(chunk);
        
        // Convert the FrBN back to bytes to feed into SHA-256
        let x_bn_bytes = fr_to_le_bytes_32(&x_bn); 
        fr_elements_bytes_concatenated.extend_from_slice(&x_bn_bytes);

        // Move the cursor forward by 32 bytes
        cursor.set_position(cursor.position() + 32);
    }

    hasher.update(&fr_elements_bytes_concatenated); // Absorb all concatenated fr_elements bytes

    // --- Prepare and absorb `nonce` ---
    // Convert the nonce FrBN element to its 32-byte little-endian representation.
    let nonce_bytes = fr_to_le_bytes_32(nonce);
    hasher.update(&nonce_bytes); // Absorb the nonce bytes

    // 2️⃣ Finalize the hash computation
    let result = hasher.finalize(); // This gives a GenericArray<u8, U32> (32 bytes)

    // 3️⃣ Convert the 32-byte SHA-256 hash output back to an FrBN
    // Note: The Circom `Bits2Num(256)` component essentially interprets these 32 bytes
    // as a single large integer which fits into the BN254 scalar field.
    FrBN::from_le_bytes_mod_order(&result[..])
    

}

/*
    Doing the MiMC hashing algorithm on the Proof & Nonce & Commitment_bytes
*/
pub fn hash_range_nonce_mimc<F: PrimeField>(
    range_proof: &RangeProof,
    nonce: &F,
    commitment_bytes: &Vec<u8>,
    mimc_params: &MiMCParameters<F>,
) -> F {
    // 1️⃣ Convert RangeProof bytes to field elements
    let mut fr_elements = Vec::new();
    let binding = range_proof.to_bytes();
    let mut cursor = std::io::Cursor::new(&binding);

    while (cursor.position() as usize + 32) <= range_proof.to_bytes().len() {
        let chunk = &range_proof.to_bytes()[cursor.position() as usize..cursor.position() as usize + 32];
        let fe = F::from_le_bytes_mod_order(chunk);
        fr_elements.push(fe);
        cursor.set_position(cursor.position() + 32);
    }

    // 2️⃣ Map commitment_bytes into field elements and append
    let commitment_elements = map_bls_to_bn254(commitment_bytes);
    fr_elements.extend(commitment_elements.0.0.iter().map(|x| F::from(*x)));

    // 3️⃣ Append nonce
    fr_elements.push(*nonce);

    // 4️⃣ Check we have the expected number of inputs
    assert_eq!(fr_elements.len(), mimc_params.num_inputs);

    // 5️⃣ Run the MiMC sponge
    let outputs = mimc_sponge(&fr_elements, mimc_params);

    // 6️⃣ Return the first output as the hash
    outputs[0]
}

// Convert an Fr to decimal string (for JSON)
pub fn fr_to_decimal_string(fr: &FrBN) -> String {
    // Step 1: Convert to BigInt (arkworks internal representation)
    let bigint = fr.into_bigint(); // BigInteger256
    // Step 2: Convert limbs to little-endian byte array
    let limbs = bigint.as_ref(); // &[u64]
    let mut bytes_le = Vec::with_capacity(limbs.len() * 8);
    for limb in limbs {
        bytes_le.extend_from_slice(&limb.to_le_bytes());
    }

    // Step 3: Interpret bytes as BigUint and get decimal string
    let dec_str =BigUint::from_bytes_le(&bytes_le).to_str_radix(10);
    
    let _big_uint = BigUint::parse_bytes(dec_str.as_bytes(), 10).unwrap();
    
    dec_str

    
}

// Convert a slice (vector) of BN-254 field to a Vector of string
pub fn fr_vec_to_decimal_array(frs: &[FrBN]) -> Vec<String> {
    frs.iter().map(fr_to_decimal_string).collect()
}


// Convert a Field Element Vector to a json-string
pub fn fr_vec_to_json(fr_vec: Vec<FrBN>) -> String {
    let serializable = InputData {
        fr_elements: fr_vec
            .iter()
            .map(|x| x.into_bigint().to_string()) // decimal string
            .collect(),
    };

    serde_json::to_string_pretty(&serializable).unwrap()
}

