import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

export function InterviewFeedback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const feedbackId = searchParams.get('feedback_id');
    const webhookId = searchParams.get('webhook_id');
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [alreadySubmitted, setAlreadySubmitted] = useState(false);
    const [formData, setFormData] = useState({
        candidate_attended: '',
        technical_configuration: '',
        technical_customization: '',
        communication_skills: '',
        leadership_abilities: '',
        enthusiasm: '',
        teamwork: '',
        attitude: '',
        interview_outcome: ''
    });
    
    useEffect(() => {
        if (!feedbackId) {
            setError('Invalid feedback form link. Missing feedback ID.');
            return;
        }
        
        checkFeedbackStatus();
    }, [feedbackId]);
    
    const checkFeedbackStatus = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/check-feedback-status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ feedback_id: feedbackId })
            });
            
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.submitted) {
                    setAlreadySubmitted(true);
                }
            }
        } catch (err) {
            console.error('Error checking feedback status:', err);
        } finally {
            setLoading(false);
        }
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation
        if (!formData.candidate_attended) {
            setError('Please select whether the candidate attended the interview');
            return;
        }
        
        if (formData.candidate_attended === 'yes') {
            const requiredFields = [
                'technical_configuration', 'technical_customization',
                'communication_skills', 'leadership_abilities',
                'enthusiasm', 'teamwork', 'attitude', 'interview_outcome'
            ];
            
            for (const field of requiredFields) {
                if (!formData[field as keyof typeof formData]) {
                    setError(`Please fill all required fields`);
                    return;
                }
            }
        }
        
        setSubmitting(true);
        setError('');
        
        try {
            const res = await fetch(`${API_BASE_URL}/api/submit-interview-feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    feedback_id: feedbackId,
                    candidate_attended: formData.candidate_attended,
                    technical_configuration: parseInt(formData.technical_configuration) || 0,
                    technical_customization: parseInt(formData.technical_customization) || 0,
                    communication_skills: parseInt(formData.communication_skills) || 0,
                    leadership_abilities: parseInt(formData.leadership_abilities) || 0,
                    enthusiasm: parseInt(formData.enthusiasm) || 0,
                    teamwork: parseInt(formData.teamwork) || 0,
                    attitude: parseInt(formData.attitude) || 0,
                    interview_outcome: formData.interview_outcome
                })
            });
            
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.detail || 'Failed to submit feedback');
            }
            
            const data = await res.json();
            if (data.success) {
                alert('✅ Feedback submitted successfully!');
                navigate('/');
            } else {
                throw new Error(data.message || 'Failed to submit feedback');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to submit feedback. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };
    
    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '48px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div style={{
                    maxWidth: '800px',
                    width: '100%',
                    background: 'white',
                    borderRadius: '20px',
                    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
                    padding: '48px'
                }}>
                    <div style={{
                        textAlign: 'center',
                        padding: '32px'
                    }}>
                        <div style={{
                            display: 'inline-block',
                            width: '50px',
                            height: '50px',
                            border: '4px solid #667eea',
                            borderTop: '4px solid transparent',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }} />
                        <p style={{
                            marginTop: '20px',
                            fontSize: '16px',
                            color: '#64748b',
                            fontWeight: '500'
                        }}>Loading feedback form...</p>
                        <style>{`
                            @keyframes spin {
                                0% { transform: rotate(0deg); }
                                100% { transform: rotate(360deg); }
                            }
                        `}</style>
                    </div>
                </div>
            </div>
        );
    }
    
    if (alreadySubmitted) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '48px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div style={{
                    maxWidth: '600px',
                    width: '100%',
                    background: 'white',
                    borderRadius: '20px',
                    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
                    padding: '48px'
                }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                        border: '2px solid #10b981',
                        borderRadius: '16px',
                        padding: '32px',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 20px',
                            boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)'
                        }}>
                            <span style={{ fontSize: '40px' }}>✓</span>
                        </div>
                        <h3 style={{
                            fontSize: '24px',
                            fontWeight: '700',
                            color: '#065f46',
                            margin: '0 0 12px 0'
                        }}>Feedback Already Submitted</h3>
                        <p style={{
                            fontSize: '15px',
                            color: '#047857',
                            margin: 0,
                            lineHeight: '1.6'
                        }}>You have already submitted feedback for this interview. Thank you for your time and input!</p>
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '48px 16px'
        }}>
            <div style={{
                maxWidth: '900px',
                margin: '0 auto',
                background: 'white',
                borderRadius: '20px',
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
                overflow: 'hidden'
            }}>
                {/* Header Section */}
                <div style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    padding: '40px',
                    textAlign: 'center'
                }}>
                    <div style={{
                        width: '100px',
                        height: '100px',
                        background: 'rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 24px',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                    }}>
                        <span style={{ fontSize: '50px' }}>📋</span>
                    </div>
                    <h1 style={{
                        fontSize: '32px',
                        fontWeight: '800',
                        color: 'white',
                        margin: '0 0 12px 0',
                        textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>Interview Feedback Form</h1>
                    <p style={{
                        fontSize: '16px',
                        color: 'rgba(255, 255, 255, 0.9)',
                        margin: 0,
                        fontWeight: '500'
                    }}>
                        Please provide your honest feedback for the interview conducted
                    </p>
                </div>
                
                <div style={{ padding: '40px' }}>
                    {error && (
                        <div style={{
                            background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                            border: '2px solid #ef4444',
                            borderRadius: '12px',
                            padding: '16px 20px',
                            marginBottom: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}>
                            <span style={{ fontSize: '20px' }}>⚠️</span>
                            <span style={{
                                color: '#991b1b',
                                fontSize: '14px',
                                fontWeight: '600'
                            }}>{error}</span>
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit} style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '24px'
                    }}>
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#1e293b',
                                marginBottom: '10px'
                            }}>
                                Did the candidate attend the Interview? <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <div style={{ position: 'relative' }}>
                                <span style={{
                                    position: 'absolute',
                                    left: '16px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    fontSize: '18px',
                                    pointerEvents: 'none'
                                }}>👥</span>
                                <select
                                    name="candidate_attended"
                                    value={formData.candidate_attended}
                                    onChange={handleChange}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '14px 16px 14px 48px',
                                        border: '2px solid #e2e8f0',
                                        borderRadius: '12px',
                                        fontSize: '15px',
                                        fontWeight: '500',
                                        color: '#1e293b',
                                        background: 'white',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        outline: 'none'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = '#667eea';
                                        e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = '#e2e8f0';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                >
                                    <option value="">Select attendance status...</option>
                                    <option value="yes">✅ Yes - Candidate attended</option>
                                    <option value="no">❌ No - Candidate did not attend</option>
                                    <option value="reschedule">🔄 Reschedule required</option>
                                </select>
                            </div>
                        </div>
                    
                        {formData.candidate_attended === 'yes' && (
                            <>
                                <div style={{
                                    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                                    border: '2px solid #3b82f6',
                                    borderRadius: '16px',
                                    padding: '24px',
                                    marginTop: '8px'
                                }}>
                                    <h3 style={{
                                        fontSize: '18px',
                                        fontWeight: '700',
                                        color: '#1e40af',
                                        margin: '0 0 20px 0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px'
                                    }}>
                                        <span style={{ fontSize: '24px' }}>⭐</span>
                                        Rate Candidate Performance (1-5 scale)
                                    </h3>
                                    
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                                        gap: '20px'
                                    }}>
                                        <div>
                                            <label style={{
                                                display: 'block',
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                color: '#1e293b',
                                                marginBottom: '8px'
                                            }}>
                                                🔧 Technical Skills: Configuration <span style={{ color: '#ef4444' }}>*</span>
                                            </label>
                                            <select
                                                name="technical_configuration"
                                                value={formData.technical_configuration}
                                                onChange={handleChange}
                                                required
                                                style={{
                                                    width: '100%',
                                                    padding: '12px 16px',
                                                    border: '2px solid #e2e8f0',
                                                    borderRadius: '10px',
                                                    fontSize: '14px',
                                                    fontWeight: '500',
                                                    color: '#1e293b',
                                                    background: 'white',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease',
                                                    outline: 'none'
                                                }}
                                                onFocus={(e) => {
                                                    e.target.style.borderColor = '#667eea';
                                                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                                                }}
                                                onBlur={(e) => {
                                                    e.target.style.borderColor = '#e2e8f0';
                                                    e.target.style.boxShadow = 'none';
                                                }}
                                            >
                                                <option value="">Rate (1-5)</option>
                                                {[1, 2, 3, 4, 5].map(num => (
                                                    <option key={num} value={num}>
                                                        {num} {num === 5 ? '⭐ Excellent' : num === 4 ? '👍 Good' : num === 3 ? '👌 Average' : num === 2 ? '⚠️ Below Average' : '❌ Poor'}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                
                                        <div>
                                            <label style={{
                                                display: 'block',
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                color: '#1e293b',
                                                marginBottom: '8px'
                                            }}>
                                                🎨 Technical Skills: Customization <span style={{ color: '#ef4444' }}>*</span>
                                            </label>
                                            <select
                                                name="technical_customization"
                                                value={formData.technical_customization}
                                                onChange={handleChange}
                                                required
                                                style={{
                                                    width: '100%',
                                                    padding: '12px 16px',
                                                    border: '2px solid #e2e8f0',
                                                    borderRadius: '10px',
                                                    fontSize: '14px',
                                                    fontWeight: '500',
                                                    color: '#1e293b',
                                                    background: 'white',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease',
                                                    outline: 'none'
                                                }}
                                                onFocus={(e) => {
                                                    e.target.style.borderColor = '#667eea';
                                                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                                                }}
                                                onBlur={(e) => {
                                                    e.target.style.borderColor = '#e2e8f0';
                                                    e.target.style.boxShadow = 'none';
                                                }}
                                            >
                                                <option value="">Rate (1-5)</option>
                                                {[1, 2, 3, 4, 5].map(num => (
                                                    <option key={num} value={num}>
                                                        {num} {num === 5 ? '⭐ Excellent' : num === 4 ? '👍 Good' : num === 3 ? '👌 Average' : num === 2 ? '⚠️ Below Average' : '❌ Poor'}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        
                                        <div>
                                            <label style={{
                                                display: 'block',
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                color: '#1e293b',
                                                marginBottom: '8px'
                                            }}>
                                                💬 Communication Skills <span style={{ color: '#ef4444' }}>*</span>
                                            </label>
                                            <select
                                                name="communication_skills"
                                                value={formData.communication_skills}
                                                onChange={handleChange}
                                                required
                                                style={{
                                                    width: '100%',
                                                    padding: '12px 16px',
                                                    border: '2px solid #e2e8f0',
                                                    borderRadius: '10px',
                                                    fontSize: '14px',
                                                    fontWeight: '500',
                                                    color: '#1e293b',
                                                    background: 'white',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease',
                                                    outline: 'none'
                                                }}
                                                onFocus={(e) => {
                                                    e.target.style.borderColor = '#667eea';
                                                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                                                }}
                                                onBlur={(e) => {
                                                    e.target.style.borderColor = '#e2e8f0';
                                                    e.target.style.boxShadow = 'none';
                                                }}
                                            >
                                                <option value="">Rate (1-5)</option>
                                                {[1, 2, 3, 4, 5].map(num => (
                                                    <option key={num} value={num}>
                                                        {num} {num === 5 ? '⭐ Excellent' : num === 4 ? '👍 Good' : num === 3 ? '👌 Average' : num === 2 ? '⚠️ Below Average' : '❌ Poor'}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        
                                        <div>
                                            <label style={{
                                                display: 'block',
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                color: '#1e293b',
                                                marginBottom: '8px'
                                            }}>
                                                👔 Leadership Abilities <span style={{ color: '#ef4444' }}>*</span>
                                            </label>
                                            <select
                                                name="leadership_abilities"
                                                value={formData.leadership_abilities}
                                                onChange={handleChange}
                                                required
                                                style={{
                                                    width: '100%',
                                                    padding: '12px 16px',
                                                    border: '2px solid #e2e8f0',
                                                    borderRadius: '10px',
                                                    fontSize: '14px',
                                                    fontWeight: '500',
                                                    color: '#1e293b',
                                                    background: 'white',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease',
                                                    outline: 'none'
                                                }}
                                                onFocus={(e) => {
                                                    e.target.style.borderColor = '#667eea';
                                                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                                                }}
                                                onBlur={(e) => {
                                                    e.target.style.borderColor = '#e2e8f0';
                                                    e.target.style.boxShadow = 'none';
                                                }}
                                            >
                                                <option value="">Rate (1-5)</option>
                                                {[1, 2, 3, 4, 5].map(num => (
                                                    <option key={num} value={num}>
                                                        {num} {num === 5 ? '⭐ Excellent' : num === 4 ? '👍 Good' : num === 3 ? '👌 Average' : num === 2 ? '⚠️ Below Average' : '❌ Poor'}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        
                                        <div>
                                            <label style={{
                                                display: 'block',
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                color: '#1e293b',
                                                marginBottom: '8px'
                                            }}>
                                                🔥 Enthusiasm <span style={{ color: '#ef4444' }}>*</span>
                                            </label>
                                            <select
                                                name="enthusiasm"
                                                value={formData.enthusiasm}
                                                onChange={handleChange}
                                                required
                                                style={{
                                                    width: '100%',
                                                    padding: '12px 16px',
                                                    border: '2px solid #e2e8f0',
                                                    borderRadius: '10px',
                                                    fontSize: '14px',
                                                    fontWeight: '500',
                                                    color: '#1e293b',
                                                    background: 'white',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease',
                                                    outline: 'none'
                                                }}
                                                onFocus={(e) => {
                                                    e.target.style.borderColor = '#667eea';
                                                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                                                }}
                                                onBlur={(e) => {
                                                    e.target.style.borderColor = '#e2e8f0';
                                                    e.target.style.boxShadow = 'none';
                                                }}
                                            >
                                                <option value="">Rate (1-5)</option>
                                                {[1, 2, 3, 4, 5].map(num => (
                                                    <option key={num} value={num}>
                                                        {num} {num === 5 ? '⭐ Excellent' : num === 4 ? '👍 Good' : num === 3 ? '👌 Average' : num === 2 ? '⚠️ Below Average' : '❌ Poor'}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        
                                        <div>
                                            <label style={{
                                                display: 'block',
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                color: '#1e293b',
                                                marginBottom: '8px'
                                            }}>
                                                🤝 Team Work <span style={{ color: '#ef4444' }}>*</span>
                                            </label>
                                            <select
                                                name="teamwork"
                                                value={formData.teamwork}
                                                onChange={handleChange}
                                                required
                                                style={{
                                                    width: '100%',
                                                    padding: '12px 16px',
                                                    border: '2px solid #e2e8f0',
                                                    borderRadius: '10px',
                                                    fontSize: '14px',
                                                    fontWeight: '500',
                                                    color: '#1e293b',
                                                    background: 'white',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease',
                                                    outline: 'none'
                                                }}
                                                onFocus={(e) => {
                                                    e.target.style.borderColor = '#667eea';
                                                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                                                }}
                                                onBlur={(e) => {
                                                    e.target.style.borderColor = '#e2e8f0';
                                                    e.target.style.boxShadow = 'none';
                                                }}
                                            >
                                                <option value="">Rate (1-5)</option>
                                                {[1, 2, 3, 4, 5].map(num => (
                                                    <option key={num} value={num}>
                                                        {num} {num === 5 ? '⭐ Excellent' : num === 4 ? '👍 Good' : num === 3 ? '👌 Average' : num === 2 ? '⚠️ Below Average' : '❌ Poor'}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        
                                        <div>
                                            <label style={{
                                                display: 'block',
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                color: '#1e293b',
                                                marginBottom: '8px'
                                            }}>
                                                😊 Attitude <span style={{ color: '#ef4444' }}>*</span>
                                            </label>
                                            <select
                                                name="attitude"
                                                value={formData.attitude}
                                                onChange={handleChange}
                                                required
                                                style={{
                                                    width: '100%',
                                                    padding: '12px 16px',
                                                    border: '2px solid #e2e8f0',
                                                    borderRadius: '10px',
                                                    fontSize: '14px',
                                                    fontWeight: '500',
                                                    color: '#1e293b',
                                                    background: 'white',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease',
                                                    outline: 'none'
                                                }}
                                                onFocus={(e) => {
                                                    e.target.style.borderColor = '#667eea';
                                                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                                                }}
                                                onBlur={(e) => {
                                                    e.target.style.borderColor = '#e2e8f0';
                                                    e.target.style.boxShadow = 'none';
                                                }}
                                            >
                                                <option value="">Rate (1-5)</option>
                                                {[1, 2, 3, 4, 5].map(num => (
                                                    <option key={num} value={num}>
                                                        {num} {num === 5 ? '⭐ Excellent' : num === 4 ? '👍 Good' : num === 3 ? '👌 Average' : num === 2 ? '⚠️ Below Average' : '❌ Poor'}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                
                                <div style={{
                                    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                                    border: '2px solid #f59e0b',
                                    borderRadius: '16px',
                                    padding: '24px'
                                }}>
                                    <h3 style={{
                                        fontSize: '18px',
                                        fontWeight: '700',
                                        color: '#92400e',
                                        margin: '0 0 16px 0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px'
                                    }}>
                                        <span style={{ fontSize: '24px' }}>🎯</span>
                                        Final Decision
                                    </h3>
                                    
                                    <label style={{
                                        display: 'block',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        color: '#1e293b',
                                        marginBottom: '8px'
                                    }}>
                                        Interview Outcome <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <select
                                        name="interview_outcome"
                                        value={formData.interview_outcome}
                                        onChange={handleChange}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '14px 16px',
                                            border: '2px solid #e2e8f0',
                                            borderRadius: '10px',
                                            fontSize: '15px',
                                            fontWeight: '600',
                                            color: '#1e293b',
                                            background: 'white',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            outline: 'none'
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = '#667eea';
                                            e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = '#e2e8f0';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    >
                                        <option value="">Select final decision...</option>
                                        <option value="selected">✅ Selected - Hire the candidate</option>
                                        <option value="proceed">➡️ Proceed - Next round of interview</option>
                                        <option value="rejected">❌ Rejected - Not suitable</option>
                                    </select>
                                </div>
                            </>
                        )}
                    
                        <button
                            type="submit"
                            disabled={submitting}
                            style={{
                                width: '100%',
                                padding: '18px',
                                background: submitting 
                                    ? 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)' 
                                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                fontSize: '16px',
                                fontWeight: '700',
                                cursor: submitting ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s ease',
                                boxShadow: submitting 
                                    ? 'none' 
                                    : '0 10px 25px rgba(102, 126, 234, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                marginTop: '8px'
                            }}
                            onMouseEnter={(e) => {
                                if (!submitting) {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 15px 35px rgba(102, 126, 234, 0.4)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!submitting) {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(102, 126, 234, 0.3)';
                                }
                            }}
                        >
                            {submitting ? (
                                <>
                                    <div style={{
                                        width: '20px',
                                        height: '20px',
                                        border: '3px solid rgba(255, 255, 255, 0.3)',
                                        borderTop: '3px solid white',
                                        borderRadius: '50%',
                                        animation: 'spin 1s linear infinite'
                                    }} />
                                    <span>Submitting Feedback...</span>
                                </>
                            ) : (
                                <>
                                    <span style={{ fontSize: '20px' }}>📤</span>
                                    <span>Submit Feedback</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

