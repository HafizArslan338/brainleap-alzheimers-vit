import os
import re
import cv2
import pandas as pd

def parse_oasis_folders(base_data_dir="./data"):
    class_mapping = {
        "Non Demented": 0,
        "Very mild Dementia": 1,
        "Mild Dementia": 2,
        "Moderate Dementia": 3
    }
    
    # Matches OAS1_XXXX
    regex_pattern = r'(OAS1_\d{4})'
    
    records = []
    rejected_count = 0
    
    print("🚀 [Muzammil] Scanning dataset folders & running Quality Assurance...")
    for folder_name, label in class_mapping.items():
        folder_path = os.path.join(base_data_dir, folder_name)
        
        if not os.path.exists(folder_path):
            print(f"⚠️ Warning: Folder '{folder_name}' not found at {folder_path}.")
            continue
            
        files = [f for f in os.listdir(folder_path) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        print(f"-> Inspecting {len(files)} slices in folder: {folder_name}")
        
        for filename in files:
            match = re.search(regex_pattern, filename)
            if match:
                patient_id = match.group(1).upper()
                full_image_path = os.path.join(folder_path, filename)
                
                # --- WEEK 3 UPGRADE: OpenCV Blur & Quality Filter ---
                img = cv2.imread(full_image_path, cv2.IMREAD_GRAYSCALE)
                if img is not None:
                    blur_score = cv2.Laplacian(img, cv2.CV_64F).var()
                    if blur_score < 30.0:  # Threshold for heavy blur
                        rejected_count += 1
                        continue
                
                records.append({
                    "image_path": full_image_path,
                    "patient_id": patient_id,
                    "label": label
                })
                
    df = pd.DataFrame(records)
    
    if not df.empty:
        df.to_csv("parsed_dataset.csv", index=False)
        print(f"\n✅ [Phase 1 Complete] Parsed {len(df)} clean image slices successfully!")
        print(f"🗑️ Rejected {rejected_count} low-quality/blurry slices.")
        print(f"💾 Master file saved to: {os.path.abspath('parsed_dataset.csv')}")
    else:
        print("\n❌ Error: No images parsed. Check your dataset folder locations.")

if __name__ == "__main__":
    parse_oasis_folders("./data")