import os
import pandas as pd
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
from torchvision.models import vit_b_16, ViT_B_16_Weights
from PIL import Image

# =====================================================================
# 1. HARDWARE WORKSTATION ROUTING
# =====================================================================
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print("="*60)
print(f"🚀 ENGINE TARGET DEVICE: {DEVICE}")
if torch.cuda.is_available():
    print(f"⚡ Hardware Accelerated Core: {torch.cuda.get_device_name(0)}")
print("="*60)

# =====================================================================
# 2. IN-MEMORY SAFE DATASET ENGINGE (PROTECTS ORIGINAL SCAN FILES)
# =====================================================================
class AlzheimerSafeDataset(Dataset):
    def __init__(self, csv_file, transform=None):
        self.data_frame = pd.read_csv(csv_file)
        self.transform = transform

    def __len__(self):
        return len(self.data_frame)

    def __getitem__(self, idx):
        img_path = self.data_frame.iloc[idx, 0]
        label = int(self.data_frame.iloc[idx, 2])
        
        # Safe Mode: Open a completely isolated copy of the image into RAM memory.
        # This keeps your original file safely untouched on disk.
        with Image.open(img_path) as raw_img:
            image_copy = raw_img.copy().convert('RGB') # Grayscale expanded to 3-channel RGB for ViT compatibility
            
        if self.transform:
            image_copy = self.transform(image_copy)
            
        return image_copy, label

# =====================================================================
# 3. CLASS IMBALANCE SOLUTION: THE WEIGHTED FOCAL LOSS CORE
# =====================================================================
class WeightedFocalLoss(nn.Module):
    def __init__(self, alpha, gamma=2.0):
        super(WeightedFocalLoss, self).__init__()
        self.alpha = alpha.to(DEVICE) # Inverse frequency multipliers
        self.gamma = gamma            # Focusing scale factor

    def forward(self, inputs, targets):
        log_softmax = F.log_softmax(inputs, dim=-1)
        prob = torch.exp(log_softmax)
        
        gather_log = log_softmax.gather(dim=-1, index=targets.unsqueeze(-1)).squeeze(-1)
        gather_prob = prob.gather(dim=-1, index=targets.unsqueeze(-1)).squeeze(-1)
        
        # Focal calculation downweights easy (healthy) slices, retains high penalty on rare stages
        focal_factor = (1.0 - gather_prob) ** self.gamma
        loss = -focal_factor * gather_log
        
        alpha_factor = self.alpha.gather(dim=-1, index=targets)
        return (alpha_factor * loss).mean()

# =====================================================================
# 4. TRAINING ENGINE EXECUTION BLOCK
# =====================================================================
def execute_vit_pipeline():
    # Preprocessing: Resizes the tensor image to standard 224x224 ViT shape dimensions
    vit_transforms = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    print("📋 Attaching data streaming engines to split index sets...")
    train_dataset = AlzheimerSafeDataset("training_indices.csv", transform=vit_transforms)
    val_dataset = AlzheimerSafeDataset("validation_indices.csv", transform=vit_transforms)
    
    train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=32, shuffle=False, num_workers=0)
    
    # Class Balancing Weight Generation 
    samples_per_class = [67222, 13725, 5002, 488]
    total_samples = sum(samples_per_class)
    num_classes = len(samples_per_class)
    computed_weights = torch.FloatTensor([total_samples / (num_classes * c) for c in samples_per_class])
    
    criterion = WeightedFocalLoss(alpha=computed_weights, gamma=2.0)
    print(f"⚖️ Loss multipliers locked: {computed_weights.tolist()}")
    
    # Load Pre-trained ViT base architecture
    print("🧠 Fetching pre-trained ViT-B/16 Core Framework...")
    weights = ViT_B_16_Weights.DEFAULT
    model = vit_b_16(weights=weights)
    
    # Overwrite the classification head to map out your 4 disease progression stages
    in_features = model.heads.head.in_features
    model.heads.head = nn.Linear(in_features, num_classes)
    model = model.to(DEVICE)
    
    # Optimization setup targeting the un-frozen modified linear layer head
    optimizer = torch.optim.AdamW(model.heads.head.parameters(), lr=1e-4, weight_decay=0.01)
    
    print("\n" + "="*60)
    print("✅ WORKSTATION INITIALIZATION STATUS: SUCCESSFUL")
    print("="*60)
    print("🎉 Core data streams are safely linked via in-memory copies.")
    print("👉 To monitor performance metrics for Tuesday's meeting, run your training batch loop!")
    print("="*60)

if __name__ == "__main__":
    execute_vit_pipeline()