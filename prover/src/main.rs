use accumulator_impl::holder::*;
use accumulator_impl::issuer::*;
use accumulator_impl::acc::*;
use accumulator_impl::helper::*;
use ark_bls12_381::Fr;
use sha2::{Digest, Sha256}; 
use ark_serialize::{CanonicalSerialize};
use ark_ec::{CurveGroup};
use serde_json::json;
use std::ops::Mul;
use serde::Serialize;
use std::fs::File;
use ark_serialize::Write;
use num_bigint::BigUint;
use ark_ff::PrimeField;
use num_traits::Num;
use serde::Deserialize;
use std::fs;
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

fn main() {
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

let x_sigma =  *carol_x_val * sigma;
let x_rho =    *carol_x_val * rho;

// // Serialize w
// let _carol_w = _carol.get_cred().get_witness();
// let mut bytes_w = Vec::new();
// _carol_w.into_affine().serialize_uncompressed(&mut bytes_w).unwrap();
// let w_hash = Sha256::digest(&bytes_w);


let mut bytes_cw = Vec::new();
Cw.into_affine().serialize_uncompressed(&mut bytes_cw).unwrap(); // byte array (needs ark-serialize trait)
let Cw_hash = Sha256::digest(&bytes_cw);
let cw_words = sha256_to_words(&Cw_hash);
// println!("Carol Cw_hash {:?}", Cw_hash);

let mut bytes_csig = Vec::new();
Csigma.into_affine().serialize_uncompressed(&mut bytes_csig).unwrap(); // byte array (needs ark-serialize trait)
let Csigma_hash = Sha256::digest(&bytes_csig);
let csig_words = sha256_to_words(&Csigma_hash);
// println!("Carol Csigma_hash {:?}", Csigma_hash);


let mut bytes_crho = Vec::new();
Crho.into_affine().serialize_uncompressed(&mut bytes_crho).unwrap(); // byte array (needs ark-serialize trait)
let Crho_hash = Sha256::digest(&bytes_crho);
let crho_words = sha256_to_words(&Crho_hash);
// println!("Carol Crho_hash {:?}", Crho_hash);


let mut bytes_cx = Vec::new();
Cx_point.into_affine().serialize_uncompressed(&mut bytes_cx).unwrap(); // byte array (needs ark-serialize trait)
let Cx_hash = Sha256::digest(&bytes_cx);
let cx_words = sha256_to_words(&Cx_hash);
// println!("Carol Cx_hash {:?}", Cx_hash);


println!("Prepare the paring!");

let e_z_j = compute_pairing(_z.into_affine(), _j.into_affine());
let e_z_g2 = compute_pairing(_z.into_affine(), _g2.into_affine());
let e_z_g2_x = e_z_g2.mul(_carol.get_cred().get_x_val());
let e_alpha_g2 = compute_pairing(_acc.get_alpha().into_affine(), _g2.into_affine());
// println!("The value of e_z_g2 {:?} ", e_z_g2);


println!("the values of x_sigma {:?}", x_sigma);
println!("the values of x * sigma {:?}", *carol_x_val * sigma);
println!("if x_sigma == carol_x_val * sigma {:?}", x_sigma ==*carol_x_val * sigma);
let ci = CircuitInput{
    Cx_hash_words: cx_words,
    Cw_hash_words: cw_words,
    Csigma_hash_words: csig_words,
    Crho_hash_words: crho_words,
    x_sigma: x_sigma.to_string(),
    x_rho: x_rho.to_string(),
    x: carol_x_val.to_string(),
    l: carol_l_val.to_string(),
    sigma: sigma.to_string(),
    rho: rho.to_string(),
    Cx_bytes: bytes_cx.clone(),
    Cw_bytes: bytes_cw.clone(),
    Csigma_bytes: bytes_csig.clone(),
    Crho_bytes: bytes_crho.clone()
};

let json_str = serde_json::to_string_pretty(&ci).unwrap();

let mut file = File::create("input.json").unwrap();
file.write_all(json_str.as_bytes()).unwrap();

println!("input.json generated for Circom!");

let json_str_new = fs::read_to_string("/home/accumulator/Vi-Anonymous-Credential/Accumulator/Accumulator_CA/prover/src/input.json");
let input: CircuitInput = serde_json::from_str(&json_str).expect("REASON");;

let x = parse_fr(&input.x);
let sigma = parse_fr(&input.sigma);
let x_sigma = parse_fr(&input.x_sigma);

let prod = x * sigma;

println!("x: {}", x);
println!("sigma: {}", sigma);
println!("x_sigma (input): {}", x_sigma);
println!("x * sigma: {}", prod);

// Check equality
if prod == x_sigma {
    println!("SUCCESS: x_sigma matches x * sigma");
} else {
    println!("ERROR: x_sigma does NOT match x * sigma");
}
}