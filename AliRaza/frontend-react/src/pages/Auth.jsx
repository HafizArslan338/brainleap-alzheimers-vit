import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Auth = ({ theme, toggleTheme }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [institution, setInstitution] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorHighlight, setErrorHighlight] = useState(false);
    const navigate = useNavigate();

    // Theme applied on body class in App.jsx

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorHighlight(false);

        try {
            const response = await axios.post('/api/login', { email, password });
            let finalName = response.data.name;
            if (!finalName.toLowerCase().startsWith('dr')) {
                finalName = "Dr. " + finalName.charAt(0).toUpperCase() + finalName.slice(1);
            }
            localStorage.setItem('doctorName', finalName);
            navigate('/');
        } catch (err) {
            setErrorHighlight(true);
            alert(err.response?.data?.detail || "Login failed");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await axios.post('/api/register', { name, institution, email, password });
            alert('Account successfully created! You can now login.');
            setIsLogin(true);
        } catch (err) {
            alert(err.response?.data?.detail || "Registration failed");
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        if (!email) {
            alert("Please enter your Clinical Email ID first so we can verify your account.");
            setErrorHighlight(true);
            return;
        }

        try {
            await axios.post('/api/forgot-password', { email });
            const otp = prompt(`Security check: We just sent a 4-digit OTP to ${email}.\n\nPlease check your inbox and enter the OTP here:`);
            if (!otp || otp.length !== 4) {
                alert("Invalid OTP format. Password reset aborted.");
                return;
            }

            const newPassword = prompt("OTP Format Accepted.\n\nPlease enter your NEW Security Password:");
            if (!newPassword || newPassword.length < 6) {
                alert("Password too short or cancelled. Password reset aborted.");
                return;
            }

            await axios.post('/api/reset-password', { email, otp, new_password: newPassword });
            alert('Password successfully reset in MongoDB! You can now login with your new password.');
            setPassword(newPassword);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.detail || "Server error during password reset process.");
        }
    };

    return (
        <div className="auth-body">
            <div className="theme-toggle auth-theme-toggle" onClick={toggleTheme} title="Toggle Light/Dark Mode">
                <i className={`fa-solid ${theme === 'light' ? 'fa-sun' : 'fa-moon'}`}></i>
            </div>

            <div className="auth-container">
                <div className="auth-card glass-panel">
                    
                    <div className="logo auth-logo">
                        <i className="fa-solid fa-brain"></i>
                        <h2>Dementia <span>Staging</span></h2>
                    </div>
                    
                    <p className="auth-subtitle" style={{maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto', lineHeight: '1.4'}}>
                        <strong>An End-to-End Clinical Decision Support System for Leakage-Aware Dementia Staging Using Patient-Isolated Neuroimaging Tensors and Distributed Web UI Frameworks</strong>
                    </p>
                    
                    <div className="auth-tabs">
                        <button className={`auth-tab ${isLogin ? 'active' : ''}`} onClick={() => setIsLogin(true)}>Login</button>
                        <button className={`auth-tab ${!isLogin ? 'active' : ''}`} onClick={() => setIsLogin(false)}>Sign Up</button>
                    </div>

                    {isLogin ? (
                        <form className="auth-form" onSubmit={handleLogin}>
                            <div className="input-group">
                                <label><i className="fa-solid fa-envelope"></i> Clinical Email ID</label>
                                <input 
                                    type="email" 
                                    placeholder="doctor@hospital.org" 
                                    required 
                                    value={email}
                                    onChange={(e) => {setEmail(e.target.value); setErrorHighlight(false)}}
                                    className={errorHighlight ? 'error-highlight' : ''}
                                />
                            </div>
                            <div className="input-group">
                                <label><i className="fa-solid fa-lock"></i> Security Password</label>
                                <input 
                                    type="password" 
                                    placeholder="••••••••" 
                                    required 
                                    value={password}
                                    onChange={(e) => {setPassword(e.target.value); setErrorHighlight(false)}}
                                    className={errorHighlight ? 'error-highlight' : ''}
                                />
                            </div>
                            <div className="auth-options">
                                <label className="remember-me"><input type="checkbox" defaultChecked /> Remember Device</label>
                                <a href="#" className="forgot-pass" onClick={handleForgotPassword}>Forgot Password?</a>
                            </div>
                            <button type="submit" className="btn-primary auth-btn" disabled={isLoading}>
                                {isLoading ? <><i className="fa-solid fa-spinner fa-spin"></i> Authenticating...</> : <><i className="fa-solid fa-right-to-bracket"></i> Secure Login</>}
                            </button>
                        </form>
                    ) : (
                        <form className="auth-form" onSubmit={handleRegister}>
                            <div className="input-group">
                                <label><i className="fa-solid fa-user-doctor"></i> Full Name</label>
                                <input type="text" placeholder="Dr. First Last" required value={name} onChange={(e) => setName(e.target.value)} />
                            </div>
                            <div className="input-group">
                                <label><i className="fa-solid fa-hospital"></i> Medical Institution</label>
                                <input type="text" placeholder="General Hospital" required value={institution} onChange={(e) => setInstitution(e.target.value)} />
                            </div>
                            <div className="input-group">
                                <label><i className="fa-solid fa-envelope"></i> Work Email</label>
                                <input type="email" placeholder="doctor@hospital.org" required value={email} onChange={(e) => setEmail(e.target.value)} />
                            </div>
                            <div className="input-group">
                                <label><i className="fa-solid fa-lock"></i> Create Password</label>
                                <input type="password" placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.target.value)} />
                            </div>
                            <button type="submit" className="btn-primary auth-btn" disabled={isLoading}>
                                {isLoading ? <><i className="fa-solid fa-spinner fa-spin"></i> Creating Profile...</> : <><i className="fa-solid fa-user-plus"></i> Request Access</>}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Auth;
