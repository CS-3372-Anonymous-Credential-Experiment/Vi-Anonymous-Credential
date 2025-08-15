
---

### Example: Deriving Generators

```rust
let label = "bulletproof-test";
let count = 5;

// Run twice with the same label
let gens1 = derive_generators(label, count).unwrap();
let gens2 = derive_generators(label, count).unwrap();

// They should match exactly
println!("{:?} {}", gens1 == gens2, "Generators equal for same label!");

// Now change the label
let gens_diff = derive_generators("different-label", count).unwrap();

// At least one generator should be different
println!("{:?} {:?}", gens1 != gens_diff, "Generators should differ for different label!");
```

---

### Example: Encoding Message and Hadamard Product

```rust
let v: u128 = 13; // example
let aL = encoding_message_to_vector(v, 128); // bits vector
let aR = message_sub_one(&aL);               // aR = aL - 1^n
let hadamard_result = hadamard_prod(&aL, &aR);

println!("aL (first 8 bits): {:?}", &aL[..8]);
println!("aR (first 8 bits): {:?}", &aR[..8]);
println!("Hadamard check (first 8): {:?}", &hadamard_result[..8]);
```

---

### Example: Pedersen Vector Commitment

```rust
// Deterministic RNG for reproducibility
let mut rng = StdRng::seed_from_u64(42u64);
let n = 8usize;

// Random generator bases for testing
let mut g_vec = Vec::with_capacity(n);
for _ in 0..n {
    let s = Fr::rand(&mut rng);
    let base = G1Projective::generator().mul(s);
    g_vec.push(base);
}

// Blinding base h
let h = G1Projective::generator().mul(Fr::rand(&mut rng));

// Random message scalars
let x: Vec<Fr> = (0..n).map(|_| Fr::rand(&mut rng)).collect();

// Blinding scalar
let r = Fr::rand(&mut rng);

// Compute commitment
let C = pedersen_vector_commit(&g_vec, &x, &h, r);

println!("Pedersen vector commitment: {:?}", C);
```

---

### Example: Sampling sL and sR Vectors

```rust
pub fn example_use() {
    // Deterministic for tests
    let mut test_rng = StdRng::seed_from_u64(42u64);
    let n = 128usize;

    let (s_l, s_r, rho) = sample_s_vectors(&mut test_rng, n);
    println!("sampled sL length = {}, sR length = {}, rho = {:?}", s_l.len(), s_r.len(), rho);

    // Convert bits to Fr (example small)
    let bits_u8: Vec<u8> = vec![1, 0, 1, 1];
    let aL_fr = bits_to_fr_vec(&bits_u8); // Vec<Fr>

    // Production: use cryptographic RNG
    let mut os_rng = OsRng;
    let (s_l_prod, s_r_prod, rho_prod) = sample_s_vectors(&mut os_rng, n);
    // use s_l_prod, s_r_prod, rho_prod in prover blinding
}
```

---

### Example: Commitment with Two Vectors (h^α · G^a\_L · H^a\_R)

```rust
// Define h and alpha
let h = G1Projective::generator().mul(Fr::rand(&mut rng));
let a = Fr::rand(&mut rng);

// Define g_vec and a_L
let secret: u128 = 23; 
let count = 128;
let a_L = encoding_message_to_vector(secret, count);      // bits vector
let a_R = message_sub_one(&a_L);                          // aR = aL - 1^n 

let label_g = "bullet-proof-g";
let label_h = "bullet-proof-h";

let g_vec = derive_generators(label_g, count).unwrap();
let h_vec = derive_generators(label_h, count).unwrap();

// Scalars as field elements
let a_L_fr: Vec<Fr> = a_L.iter().map(|&bit| Fr::from(bit as u64)).collect();
let a_R_fr: Vec<Fr> = a_R.iter().map(|&bit| Fr::from(bit as u64)).collect();

let commitment = pedersen_commit_with_two_vectors(
    &h,             // single base for blinding
    a,              // scalar for h
    &g_vec,         // vector of G1Projective generators for a_L
    &a_L_fr,        // vector of Fr scalars
    &h_vec,         // vector of G1Projective generators for a_R
    &a_R_fr,        // vector of Fr scalars
);

println!("Commitment: {:?}", commitment);
```

---

