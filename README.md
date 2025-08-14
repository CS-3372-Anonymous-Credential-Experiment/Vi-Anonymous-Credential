
# Vi-Anonymous-Credential

This project implements a prototype of an anonymous credential issuance system using a bilinear pairing-based accumulator, designed to support an allow-list mechanism for revoking credentials and preventing misuse.

The accumulator logic is currently being updated based on the model proposed by Flamini et al. (2025).
👉 Read the paper here [https://eprint.iacr.org/2025/549.pdf]
The bulletproof (linear-size scaling) was follow the idea of (Bünz et al., 2017)
👉 Read the paper here [https://eprint.iacr.org/2017/1066.pdf]
The idea of Anonymous Credential System was follow the idea of (Muth et al., 2023)
👉 Read the paper here [https://eprint.iacr.org/2022/492.pdf]

We aim at the credential revocation problem by using 2 approach - using the Membership test by proving secret witness doesn't belong to self-reconstruct merkel-tree from holder's bases on issuer's provided data; another approach was using ZK-SNARK to prove holder's credential not contain within the accumulator (by using the idea of Flamini with some hashing as the mapping from Bls12-381 eliptic-curve to BN-256 curves's point - for smart-contract adaptability)

For proving holder's attribute, we aiming leverage the idea of linear-size scaling bulletproof (in the future ones can using the log-size scaling bulletproof) to enhance the credential's proving issurance.

With Issuer - we imply the trust between the Issuer & Holder's credential (acceptance some linkability risk), but no more trust imply can be enforce within this setting - This would be suitable to the centralization setting as Government Credential Issurance, e-ID 

⸻

## 🔧 Project Components


### 🧩 Accumulator Implementation (accumulator_impl)
Represents the core bilinear pairing-based accumulator structure.  
Includes logic for initializing, updating, and testing accumulator behavior via a simple `main` function.
Include the Holder, Issuer, some objects relate to credential-issurance
Using BBS+ signature scheme & Pedersent system for the messeage hidding

### ZK-SNARK memebership accumulator testing (snark_mem_acc) 
Implement the ZK-SNARK in ZKP-prove generation (the process of prove generate was off-chain - follow by Flamini <2025>) , but to adapt on-chain enviroment,
modification as Hahsing the BLS12-381 cryptographic object was implement by using Poseident hashing and SHA-256 bit-mapping to BN-256 was uses to adapt to 
current environemt & support library


### BulletProof (BulletProof/bulletproof-bls12 - In-Progress)
Using the Bulletproof (with linear-scaling proof size) for generating ZKP-Challenge to Prover

### Some other up-comming update: 
- Adding the Merkel Hashing Tree as another implementation for Revocation Problem
- On-chain EVM deployment of the Credential Verification
