use serde::Serialize;
use ark_bls12_381::{Bls12_381, Fr, Fq, Fq2, Fq12, G1Projective, G2Projective};
use ark_groth16::{Proof};
use ark_serialize::{CanonicalSerialize, CanonicalDeserialize};
use ark_ff::PrimeField;
use ark_ff::BigInteger;
use std::fs::File;
use ark_serialize::Write;
use std::collections::BTreeMap;
use std::io::BufWriter;
use serde_json::json;
#[derive(Serialize)]
pub struct SnarkjsProof {
    protocol: String,
    curve: String,
    pi_a: [String; 3],
    pi_b: [[String; 2]; 3],
    pi_c: [String; 3],
}

pub fn proof_to_snarkjs(proof: &Proof<Bls12_381>) -> SnarkjsProof {
    let a = proof.a; //.into_affine();
    let b = proof.b ;//.into_affine();
    let c = proof.c ;//.into_affine();

    let snp = SnarkjsProof {
        pi_a: [
            proof.a.x.into_bigint().to_string(),
            proof.a.y.into_bigint().to_string(),
            "1".to_string(),
        ],
        pi_b: [
            [
                proof.b.x.c0.into_bigint().to_string(),
                proof.b.x.c1.into_bigint().to_string(),
            ],
            [
                proof.b.y.c0.into_bigint().to_string(),
                proof.b.y.c1.into_bigint().to_string(),
            ],
            [
                "1".to_string(),
                "0".to_string(),
            ],
        ],
        pi_c: [
            proof.c.x.into_bigint().to_string(),
            proof.c.y.into_bigint().to_string(),
            "1".to_string(),
        ],
        protocol: "groth16".to_string(),
        curve: "bls12_381".to_string(),
    };



    let file = File::create("proof_test.json").expect("Unable to create file");
    serde_json::to_writer_pretty(&file, &snp).expect("Unable to write JSON");
    let json = serde_json::to_string(&snp).expect("Failed to serialize proof");
    let file = File::create("proof_test.json").expect("Unable to create file");
    serde_json::to_writer_pretty(&file, &snp).expect("Unable to write JSON");
    snp
}

pub fn export_public_inputs_to_json<F: PrimeField>(
    public_inputs: &[F],
    path: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    let file = File::create(path)?;
    let mut writer = BufWriter::new(file);

    writeln!(writer, "[")?;
    for (i, value) in public_inputs.iter().enumerate() {
        let s = value.to_string();
        if i + 1 != public_inputs.len() {
            writeln!(writer, "  \"{}\",", s)?;
        } else {
            writeln!(writer, "  \"{}\"", s)?;
        }
    }
    writeln!(writer, "]")?;

    Ok(())
}

pub fn export_public_inputs_to_json_field<F: PrimeField>(
    public_inputs: &[F],
    path: &str,
)  {
    let mut map = BTreeMap::new();

    for (i, value) in public_inputs.iter().enumerate() {
        let term_index = (i / 2) + 1;
        let side = if i % 2 == 0 { "lhs" } else { "rhs" };
        let key = format!("term_{}_{}_hash", term_index, side);
        map.insert(key, value.to_string());
    }

    let json_value = json!(map);

    // let file = File::create(path);
    // let writer = BufWriter::new(file);
    // serde_json::to_writer_pretty(writer, &json_value);

    let file = File::create(path).expect("Unable to create file");
    serde_json::to_writer_pretty(&file, &json_value).expect("Unable to write JSON");
    

    
}

// pub fn export_pk_vk_binary<P: CanonicalSerialize, V: CanonicalSerialize>(
//     pk: &P,
//     vk: &V,
//     pk_path: &str,
//     vk_path: &str,
// ) -> Result<(), Box<dyn std::error::Error>> {
//     // Write Proving Key
//     let pk_file = File::create(pk_path)?;
//     let mut pk_writer = BufWriter::new(pk_file);
//     pk.serialize_uncompressed(&mut pk_writer)?;

//     // Write Verification Key
//     let vk_file = File::create(vk_path)?;
//     let mut vk_writer = BufWriter::new(vk_file);
//     vk.serialize_uncompressed(&mut vk_writer)?;

//     Ok(())
// }

// pub fn import_pk_vk_binary<P: CanonicalDeserialize, V: CanonicalDeserialize>(
//     pk_path: &str,
//     vk_path: &str,
// ) -> Result<(P, V), Box<dyn std::error::Error>> {
//     let pk_file = File::open(pk_path)?;
//     let mut pk_reader = BufReader::new(pk_file);
//     let pk = P::deserialize_unchecked(&mut pk_reader)?;

//     let vk_file = File::open(vk_path)?;
//     let mut vk_reader = BufReader::new(vk_file);
//     let vk = V::deserialize_unchecked(&mut vk_reader)?;

//     Ok((pk, vk))
// }