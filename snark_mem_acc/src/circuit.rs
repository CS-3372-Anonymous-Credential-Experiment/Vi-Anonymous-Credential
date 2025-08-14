use ark_relations::r1cs::{ConstraintSynthesizer, ConstraintSystemRef, SynthesisError, Variable};
use ark_relations::r1cs::ConstraintSystem;
use ark_ff::Field;
use ark_std::marker::PhantomData; 
use ark_snark::CircuitSpecificSetupSNARK;
use ark_snark::SNARK;
use ark_relations::r1cs::LinearCombination;
use ark_relations::r1cs::ConstraintLayer;
use ark_bls12_381::{Bls12_381, G1Projective, G2Projective, Fr};
use ark_r1cs_std::fields::fp::FpVar;
// Define your circuit struct
use ark_r1cs_std::{
    alloc::{AllocVar, AllocationMode},
    eq::EqGadget,
    R1CSVar,
};
use ark_sponge::{
    poseidon::{PoseidonSponge, PoseidonConfig},
    CryptographicSponge,
};

use ark_std::vec::Vec;

#[derive(Clone)]
pub struct CubeCircuit<F: Field> {
    pub x: Option<F>,
    pub y: Option<F>,
}

impl<F: Field + Clone> ConstraintSynthesizer<F> for CubeCircuit<F> {

    fn generate_constraints(self, cs: ConstraintSystemRef<F>) -> Result<(), SynthesisError> {
        // Allocate x
        let x_var = cs.new_witness_variable(|| self.x.ok_or(SynthesisError::AssignmentMissing))?;
        // println!("The values of x_var {:?}", x_var);

        // Allocate y
        let y_var = cs.new_input_variable(|| self.y.ok_or(SynthesisError::AssignmentMissing))?;
        // println!("The values of _var {:?}", y_var);
        // Compute x^2 value here
        let x_val = self.x.ok_or(SynthesisError::AssignmentMissing)?;
        let x_squared_val = x_val * x_val;

        // Allocate x_squared
        let x_squared = cs.new_witness_variable(|| Ok(x_squared_val))?;

        // Enforce x * x = x_squared
        cs.enforce_constraint(
            LinearCombination::new() + x_var,
            LinearCombination::new() + x_var,
            LinearCombination::new() + x_squared,
        )?;

    

        // Compute x_cubed value based on x_squared_val
        let x_cubed_val = x_squared_val * x_val;

        // Allocate x_cubed
        let x_cubed = cs.new_witness_variable(|| Ok(x_cubed_val))?;

        // Enforce x_squared * x = x_cubed
        cs.enforce_constraint(
            LinearCombination::new() + x_squared,
            LinearCombination::new() + x_var,
            LinearCombination::new() + x_cubed,
        )?;

        let five = F::from(5u64);
        // Enforce x_cubed + x + 5 = y
        let result = cs.enforce_constraint(
            LinearCombination::new() + x_cubed + x_var + (five, Variable::One),
            LinearCombination::new() + Variable::One,                           // b = 1
        LinearCombination::new() + y_var,                                  // c
        );

        result
}

}





