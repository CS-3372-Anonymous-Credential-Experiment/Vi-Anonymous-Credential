use ark_bls12_381::{g1::Config as G1Config, G1Projective, Fr, G1Affine};
use ark_ec::hashing::{
    curve_maps::wb::WBMap, map_to_curve_hasher::MapToCurveBasedHasher, HashToCurve,
};
// use ark_ff::PrimeField;
use sha2::Sha256;
use ark_ff::field_hashers::DefaultFieldHasher;
use ark_ec::AffineRepr;
use ark_ff::{One, Zero, UniformRand};
use ark_ec::CurveGroup;
use std::ops::Mul;
use rand_core::RngCore;   // trait bound for RNGs
use ark_ff::PrimeField;
use ark_serialize::CanonicalSerialize;
use sha2::Digest;
use ark_ff::Field;
use rand::rngs::StdRng;
use rand::SeedableRng;
/// Error type for your function (customize if you have a different error type)
type HashToCurveError = Box<dyn std::error::Error>;

pub fn derive_generators(label: &str, count: usize) -> Result<Vec<G1Projective>, HashToCurveError> {
    // Domain separation tag (DST)
    let dst = b"BULLETPROOF_GENERATORS_BLS12381G1";

    // Hasher: (base field, WBMap) + SHA256
    type Hasher = MapToCurveBasedHasher<
        G1Projective, // The Curve Group target
        DefaultFieldHasher<Sha256, 128>,   // H2F: hash to field
        WBMap<G1Config>,            // M2C: Map to Curve
    >;

    let hasher = Hasher::new(dst)?;

    let mut gens = Vec::with_capacity(count);
    for i in 0..count {
        let input = format!("{}||{}", label, i);
        let pt = hasher.hash(input.as_bytes())?;
        gens.push(pt.into_group());
    }

    Ok(gens)
}

pub fn encoding_message_to_vector(v: u128, n: usize) -> Vec<Fr> {
    let mut bits = Vec::with_capacity(n);
    for i in 0..n {
        let bit = ((v >> i) & 1) as u64;
        bits.push(Fr::from(bit));
    }
    bits
}

/// Subtract 1 (field element) from each element of the vector a_l, inside the field.
/// Returns a vector a_r = a_l - 1^n (all ones vector).
pub fn message_sub_one(a_l: &[Fr]) -> Vec<Fr> {
    let one_vec = vec![Fr::one(); a_l.len()];
    a_l.iter()
        .zip(one_vec.iter())
        .map(|(a_l_i, one_i)| *a_l_i - *one_i)
        .collect()
}

/// Hadamard product of two vectors inside the field: element-wise multiplication.
pub fn hadamard_prod(a: &[Fr], b: &[Fr]) -> Vec<Fr> {
    a.iter()
        .zip(b.iter())
        .map(|(x, y)| *x * *y)
        .collect()
}

pub fn scale_vector_by_scalar(a_vec: &[Fr], x: Fr) -> Vec<Fr> {
    a_vec.iter().map(|&a_val| a_val * x).collect()
}

pub fn vector_addition(a_vec: &[Fr], b_vec: &[Fr]) -> Vec<Fr> {
    assert_eq!(
        a_vec.len(),
        b_vec.len(),
        "Vector lengths must be equal for element-wise addition"
    );
    a_vec.iter().zip(b_vec.iter()).map(|(&a_val, &b_val)| a_val + b_val).collect()
}

pub fn hadamard_product_of_generators(
    g_vec: &[G1Projective],
    h_vec: &[G1Projective],
    scalar: Fr, // Optional scalar to scale each pair
) -> Vec<G1Projective> {
    assert_eq!(g_vec.len(), h_vec.len(), "Vectors must have the same length");

    g_vec.iter()
        .zip(h_vec.iter())
        .map(|(&g, &h)| g.mul(scalar) + h.mul(scalar)) // Element-wise scaled addition
        .collect()
}

/* Naive Pedersen vector commitment:
  Com(x; r) = h^r * \prod_i g_i^{x_i}

    - `g_vec`: generator bases g_i (length n)
    - `x`: scalar vector x_i (length n)
    - `h`: blinding base
    - `r`: blinding scalar

    Returns a `G1Projective` (projective point).
*/


/// Compute commitment C = ∏ g_i^{a_i}
/// - `generators`: slice of curve points g_i (G1Projective for example)
/// - `exponents`: slice of scalars a_i (Fr for example)
/// Returns: group element commitment C
pub fn commit(g_vec: &[G1Projective], exponents: &[Fr]) -> G1Projective {
    assert_eq!(g_vec.len(), exponents.len(), "bases and scalars length mismatch in pedersen_vector_commit");

    let mut commitment = G1Projective::zero(); // Now this should work

    for (g_i, a_i) in g_vec.iter().zip(exponents.iter()) {
        commitment += g_i.mul(*a_i);
    }

    commitment
}

// Basic Pedersent Commitment g^v * h^gamma (gamma random)
pub fn compute_commitment_and_field(x: &Fr, g: &G1Projective, h: &G1Projective, r: &Fr) -> (G1Projective, Fr) {
    // let mut rng = OsRng;
    // let r = Fr::rand(&mut rng);                 // blinding
    let cx_point = g.mul(x) + h.mul(r);        // Pedersen commitment in G1

    // Serialize the group point (to bytes) and hash to field
    let mut bytes = Vec::new();
    cx_point.into_affine().serialize_uncompressed(&mut bytes).unwrap(); // byte array (needs ark-serialize trait)
    let hash = Sha256::digest(&bytes);
    let cx_fr = Fr::from_le_bytes_mod_order(&hash);

    (cx_point, cx_fr) // send cx_fr for verification
}

pub fn pedersen_vector_commit(
    g_vec: &[G1Projective],
    x: &[Fr],
    h: &G1Projective,
    r: Fr,
) -> G1Projective {
    assert_eq!(
        g_vec.len(),
        x.len(),
        "bases and scalars length mismatch in pedersen_vector_commit"
    );

    // Accumulate sum_i g_i^{x_i}
    // Note: using naive loop. Replace with optimized MSM for speed in production.
    let mut acc = G1Projective::zero();
    for (g_i, x_i) in g_vec.iter().zip(x.iter()) {
        // scalar multiplication: g_i * x_i
        acc += g_i.mul(x_i);
    }

    // Add the blinding term h^r
    acc + h.mul(r)
}

/// Convenience variant: return affine point (useful for serialization/storage)
pub fn pedersen_vector_commit_affine(
    g_vec: &[G1Projective],
    x: &[Fr],
    h: &G1Projective,
    r: Fr,
) -> G1Affine {
    let proj = pedersen_vector_commit(g_vec, x, h, r);
    proj.into_affine()
}

/// Compute C = h^a * g_v^v * h_v^t  (in EC additive notation)
pub fn pedersen_commit_with_two_vectors(
    h: &G1Projective,
    a: Fr,
    g_vec: &[G1Projective],
    v_vec: &[Fr],
    h_vec: &[G1Projective],
    t_vec: &[Fr],
) -> G1Projective {
    assert_eq!(g_vec.len(), v_vec.len());
    assert_eq!(h_vec.len(), t_vec.len());
    assert_eq!(g_vec.len(), h_vec.len());

    let mut acc = h.mul(a);

    // add g_i * v_i
    for (g_i, v_i) in g_vec.iter().zip(v_vec) {
        acc += g_i.mul(*v_i);
    }

    // add h_i * t_i
    for (h_i, t_i) in h_vec.iter().zip(t_vec) {
        acc += h_i.mul(*t_i);
    }

    acc
}

/// Sample a vector of `n` random Fr elements using the provided RNG.
/// Generic over any RNG implementing RngCore so you can use StdRng or OsRng.
pub fn random_fr_vec<R: RngCore + ?Sized>(rng: &mut R, n: usize) -> Vec<Fr> {
    (0..n).map(|_| Fr::rand(rng)).collect()
}

/// Sample sL, sR vectors (length n) and rho scalar.
/// - Uses the provided RNG. For production use `OsRng`.
/// - Returns (sL, sR, rho) <Blinding Factors>
pub fn sample_s_rho_vectors<R: RngCore + ?Sized>(rng: &mut R, n: usize) -> (Vec<Fr>, Vec<Fr>, Fr) {
    let s_l = random_fr_vec(rng, n);
    let s_r = random_fr_vec(rng, n);
    let rho = Fr::rand(rng);
    (s_l, s_r, rho)
}

// Inner product <u, v>
pub fn inner_product<F: PrimeField>(u: &[F], v: &[F]) -> F {
    u.iter().zip(v).map(|(x, y)| *x * *y).sum()
}

// Helper: produce vector of ones [1,...,1]
pub fn ones_vec<F: PrimeField>(n: usize) -> Vec<F> {
    vec![F::ONE; n]
}

// Helper: produce vector of powers of two
pub fn twos_vec<F: PrimeField>(n: usize) -> Vec<F> {
    let mut twos = Vec::with_capacity(n);
    let two = F::from(2u64);
    let mut acc = F::one();
    for _ in 0..n {
        twos.push(acc);
        acc *= two;  // multiply by 2 each iteration, no overflow
    }
    twos
}


// Compute l(X) = (aL - z * 1^n) + sL * X
pub fn compute_l_x<F: PrimeField>(
    a_l: &[F],
    s_l: &[F],
    z: F,
    x: F, ) -> Vec<F> {
    let n = a_l.len();
    
    // Create vector of ones
    let one_vec: Vec<F> = vec![F::one(); n];
    
    // Compute (a_L - z * 1^n)
    let mut result = Vec::with_capacity(n);
    for i in 0..n {
        let val = a_l[i] - (z * one_vec[i]);
        result.push(val);
    }
    
    // Add s_L * x
    for i in 0..n {
        result[i] += s_l[i] * x;
    }
    
    result
}

// Compute l(X) = (aL - z * 1^n) + sL * X (but not invole x)
pub fn compute_l<F: PrimeField>(
    a_l: &[F],
    s_l: &[F],
    z: F,) -> (Vec<F>, Vec<F>) {
    let n = a_l.len();
    let one_vec = vec![F::one(); n];

    let mut l0 = Vec::with_capacity(n);
    for i in 0..n {
        l0.push(a_l[i] - z * one_vec[i]);
    }

    let l1 = s_l.to_vec(); // s_L directly is coefficient of X

    (l0, l1)
}

// Compute r(X) = y^n ∘ (aR + z*1^n + sR * X) + z^2 * 2^n
pub fn compute_r_x<F: PrimeField>(
    a_r: &[F],
    s_r: &[F],
    y: F,
    z: F,
    x: F, )      // <-- the scalar X here
    -> Vec<F> {
    let n = a_r.len();
    let one_vec = ones_vec::<F>(n);
    let two_pows = twos_vec::<F>(n);
    let y_powers = y_pows::<F>(y, n);
    let z_squared = z.square();

    let mut r = Vec::with_capacity(n);

    for i in 0..n {
        // compute inner term: aR[i] + z*1 + sR[i]*x
        let inner = a_r[i] + z * one_vec[i] + s_r[i] * x;

        // apply y^i and add z^2 * 2^i
        let val = y_powers[i] * inner + z_squared * two_pows[i];
        r.push(val);
    }

    r
}
// Compute r(X) = y^n ∘ (aR + z*1^n + sR * X) + z^2 * 2^n (with out using x)

pub fn compute_r<F: PrimeField>(
    a_r: &[F],
    s_r: &[F],
    y: F,
    z: F,) -> (Vec<F>, Vec<F>) {
    let n = a_r.len();
    let one_vec = vec![F::one(); n];
    let two_pows = twos_vec::<F>(n);
    let y_pows = y_pows::<F>(y, n);
    let z_squared = z.square();

    let mut r0 = Vec::with_capacity(n);
    let mut r1 = Vec::with_capacity(n);

    for i in 0..n {
        // r0 = y^i * (aR[i] + z*1) + z^2 * 2^i
        let r0_val = y_pows[i] * (a_r[i] + z * one_vec[i]) + z_squared * two_pows[i];
        r0.push(r0_val);
        // r1 = sR[i] * y^i
        r1.push(s_r[i] * y_pows[i]);
    }

    (r0, r1)
}

// Compute t(X) = <l(X), r(X)> => t0, t1, t2
pub fn compute_t<F: PrimeField>(
    l0: &[F], l1: &[F],
    r0: &[F], r1: &[F] ) -> Vec<F> {
    let t0 = inner_product(l0, r0);
    let t1 = inner_product(l0, r1) + inner_product(l1, r0);
    let t2 = inner_product(l1, r1);

    vec![t0, t1, t2]
}

/// Convert a vector of bits (u8 or i8 where values are 0 or 1) into Vec<Fr>.
/// Accepts any slice of integers convertible to u8.
/// Example: bits = vec![1u8, 0, 1, 1] -> returns Vec<Fr> with Fr::from(1), Fr::from(0), ...
pub fn bits_to_fr_vec<B: Into<u8> + Copy>(bits: &[B]) -> Vec<Fr> {
    bits.iter().map(|&b| Fr::from(b.into() as u64)).collect()
}

/*
    Verifier Logic - pick random challenge of y^n (vector) 
    and z (the challenge Scalar)
*/

/// Return vector [1, y, y^2, ..., y^{n-1}]
pub fn y_pows<F: PrimeField>(y: F, n: usize) -> Vec<F> {
    let mut out = Vec::with_capacity(n);
    let mut cur: F = F::one(); // cur must be type F explicitly

    for _ in 0..n {
        out.push(cur);
        cur *= y; // multiply two F's, no conflict now
    }

    out
}

/// Compute geometric sum: sum_{i=0}^{n-1} base^i
pub fn geom_sum(base: Fr, n: usize) -> Fr {
    if n == 0 {
        return Fr::zero();
    }
    // Simple loop (safe for cryptographic fields; n is small like <= 256)
    let mut sum = Fr::zero();
    let mut cur = Fr::one();
    for _ in 0..n {
        sum += cur;
        cur *= base;
    }
    sum
}

// δ for single value (one range proof)
// δ(y,z) = (z - z^2) * <1^n, y^n> - z^3 * <1^n, 2^n> = k in Z_p (p = 128)
// For proving a Single product identity
pub fn delta<F: PrimeField>(y: F, z: F, n: usize) -> F {
    let one = F::one();
    
    // Compute sum of powers y^i for i in 0..n (geometric series)
    let y_pow_n = y.pow(&[n as u64]);
    let sum_y = if y == one {
        F::from(n as u64)
    } else {
        (y_pow_n - one) / (y - one)
    };
    
    // sum of powers of two: 2^n - 1
    let two = F::from(2u64);
    let sum_two = two.pow(&[n as u64]) - one;
    
    // delta = (z - z^2) * sum_y - z^3 * sum_two
    let z_sq = z * z;
    let z_cu = z_sq * z;
    
    (z - z_sq) * sum_y - z_cu * sum_two
}


pub fn get_h_prime(
    h: &[G1Projective],
    y: Fr,
) -> Vec<G1Projective> {
    let y_inv = y.inverse().expect("y must be nonzero");
    let mut exp = Fr::one();

    h.iter()
     .map(|h_i| {
         let res = h_i.mul(exp);
         exp *= y_inv;  // exp = exp * y_inv = y^{-i} for next i
         res
     })
     .collect()
}


// Helper method to raise a vector of generators to a scalar power
pub fn raise_generators_to_power(generators: &[G1Projective], scalar: Fr) -> Vec<G1Projective> {
    generators.iter().map(|g| g.mul(scalar)).collect()
}

pub fn raise_g_to_t_x(
    g: G1Projective,
    t: &[Fr],  // coefficients for BLS12-381 scalar field
    x: Fr,
) -> G1Projective {
    let mut result = g.mul(t[0]);

    let x_pow_1 = x;
    let term_1 = g.mul(t[1] * &x_pow_1);
    result += &term_1;

    let x_pow_2 = x * x;
    let term_2 = g.mul(t[2] * &x_pow_2);
    result += &term_2;

    result
}

pub fn inner_prod_argument(
        g_vec : &[G1Projective],
        h_vec : &[G1Projective],
        u: &G1Projective,
        P: &G1Projective,
        a_vec : &Vec<Fr>,
        b_vec : &Vec<Fr>,
        current_n: usize, // Changed from Fr to usize for current size
        x_list : &mut Vec<Fr>,
        original_n: usize,      // Added to track original size
        // s_list = &Vec<Fr>
    ) -> bool {
        if g_vec.len() != h_vec.len() {
            return false;
        }
        if current_n == 1 {
            // P send V a, b
            // V compute c = a * b
            // c = a * b;
            // compute g from g_vec, s_list
            // compute h from h_vec, s_list
            // check if P = g^a * h^b * u^(a *b)
            let s_list = compute_s_vector(&x_list, original_n);
            let s_list_inv = inverse_the_vector(&s_list);
            let a = a_vec[0];
            let b = b_vec[0];
            // V compute a, b
            let c = a * b;

            // Compute g' = \prod g_i^{s_i}
            let mut g = G1Affine::identity().into_group(); // identity point
            for i in 0..g_vec.len() { // Start from 0 to include all elements
                let cur_g = g_vec[i].mul(s_list[i]); // Multiply g_i by s_i (raise to the power)
                g = g + cur_g; // Accumulate the product
            }

            let mut h = G1Affine::identity().into_group(); // identity point
            for i in 0..h_vec.len() { // Start from 0 to include all elements
                let cur_h = h_vec[i].mul(s_list_inv[i]); // Multiply h_i by 1/ s_i (raise to the power)
                h = h + cur_h; // Accumulate the product
            }
            
            let rhs = g.mul(a) + h.mul(b) + u.mul(c);
            let lhs = P;
            return rhs == *lhs

        }
        else {
            let mid = current_n / 2 ;
            let a_lo = a_vec[0..mid].to_vec();
            let a_hi = a_vec[mid..].to_vec();
            let b_lo = b_vec[0..mid].to_vec();
            let b_hi = b_vec[mid..].to_vec();

            let g_lo = g_vec[0..mid].to_vec();
            let g_hi = g_vec[mid..].to_vec();
            let h_lo = h_vec[0..mid].to_vec();
            let h_hi = h_vec[mid..].to_vec();

            let cl = inner_product(&a_lo, &b_hi);
            let cr = inner_product(&a_hi, &b_lo);

            let L = pedersen_commit_with_two_vectors(&u, cl, &g_hi, &a_lo, &h_lo, &b_hi);
            let R = pedersen_commit_with_two_vectors(&u, cr, &g_lo, &a_hi, &h_hi, &b_lo);

            // P send to V: L, R

            // V send to P: x in Z_p /{0}
            let mut rng = StdRng::seed_from_u64(42u64);
            let mut x;
            loop {
                x = Fr::rand(&mut rng);
                if !x.is_zero() {
                    break;
                }
            }
            x_list.push(x);

            // P_ip & V_ip compute
            let x_inv = x.inverse().expect("x must be non-zero");
            let g_prime_term_1 = raise_generators_to_power(&g_hi,x_inv);
            let g_prime_term_2 = raise_generators_to_power(&g_lo,x);
            let g_prime = hadamard_product_of_generators(&g_prime_term_1, &g_prime_term_2, Fr::from(1u64));

            let h_prime_term_1 = raise_generators_to_power(&h_lo,x);
            let h_prime_term_2 = raise_generators_to_power(&h_hi,x_inv);
            let h_prime = hadamard_product_of_generators(&h_prime_term_1, &h_prime_term_2, Fr::from(1u64));

            let x_square = x * x;
            let P_prime = L.mul(x_square) + P + R.mul(x_square.inverse().expect("x-square must be non-zero"));

            // P_ip compute and update the a' and b'
            let a_prime_term_1 = scale_vector_by_scalar(&a_lo, x);
            let a_prime_term_2 = scale_vector_by_scalar(&a_hi, x_inv);
            let a_prime = vector_addition(&a_prime_term_1, &a_prime_term_2);

            let b_prime_term_1 = scale_vector_by_scalar(&b_lo, x_inv);
            let b_prime_term_2 = scale_vector_by_scalar(&b_hi, x);
            let b_prime = vector_addition(&b_prime_term_1, &b_prime_term_2);

            inner_prod_argument(
                &g_prime,
                &h_prime,
                u,
                &P_prime,
                &a_prime,
                &b_prime,
                mid ,
                x_list,
                original_n,
            )

        }   
}


/// Computes the vector s = (s₁, ..., sₙ) based on challenges x₁, ..., x₍log₂(n)₎.
///
    /// # Arguments
    /// * `challenges` - A vector of Fr elements representing the challenges x₁, ..., x₍log₂(n)₎.
    /// * `n` - The length of the output vector s (must be a power of 2).
    ///
    /// # Panics
    /// Panics if `n` is not a power of 2 or if the number of challenges is not log₂(n).
    ///
    /// # Returns
    /// A vector of Fr elements representing sᵢ = ∏_{j=1}^{log₂(n)} x_j^{b(i,j)},
    /// where b(i,j) = 1 if the j-th bit of i-1 is 1, and -1 otherwise.
    ///
    /// # Example
    /// ```
    /// let challenges = vec![Fr::from(2), Fr::from(3)]; // log₂(4) = 2 challenges
    /// let s = compute_s_vector(&challenges, 4);
    /// // s[0] = 2^(-1) * 3^(-1) = 1/6 (for i=1, i-1=0, all bits 0)
    /// // s[1] = 2^1 * 3^(-1) = 2/3 (for i=2, i-1=1, first bit 1)
/// ```
pub fn compute_s_vector(challenges: &[Fr], n: usize) -> Vec<Fr> {
    // Check that n is a power of 2
    assert!(
        n.is_power_of_two(),
        "n must be a power of 2, got {}",
        n
    );
    // Check that the number of challenges matches log₂(n)
    let log_n = n.trailing_zeros() as usize;
    assert_eq!(
        challenges.len(),
        log_n,
        "Number of challenges must be log₂(n) = {}, got {}",
        log_n,
        challenges.len()
    );

    let mut s = Vec::with_capacity(n);
    for i in 0..n {
        let mut s_i = Fr::one(); // Initialize s_i as 1
        let mut bits = i; // i-1 in 0-based indexing, bits of i-1

        // Compute s_i = ∏ x_j^{b(i,j)}
        for j in 0..log_n {
            let bit = (bits & 1) == 1; // Check j-th bit of i-1
            let x_j = &challenges[j];
            if bit {
                s_i *= x_j; // x_j ^ 1
            } else {
                s_i *= x_j.inverse().unwrap(); // x_j ^ -1
            }
            bits >>= 1; // Shift to next bit
        }
        s.push(s_i);
    }
    s
}

pub fn inverse_the_vector(original_vec: &[Fr]) -> Vec<Fr> {
    original_vec
        .iter()
        .map(|&x| x.inverse().expect("Cannot invert zero element"))
        .collect()
}