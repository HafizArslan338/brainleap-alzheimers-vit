document.addEventListener('DOMContentLoaded', () => {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const previewSection = document.getElementById('previewSection');
    const imagePreview = document.getElementById('imagePreview');
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const resetBtn = document.getElementById('resetBtn');
    
    const resultsEmpty = document.getElementById('resultsEmpty');
    const resultsContent = document.getElementById('resultsContent');
    const predictionText = document.getElementById('predictionText');
    const confidenceBar = document.getElementById('confidenceBar');
    const confidenceText = document.getElementById('confidenceText');
    const heatmapPreview = document.getElementById('heatmapPreview');
    const heatmapWrapper = document.querySelector('.heatmap-wrapper');
    const loader = document.getElementById('loader');
    const ctx = document.getElementById('probabilityChart').getContext('2d');
    const ctxRadar = document.getElementById('radarChart').getContext('2d');
    const radarCard = document.getElementById('radarCard');
    let probabilityChartInstance = null;
    let radarChartInstance = null;
    
    // Metadata UI elements
    const patientIdDisplay = document.getElementById('patientIdDisplay');
    const qaStatusDisplay = document.getElementById('qaStatusDisplay');
    const qaStatusBox = document.getElementById('qaStatusBox');
    
    // Tab Elements
    const tabDashboard = document.getElementById('tabDashboard');
    const tabPatients = document.getElementById('tabPatients');
    const tabSettings = document.getElementById('tabSettings');
    const sectionDashboard = document.getElementById('sectionDashboard');
    const sectionPatients = document.getElementById('sectionPatients');
    const sectionSettings = document.getElementById('sectionSettings');
    const patientsTableBody = document.getElementById('patientsTableBody');
    
    // Profile loading from localStorage
    const savedName = localStorage.getItem('doctorName');
    if (savedName) {
        document.getElementById('profileName').textContent = savedName;
        // Clean name for URL (remove Dr. and spaces)
        const nameForAvatar = savedName.replace('Dr. ', '').replace(' ', '+');
        document.getElementById('profileAvatar').src = `https://ui-avatars.com/api/?name=${nameForAvatar}&background=0D8ABC&color=fff`;
    }
    
    let selectedFile = null;

    // Theme Toggle Logic
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = themeToggle.querySelector('i');
    
    // Load saved theme
    if(localStorage.getItem('theme') === 'light') {
        document.body.classList.add('light-theme');
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
    }
    
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        const isLightMode = document.body.classList.contains('light-theme');
        
        if (isLightMode) {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
            localStorage.setItem('theme', 'light');
        } else {
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
            localStorage.setItem('theme', 'dark');
        }
        
        // Update Chart colors dynamically if it exists
        if (window.probabilityChartInstance) {
            const textColor = isLightMode ? '#2d3748' : '#e2e8f0';
            const gridColor = isLightMode ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';
            
            window.probabilityChartInstance.options.scales.x.ticks.color = textColor;
            window.probabilityChartInstance.options.scales.y.ticks.color = textColor;
            window.probabilityChartInstance.options.scales.y.grid.color = gridColor;
            window.probabilityChartInstance.update();
        }
        
        if (window.radarChartInstance) {
            const textColor = isLightMode ? '#2d3748' : '#e2e8f0';
            const gridColor = isLightMode ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';
            window.radarChartInstance.options.scales.r.ticks.color = textColor;
            window.radarChartInstance.options.scales.r.ticks.backdropColor = 'transparent';
            window.radarChartInstance.options.scales.r.grid.color = gridColor;
            window.radarChartInstance.options.scales.r.pointLabels.color = textColor;
            window.radarChartInstance.update();
        }
    });

    // Handle Navigation Tabs
    function switchTab(activeTab, activeSection) {
        [tabDashboard, tabPatients, tabSettings].forEach(t => t.classList.remove('active'));
        [sectionDashboard, sectionPatients, sectionSettings].forEach(s => s.classList.add('hidden'));
        activeTab.classList.add('active');
        activeSection.classList.remove('hidden');
    }

    tabDashboard.addEventListener('click', (e) => {
        e.preventDefault();
        switchTab(tabDashboard, sectionDashboard);
    });

    tabSettings.addEventListener('click', (e) => {
        e.preventDefault();
        switchTab(tabSettings, sectionSettings);
    });

    tabPatients.addEventListener('click', async (e) => {
        e.preventDefault();
        switchTab(tabPatients, sectionPatients);
        
        try {
            const res = await fetch('/api/patients');
            if (res.ok) {
                const data = await res.json();
                patientsTableBody.innerHTML = '';
                
                if (data.patients.length === 0) {
                    patientsTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px;">No patient records found in database.</td></tr>';
                    return;
                }

                data.patients.forEach(p => {
                    const statusColor = p.qa_passed ? 'var(--severity-safe)' : 'var(--severity-high)';
                    const statusText = p.qa_passed ? 'Passed' : 'Failed';
                    patientsTableBody.innerHTML += `
                        <tr style="border-bottom: 1px solid rgba(128,128,128,0.2);">
                            <td style="padding: 12px; font-weight: bold;">${p.patient_id}</td>
                            <td style="padding: 12px; color: ${statusColor};">${statusText}</td>
                            <td style="padding: 12px;">${p.prediction}</td>
                            <td style="padding: 12px;">${p.confidence}%</td>
                        </tr>
                    `;
                });
            }
        } catch (error) {
            patientsTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px; color: red;">Failed to load data from MongoDB.</td></tr>';
        }
    });
    
    uploadArea.addEventListener('click', () => fileInput.click());
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFile(e.target.files[0]);
        }
    });

    function handleFile(file) {
        if (!file.type.match('image.*')) {
            alert('Please upload an image file (PNG/JPG)');
            return;
        }
        selectedFile = file;
        fileNameDisplay.textContent = file.name;
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            uploadArea.classList.add('hidden');
            previewSection.classList.remove('hidden');
            
            resultsEmpty.classList.remove('hidden');
            resultsContent.classList.add('hidden');
        };
        reader.readAsDataURL(file);
    }
    
    // --- NEW: Reset/Change Scan Logic ---
    resetBtn.addEventListener('click', () => {
        fileInput.value = '';
        selectedFile = null;
        
        previewSection.classList.add('hidden');
        uploadArea.classList.remove('hidden');
        
        resultsContent.classList.add('hidden');
        radarCard.classList.add('hidden'); // Hide radar card
        resultsEmpty.classList.remove('hidden');
        
        if (window.probabilityChartInstance) window.probabilityChartInstance.destroy();
        if (window.radarChartInstance) window.radarChartInstance.destroy();
    });

    analyzeBtn.addEventListener('click', async () => {
        if (!selectedFile) return;

        loader.classList.remove('hidden');
        heatmapWrapper.classList.add('loading-scan');
        
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('colormap', document.getElementById('colormapSelect').value); // Send chosen colormap

        try {
            const response = await fetch('/api/predict', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || 'Server Error');
            }

            const data = await response.json();
            
            loader.classList.add('hidden');
            heatmapWrapper.classList.remove('loading-scan');

            resultsEmpty.classList.add('hidden');
            resultsContent.classList.remove('hidden');
            radarCard.classList.remove('hidden');

            patientIdDisplay.textContent = data.patient_id;
            
            if (data.qa_passed) {
                qaStatusDisplay.textContent = "Passed (Score: " + data.blur_score + ")";
                qaStatusBox.className = "meta-item qa-passed";
            } else {
                qaStatusDisplay.textContent = "Failed - Blurry (Score: " + data.blur_score + ")";
                qaStatusBox.className = "meta-item qa-failed";
            }

            predictionText.textContent = data.prediction;
            
            predictionText.className = '';
            if (data.prediction.toLowerCase().includes('non-demented')) {
                predictionText.classList.add('severity-safe');
                confidenceBar.style.backgroundColor = 'var(--severity-safe)';
            } else if (data.prediction.toLowerCase().includes('very mild') || data.prediction.toLowerCase().includes('mild')) {
                predictionText.classList.add('severity-mild');
                confidenceBar.style.backgroundColor = 'var(--severity-mild)';
            } else {
                predictionText.classList.add('severity-high');
                confidenceBar.style.backgroundColor = 'var(--severity-high)';
            }

            const confPercent = Math.round(data.confidence * 100);
            setTimeout(() => {
                confidenceBar.style.width = confPercent + '%';
            }, 100);
            confidenceText.textContent = `Confidence: ${confPercent}%`;

            heatmapPreview.src = data.heatmap_image;
            
            // --- Render the Probability Chart ---
            if (window.probabilityChartInstance) {
                window.probabilityChartInstance.destroy(); // destroy old chart if exists
            }
            
            const isLightMode = document.body.classList.contains('light-theme');
            const textColor = isLightMode ? '#2d3748' : '#e2e8f0';
            const gridColor = isLightMode ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';

            window.probabilityChartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ["Non-Demented", "Very Mild", "Mild", "Moderate"],
                    datasets: [{
                        label: 'Model Confidence (%)',
                        data: data.probabilities.map(p => (p * 100).toFixed(2)),
                        backgroundColor: [
                            'rgba(72, 187, 120, 0.7)',  // Safe Green
                            'rgba(236, 201, 75, 0.7)',  // Mild Yellow
                            'rgba(237, 137, 54, 0.7)',   // Orange
                            'rgba(245, 101, 101, 0.7)'   // High Red
                        ],
                        borderColor: [
                            '#48bb78',
                            '#ecc94b',
                            '#ed8936',
                            '#f56565'
                        ],
                        borderWidth: 2,
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            ticks: { color: textColor },
                            grid: { color: gridColor }
                        },
                        x: {
                            ticks: { color: textColor },
                            grid: { display: false }
                        }
                    }
                }
            });
            
            // --- Render the Radar Chart ---
            if (window.radarChartInstance) {
                window.radarChartInstance.destroy(); // destroy old chart if exists
            }
            
            window.radarChartInstance = new Chart(ctxRadar, {
                type: 'radar',
                data: {
                    labels: ['Hippocampus', 'Ventricles', 'Cerebral Cortex', 'Parietal Lobe', 'Temporal Lobe'],
                    datasets: [{
                        label: 'Atrophy Severity (%)',
                        data: data.regional_atrophy,
                        backgroundColor: 'rgba(13, 138, 188, 0.4)', // BrainLeap Blue
                        borderColor: '#0D8ABC',
                        pointBackgroundColor: '#0D8ABC',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: '#0D8ABC'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        r: {
                            beginAtZero: true,
                            max: 100,
                            ticks: { 
                                color: textColor,
                                backdropColor: 'transparent',
                                stepSize: 20
                            },
                            grid: { color: gridColor },
                            pointLabels: {
                                color: textColor,
                                font: {
                                    family: 'Inter',
                                    size: 11
                                }
                            }
                        }
                    }
                }
            });

        } catch (error) {
            loader.classList.add('hidden');
            heatmapWrapper.classList.remove('loading-scan');
            console.error("Error:", error);
            alert("Analysis failed: " + error.message);
        }
    });
});
