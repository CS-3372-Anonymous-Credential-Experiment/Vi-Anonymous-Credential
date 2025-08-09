use ark_bls12_381::{Bls12_381, G1Projective, G2Projective, Fr};
use bbs_plus::prelude::*;
use crate::helper::*;
use crate::acc::*;
use crate::credential::*;
use rand::thread_rng;
use ark_std::UniformRand;
use bbs_plus::setup::SecretKey;
use ark_ec::Group;
use ark_ff::BigInteger;
use zeroize::Zeroize;


pub struct Issuer {
    sk: SecretKey<Fr>,
    pk: PublicKeyG2<Bls12_381>,
    sig_param: SignatureParamsG1::<Bls12_381>,
    // Parameter for accumulator (public)
    #[allow(dead_code)]
    g1: G1Projective, // for define the alpha_0
    g2: G2Projective,
    #[allow(dead_code)]
    j: G2Projective, // j = g2^sk
    // Parameter for Perdersen Commitment (public for Holder hidding the data)
    g: Option<G1Projective>,
    h: Option<G1Projective>,
    k: Option<G1Projective>,
    z: Option<G1Projective>,

}

impl Issuer {
    pub fn new() -> Self {
        let (param, keypair_g2)  = generate_bbs_param_keypair();
        let g1 = G1Projective::generator();
        let g2 = G2Projective::generator();
        let j = g2 * keypair_g2.secret_key.0;
        // Setting up the ZKP parameter
        let mut rng = ark_std::test_rng();
        let g = G1Projective::rand(&mut rng);
        let h = G1Projective::rand(&mut rng);
        let k = G1Projective::rand(&mut rng);
        let z = G1Projective::rand(&mut rng);
        Issuer{sk: keypair_g2.secret_key.clone(), pk: keypair_g2.public_key.clone(), sig_param:param,
        g1: g1, g2: g2, j: j,
        g: Some(g), h: Some(h), k: Some(k), z: Some(z)}
    }

    pub fn get_pk(&self) -> &PublicKeyG2<Bls12_381> {
        &self.pk
    }

    pub fn get_sig_param(&self) -> &SignatureParamsG1::<Bls12_381> {
        &self.sig_param
    }

    pub fn get_g2(&self) -> &G2Projective {
        &self.g2
    }

    pub fn get_j(&self) -> &G2Projective {
        &self.j
    }
    pub fn get_g1(&self) -> &G1Projective {
        &self.g1
    }

    pub fn get_g_h_k_z(&self) -> (&G1Projective, &G1Projective, &G1Projective, &G1Projective) {
        (
            self.g.as_ref().expect("g not set"),
            self.h.as_ref().expect("h not set"),
            self.k.as_ref().expect("k not set"),
            self.z.as_ref().expect("z not set"),
        )
    }
    
    pub fn gen_witness_n_cred(&self, accummulator: &ECAccumulator, messages: Vec<Fr>) -> Credential {

        // Uniform sampling the secret values x in D = Z_p* / {sk} & the X as well
        let mut rng = thread_rng();
        let x = loop {
            let candidate = Fr::rand(&mut rng);
                let sum = candidate + self.sk.0;
                if !sum.0.is_zero() {
                    break candidate;
                }
        };
        
        let r = loop {
            let candidate = Fr::rand(&mut rng);
                let sum = candidate + self.sk.0;
                if !sum.0.is_zero() {
                    break candidate;
                }
        };

        let (_cx, cx_fr) = compute_commitment_and_field(
            &x,
            self.g.as_ref().expect("g not set"),
            self.h.as_ref().expect("h not set"),
            &r
        );
        // Generating the witness
        let witness_x_t = &accummulator.gen_witness(&x, &self.sk);

        // Sign the X || Cx
        let mut msg_and_cx = messages.clone();
        let mut rng = thread_rng();
        msg_and_cx.push(cx_fr); // X || cx
        let signature = SignatureG1::new(
            &mut rng,
            &msg_and_cx,       // your Vec<Fr>
            &self.sk,          // &SecretKey<Fr>
            &self.sig_param,    // &SignatureParamsG1<Bls12_381>
            
        ).expect("failed to sign");

        // Return the credential contain the witness
        let credential = Credential::new(
            signature,
            messages,
            x,
            r,
            *witness_x_t
        );

        return credential;

    }

    pub fn revoke_a_cred(&self, accumulator: &mut ECAccumulator, cred: &Credential) -> Fr{
        accumulator.update_acc(cred.get_x_val(), &self.sk);
        return cred.get_x_val().clone();
    }
    
    pub fn destructor(&mut self) {
        self.sk.zeroize(); // wipe-out the values of sk when done-session from memory to prevenet key exposure
    }
}