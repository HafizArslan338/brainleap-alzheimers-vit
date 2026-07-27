import os
import pandas as pd
from sklearn.model_selection import GroupShuffleSplit

def split_dataset_by_patient(csv_path="parsed_dataset.csv"):
    print("🚀 Initializing Kashan's Patient-Isolated Split Gate...")
    
    # 1. Load the master map created by Muzammil's script
    if not os.path.exists(csv_path):
        print(f"❌ Error: Could not find '{csv_path}' in the current directory.")
        print("Please ensure you are running this from the folder containing the parsed CSV file.")
        return
        
    df = pd.read_csv(csv_path)
    print(f"📋 Loaded master file with {len(df)} image rows and {df['patient_id'].nunique()} unique patients.")
    
    # 2. First Split Phase: Separate a clean 10% patient pool for the independent Test set
    gs1 = GroupShuffleSplit(n_splits=1, test_size=0.10, random_state=42)
    train_val_idx, test_idx = next(gs1.split(df, groups=df['patient_id']))
    
    df_train_val = df.iloc[train_val_idx].reset_index(drop=True)
    df_test = df.iloc[test_idx].reset_index(drop=True)
    
    # 3. Second Split Phase: Take the remaining 90% and split 80/20 into Train / Validation
    # This translates to 72% total for training and 18% total for validation.
    gs2 = GroupShuffleSplit(n_splits=1, test_size=0.20, random_state=42)
    train_idx, val_idx = next(gs2.split(df_train_val, groups=df_train_val['patient_id']))
    
    df_train = df_train_val.iloc[train_idx].reset_index(drop=True)
    df_val = df_train_val.iloc[val_idx].reset_index(drop=True)
    
    # 4. Core Verification: Assert mathematically that no patient crosses sets (Zero Leakage)
    train_patients = set(df_train['patient_id'])
    val_patients = set(df_val['patient_id'])
    test_patients = set(df_test['patient_id'])
    
    overlap_train_val = train_patients.intersection(val_patients)
    overlap_train_test = train_patients.intersection(test_patients)
    overlap_val_test = val_patients.intersection(test_patients)
    
    if len(overlap_train_val) == 0 and len(overlap_train_test) == 0 and len(overlap_val_test) == 0:
        print("✅ Data Isolation Check Passed! Zero patient leakage detected across sets.")
    else:
        print("❌ Data Leakage Warning: Patient IDs are overlapping across splits!")
        print(f"Train-Val Overlap: {len(overlap_train_val)} | Train-Test Overlap: {len(overlap_train_test)}")
        return

    # 5. Export individual split references
    df_train.to_csv("training_indices.csv", index=False)
    df_val.to_csv("validation_indices.csv", index=False)
    df_test.to_csv("testing_indices.csv", index=False)
    
    print("\n" + "="*50)
    print("📊 KASHAN'S SPLITTER PIPELINE REPORT")
    print("="*50)
    print(f"🏋️ Training Set:   {len(df_train)} slices from {len(train_patients)} unique patients.")
    print(f"🧪 Validation Set: {len(df_val)} slices from {len(val_patients)} unique patients.")
    print(f"🏁 Testing Set:    {len(df_test)} slices from {len(test_patients)} unique patients.")
    print("="*50)
    print("🎉 Index maps exported successfully! Ready for your PyTorch training loop.")

if __name__ == "__main__":
    split_dataset_by_patient()