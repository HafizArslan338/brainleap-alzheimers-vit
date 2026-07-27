import os
import re
import pandas as pd

def parse_oasis_directory(data_dir="./data", output_csv="./artifacts/parsed_dataset.csv"):
    """
    Muzammil's Task: Deterministic Regex Data Integrity Engine
    Scans dataset directories and maps slice paths to unique patient IDs.
    """
    os.makedirs(os.path.dirname(output_csv), exist_ok=True)
    
    class_mapping = {
        "Non-Demented": 0,
        "Very-Mild": 1,
        "Mild": 2,
        "Moderate": 3
    }
    
    # Regex to capture OASIS-1 patient identifier (e.g., OASIS1_0001)
    patient_regex = re.compile(r'(OASIS1_\d{4})')
    records = []

    print("[Muzammil] Scanning raw OASIS directories...")
    for class_name, label in class_mapping.items():
        folder_path = os.path.join(data_dir, class_name)
        if not os.path.exists(folder_path):
            print(f"[Warning] Folder missing: {folder_path}. Skipping.")
            continue
            
        for fname in os.listdir(folder_path):
            if fname.lower().endswith(('.jpg', '.png', '.jpeg')):
                match = patient_regex.search(fname)
                if match:
                    patient_id = match.group(1)
                    records.append({
                        "image_path": os.path.join(folder_path, fname),
                        "patient_id": patient_id,
                        "label": label,
                        "class_name": class_name
                    })

    df = pd.DataFrame(records)
    if df.empty:
        raise ValueError("No images found! Verify folder structure in './data'.")

    df.to_csv(output_csv, index=False)
    print(f"[Muzammil] Done. Parsed {len(df)} slices from {df['patient_id'].nunique()} unique patients.")
    return df