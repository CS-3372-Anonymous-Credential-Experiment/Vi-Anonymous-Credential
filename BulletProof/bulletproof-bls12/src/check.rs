use num_bigint::BigUint;
use serde::Deserialize;
use std::fs;

const BN254_MODULUS: &str = "21888242871839275222246405745257275088548364400416034343698204186575808495617";

#[derive(Deserialize)]
struct InputData {
    fr_elements: Vec<String>,
    hash: String,
    mapped_com_254: String,
    nonce: String,
}

fn check_lt_modulus(value: &BigUint, name: &str, modulus: &BigUint) {
    if value >= modulus {
        println!("❌ {} is NOT less than BN254 modulus!", name);
    } else {
        println!("✅ {} is valid.", name);
    }
}

pub fn check() -> anyhow::Result<()> {
    // Load JSON file
    let data = fs::read_to_string("input.json")?;
    let input: InputData = serde_json::from_str(&data)?;

    let modulus = BigUint::parse_bytes(BN254_MODULUS.as_bytes(), 10).unwrap();

    // Check fr_elements
    for (i, e) in input.fr_elements.iter().enumerate() {
        let val = BigUint::parse_bytes(e.as_bytes(), 10).unwrap();
        check_lt_modulus(&val, &format!("fr_elements[{}]", i), &modulus);
    }

    // Check hash
    let hash_val = BigUint::parse_bytes(input.hash.as_bytes(), 10).unwrap();
    check_lt_modulus(&hash_val, "hash", &modulus);

    // Check mapped_com_254
    let mapped_val = BigUint::parse_bytes(input.mapped_com_254.as_bytes(), 10).unwrap();
    check_lt_modulus(&mapped_val, "mapped_com_254", &modulus);

    // Check nonce
    let nonce_val = BigUint::parse_bytes(input.nonce.as_bytes(), 10).unwrap();
    check_lt_modulus(&nonce_val, "nonce", &modulus);

    Ok(())
}