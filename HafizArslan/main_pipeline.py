import sys
import os

# Import Week 3 modules from src folder
from src.parser import parse_oasis_folders
from src.splitter import split_dataset_by_patient
from src.trainer import execute_vit_pipeline

def run_master_pipeline():
    print("==================================================================")
    print(" BRAINLEAP WEEK 3: PATIENT-ISOLATED VISION TRANSFORMER PIPELINE ")
    print("==================================================================")
    
    # Phase 1: Muzammil (Quality Assurance & Parser)
    print("\n--- PHASE 1: MUZAMMIL'S QA PARSER ---")
    parse_oasis_folders(base_data_dir="./data")

    # Phase 2: Kashan (Stratified Patient Group Split Gate)
    print("\n--- PHASE 2: KASHAN'S STRATIFIED ISOLATION GATE ---")
    split_dataset_by_patient(csv_path="parsed_dataset.csv")

    # Phase 3: Arslan (Fine-Tuning ViT Engine)
    print("\n--- PHASE 3: ARSLAN'S ViT FINE-TUNING ENGINE ---")
    execute_vit_pipeline()

    print("\n[SUCCESS] Master Pipeline Complete!")

if __name__ == "__main__":
    run_master_pipeline()