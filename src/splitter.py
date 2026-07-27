import pandas as pd
import numpy as np
from sklearn.model_selection import StratifiedGroupKFold

def execute_stratified_patient_split(parsed_csv="./artifacts/parsed_dataset.csv", artifact_dir="./artifacts"):
    """
    Kashan's Task: Stratified Group Isolation Gate
    Guarantees 0% patient leakage while balancing disease stages across splits.
    """
    df = pd.read_csv(parsed_csv)
    
    # Target distribution: ~70% Train, ~15% Val, ~15% Test
    # Using 7-fold StratifiedGroupKFold gives ~14.2% per fold
    sgkf = StratifiedGroupKFold(n_splits=7, shuffle=True, random_state=42)
    
    # Obtain group arrays
    groups = df['patient_id'].values
    X = df['image_path'].values
    y = df['label'].values
    
    folds = list(sgkf.split(X, y, groups=groups))
    
    # Assign Fold 0 as Test (~14.3%), Fold 1 as Val (~14.3%), Remaining Folds (2-6) as Train (~71.4%)
    test_idx = folds[0][1]
    val_idx = folds[1][1]
    train_idx = np.hstack([folds[i][1] for i in range(2, 7)])
    
    train_df = df.iloc[train_idx].reset_index(drop=True)
    val_df = df.iloc[val_idx].reset_index(drop=True)
    test_df = df.iloc[test_idx].reset_index(drop=True)

    # Save artifacts
    train_df.to_csv(f"{artifact_dir}/train_split.csv", index=False)
    val_df.to_csv(f"{artifact_dir}/val_split.csv", index=False)
    test_df.to_csv(f"{artifact_dir}/test_split.csv", index=False)

    # --- ZERO LEAKAGE AUDIT ---
    train_p = set(train_df['patient_id'])
    val_p = set(val_df['patient_id'])
    test_p = set(test_df['patient_id'])

    assert train_p.isdisjoint(val_p), "CRITICAL ERROR: Leakage between Train and Val!"
    assert train_p.isdisjoint(test_p), "CRITICAL ERROR: Leakage between Train and Test!"
    assert val_p.isdisjoint(test_p), "CRITICAL ERROR: Leakage between Val and Test!"

    print("[Kashan] Patient Isolation Audit Passed (0.0% Contamination).")
    print(f"[Kashan] Splitting Summary -> Train: {len(train_df)} slices | Val: {len(val_df)} slices | Test: {len(test_df)} slices")