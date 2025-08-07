#[cfg(test)]
mod tests {
    use bls12_381::{G1Projective, Scalar};
    use ff::Field;
    use group::Group;
    use rand::thread_rng;

    use accumulator_impl::acc::ECAccumulator;
    use accumulator_impl::zkp::{commit, gen_zkp, verify_zkp, ZKProof};

    #[test]
    fn test_accumulator_operations() {
        let mut rng = thread_rng();
        let acc = ECAccumulator::setup();

        // Generate a witness for an element x
        let x = Scalar::random(&mut rng);
        let witness = acc.gen_witness(x);

        // Verify the witness
        assert!(acc.verify_witness(x, witness), "Witness verification failed");

        // Verify invalid witness fails
        let invalid_witness = G1Projective::random(&mut rng);
        assert!(
            !acc.verify_witness(x, invalid_witness),
            "Invalid witness should not verify"
        );

        // Perform deletion
        let (new_alpha, delta) = acc.del(x);

        // Update the witness for another element y
        let y = Scalar::random(&mut rng);
        let old_witness_y = acc.gen_witness(y);
        let mut updated_acc = acc;
        updated_acc.alpha = new_alpha;
        let new_witness_y = updated_acc.update_witness(old_witness_y, y, delta, new_alpha);

        // Verify the updated witness
        assert!(
            updated_acc.verify_witness(y, new_witness_y),
            "Updated witness verification failed"
        );
    }

    #[test]
    fn test_zkp_generation_and_verification() {
        let mut rng = thread_rng();
        let acc = ECAccumulator::setup();

        // Generate a witness for an element x
        let x = Scalar::random(&mut rng);
        let l = Scalar::random(&mut rng); // Random blinding factor for Pedersen commitment
        let witness = acc.gen_witness(x);

        // Generate ZKP
        let (commitment, proof) = gen_zkp(
            &acc.g,
            &acc.h,
            &acc.k,
            &acc.z,
            &acc.g2,
            &acc.j,
            &acc.alpha,
            &acc.e_z_g2,
            &acc.e_z_j,
            x,
            l,
            &witness,
        );

        // Verify ZKP
        assert!(
            verify_zkp(
                &acc.g,
                &acc.h,
                &acc.k,
                &acc.z,
                &acc.g2,
                &acc.j,
                &acc.alpha,
                &acc.e_z_g2,
                &acc.e_z_j,
                &commitment,
                &proof
            ),
            "ZKP verification failed"
        );

        // Test invalid proof (tampered s_x)
        let tampered_proof = ZKProof {
            c: proof.c,
            s_x: Scalar::random(&mut rng), // Tamper s_x
            s_l: proof.s_l,
            s_sigma: proof.s_sigma,
            s_rho: proof.s_rho,
            s_xsigma: proof.s_xsigma,
            s_xrho: proof.s_xrho,
            c_w: proof.c_w,
            c_sigma: proof.c_sigma,
            c_rho: proof.c_rho,
        };

        assert!(
            !verify_zkp(
                &acc.g,
                &acc.h,
                &acc.k,
                &acc.z,
                &acc.g2,
                &acc.j,
                &acc.alpha,
                &acc.e_z_g2,
                &acc.e_z_j,
                &commitment,
                &tampered_proof
            ),
            "Tampered proof should not verify"
        );

        // Test invalid commitment
        let invalid_commitment = commit(&acc.g, &acc.h, Scalar::random(&mut rng), l);
        assert!(
            !verify_zkp(
                &acc.g,
                &acc.h,
                &acc.k,
                &acc.z,
                &acc.g2,
                &acc.j,
                &acc.alpha,
                &acc.e_z_g2,
                &acc.e_z_j,
                &invalid_commitment,
                &proof
            ),
            "Invalid commitment should not verify"
        );
    }

    #[test]
    fn test_zkp_with_deleted_element() {
        let mut rng = thread_rng();
        let acc = ECAccumulator::setup();

        // Generate a witness for an element x
        let x = Scalar::random(&mut rng);
        let l = Scalar::random(&mut rng);
        let witness = acc.gen_witness(x);

        // Generate ZKP before deletion
        let (commitment, proof) = gen_zkp(
            &acc.g,
            &acc.h,
            &acc.k,
            &acc.z,
            &acc.g2,
            &acc.j,
            &acc.alpha,
            &acc.e_z_g2,
            &acc.e_z_j,
            x,
            l,
            &witness,
        );
        assert!(
            verify_zkp(
                &acc.g,
                &acc.h,
                &acc.k,
                &acc.z,
                &acc.g2,
                &acc.j,
                &acc.alpha,
                &acc.e_z_g2,
                &acc.e_z_j,
                &commitment,
                &proof
            ),
            "ZKP verification before deletion failed"
        );

        // Delete x and update accumulator
        let (new_alpha, delta) = acc.del(x);
        let mut updated_acc = acc;
        updated_acc.alpha = new_alpha;

        // Generate a new witness for another element y
        let y = Scalar::random(&mut rng);
        let old_witness_y = updated_acc.gen_witness(y);
        let new_witness_y = updated_acc.update_witness(old_witness_y, y, delta, new_alpha);
        let new_l = Scalar::random(&mut rng);
        let (new_commitment, new_proof) = gen_zkp(
            &updated_acc.g,
            &updated_acc.h,
            &updated_acc.k,
            &updated_acc.z,
            &updated_acc.g2,
            &updated_acc.j,
            &updated_acc.alpha,
            &updated_acc.e_z_g2,
            &updated_acc.e_z_j,
            y,
            new_l,
            &new_witness_y,
        );

        // Verify ZKP for y with updated accumulator
        assert!(
            verify_zkp(
                &updated_acc.g,
                &updated_acc.h,
                &updated_acc.k,
                &updated_acc.z,
                &updated_acc.g2,
                &updated_acc.j,
                &updated_acc.alpha,
                &updated_acc.e_z_g2,
                &updated_acc.e_z_j,
                &new_commitment,
                &new_proof
            ),
            "ZKP verification after deletion failed"
        );

        // Attempt to verify old proof with updated accumulator (should fail)
        assert!(
            !verify_zkp(
                &updated_acc.g,
                &updated_acc.h,
                &updated_acc.k,
                &updated_acc.z,
                &updated_acc.g2,
                &updated_acc.j,
                &updated_acc.alpha,
                &updated_acc.e_z_g2,
                &updated_acc.e_z_j,
                &commitment,
                &proof
            ),
            "Old proof should not verify after deletion"
        );
    }
}