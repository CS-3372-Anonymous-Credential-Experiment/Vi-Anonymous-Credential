# Vi-Anonymous-Credential

This project implements a prototype of an anonymous credential issuance system using a bilinear pairing-based accumulator, designed to support an allow-list mechanism for revoking credentials and preventing misuse.

- The accumulator logic is currently being updated based on the model proposed by Flamini et al. (2025)  
  - 👉 Read the paper here: [https://eprint.iacr.org/2025/549.pdf]

- The bulletproof (linear-size scaling) follows the idea of Bünz et al. (2017)  
  - 👉 Read the paper here: [https://eprint.iacr.org/2017/1066.pdf]

- The idea of the Anonymous Credential System follows Muth et al. (2023)  
  - 👉 Read the paper here: [https://eprint.iacr.org/2022/492.pdf]

We aim at the credential revocation problem by using two approaches:  

1. Using the **Membership test** by proving a secret witness doesn’t belong to a self-reconstructed Merkle tree from the holder's data based on issuer-provided data.  
2. Using **ZK-SNARK** to prove that a holder's credential is not contained within the accumulator (following Flamini et al., 2025), with some hashing mapping from BLS12-381 elliptic-curve points to BN-256 curve points for smart-contract adaptability.

For proving holder attributes, we aim to leverage the **linear-size scaling Bulletproof** (in the future, log-size scaling Bulletproof could be used) to enhance credential issuance proof efficiency.

Regarding the **Issuer**:  
We imply trust between the Issuer and Holder's credential (accepting some linkability risk), but no further trust is enforced in this setting. This setup is suitable for centralized credential issuance, such as government-issued credentials or e-ID.

---

## 🔧 Project Components

### 🧩 Accumulator Implementation (`accumulator_impl`)
- Represents the core bilinear pairing-based accumulator structure.  
- Includes logic for initializing, updating, and testing accumulator behavior via a simple `main` function.  
- Includes Holder, Issuer, and objects related to credential issuance.  
- Uses **BBS+ signature scheme** & **Pedersen commitments** for message hiding.

### ZK-SNARK Membership Accumulator Testing (`snark_mem_acc`)
- Implements ZK-SNARK proof generation (off-chain), following Flamini et al., 2025.  
- Adapts to on-chain environment by hashing BLS12-381 objects using Poseidon and SHA-256 mapping to BN-256 curve points.  
- Supports current environment & library compatibility.

### BulletProof (`BulletProof/bulletproof-bls12` - In Progress)
- Uses Bulletproof (linear-scaling proof size) for generating ZKP challenges to the prover.

### Upcoming Updates
- Adding the **Merkle Hashing Tree** as another approach for the revocation problem.  
- On-chain EVM deployment of the credential verification process.
