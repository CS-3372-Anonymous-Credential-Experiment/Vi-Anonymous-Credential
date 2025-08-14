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
fn main() {

// Testing the test-case 1:

// Issuer Creation
let _issuer_idp = Issuer::new();
let _g1 = _issuer_idp.get_g1();
// Initialize the accumulator
let mut _acc = ECAccumulator::new(_g1);

//Generate a Witness & Issuing a Credential
/*
    Define: Name: 19, DOB: 15112004, Age:21, Score:75, Candidate_ID: 245
*/
let mut messages: Vec<Fr> = Vec::new();
messages.push(Fr::from(19u128));
messages.push(Fr::from(15_112_004u128)); // DOB
messages.push(Fr::from(21u128));          // Age
messages.push(Fr::from(75u128));          // Score
messages.push(Fr::from(245u128)); // Candidate ID


// Sign the message & testing the witness

let _candidate_cert = _issuer_idp.gen_witness_n_cred(&_acc, messages);
// println!("The Signature {:?}", _candidate_cert.get_signature());
// println!("The Message {:?}", _candidate_cert.get_message());
// println!("The secrete value x {:?}", _candidate_cert.get_x_val());
// println!("The Witness {:?}", _candidate_cert.get_witness());
// println!("The Random Value r {:?}", _candidate_cert.get_r());

// Creating a Holder keep the cred
let _alice = Holder::new(_candidate_cert);

// Get the public parameter from issuer & accumulator
let _alpha = _acc.get_alpha(); // alpha
let (_g, _h, _k, _z) = _issuer_idp.get_g_h_k_z();
let _pk = _issuer_idp.get_pk();
let _g2 = _issuer_idp.get_g2();
let _j = _issuer_idp.get_j();
let _param = _issuer_idp.get_sig_param();

println!("The alpha when Alice only {}", _alpha);
let is_valid = _alice.verify_mem(_g, _h, _pk, _param, _alpha, _g2, _j);
println!("is valid {}", is_valid);


// Adding more Credentials to the accumulator
/*

    Define: Name 20, DOB: 22082008, Age: 23, Score: 65, Candidate_ID: 208
*/

let mut messages_2: Vec<Fr> = Vec::new();
messages_2.push(Fr::from(20u128));
messages_2.push(Fr::from(22_082_004u128)); // DOB
messages_2.push(Fr::from(23u128));          // Age
messages_2.push(Fr::from(65u128));          // Score
messages_2.push(Fr::from(208u128)); // Candidate ID

let _candidate_cert_2 = _issuer_idp.gen_witness_n_cred(&_acc, messages_2);
// println!("The Signature {:?}", _candidate_cert_2.get_signature());
// println!("The Message {:?}", _candidate_cert_2.get_message());
// println!("The secrete value x {:?}", _candidate_cert_2.get_x_val());
// println!("The Witness {:?}", _candidate_cert_2.get_witness());
// println!("The Random Value r {:?}", _candidate_cert_2.get_r());


let mut _carol = Holder::new(_candidate_cert_2);
let _alpha_2 = _acc.get_alpha(); // alpha
println!("The alpha with [Alice, Carol] {}", _alpha_2);
let is_valid = _carol.verify_mem(_g, _h, _pk, _param, _alpha_2, _g2, _j);
println!("is valid {}", is_valid);


/*

    Define: Name 25, DOB: 22082008, Age: 23, Score: 65, Candidate_ID: 208
*/

let mut messages_3: Vec<Fr> = Vec::new();
messages_3.push(Fr::from(25u128));
messages_3.push(Fr::from(22_082_004u128)); // DOB
messages_3.push(Fr::from(23u128));          // Age
messages_3.push(Fr::from(65u128));          // Score
messages_3.push(Fr::from(208u128)); // Candidate ID


let _candidate_cert_3 = _issuer_idp.gen_witness_n_cred(&_acc, messages_3);
// println!("The Signature {:?}", _candidate_cert_2.get_signature());
// println!("The Message {:?}", _candidate_cert_2.get_message());
// println!("The secrete value x {:?}", _candidate_cert_2.get_x_val());
// println!("The Witness {:?}", _candidate_cert_2.get_witness());
// println!("The Random Value r {:?}", _candidate_cert_2.get_r());


let mut _james = Holder::new(_candidate_cert_3);

let _alpha_3 = _acc.get_alpha(); // alpha
println!("The alpha with [Alice, Carol, James] {}", _alpha_3);
let is_valid = _james.verify_mem(_g, _h, _pk, _param, _alpha_3, _g2, _j);
println!("is valid {}", is_valid);

println!();
println!("Alice witness's {:?}", _alice.get_cred().get_witness());
println!("Carol witness's {:?}", _carol.get_cred().get_witness());
println!("James witness's {:?}", _james.get_cred().get_witness());

println!();



// Doing the Revocation Process

// Revoke Alice's Credential
let alice_cred = _alice.get_cred();
let delta = _issuer_idp.revoke_a_cred(&mut _acc, alice_cred);
println!("The delta {:?}", delta);
println!("the accumulator state of deltas {:?}", _acc.get_deltas());
println!("Alice x's value {:?}", alice_cred.get_x_val());


let _alpha_4 = _acc.get_alpha(); 
let is_valid = _alice.verify_mem(_g, _h, _pk, _param, _alpha_4, _g2, _j);
println!("is Alice still valid {}", is_valid);


// Carol & James update the witness

println!("The alpha with [Carol, James] {:?}", _acc.get_alpha());
_carol.update_witness(delta, *_acc.get_alpha());
_james.update_witness(delta, *_acc.get_alpha());


// Check the Validity of Carol & James's Credential

let is_james_valid_new = _james.verify_mem(_g, _h, _pk, _param, _acc.get_alpha(), _g2, _j);
let is_carol_valid_new = _carol.verify_mem(_g, _h, _pk, _param, _acc.get_alpha(), _g2, _j);

println!("Is James still valid {:?}", is_james_valid_new);
println!("Is Carol still valid {:?}", is_carol_valid_new);


println!();
println!("Alice witness's {:?}", _alice.get_cred().get_witness());
println!("Carol witness's {:?}", _carol.get_cred().get_witness());
println!("James witness's {:?}", _james.get_cred().get_witness());



println!();
println!("Start prepare the ZKP for Carol");

let (Cw, Csigma, Crho, Cx_point, x_times_sig, x_times_rho, _, _) = _carol.prepare_ZKP(_g, _h, _k, _z);
// println!("Carol Cw {:?}", Cw);
// println!("Carol Csigma {:?}", Csigma);
// println!("Carol Crho {:?}", Crho);
// println!("Carol Cx_point {:?}", Cx_point);
// println!("Carol x_times_sig {:?}", x_times_sig);
// println!("Carol x_times_rho {:?}", x_times_rho);


// Serialize w
let _carol_w = _carol.get_cred().get_witness();
let mut bytes_w = Vec::new();
_carol_w.into_affine().serialize_uncompressed(&mut bytes_w).unwrap();
let w_hash = Sha256::digest(&bytes_w);
// println!("the w_hash {:?}", w_hash);


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


// let input = json!({
//   // public: each hash as array of eight 32-bit integers
//   "Cw_hash_words": cw_words,        // [u32, u32, ...] length 8
//   "Csigma_hash_words": csigma_words,
//   "Crho_hash_words": crho_words,
//   "Cx_hash_words": cx_words,

//   // private witness scalars (strings to ensure big ints handled)
//   "x": _carol.get_cred().get_x_val().to_string(),
//   "w": w.to_string(),
//   "l": l.to_string(),
//   "sigma": sigma.to_string(),
//   "rho": rho.to_string(),
//   "x_times_sig": x_times_sig.to_string(),
//   "x_times_rho": x_times_rho.to_string()
// });

}