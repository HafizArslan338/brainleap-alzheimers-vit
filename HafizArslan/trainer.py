import os
import pandas as pd
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
from torchvision.models import vit_b_16, ViT_B_16_Weights
from PIL import Image
import time

# =====================================================================
# 1. HARDWARE WORKSTATION ROUTING
# =====================================================================
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print("="*60)
print(f"🚀 ENGINE TARGET DEVICE: {DEVICE}")
if torch.cuda.is_available():
    print(f"⚡ Hardware Accelerated Core: {torch.cuda.get_device_name(0)}")
print("="*60)

class AlzheimerSafeDataset(Dataset):
    def __init__(self, csv_file, transform=None):
        self.data_frame = pd.read_csv(csv_file)
        self.transform = transform

    def __len__(self):
        return len(self.data_frame)

    def __getitem__(self, idx):
        img_path = self.data_frame.iloc[idx, 0]
        label = int(self.data_frame.iloc[idx, 2])
        
        with Image.open(img_path) as raw_img:
            image_copy = raw_img.copy().convert('RGB') 
            
        if self.transform:
            image_copy = self.transform(image_copy)
            
        return image_copy, label

class WeightedFocalLoss(nn.Module):
    def __init__(self, alpha, gamma=2.0):
        super(WeightedFocalLoss, self).__init__()
        self.alpha = alpha.to(DEVICE)
        self.gamma = gamma

    def forward(self, inputs, targets):
        log_softmax = F.log_softmax(inputs, dim=-1)
        prob = torch.exp(log_softmax)
        gather_log = log_softmax.gather(dim=-1, index=targets.unsqueeze(-1)).squeeze(-1)
        gather_prob = prob.gather(dim=-1, index=targets.unsqueeze(-1)).squeeze(-1)
        focal_factor = (1.0 - gather_prob) ** self.gamma
        loss = -focal_factor * gather_log
        alpha_factor = self.alpha.gather(dim=-1, index=targets)
        return (alpha_factor * loss).mean()

def execute_vit_pipeline():
    EPOCHS = 5  
    BATCH_SIZE = 32

    # --- WEEK 3 UPGRADE: Data Augmentation ---
    train_transforms = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(degrees=10),
        transforms.ColorJitter(brightness=0.1, contrast=0.1),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    val_transforms = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    print("📋 Attaching data streaming engines to split index sets...")
    train_dataset = AlzheimerSafeDataset("training_indices.csv", transform=train_transforms)
    val_dataset = AlzheimerSafeDataset("validation_indices.csv", transform=val_transforms)
    
    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=0)
    
    samples_per_class = [67222, 13725, 5002, 488]
    total_samples = sum(samples_per_class)
    num_classes = len(samples_per_class)
    computed_weights = torch.FloatTensor([total_samples / (num_classes * c) for c in samples_per_class])
    
    criterion = WeightedFocalLoss(alpha=computed_weights, gamma=2.0)
    
    print("🧠 Fetching pre-trained ViT-B/16 Core Framework...")
    weights = ViT_B_16_Weights.DEFAULT
    model = vit_b_16(weights=weights)
    model.heads.head = nn.Linear(model.heads.head.in_features, num_classes)
    
    # --- WEEK 3 UPGRADE: Fine-Tuning from Previous Run ---
    if os.path.exists("best_alzheimer_vit.pth"):
        print("🔄 Loading your previously trained weights for Fine-Tuning...")
        model.load_state_dict(torch.load("best_alzheimer_vit.pth", map_location=DEVICE))
        
    model = model.to(DEVICE)
        
    optimizer = torch.optim.AdamW(model.parameters(), lr=1e-5, weight_decay=0.01)
    
    # --- WEEK 3 UPGRADE: Cosine Annealing Learning Rate ---
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=EPOCHS)
    
    print("\n⚡ Initialization Successful. Starting the Active Training Loop... ⚡\n")
    best_val_acc = 0.0

    for epoch in range(EPOCHS):
        start_time = time.time()
        model.train()
        running_loss = 0.0
        correct_train, total_train = 0, 0
        
        print(f"🎬 Epoch {epoch+1}/{EPOCHS}")
        print("-" * 30)
        
        for batch_idx, (images, labels) in enumerate(train_loader):
            images, labels = images.to(DEVICE), labels.to(DEVICE)
            
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            running_loss += loss.item() * images.size(0)
            _, predicted = outputs.max(1)
            total_train += labels.size(0)
            correct_train += predicted.eq(labels).sum().item()
            
            if (batch_idx + 1) % 100 == 0:
                current_batch_acc = 100.0 * correct_train / total_train
                print(f"   Batch {batch_idx+1}/{len(train_loader)} | Loss: {loss.item():.4f} | Train Acc: {current_batch_acc:.2f}%")
        
        scheduler.step() # Advance Learning Rate Scheduler
        
        epoch_loss = running_loss / len(train_loader.dataset)
        epoch_train_acc = 100.0 * correct_train / total_train
        
        model.eval()
        running_val_loss = 0.0
        correct_val, total_val = 0, 0
        
        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(DEVICE), labels.to(DEVICE)
                outputs = model(images)
                loss = criterion(outputs, labels)
                
                running_val_loss += loss.item() * images.size(0)
                _, predicted = outputs.max(1)
                total_val += labels.size(0)
                correct_val += predicted.eq(labels).sum().item()
        
        epoch_val_loss = running_val_loss / len(val_loader.dataset)
        epoch_val_acc = 100.0 * correct_val / total_val
        elapsed_time = time.time() - start_time
        
        print("\n" + "="*50)
        print(f"📊 SUMMARY FOR EPOCH {epoch+1}")
        print("="*50)
        print(f"⏱️ Time Taken:         {elapsed_time:.1f} seconds")
        print(f"📉 Train Loss:         {epoch_loss:.4f}   | 📈 Train Accuracy: {epoch_train_acc:.2f}%")
        print(f"📉 Validation Loss:    {epoch_val_loss:.4f}   | 📈 Validation Accuracy: {epoch_val_acc:.2f}%")
        print("="*50 + "\n")
        
        if epoch_val_acc > best_val_acc:
            best_val_acc = epoch_val_acc
            torch.save(model.state_dict(), "best_alzheimer_vit_v2.pth")
            print("💾 Upgraded model saved successfully as 'best_alzheimer_vit_v2.pth'!\n")

    print("🎉 Pipeline finished training successfully! Bring these logs to Tuesday's meeting.")

if __name__ == "__main__":
    execute_vit_pipeline()