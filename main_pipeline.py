import sys
from src.parser import parse_oasis_directory
from src.splitter import execute_stratified_patient_split
from src.trainer import train_week3_vit

def run_master_pipeline():
    print("==================================================================")
    print(" BRAINLEAP WEEK 3: PATIENT-ISOLATED VISION TRANSFORMER PIPELINE ")
    print("==================================================================")
    
    # Phase 1: Muzammil
    print("\n--- PHASE 1: MUZAMMIL'S PARSER ---")
    parse_oasis_directory(data_dir="./data", output_csv="./artifacts/parsed_dataset.csv")

    # Phase 2: Kashan
    print("\n--- PHASE 2: KASHAN'S STRATIFIED ISOLATION GATE ---")
    execute_stratified_patient_split(parsed_csv="./artifacts/parsed_dataset.csv", artifact_dir="./artifacts")

    # Phase 3: Arslan
    print("\n--- PHASE 3: ARSLAN'S ADVANCED ViT TRAINING ENGINE ---")
    train_week3_vit(epochs=5, batch_size=32, lr=1e-4)

    print("\n[SUCCESS] Master Pipeline Complete! Handover ready for Ali's API layer.")

if __name__ == "__main__":
    run_master_pipeline()