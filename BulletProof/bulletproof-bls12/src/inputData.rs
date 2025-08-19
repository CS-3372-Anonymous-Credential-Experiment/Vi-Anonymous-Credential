use serde::Serialize;
#[derive(Serialize)]
/*
This is the data structure for compacting a list of String which 
represent the BN-254 field element in its decimal string format
*/
pub struct InputData {
    pub fr_elements: Vec<String>, // Store as decimal strings
}

