use bulletproofs_bls12::inner::*;
use ark_bls12_381::{G1Projective, Fr};
use ark_ff::UniformRand;
use ark_ec::{Group, CurveGroup};
use rand::rngs::StdRng;
use rand::SeedableRng;
use std::ops::Mul;
use ark_ff::{Zero};


pub fn linear_size_range_proof() {
    // This bullet proof is proving the number 13 in range [0, 2^64 -1]
    // But this is not working with the logarithmic size reduction - only for purely linear increment in the size
    // of the data: aL, aR
    // Reference: (Bünz et al., 2017).
    let mut rng = StdRng::seed_from_u64(42u64);


    // Prover Side
    let v: u64 = 13; // the secret need to hide
    let n = 64; // the bit size
    let ones = ones_vec::<Fr>(n);  // vector of 1's of length n
    // Select the h, g, h_vec, g_vec (the generator for pedersent commitment)
    let h = G1Projective::generator().mul(Fr::rand(&mut rng));
    let g = G1Projective::generator().mul(Fr::rand(&mut rng));
    let label_g = "bullet-proof-g";
    let label_h = "bullet-proof-h";
    let g_vec = derive_generators(label_g, n).unwrap();
    let h_vec = derive_generators(label_h, n).unwrap();
    let gamma = Fr::rand(&mut rng);
    let alpha = Fr::rand(&mut rng);

    // Encode the secret to binary pieces
    let al = encoding_message_to_vector(v.into(), n); // bits vector
    let ar = message_sub_one(&al);               // aR = aL - 1^n
    let (s_l, s_r, rho) = sample_s_rho_vectors(&mut rng, n); // Compute the binding parameter
    let A = pedersen_commit_with_two_vectors(&h, alpha, &g_vec, &al, &h_vec, &ar);
    let S = pedersen_commit_with_two_vectors(&h, rho, &g_vec, &s_l, &h_vec, &s_r);
    let (V_cx, V_fr) = compute_commitment_and_field(&Fr::from(v), &g, &h, &gamma);
    
    
    // Verifier Challenges Sending (if t_0_poly = v * z^2  + delta(y, z))
    let mut z;
    loop {
        z = Fr::rand(&mut rng);
        if !z.is_zero() {
            break;
        }
    }
    
    let mut y;
    loop {
        y = Fr::rand(&mut rng);
        if !y.is_zero() {
            break;
        }
    }

    let phi_1 = Fr::rand(&mut rng);
    let phi_2 = Fr::rand(&mut rng);
    let l_poly = compute_l::<Fr>(&al, &s_l, z);
    let r_poly = compute_r::<Fr>(&ar, &s_r, y, z);
    let t_poly = compute_t::<Fr>(&l_poly.0, &l_poly.1, &r_poly.0, &r_poly.1); // [t0, t1,t2]

    let _T1 = g.mul(t_poly[1]) + h.mul(phi_1);
    let _T2 = g.mul(t_poly[2]) + h.mul(phi_2);


    // Verifer send back x:
    let mut x;
    loop {
        x = Fr::rand(&mut rng);
        if !x.is_zero() {
            break;
        }
    }

    // Prover compute l, r, t, phi_x, mu as challenge response
    
    let lx = compute_l_x(&al, &s_l,z,x);
    let rx = compute_r_x(&ar, &s_r,y, z,x);
    let t_hat = inner_product(&lx, &rx);
    let _phi_x = phi_2 * x* x + phi_1 * x + z * z * gamma;
    let mu = alpha + rho * x;

    // Verifier Check The Prover Response
    let h_prime = get_h_prime(&h_vec, y);

    // check that t^ = t(x) = t0 + t1 * x + t2 * x^2
    // g^(t^) = g^( t0 + t1 * x + t2 * x^2)
    // g^t0 * g^(t1 *x)  * g^(t2 * x^2)

    let _g_pow_t_hat = raise_g_to_t_x(g, &t_poly,x );
    let _h_pow_phi_x = h.mul(_phi_x);

    let lhs = _g_pow_t_hat + _h_pow_phi_x ; // g^(t^) * h^(phi_x)
    // println!("{:?}", g_t_h_phi_x);
    let delta = delta(y,z, n);
    let rhs = V_cx.mul(z * z) + g.mul(delta) + _T1.mul(x) + _T2.mul(x * x);

    // println!("{:?}",lhs);
    // println!("{:?}",rhs);
    println!("Are equal? {}", lhs == rhs);// if lhs = lamb * rhs -> equal
    
   
    let minus_z = vec![-z; n];
    // Multiply y_power vector elements by scalar z
    let y_power = y_pows::<Fr>(y, n);
    let y_power_scaled: Vec<Fr> = y_power.iter().map(|yi| *yi * z).collect();

    // Multiply twos_vec vector elements by scalar z*z
    let z_squared = z * z;
    let twos_scaled: Vec<Fr> = twos_vec::<Fr>(n).iter().map(|ti| *ti * z_squared).collect();

    // Now add two vectors element-wise
    let exp_y_z_square: Vec<Fr> = y_power_scaled.iter()
        .zip(twos_scaled.iter())
        .map(|(a, b)| *a + *b)
        .collect();

    
    let g_pow_minus_z = commit(&g_vec, &minus_z);
    let h_pow_exp_y_z_sqrt = commit(&h_prime, &exp_y_z_square);
    let lhs_p = A + S.mul(x) + g_pow_minus_z + h_pow_exp_y_z_sqrt;

    // check if l, r is correct (from the values)
    
    let rhs_p = h.mul(mu) + commit(&g_vec, &lx) + commit(&h_prime, &rx);
    println!("is equal {:?}", rhs_p == lhs_p);

    // Check if t^ is correct (by measure the t_poly (constant before x) vs dot-product (after know x))
    let rhs_t = inner_product(&lx, &rx);
    let t_x_computed = t_poly[0] + t_poly[1] * x + t_poly[2] * x * x;

    let lhs_t = t_x_computed;
    println!("If equals {:?}", rhs_t == lhs_t);



    // term = aL - 1^n - aR, element-wise
    // let _term: Vec<Fr> = al.iter()
    //     .zip(ones.iter())
    //     .zip(ar.iter())
    //     .map(|((&a_l_i, &one_i), &a_r_i)| a_l_i - one_i - a_r_i)
    //     .collect();

    // let z_one_vec = vec![z; n];
    // let z_square : Vec<Fr> = z_one_vec.iter()
        // .zip(z_one_vec.iter())
        // .map(|(&z_ones, &z_ones_2)| z_ones * z_ones_2)
        // .collect();
    // println!("{:?}",z_square );

    // let z_square_v : Vec<Fr> = z_square.iter()
        // .map(|&z_ones| z_ones * Fr::from(v))
        // .collect();
    // println!("{:?}",z_square_v );

    // let delta = delta::<Fr>(y, z, n);
    // let _z_square_v_delta : Vec<Fr> = z_square_v.iter()
        // .map(|&z_ones| z_ones + delta)
        // .collect();

    // println!("{:?}", z_square_v_delta); == t_poly[0]
    // println!("{:?}", t_poly[0]);
    // let y_power = y_pows::<Fr>(y, n);
    

    
}


fn main() {
    let h = G1Projective::generator().mul(Fr::rand(&mut rng));
    let g = G1Projective::generator().mul(Fr::rand(&mut rng));
    let label_g = "bullet-proof-g";
    let label_h = "bullet-proof-h";
    let g_vec = derive_generators(label_g, n).unwrap();
    let h_vec = derive_generators(label_h, n).unwrap();

    // the bullet-proof of log-size is the enhancement of linear_size_range_proof (send less data + more ZKP)
    // for the logic check section 4.2 in the paper
    
}   