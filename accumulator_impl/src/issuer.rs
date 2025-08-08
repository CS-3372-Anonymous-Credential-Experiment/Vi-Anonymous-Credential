use ark_bls12_381::{G1Affine, G2Affine}
use bbs_plus::prelude::*;
use helper::*;
use acc::*;
use credential::*;
use ark_std::UniformRand;
pub struct Issuer {
    sk: SecretKey<Bls12_318>,
    pk: PublicKeyG2<Bls12_318>,
    sig_param: SignatureParamsG1::<Bls12_318>,
    // Parameter for accumulator (public)
    g1: G1Projective, // for define the alpha_0
    g2: G2Projective,
    j: G2Projective, // j = g2^sk
    // Parameter for Perdersen Commitment (public for Holder hidding the data)
    g: <Option> G1Projective,
    h: <Option> G1Projective,
    k: <Option> G1Affine,
    z: <Option> G2Affine

}

impl Issuer {
    pub fn new() -> Self {
        let (param, keypair_g2)  = generate_bbs_param_keypair();
        let g1 = G1Projective::generator();
        let g2 = G2Projective::generator();
        let j = g2 * sk;
        // Setting up the ZKP parameter
        let mut rng = ark_std::test_rng();
        let g = G1Projective::rand(&mut rng);
        let h = G1Projective::rand(&mut rng);
        let k = G1Projective::rand(&mut rng);
        let z = G1Projective::rand(&mut rng);
        {sk: keypair_g2.secret_key, pk: keypair_g2.public_key, sig_param:param,
        g1: g1, g2: g2, j: j
        g: g, h: h, k: k, z: z}
    }


    pub fn gen_witness_n_cred(&self, accummulator: &ECAccumulator, messages: Vec<Fr>) -> Credential {

        // Uniform sampling the secret values x in D = Z_p* / {sk} & the X as well
        let x = loop {
            let candidate = Fr::rand(&mut rng);
                let sum = candidate + self.sk.0;
                if !sum.0.is_zero() {
                    break candidate;
                }
        }
        let r = loop {
            let candidate = Fr::rand(&mut rng);
                let sum = candidate + self.sk.0;
                if !sum.0.is_zero() {
                    break candidate;
                }
        }
        let (cx, cx_fr) = compute_commitment_and_field(&x, &self.g, &self.h, &self.r);
        // Generating the witness
        let witness_x_t = &accumulator.gen_witness(x, self.sk);

        // Sign the X || Cx
        let mut cx_fr_bytes = Vec::new();
        cx_fr.serialize(&mut cx_fr_bytes).unwrap();
        let mut msg_and_cx = message.to_vec();
        msg_and_cx.entend_from_slice(&cx_fr_bytes); // X || cx
        let signature = sk.sign(&msg_and_cx); 

        // Return the credential contain the witness
        let credential = Credential(
            signature: signature,
            message: message,
            x_val: x,
            r: r,
            witness
        )

        return credential;

    }

    pub fn revoke_a_cred(&self, accumulator: &ECAccumulator, cred: Credential) -> Fr{
        accumulator.update_acc( cred.get_x_val(), self.sk);
        return cred.get_x_val().clone();
    }
    
    pub fn destructor() {
        sk.zeroize(); // wipe-out the values of sk when done-session from memory to prevenet key exposure
    }
}