import os
import numpy as np
import pandas as pd
from sklearn.model_selection import StratifiedGroupKFold

def split_dataset_by_patient(csv_path="parsed_dataset.csv"):
    print("🚀 [Kashan] Initializing Stratified Patient-Isolated Split Gate...")
    
    if not os.path.exists(csv_path):
        print(f"❌ Error: Could not find '{csv_path}' in the current directory.")
        return
        
    df = pd.read_csv(csv_path)
    print(f"📋 Loaded master file with {len(df)} image rows and {df['patient_id'].nunique()} unique patients.")
    
    # --- WEEK 3 UPGRADE: Stratified Group Isolation ---
    # 5 Folds: Fold 0 = Test (20%), Fold 1 = Val (20%), Folds 2-4 = Train (60%)
    sgkf = StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=42)
    
    X = df['image_path'].values
    y = df['label'].values
    groups = df['patient_id'].values
    
    folds = list(sgkf.split(X, y, groups=groups))
    
    test_idx = folds[0][1]
    val_idx = folds[1][1]
    train_idx = np.hstack([folds[2][1], folds[3][1], folds[4][1]])
    
    df_train = df.iloc[train_idx].reset_index(drop=True)
    df_val = df.iloc[val_idx].reset_index(drop=True)
    df_test = df.iloc[test_idx].reset_index(drop=True)
    
    # 4. Core Verification (Zero Leakage Check)
    train_patients = set(df_train['patient_id'])
    val_patients = set(df_val['patient_id'])
    test_patients = set(df_test['patient_id'])
    
    if train_patients.isdisjoint(val_patients) and train_patients.isdisjoint(test_patients):
        print("✅ Stratified Isolation Check Passed! Zero patient leakage detected.")
    else:
        print("❌ Data Leakage Warning: Patient IDs are overlapping across splits!")
        return

    # 5. Export individual split references
    df_train.to_csv("training_indices.csv", index=False)
    df_val.to_csv("validation_indices.csv", index=False)
    df_test.to_csv("testing_indices.csv", index=False)
    
    print("\n" + "="*50)
    print("📊 KASHAN'S SPLITTER PIPELINE REPORT")
    print("="*50)
    print(f"🏋️ Training Set:   {len(df_train)} slices ({len(train_patients)} unique patients)")
    print(f"🧪 Validation Set: {len(df_val)} slices ({len(val_patients)} unique patients)")
    print(f"🏁 Testing Set:    {len(df_test)} slices ({len(test_patients)} unique patients)")
    print("="*50)

if __name__ == "__main__":
    split_dataset_by_patient()