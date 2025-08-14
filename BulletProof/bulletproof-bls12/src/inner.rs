use ark_bls12_381::{g1::Config as G1Config, G1Projective, Fr, G1Affine};
use ark_ec::hashing::{
    curve_maps::wb::WBMap, map_to_curve_hasher::MapToCurveBasedHasher, HashToCurve,
};
use sha2::{Sha256, Digest};
use ark_ff::field_hashers::DefaultFieldHasher;
use ark_ec::AffineRepr;
use ark_ff::{One, Zero, UniformRand, Field};
use ark_ec::CurveGroup;
use std::ops::Mul;
use rand_core::RngCore;
use ark_ff::PrimeField;
use ark_serialize::CanonicalSerialize;

type HashToCurveError = Box<dyn std::error::Error>;

pub fn derive_generators(label: &str, count: usize) -> Result<Vec<G1Projective>, HashToCurveError> {
    let dst = b"BULLETPROOF_GENERATORS_BLS12381G1";
    type Hasher = MapToCurveBasedHasher<
        G1Projective,
        DefaultFieldHasher<Sha256, 128>,
        WBMap<G1Config>,
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

pub fn message_sub_one(a_l: &[Fr]) -> Vec<Fr> {
    let one_vec = vec![Fr::one(); a_l.len()];
    a_l.iter()
        .zip(one_vec.iter())
        .map(|(a_l_i, one_i)| *a_l_i - *one_i)
        .collect()
}

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
    scalar: Fr,
) -> Vec<G1Projective> {
    assert_eq!(g_vec.len(), h_vec.len(), "Vectors must have the same length");
    g_vec.iter()
        .zip(h_vec.iter())
        .map(|(&g, &h)| g.mul(scalar) + h.mul(scalar))
        .collect()
}

pub fn commit(g_vec: &[G1Projective], exponents: &[Fr]) -> G1Projective {
    assert_eq!(g_vec.len(), exponents.len(), "bases and scalars length mismatch in commit");
    let mut commitment = G1Projective::zero();
    for (g_i, a_i) in g_vec.iter().zip(exponents.iter()) {
        commitment += g_i.mul(*a_i);
    }
    commitment
}

pub fn compute_commitment_and_field(x: &Fr, g: &G1Projective, h: &G1Projective, r: &Fr) -> (G1Projective, Fr) {
    let cx_point = g.mul(x) + h.mul(r);
    let mut bytes = Vec::new();
    cx_point.into_affine().serialize_uncompressed(&mut bytes).unwrap();
    let hash = Sha256::digest(&bytes);
    let cx_fr = Fr::from_le_bytes_mod_order(&hash);
    (cx_point, cx_fr)
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
    let mut acc = G1Projective::zero();
    for (g_i, x_i) in g_vec.iter().zip(x.iter()) {
        acc += g_i.mul(*x_i);
    }
    acc + h.mul(r)
}

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
    for (g_i, v_i) in g_vec.iter().zip(v_vec) {
        acc += g_i.mul(*v_i);
    }
    for (h_i, t_i) in h_vec.iter().zip(t_vec) {
        acc += h_i.mul(*t_i);
    }
    acc
}

pub fn random_fr_vec<R: RngCore + ?Sized>(rng: &mut R, n: usize) -> Vec<Fr> {
    (0..n).map(|_| Fr::rand(rng)).collect()
}

pub fn sample_s_rho_vectors<R: RngCore + ?Sized>(rng: &mut R, n: usize) -> (Vec<Fr>, Vec<Fr>, Fr) {
    let s_l = random_fr_vec(rng, n);
    let s_r = random_fr_vec(rng, n);
    let rho = Fr::rand(rng);
    (s_l, s_r, rho)
}

pub fn inner_product<F: PrimeField>(u: &[F], v: &[F]) -> F {
    u.iter().zip(v).map(|(x, y)| *x * *y).sum()
}

pub fn ones_vec<F: PrimeField>(n: usize) -> Vec<F> {
    vec![F::ONE; n]
}

pub fn twos_vec<F: PrimeField>(n: usize) -> Vec<F> {
    let mut twos = Vec::with_capacity(n);
    let two = F::from(2u64);
    let mut acc = F::one();
    for _ in 0..n {
        twos.push(acc);
        acc *= two;
    }
    twos
}

pub fn compute_l_x<F: PrimeField>(a_l: &[F], s_l: &[F], z: F, x: F) -> Vec<F> {
    let n = a_l.len();
    let one_vec: Vec<F> = vec![F::one(); n];
    let mut result = Vec::with_capacity(n);
    for i in 0..n {
        let val = a_l[i] - (z * one_vec[i]);
        result.push(val);
    }
    for i in 0..n {
        result[i] += s_l[i] * x;
    }
    result
}

pub fn compute_l<F: PrimeField>(a_l: &[F], s_l: &[F], z: F) -> (Vec<F>, Vec<F>) {
    let n = a_l.len();
    let one_vec = vec![F::one(); n];
    let mut l0 = Vec::with_capacity(n);
    for i in 0..n {
        l0.push(a_l[i] - z * one_vec[i]);
    }
    let l1 = s_l.to_vec();
    (l0, l1)
}

pub fn compute_r_x<F: PrimeField>(a_r: &[F], s_r: &[F], y: F, z: F, x: F) -> Vec<F> {
    let n = a_r.len();
    let one_vec = ones_vec::<F>(n);
    let two_pows = twos_vec::<F>(n);
    let y_powers = y_pows::<F>(y, n);
    let z_squared = z.square();
    let mut r = Vec::with_capacity(n);
    for i in 0..n {
        let inner = a_r[i] + z * one_vec[i] + s_r[i] * x;
        let val = y_powers[i] * inner + z_squared * two_pows[i];
        r.push(val);
    }
    r
}

pub fn compute_r<F: PrimeField>(a_r: &[F], s_r: &[F], y: F, z: F) -> (Vec<F>, Vec<F>) {
    let n = a_r.len();
    let one_vec = vec![F::one(); n];
    let two_pows = twos_vec::<F>(n);
    let y_pows = y_pows::<F>(y, n);
    let z_squared = z.square();
    let mut r0 = Vec::with_capacity(n);
    let mut r1 = Vec::with_capacity(n);
    for i in 0..n {
        let r0_val = y_pows[i] * (a_r[i] + z * one_vec[i]) + z_squared * two_pows[i];
        r0.push(r0_val);
        r1.push(s_r[i] * y_pows[i]);
    }
    (r0, r1)
}

pub fn compute_t<F: PrimeField>(l0: &[F], l1: &[F], r0: &[F], r1: &[F]) -> Vec<F> {
    let t0 = inner_product(l0, r0);
    let t1 = inner_product(l0, r1) + inner_product(l1, r0);
    let t2 = inner_product(l1, r1);
    vec![t0, t1, t2]
}

pub fn y_pows<F: PrimeField>(y: F, n: usize) -> Vec<F> {
    let mut out = Vec::with_capacity(n);
    let mut cur: F = F::one();
    for _ in 0..n {
        out.push(cur);
        cur *= y;
    }
    out
}

pub fn delta<F: PrimeField>(y: F, z: F, n: usize) -> F {
    let one = F::one();
    let y_pow_n = y.pow(&[n as u64]);
    let sum_y = if y == one {
        F::from(n as u64)
    } else {
        (y_pow_n - one) / (y - one)
    };
    let two = F::from(2u64);
    let sum_two = two.pow(&[n as u64]) - one;
    let z_sq = z * z;
    let z_cu = z_sq * z;
    (z - z_sq) * sum_y - z_cu * sum_two
}

pub fn get_h_prime(h: &[G1Projective], y: Fr) -> Vec<G1Projective> {
    let y_inv = y.inverse().expect("y must be nonzero");
    let mut exp = Fr::one();
    h.iter()
        .map(|h_i| {
            let res = h_i.mul(exp);
            exp *= y_inv;
            res
        })
        .collect()
}

pub fn raise_generators_to_power(generators: &[G1Projective], scalar: Fr) -> Vec<G1Projective> {
    generators.iter().map(|g| g.mul(scalar)).collect()
}

pub fn raise_g_to_t_x(g: G1Projective, t: &[Fr], x: Fr) -> G1Projective {
    let mut result = g.mul(t[0]);
    let x_pow_1 = x;
    let term_1 = g.mul(t[1] * &x_pow_1);
    result += &term_1;
    let x_pow_2 = x * x;
    let term_2 = g.mul(t[2] * &x_pow_2);
    result += &term_2;
    result
}

pub fn hash_to_scalar(hash: &[u8]) -> Fr {
    Fr::from_le_bytes_mod_order(hash)
}

pub fn compute_s_vector(challenges: &[Fr], n: usize) -> Vec<Fr> {
    assert!(
        n.is_power_of_two(),
        "n must be a power of 2, got {}",
        n
    );
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
        let mut s_i = Fr::one();
        let bits = i;
        for j in 0..log_n {
            let bit = (bits >> j) & 1 == 1;
            let x_j = &challenges[j];
            if bit {
                s_i *= x_j;
            } else {
                s_i *= x_j.inverse().expect("Challenge must be non-zero");
            }
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

pub fn inner_prod_argument(
    g_vec: &[G1Projective],
    h_vec: &[G1Projective],
    u: &G1Projective,
    p: &G1Projective,
    a_vec: &Vec<Fr>,
    b_vec: &Vec<Fr>,
    n: usize,
    x_list: &mut Vec<Fr>,
    transcript: &mut Sha256,
) -> bool {
    if g_vec.len() != h_vec.len() || g_vec.len() != a_vec.len() || h_vec.len() != b_vec.len() || n != g_vec.len() {
        println!("❌ Vector length mismatch: g_vec.len={}, h_vec.len={}, a_vec.len={}, b_vec.len={}, n={}",
                 g_vec.len(), h_vec.len(), a_vec.len(), b_vec.len(), n);
        return false;
    }
    if !n.is_power_of_two() {
        println!("❌ n must be a power of 2, got {}", n);
        return false;
    }

    let mut g = g_vec.to_vec();
    let mut h = h_vec.to_vec();
    let mut a = a_vec.clone();
    let mut b = b_vec.clone();
    let mut p = *p;
    let mut current_n = n;

    // Initialize transcript
    let mut transcript = transcript.clone();
    transcript.update(b"innerproduct_domain");
    transcript.update(&current_n.to_le_bytes());

    while current_n != 1 {
        let mid = current_n / 2;
        let a_lo = &a[0..mid];
        let a_hi = &a[mid..];
        let b_lo = &b[0..mid];
        let b_hi = &b[mid..];
        let g_lo = &g[0..mid];
        let g_hi = &g[mid..];
        let h_lo = &h[0..mid];
        let h_hi = &h[mid..];

        let cl = inner_product(a_lo, b_hi);
        let cr = inner_product(a_hi, b_lo);
        let l = pedersen_commit_with_two_vectors(u, cl, g_hi, a_lo, h_lo, b_hi);
        let r = pedersen_commit_with_two_vectors(u, cr, g_lo, a_hi, h_hi, b_lo);

        let mut l_bytes = Vec::new();
        l.into_affine().serialize_uncompressed(&mut l_bytes).unwrap();
        transcript.update(&l_bytes);
        let mut r_bytes = Vec::new();
        r.into_affine().serialize_uncompressed(&mut r_bytes).unwrap();
        transcript.update(&r_bytes);
        let x = hash_to_scalar(&transcript.finalize());
        transcript = Sha256::new();
        transcript.update(b"innerproduct_domain");
        let mut x_bytes = Vec::new();
        x.serialize_uncompressed(&mut x_bytes).unwrap();
        transcript.update(&x_bytes);
        x_list.push(x);

        let x_inv = x.inverse().expect("x must be non-zero");
        let g_prime = (0..mid)
            .map(|i| g_lo[i].mul(x) + g_hi[i].mul(x_inv))
            .collect::<Vec<_>>();
        let h_prime = (0..mid)
            .map(|i| h_lo[i].mul(x) + h_hi[i].mul(x_inv))
            .collect::<Vec<_>>();
        let a_prime = (0..mid)
            .map(|i| a_lo[i] * x + a_hi[i] * x_inv)
            .collect::<Vec<_>>();
        let b_prime = (0..mid)
            .map(|i| b_lo[i] * x_inv + b_hi[i] * x)
            .collect::<Vec<_>>();
        p = l.mul(x) + p + r.mul(x_inv);

        g = g_prime;
        h = h_prime;
        a = a_prime;
        b = b_prime;
        current_n = mid;

        println!("IPA iteration: n={}, cl={:?}, cr={:?}, x={:?}", current_n, cl, cr, x);
    }

    let a = a[0];
    let b = b[0];
    let c = a * b;
    let rhs = g[0].mul(a) + h[0].mul(b) + u.mul(c);
    let lhs = p;
    let result = lhs == rhs;
    println!("IPA final check (n=1): a={:?}, b={:?}, c={:?}, equal={}", a, b, c, result);
    if !result {
        println!("❌ IPA final check failed");
    }
    result
}