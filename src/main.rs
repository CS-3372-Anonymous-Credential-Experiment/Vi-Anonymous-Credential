mod bb_params;
mod credential;
mod commitment;
mod witness;
mod acumulator;

use ark_bls12_381::Bls12_381;
use ark_bls12_381::Fr;
use bbs_plus::prelude::SignatureParamsG1;
use bbs_plus::prelude::SecretKey;
use ark_ff::UniformRand;
use sha2::Sha256;
use rand::thread_rng;
use bbs_plus::prelude::SignatureG1;
use crate::acumulator::Accumulator;
use crate::credential::Credential;

fn main() {
    let mut rng = thread_rng();
    let mut acc = Accumulator::new();

    // Step 1: Accumulator secret key
    let sk_fr = Fr::rand(&mut rng);
    acc.acc_gen(sk_fr, 10);

    // Step 2: Issuer secret key (for signing)
    let seed = [0u8; 32];
    let sk = SecretKey::<Fr>::generate_using_seed::<Sha256>(&seed);

    // Step 3: Prepare parameters and message
    let message_count = 2;
    let params = SignatureParamsG1::<Bls12_381>::generate_using_rng(&mut rng, message_count);
    let fr_messages: Vec<Fr> = (0..message_count).map(|_| Fr::rand(&mut rng)).collect();
    let signature = SignatureG1::new(&mut rng, &fr_messages, &sk, &params).unwrap();

    // Step 4: Create credential
    let credential = Credential {
        signature: signature.clone(),
        messages: fr_messages.clone(),
        issuer_pk: None,
    };

    println!(
        "type of signature: {}",
        std::any::type_name_of_val(&credential.signature)
    );    
    println!("the signature values: {:?}", credential.signature);
    // // Step 5: Generate witness for credential
    // let h = G1Affine::new_unchecked(G1_GENERATOR_X, G1_GENERATOR_Y).into_group();
    // let witness = acc.gen_wit(&sk, credential.clone(), &h);

    // println!("\n[Test Case] Witness generated for credential");
    // println!("- x = {:?}", witness.x);
    // println!("- acc_val (before) = {:?}", acc.acc_val);

    // // Step 6: Revoke the credential (deletion from accumulator)
    // let delta = acc.del(&sk, credential);

    // println!("\n[Test Case] Credential revoked");
    // println!("- delta (x) = {:?}", delta);
    // println!("- acc_val (after) = {:?}", acc.acc_val);
}