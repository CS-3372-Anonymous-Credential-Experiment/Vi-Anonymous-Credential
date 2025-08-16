#!/bin/bash
set -e

# === CONFIG ===
CIRCUIT="BindHash"
N_FR=20
CHUNK=10
INPUT_JSON="input.json"
PTAU="powersOfTau28_hez_final_10.ptau"

# Output directories
BUILD_DIR="build"

echo "=== Step 1: Compile circuit ==="
circom ${CIRCUIT}.circom --r1cs --wasm --sym -o ${BUILD_DIR}

echo "=== Step 2: Generate witness ==="
node ${BUILD_DIR}/${CIRCUIT}_js/generate_witness.js \
    ${BUILD_DIR}/${CIRCUIT}.wasm \
    ${INPUT_JSON} \
    ${BUILD_DIR}/witness.wtns

echo "=== Step 3: Setup trusted setup (Groth16) ==="
snarkjs groth16 setup ${BUILD_DIR}/${CIRCUIT}.r1cs ${PTAU} ${BUILD_DIR}/circuit_0000.zkey

# Optional: contribute randomness
# snarkjs zkey contribute ${BUILD_DIR}/circuit_0000.zkey ${BUILD_DIR}/circuit_final.zkey --name="My contribution"
# For now, just copy 0000.zkey to final
cp ${BUILD_DIR}/circuit_0000.zkey ${BUILD_DIR}/circuit_final.zkey

echo "=== Step 4: Export verification key ==="
snarkjs zkey export verificationkey ${BUILD_DIR}/circuit_final.zkey ${BUILD_DIR}/verification_key.json

echo "=== Step 5: Generate proof ==="
snarkjs groth16 prove ${BUILD_DIR}/circuit_final.zkey ${BUILD_DIR}/witness.wtns \
    ${BUILD_DIR}/proof.json ${BUILD_DIR}/public.json

echo "=== Step 6: Verify proof ==="
snarkjs groth16 verify ${BUILD_DIR}/verification_key.json ${BUILD_DIR}/public.json ${BUILD_DIR}/proof.json

echo "=== Done ==="