
# Vi-Anonymous-Credential

This project implements a prototype of an anonymous credential issuance system using a bilinear pairing-based accumulator, designed to support an allow-list mechanism for revoking credentials and preventing misuse.

The accumulator logic is currently being updated based on the model proposed by Flamini et al. (2025).
👉 Read the paper here [https://eprint.iacr.org/2025/549.pdf]

⸻

🔧 Project Components
	•	Accumulator
Represents the pairing-based accumulator structure. Includes a simple main function for testing and demonstration purposes.
	•	Credential
Defines a credential object, which includes a BBS+ signature over a list of attribute values (messages) issued by the issuer.
	•	Commitment
Implements the logic for hiding sensitive information using the Pedersen commitment scheme.
	•	Witness
Holds the values that a user (holder) retains and uses to generate zero-knowledge proofs (ZKPs) of valid credential ownership and revocation status.

⸻

🚧 In Progress
	•	Integration of the ZKP generation algorithm for the holder to prove validity and non-revocation of their credential.

⸻
