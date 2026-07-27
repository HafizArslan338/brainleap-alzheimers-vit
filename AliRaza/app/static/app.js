// BrainLeap Clinical Web UI — Luxury Medical Light Theme JavaScript Application Logic
document.addEventListener("DOMContentLoaded", () => {
    const dropzone = document.getElementById("dropzone");
    const fileInput = document.getElementById("fileInput");
    const dropzoneContent = document.getElementById("dropzoneContent");
    const previewContainer = document.getElementById("previewContainer");
    const imagePreview = document.getElementById("imagePreview");
    const btnRemoveImage = document.getElementById("btnRemoveImage");
    const btnRunScreening = document.getElementById("btnRunScreening");
    const btnText = document.getElementById("btnText");
    const btnSpinner = document.getElementById("btnSpinner");

    const emptyState = document.getElementById("emptyState");
    const resultsContainer = document.getElementById("resultsContainer");

    const stagingTitle = document.getElementById("stagingTitle");
    const stagingAccent = document.getElementById("stagingAccent");
    const confidenceBadge = document.getElementById("confidenceBadge");
    const confidenceBar = document.getElementById("confidenceBar");
    const executionModeText = document.getElementById("executionModeText");
    const probList = document.getElementById("probList");

    const opacitySlider = document.getElementById("opacitySlider");
    const opacityVal = document.getElementById("opacityVal");
    const viewerBaseImg = document.getElementById("viewerBaseImg");
    const viewerOverlayBase = document.getElementById("viewerOverlayBase");
    const viewerHeatmapOverlay = document.getElementById("viewerHeatmapOverlay");
    const regionsText = document.getElementById("regionsText");

    const btnPrintReport = document.getElementById("btnPrintReport");
    const btnViewMetadata = document.getElementById("btnViewMetadata");
    const metadataModal = document.getElementById("metadataModal");
    const btnCloseModal = document.getElementById("btnCloseModal");
    const modalBody = document.getElementById("modalBody");

    let currentFile = null;

    // --- Dropzone & File Selection ---
    dropzone.addEventListener("click", (e) => {
        if (e.target !== btnRemoveImage && !currentFile) {
            fileInput.click();
        }
    });

    dropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropzone.classList.add("dragover");
    });

    dropzone.addEventListener("dragleave", () => {
        dropzone.classList.remove("dragover");
    });

    dropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropzone.classList.remove("dragover");
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener("change", (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
        }
    });

    function handleFileSelect(file) {
        if (!file.type.startsWith("image/")) {
            alert("Please select a valid sMRI scan image file (JPEG, PNG).");
            return;
        }
        currentFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            dropzoneContent.classList.add("hidden");
            previewContainer.classList.remove("hidden");
            btnRunScreening.disabled = false;
        };
        reader.readAsDataURL(file);
    }

    btnRemoveImage.addEventListener("click", (e) => {
        e.stopPropagation();
        currentFile = null;
        fileInput.value = "";
        imagePreview.src = "";
        previewContainer.classList.add("hidden");
        dropzoneContent.classList.remove("hidden");
        btnRunScreening.disabled = true;
    });

    // --- Presets Handler ---
    document.querySelectorAll(".btn-preset").forEach((btn) => {
        btn.addEventListener("click", () => {
            const presetType = btn.getAttribute("data-preset");
            generateSyntheticPreset(presetType);
        });
    });

    function generateSyntheticPreset(type) {
        const canvas = document.createElement("canvas");
        canvas.width = 224;
        canvas.height = 224;
        const ctx = canvas.getContext("2d");

        // Background
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(0, 0, 224, 224);

        // Skull contour
        ctx.beginPath();
        ctx.ellipse(112, 112, 85, 95, 0, 0, 2 * Math.PI);
        ctx.fillStyle = "#1e293b";
        ctx.fill();

        // Brain parenchyma
        ctx.beginPath();
        ctx.ellipse(112, 112, 75, 85, 0, 0, 2 * Math.PI);
        ctx.fillStyle = "#475569";
        ctx.fill();

        // Ventricles based on stage
        ctx.fillStyle = "#0f172a";
        if (type === "nondemented") {
            ctx.ellipse(98, 105, 6, 18, -0.1, 0, 2 * Math.PI); ctx.fill();
            ctx.ellipse(126, 105, 6, 18, 0.1, 0, 2 * Math.PI); ctx.fill();
        } else if (type === "verymild") {
            ctx.ellipse(98, 105, 9, 22, -0.1, 0, 2 * Math.PI); ctx.fill();
            ctx.ellipse(126, 105, 9, 22, 0.1, 0, 2 * Math.PI); ctx.fill();
        } else if (type === "mild") {
            ctx.ellipse(98, 105, 14, 28, -0.1, 0, 2 * Math.PI); ctx.fill();
            ctx.ellipse(126, 105, 14, 28, 0.1, 0, 2 * Math.PI); ctx.fill();
        } else {
            // Moderate Stage
            ctx.ellipse(98, 105, 20, 36, -0.1, 0, 2 * Math.PI); ctx.fill();
            ctx.ellipse(126, 105, 20, 36, 0.1, 0, 2 * Math.PI); ctx.fill();
        }

        canvas.toBlob((blob) => {
            const file = new File([blob], `oasis_smri_${type}.png`, { type: "image/png" });
            handleFileSelect(file);
        });
    }

    // --- Execute Clinical Screening ---
    btnRunScreening.addEventListener("click", async () => {
        if (!currentFile) return;

        btnRunScreening.disabled = true;
        btnText.textContent = "Executing Neural Inference...";
        btnSpinner.classList.remove("hidden");

        const formData = new FormData();
        formData.append("file", currentFile);

        try {
            const response = await fetch("/predict", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || "Prediction failed.");
            }

            const data = await response.json();
            renderResults(data);
        } catch (err) {
            alert(`Screening Error: ${err.message}`);
        } finally {
            btnRunScreening.disabled = false;
            btnText.textContent = "Execute Clinical Screening";
            btnSpinner.classList.add("hidden");
        }
    });

    // --- Render Clinical Results ---
    function renderResults(data) {
        emptyState.classList.add("hidden");
        resultsContainer.classList.remove("hidden");

        // Staging Title & Confidence
        stagingTitle.textContent = data.prediction;
        confidenceBadge.textContent = `${data.confidence_percentage} Confidence`;
        confidenceBar.style.width = data.confidence_percentage;

        // Custom Light Theme Color Palette for Clinical Stages
        const stageThemes = {
            "Non-Demented": { color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
            "Very Mild": { color: "#4f46e5", bg: "#eef2ff", border: "#c7d2fe" },
            "Mild": { color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
            "Moderate": { color: "#dc2626", bg: "#fef2f2", border: "#fecaca" }
        };

        const activeTheme = stageThemes[data.prediction] || { color: "#1e3a8a", bg: "#eff6ff", border: "#bfdbfe" };

        stagingTitle.style.color = activeTheme.color;
        stagingAccent.style.background = activeTheme.color;
        confidenceBadge.style.color = activeTheme.color;
        confidenceBadge.style.background = activeTheme.bg;
        confidenceBadge.style.borderColor = activeTheme.border;
        confidenceBar.style.background = activeTheme.color;

        executionModeText.textContent = `Execution Engine: ${data.execution_mode}`;

        // Render Probability Bars
        probList.innerHTML = "";
        Object.entries(data.class_probabilities).forEach(([clsName, probVal]) => {
            const pct = Math.round(probVal * 100);
            const isTop = clsName === data.prediction;
            const barColor = isTop ? activeTheme.color : "#cbd5e1";

            const item = document.createElement("div");
            item.className = "prob-row";
            item.innerHTML = `
                <div class="prob-labels">
                    <span class="prob-name" style="color: ${isTop ? activeTheme.color : 'var(--text-primary)'}; font-weight: ${isTop ? '700' : '500'}">${clsName}</span>
                    <span class="prob-val" style="color: ${isTop ? activeTheme.color : 'var(--text-secondary)'}">${pct}%</span>
                </div>
                <div class="prob-track">
                    <div class="prob-bar" style="width: ${pct}%; background-color: ${barColor}"></div>
                </div>
            `;
            probList.appendChild(item);
        });

        // Render Heatmaps
        viewerBaseImg.src = URL.createObjectURL(currentFile);
        viewerOverlayBase.src = URL.createObjectURL(currentFile);
        viewerHeatmapOverlay.src = data.gradcam.heatmap_b64;
        regionsText.textContent = data.gradcam.attention_regions.join(" • ");
    }

    // --- Heatmap Opacity Slider ---
    opacitySlider.addEventListener("input", (e) => {
        const val = e.target.value;
        opacityVal.textContent = `${val}%`;
        viewerHeatmapOverlay.style.opacity = val / 100;
    });

    // --- Print Report ---
    btnPrintReport.addEventListener("click", () => {
        window.print();
    });

    // --- Metadata Modal ---
    btnViewMetadata.addEventListener("click", async () => {
        modalBody.innerHTML = "<p>Loading pipeline metadata...</p>";
        metadataModal.classList.remove("hidden");

        try {
            const res = await fetch("/metadata");
            const meta = await res.json();
            modalBody.innerHTML = `
                <h4 style="color:#1e3a8a; font-size:16px; margin-bottom:8px;">${meta.project_title}</h4>
                <p><strong>Version:</strong> ${meta.version}</p>
                <p><strong>Data Isolation Guarantee:</strong> <span style="color:#2563eb">${meta.data_leakage_guarantee}</span></p>
                <br>
                <p><strong>Group Component Handshake:</strong></p>
                <ul style="padding-left: 20px; line-height: 1.8;">
                    <li>1. ${meta.pipeline_components.component_1_regex_parser}</li>
                    <li>2. ${meta.pipeline_components.component_2_data_isolation}</li>
                    <li>3. ${meta.pipeline_components.component_3_model_core}</li>
                    <li>4. ${meta.pipeline_components.component_4_web_deployment}</li>
                </ul>
                <br>
                <p><strong>Pipeline Handshake Metadata JSON:</strong></p>
                <code-block>${JSON.stringify(meta, null, 2)}</code-block>
            `;
        } catch (err) {
            modalBody.innerHTML = `<p style="color:#dc2626">Error fetching metadata: ${err.message}</p>`;
        }
    });

    btnCloseModal.addEventListener("click", () => {
        metadataModal.classList.add("hidden");
    });
});
