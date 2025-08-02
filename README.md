
# Vi-Anonymous-Credential

This project implements a prototype of an anonymous credential issuance system using a bilinear pairing-based accumulator, designed to support an allow-list mechanism for revoking credentials and preventing misuse.

The accumulator logic is currently being updated based on the model proposed by Flamini et al. (2025).
👉 Read the paper here [https://eprint.iacr.org/2025/549.pdf]

⸻

## 🔧 Project Components

### 🧩 Accumulator  
Represents the core bilinear pairing-based accumulator structure.  
Includes logic for initializing, updating, and testing accumulator behavior via a simple `main` function.

### 📜 Credential  
Defines a credential that includes:  
- A BBS+ signature over a list of attribute values (messages).  
- The issuer's public key.  
This object models the credential held by the user.

### 🔐 Commitment  
Implements Pedersen-style commitments to hide sensitive message values.  
Used during zero-knowledge proof generation to ensure privacy.

### 🧾 Witness  
Contains the data a credential holder maintains to prove non-revocation:  
- A private scalar `x`  
- A Pedersen commitment `c_x`  
- A trapdoor witness `w_x_t`  
- The credential's BBS+ signature  

⸻

🚧 In Progress
	•	Integration of the ZKP generation algorithm for the holder to prove validity and non-revocation of their credential.

⸻
