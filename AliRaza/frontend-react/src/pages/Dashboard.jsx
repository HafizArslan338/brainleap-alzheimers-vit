import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Chart from 'chart.js/auto';

const Dashboard = ({ theme, toggleTheme }) => {
    const navigate = useNavigate();
    const doctorName = localStorage.getItem('doctorName') || 'Dr. User';
    const nameForAvatar = doctorName.replace('Dr. ', '').replace(' ', '+');
    const avatarUrl = `https://ui-avatars.com/api/?name=${nameForAvatar}&background=0D8ABC&color=fff`;

    const [activeTab, setActiveTab] = useState('dashboard');
    
    // Upload State
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    
    // Result State
    const [result, setResult] = useState(null);
    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    
    // Patients State
    const [patients, setPatients] = useState([]);
    const [loadingPatients, setLoadingPatients] = useState(false);

    // Settings State
    const [colormap, setColormap] = useState('JET');

    useEffect(() => {
        if (!localStorage.getItem('doctorName')) {
            navigate('/auth');
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('doctorName');
        navigate('/auth');
    };

    const handleFileDrop = (e) => {
        e.preventDefault();
        if (e.dataTransfer.files.length) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files.length) {
            processFile(e.target.files[0]);
        }
    };

    const processFile = (file) => {
        if (!file.type.match('image.*')) {
            alert('Please upload an image file (PNG/JPG)');
            return;
        }
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setResult(null); // reset old result
    };

    const resetScan = () => {
        setSelectedFile(null);
        setPreviewUrl('');
        setResult(null);
    };

    const handleAnalyze = async () => {
        if (!selectedFile) return;
        setIsAnalyzing(true);
        
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('colormap', colormap);

        try {
            const response = await axios.post('/api/predict', formData);
            setResult(response.data);
            renderChart(response.data.probabilities);
        } catch (err) {
            alert("Analysis failed: " + (err.response?.data?.detail || err.message));
        } finally {
            setIsAnalyzing(false);
        }
    };

    const renderChart = (probabilities) => {
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }
        
        const isLightMode = theme === 'light';
        const textColor = isLightMode ? '#2d3748' : '#e2e8f0';
        const gridColor = isLightMode ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';

        const ctx = chartRef.current.getContext('2d');
        chartInstance.current = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ["Non-Demented", "Very Mild", "Mild", "Moderate"],
                datasets: [{
                    label: 'Model Confidence (%)',
                    data: probabilities.map(p => (p * 100).toFixed(2)),
                    backgroundColor: [
                        'rgba(72, 187, 120, 0.7)',
                        'rgba(236, 201, 75, 0.7)',
                        'rgba(237, 137, 54, 0.7)',
                        'rgba(245, 101, 101, 0.7)'
                    ],
                    borderColor: ['#48bb78', '#ecc94b', '#ed8936', '#f56565'],
                    borderWidth: 2,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
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
    };

    // Update chart colors on theme change or tab change
    useEffect(() => {
        if (activeTab === 'dashboard' && result && chartRef.current) {
            renderChart(result.probabilities);
        }
    }, [theme, activeTab, result]);

    const loadPatients = async () => {
        setActiveTab('patients');
        setLoadingPatients(true);
        try {
            const res = await axios.get('/api/patients');
            setPatients(res.data.patients);
        } catch (e) {
            console.error("Failed to load patients");
        } finally {
            setLoadingPatients(false);
        }
    };

    const handleExport = () => {
        if (activeTab === 'dashboard' && !result) {
            alert("No clinical data to export. Please upload and analyze a patient scan first.");
        } else {
            window.print();
        }
    };

    const getSeverityClass = (pred) => {
        if (!pred) return '';
        const lower = pred.toLowerCase();
        if (lower.includes('non-demented')) return 'severity-safe';
        if (lower.includes('very mild') || lower.includes('mild')) return 'severity-mild';
        return 'severity-high';
    };

    return (
        <div className="app-container">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="logo">
                    <i className="fa-solid fa-brain"></i>
                    <h2>Dementia <span>Staging</span></h2>
                </div>
                <nav className="nav-menu">
                    <a href="#" className={activeTab === 'dashboard' ? 'active' : ''} onClick={(e) => {e.preventDefault(); setActiveTab('dashboard')}}><i className="fa-solid fa-chart-pie"></i> Clinical Dashboard</a>
                    <a href="#" className={activeTab === 'patients' ? 'active' : ''} onClick={(e) => {e.preventDefault(); loadPatients()}}><i className="fa-solid fa-users-viewfinder"></i> Patient Isolation Hub</a>
                    <a href="#" className={activeTab === 'settings' ? 'active' : ''} onClick={(e) => {e.preventDefault(); setActiveTab('settings')}}><i className="fa-solid fa-microchip"></i> ViT Settings</a>
                </nav>
                <div className="user-profile">
                    <img id="profileAvatar" src={avatarUrl} alt="User" />
                    <div className="user-info">
                        <h4 id="profileName">{doctorName}</h4>
                        <p>Neurologist</p>
                    </div>
                </div>
                <a href="#" onClick={(e) => {e.preventDefault(); handleLogout();}} className="logout-btn">
                    <i className="fa-solid fa-arrow-right-from-bracket"></i> Secure Logout
                </a>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <header className="top-header">
                    <div>
                        <h1 style={{fontSize: '24px'}}>An End-to-End Clinical Decision Support System</h1>
                        <p className="subtitle" style={{marginTop:'4px', maxWidth: '800px', lineHeight: '1.4'}}>
                            <strong>For Leakage-Aware Dementia Staging Using Patient-Isolated Neuroimaging Tensors and Distributed Web UI Frameworks</strong>
                        </p>
                    </div>
                    <div className="header-actions">
                        <button className="btn-outline" onClick={handleExport}><i className="fa-solid fa-download"></i> Export Report</button>
                        <div className="theme-toggle" onClick={toggleTheme}><i className={`fa-solid ${theme === 'light' ? 'fa-sun' : 'fa-moon'}`}></i></div>
                    </div>
                </header>

                {/* Dashboard Tab */}
                {activeTab === 'dashboard' && (
                    <div className="dashboard-grid">
                        <div className="left-column" style={{display: 'flex', flexDirection: 'column', gap: '32px'}}>
                            
                            <div className="card upload-card glass-panel">
                                <h3><i className="fa-solid fa-cloud-arrow-up"></i> T1-Weighted MRI Scanner</h3>
                                <p className="subtitle">Upload patient structural MRI slice (OASIS Format) for ViT analysis.</p>
                                
                                {!selectedFile ? (
                                    <div className="upload-area" onDragOver={(e) => e.preventDefault()} onDrop={handleFileDrop} onClick={() => document.getElementById('fileInput').click()}>
                                        <i className="fa-regular fa-image upload-icon"></i>
                                        <p>Drag & drop MRI scan here or <span className="highlight">browse files</span></p>
                                        <input type="file" id="fileInput" accept="image/png, image/jpeg, image/jpg" hidden onChange={handleFileChange} />
                                    </div>
                                ) : (
                                    <div className="preview-section">
                                        <div className="file-info-badge">
                                            <i className="fa-solid fa-file-image"></i>
                                            <span>{selectedFile.name}</span>
                                        </div>
                                        <div className="image-wrapper">
                                            <img src={previewUrl} alt="MRI Preview" />
                                        </div>
                                        <div style={{display: 'flex', gap: '10px', marginTop: '15px'}}>
                                            <button className="btn-outline" onClick={resetScan} style={{flex: 1, padding: '12px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-color)', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Outfit'}}>
                                                <i className="fa-solid fa-rotate-left"></i> Change Scan
                                            </button>
                                            <button className="btn-primary" onClick={handleAnalyze} style={{flex: 2}}>
                                                <i className="fa-solid fa-microchip"></i> Run ViT Analysis
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            <div className={`card glass-panel ${!result ? 'hidden' : ''}`}>
                                <h3><i className="fa-solid fa-chart-pie"></i> Clinical Probability</h3>
                                <p className="subtitle">ViT class activation confidence across all stages.</p>
                                <div style={{background: 'rgba(0,0,0,0.1)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-color)'}}>
                                    <canvas ref={chartRef} width="400" height="200"></canvas>
                                </div>
                            </div>
                        </div>

                        <div className="card results-card glass-panel">
                            <h3><i className="fa-solid fa-stethoscope"></i> Clinical Assessment</h3>
                            
                            {!result ? (
                                <div className="empty-state">
                                    <i className="fa-solid fa-notes-medical"></i>
                                    <p>Upload a scan and run analysis to view patient diagnosis and Grad-CAM visualizations.</p>
                                </div>
                            ) : (
                                <div className="results-content">
                                    <div className="metadata-grid">
                                        <div className="meta-item">
                                            <span><i className="fa-solid fa-id-card"></i> Patient ID:</span>
                                            <strong>{result.patient_id}</strong>
                                        </div>
                                        <div className={`meta-item ${result.qa_passed ? 'qa-passed' : 'qa-failed'}`}>
                                            <span><i className="fa-solid fa-shield-halved"></i> Image QA:</span>
                                            <strong>{result.qa_passed ? 'Passed' : 'Failed - Blurry'} (Score: {result.blur_score})</strong>
                                        </div>
                                    </div>

                                    <div className="prediction-box">
                                        <span className="label">AI Diagnosis Stage</span>
                                        <h2 className={getSeverityClass(result.prediction)}>{result.prediction}</h2>
                                        <div className="confidence-bar-container">
                                            <div className="confidence-bar" style={{width: `${Math.round(result.confidence * 100)}%`, backgroundColor: `var(--${getSeverityClass(result.prediction)})`}}></div>
                                        </div>
                                        <span className="confidence-text">Confidence: {Math.round(result.confidence * 100)}%</span>
                                    </div>

                                    <div className="heatmap-section">
                                        <h4><i className="fa-solid fa-layer-group"></i> Attention Heatmap (Grad-CAM)</h4>
                                        <p className="small-text">Areas of the brain strongly influencing the ViT model's prediction.</p>
                                        <div className="image-wrapper heatmap-wrapper">
                                            <img src={result.heatmap_image} alt="Grad-CAM Heatmap" />
                                            <div className="scan-line"></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Patients Tab */}
                {activeTab === 'patients' && (
                    <div className="card glass-panel">
                        <h3><i className="fa-solid fa-database"></i> Patient Isolation Hub</h3>
                        <p className="subtitle">Real-time database of all patient analyses saved securely to MongoDB Atlas.</p>
                        <div style={{overflowX: 'auto', marginTop: '20px'}}>
                            <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left'}}>
                                <thead>
                                    <tr style={{borderBottom: '1px solid var(--border-color)'}}>
                                        <th style={{padding: '12px', color: 'var(--text-secondary)'}}>Patient ID</th>
                                        <th style={{padding: '12px', color: 'var(--text-secondary)'}}>Scan File</th>
                                        <th style={{padding: '12px', color: 'var(--text-secondary)'}}>Image QA</th>
                                        <th style={{padding: '12px', color: 'var(--text-secondary)'}}>AI Diagnosis</th>
                                        <th style={{padding: '12px', color: 'var(--text-secondary)'}}>Confidence</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadingPatients ? (
                                        <tr><td colSpan="4" style={{textAlign: 'center', padding: '20px'}}><i className="fa-solid fa-spinner fa-spin"></i> Loading...</td></tr>
                                    ) : patients.length === 0 ? (
                                        <tr><td colSpan="4" style={{textAlign: 'center', padding: '20px'}}>No patient records found in database.</td></tr>
                                    ) : (
                                        patients.map((p, idx) => (
                                            <tr key={idx} style={{borderBottom: '1px solid rgba(128,128,128,0.2)'}}>
                                                <td style={{padding: '12px', fontWeight: 'bold'}}>{p.patient_id}</td>
                                                <td style={{padding: '12px', fontSize: '13px', color: 'var(--text-secondary)'}}>{p.filename}</td>
                                                <td style={{padding: '12px', color: p.qa_passed ? 'var(--severity-safe)' : 'var(--severity-high)'}}>{p.qa_passed ? 'Passed' : 'Failed'}</td>
                                                <td style={{padding: '12px'}}>{p.prediction}</td>
                                                <td style={{padding: '12px'}}>{p.confidence}%</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                    <div className="card glass-panel">
                        <h3><i className="fa-solid fa-microchip"></i> ViT Model & System Configuration</h3>
                        <p className="subtitle">Fine-tune the Vision Transformer parameters and application preferences.</p>
                        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginTop: '20px'}}>
                            
                            <div style={{display: 'flex', flexDirection: 'column', gap: '24px'}}>
                                <h4 style={{borderBottom: '1px solid var(--border-color)', paddingBottom: '8px'}}><i className="fa-solid fa-sliders"></i> Core Parameters</h4>
                                <div>
                                    <label style={{fontSize: '14px', fontWeight: 'bold', color: 'var(--text-secondary)'}}>Laplacian QA Blur Threshold</label>
                                    <input type="range" min="10" max="100" defaultValue="30" style={{width: '100%', marginTop: '8px', cursor: 'pointer'}} />
                                    <span style={{fontSize: '12px', color: 'var(--accent-color)'}}>Current: 30.0 (Strict)</span>
                                </div>
                                <div>
                                    <label style={{fontSize: '14px', fontWeight: 'bold', color: 'var(--text-secondary)'}}>Confidence Alert Threshold</label>
                                    <input type="range" min="50" max="99" defaultValue="85" style={{width: '100%', marginTop: '8px', cursor: 'pointer'}} />
                                    <span style={{fontSize: '12px', color: 'var(--accent-color)'}}>Current: 85%</span>
                                </div>
                                <div>
                                    <label style={{fontSize: '14px', fontWeight: 'bold', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px'}}>Active Model Checkpoint</label>
                                    <select style={{width: '100%', padding: '10px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontFamily: 'var(--font-main)'}}>
                                        <option>ViT-B/16 (Production - v2.0)</option>
                                        <option>ViT-L/16 (Experimental - v3.0-beta)</option>
                                        <option>ResNet-50 (Legacy Baseline)</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{display: 'flex', flexDirection: 'column', gap: '24px'}}>
                                <h4 style={{borderBottom: '1px solid var(--border-color)', paddingBottom: '8px'}}><i className="fa-solid fa-desktop"></i> System & Visuals</h4>
                                <div>
                                    <label style={{fontSize: '14px', fontWeight: 'bold', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px'}}>Grad-CAM Colormap</label>
                                    <select value={colormap} onChange={(e) => setColormap(e.target.value)} style={{width: '100%', padding: '10px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontFamily: 'var(--font-main)'}}>
                                        <option value="JET">JET (Clinical Standard)</option>
                                        <option value="VIRIDIS">VIRIDIS (Colorblind Safe)</option>
                                        <option value="HOT">HOT (High Contrast)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <div style={{marginTop: '30px', textAlign: 'right', borderTop: '1px solid var(--border-color)', paddingTop: '20px'}}>
                            <button className="btn-primary" onClick={() => alert("Settings applied!")} style={{width: 'auto', display: 'inline-flex', float: 'right'}}><i className="fa-solid fa-save"></i> Apply Changes</button>
                            <div style={{clear: 'both'}}></div>
                        </div>
                    </div>
                )}

                {/* Loader */}
                {isAnalyzing && (
                    <div className="loader-overlay">
                        <div className="spinner">
                            <div className="double-bounce1"></div>
                            <div className="double-bounce2"></div>
                        </div>
                        <p>Processing Vision Transformer Tensors...</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Dashboard;
