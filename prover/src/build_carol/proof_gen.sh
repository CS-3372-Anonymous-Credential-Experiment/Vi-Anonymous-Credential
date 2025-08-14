#!/bin/bash
set -e

# ============================
# Configuration
# ============================
CIRCUIT_NAME="CarolCircuit"
BUILD_DIR="build_carol"
PTAU_FILE="pot14_0000.ptau"
PTAU_FINAL="pot14_final.ptau"
ZKEY_FILE="${CIRCUIT_NAME}_0000.zkey"
ZKEY_FINAL="${CIRCUIT_NAME}_final.zkey"
VERIFIER_SOL="${CIRCUIT_NAME}Verifier.sol"
PUBLIC_JSON="public.json"
WITNESS_WTNS="witness.wtns"
PROOF_JSON="proof.json"

mkdir -p $BUILD_DIR

# ============================
# 1️⃣ Compile the circuit
# ============================
echo ">> Compiling circuit..."
circom ${CIRCUIT_NAME}.circom --r1cs --wasm --sym -o $BUILD_DIR

# ============================
# 2️⃣ Setup Powers of Tau
# ============================
if [ ! -f $PTAU_FILE ]; then
    echo ">> Downloading initial Powers of Tau..."
    snarkjs powersoftau new bn128 14 $PTAU_FILE -v
fi

echo ">> Contributing to the Powers of Tau ceremony..."
snarkjs powersoftau contribute $PTAU_FILE ${PTAU_FILE} -v --name="First contribution"

# Optional: verify tau file
snarkjs powersoftau verify $PTAU_FILE

# ============================
# 3️⃣ Generate ZKey (proving + verifying keys)
# ============================
echo ">> Generating initial zkey..."
snarkjs groth16 setup $BUILD_DIR/${CIRCUIT_NAME}.r1cs $PTAU_FILE $ZKEY_FILE

echo ">> Contributing to zkey..."
snarkjs zkey contribute $ZKEY_FILE $ZKEY_FINAL --name="First contribution" -v

echo ">> Export verification key..."
snarkjs zkey export verificationkey $ZKEY_FINAL $BUILD_DIR/${CIRCUIT_NAME}_verification_key.json

# ============================
# 4️⃣ Generate witness (user should provide public inputs JSON)
# ============================
echo ">> Generating witness (requires public input JSON)..."
node $BUILD_DIR/generate_witness.js $BUILD_DIR/${CIRCUIT_NAME}.wasm $PUBLIC_JSON $BUILD_DIR/$WITNESS_WTNS

# ============================
# 5️⃣ Generate proof & public inputs
# ============================
echo ">> Generating Groth16 proof..."
snarkjs groth16 prove $ZKEY_FINAL $BUILD_DIR/$WITNESS_WTNS $BUILD_DIR/$PROOF_JSON $BUILD_DIR/$PUBLIC_JSON

# ============================
# 6️⃣ Verify proof locally
# ============================
echo ">> Verifying proof..."
snarkjs groth16 verify $BUILD_DIR/${CIRCUIT_NAME}_verification_key.json $BUILD_DIR/$PUBLIC_JSON $BUILD_DIR/$PROOF_JSON

# ============================
# 7️⃣ Export Solidity verifier
# ============================
echo ">> Exporting Solidity verifier..."
snarkjs zkey export solidityverifier $ZKEY_FINAL $BUILD_DIR/$VERIFIER_SOL

echo "✅ All done! Files in $BUILD_DIR/"