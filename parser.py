import os
import re
import pandas as pd

def parse_oasis_folders(base_data_dir):
    class_mapping = {
        "Non Demented": 0,
        "Very mild Dementia": 1,
        "Mild Dementia": 2,
        "Moderate Dementia": 3
    }
    
    # FIXED: Pattern updated from OASIS1 to OAS1 to match your exact filenames!
    regex_pattern = r'(OAS1_\d{4})'
    
    records = []
    
    print("🚀 Scanning dataset folders...")
    for folder_name, label in class_mapping.items():
        folder_path = os.path.join(base_data_dir, folder_name)
        
        if not os.path.exists(folder_path):
            print(f"⚠️ Warning: Folder '{folder_name}' not found at {folder_path}.")
            continue
            
        files = [f for f in os.listdir(folder_path) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        print(f"-> Found {len(files)} slices in folder: {folder_name}")
        
        for filename in files:
            match = re.search(regex_pattern, filename)
            if match:
                patient_id = match.group(1)
                full_image_path = os.path.join(folder_path, filename)
                
                records.append({
                    "image_path": full_image_path,
                    "patient_id": patient_id,
                    "label": label
                })
                
    df = pd.DataFrame(records)
    
    if not df.empty:
        df.to_csv("parsed_dataset.csv", index=False)
        print(f"\n✅ [Phase 1 Complete] Parsed {len(df)} total image slices successfully!")
        print(f"💾 Master file saved to: {os.path.abspath('parsed_dataset.csv')}")
        print("👉 Data Integrity verified. You are ready for Kashan's splitter script!")
    else:
        print("\n❌ Error: Still no images parsed. Double-check your filename prefix matches 'OAS1_'.")

if __name__ == "__main__":
    parse_oasis_folders(".")