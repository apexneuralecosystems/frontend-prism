import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, UserCheck, FileText, Mail, User, Calendar } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

export function ReviewForm() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const reviewId = searchParams.get('review_id');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [reviewData, setReviewData] = useState<any>(null);
    const [selectedDecision, setSelectedDecision] = useState<string>('');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        if (!reviewId) {
            setMessage({ type: 'error', text: 'Invalid review form link. Missing review ID.' });
            setLoading(false);
            return;
        }
        fetchReviewData(reviewId);
    }, [reviewId]);

    const fetchReviewData = async (id: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/review-request/${id}`);
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setReviewData(data);
                    // If already submitted, show message
                    if (data.already_submitted) {
                        setMessage({ type: 'success', text: 'This review has already been submitted.' });
                    }
                } else {
                    setMessage({ type: 'error', text: 'Review request not found or expired' });
                }
            } else {
                const errorData = await res.json().catch(() => ({ detail: 'Review request not found' }));
                setMessage({ type: 'error', text: errorData.detail || 'Review request not found or expired' });
            }
        } catch (err) {
            console.error('Failed to fetch review data:', err);
            setMessage({ type: 'error', text: 'Error loading review request. Please check your connection.' });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!selectedDecision || !reviewId) {
            setMessage({ type: 'error', text: 'Please select a decision' });
            return;
        }

        setSubmitting(true);
        setMessage(null);

        try {
            const res = await fetch(`${API_BASE_URL}/api/review-form/${reviewId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ decision: selectedDecision })
            });

            const responseData = await res.json().catch(() => ({}));

            if (res.ok && responseData.success) {
                setMessage({ type: 'success', text: 'Your review has been submitted successfully! Thank you.' });
                // Disable form after successful submission
                setReviewData({ ...reviewData, already_submitted: true, status: selectedDecision });
                setTimeout(() => {
                    navigate('/');
                }, 3000);
            } else {
                setMessage({ type: 'error', text: responseData.detail || 'Failed to submit review. Please try again.' });
            }
        } catch (err: any) {
            console.error('Failed to submit review:', err);
            setMessage({ type: 'error', text: err.message || 'Error submitting review. Please check your connection and try again.' });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #f8fafc, #e0f2fe)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ 
                        width: '48px', 
                        height: '48px', 
                        border: '4px solid #2563eb', 
                        borderTop: '4px solid transparent', 
                        borderRadius: '50%', 
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 16px'
                    }}></div>
                    <p style={{ color: '#475569', fontSize: '16px', fontWeight: '500' }}>Loading review request...</p>
                </div>
            </div>
        );
    }

    if (!reviewData) {
        return (
            <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #f8fafc, #e0f2fe)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ 
                    background: '#ffffff', 
                    padding: '40px', 
                    borderRadius: '12px', 
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    textAlign: 'center',
                    maxWidth: '500px'
                }}>
                    <XCircle style={{ width: '64px', height: '64px', color: '#dc2626', margin: '0 auto 16px' }} />
                    <h2 style={{ color: '#1e293b', margin: '0 0 8px 0' }}>Review Not Found</h2>
                    <p style={{ color: '#64748b', margin: 0 }}>This review request is invalid or has expired.</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #f8fafc, #e0f2fe)', padding: '40px 20px' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ 
                    background: 'linear-gradient(to right, #6366f1, #8b5cf6)',
                    borderRadius: '12px',
                    padding: '24px',
                    marginBottom: '24px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}>
                    <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', margin: '0 0 8px 0' }}>
                        Candidate Review Request
                    </h1>
                    <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.9)', margin: 0 }}>
                        Please review the candidate profile and provide your decision
                    </p>
                </div>

                {/* Candidate Info Card */}
                <div style={{ 
                    background: '#ffffff', 
                    borderRadius: '12px', 
                    padding: '24px', 
                    marginBottom: '24px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                    border: '1px solid #e2e8f0'
                }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1e293b', margin: '0 0 20px 0' }}>
                        Candidate Information
                    </h2>
                    
                    <div style={{ display: 'grid', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <User style={{ width: '20px', height: '20px', color: '#64748b' }} />
                            <div>
                                <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>Name</p>
                                <p style={{ margin: 0, fontSize: '16px', color: '#1e293b', fontWeight: '600' }}>{reviewData.applicant_name}</p>
                            </div>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Mail style={{ width: '20px', height: '20px', color: '#64748b' }} />
                            <div>
                                <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>Email</p>
                                <p style={{ margin: 0, fontSize: '16px', color: '#1e293b', fontWeight: '600' }}>{reviewData.applicant_email}</p>
                            </div>
                        </div>

                        {reviewData.resume_url && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <FileText style={{ width: '20px', height: '20px', color: '#64748b' }} />
                                <div style={{ flex: 1 }}>
                                    <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>Resume</p>
                                    <a 
                                        href={`${API_BASE_URL}${reviewData.resume_url}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        style={{ 
                                            color: '#2563eb',
                                            textDecoration: 'none',
                                            fontWeight: '500',
                                            fontSize: '14px'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                                        onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                                    >
                                        View Resume →
                                    </a>
                                </div>
                            </div>
                        )}

                        {reviewData.additional_details && (
                            <div style={{ 
                                marginTop: '8px',
                                padding: '16px',
                                background: 'linear-gradient(to bottom right, #f0f9ff, #e0f2fe)',
                                borderRadius: '8px',
                                border: '1px solid #bae6fd'
                            }}>
                                <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#0c4a6e', fontWeight: '600' }}>Additional Details</p>
                                <div style={{ fontSize: '13px', lineHeight: '1.6', color: '#475569', whiteSpace: 'pre-wrap' }}>
                                    {reviewData.additional_details}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Decision Form */}
                <div style={{ 
                    background: '#ffffff', 
                    borderRadius: '12px', 
                    padding: '24px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                    border: '1px solid #e2e8f0'
                }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1e293b', margin: '0 0 20px 0' }}>
                        Your Decision
                    </h2>

                    <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
                        <label style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '12px',
                            padding: '16px',
                            border: selectedDecision === 'selected' ? '2px solid #22c55e' : '2px solid #e2e8f0',
                            borderRadius: '8px',
                            cursor: reviewData?.already_submitted ? 'not-allowed' : 'pointer',
                            background: selectedDecision === 'selected' ? '#f0fdf4' : '#ffffff',
                            opacity: reviewData?.already_submitted ? 0.6 : 1,
                            transition: 'all 0.15s ease'
                        }}
                        onClick={() => !reviewData?.already_submitted && setSelectedDecision('selected')}
                        >
                            <input 
                                type="radio" 
                                name="decision" 
                                value="selected"
                                checked={selectedDecision === 'selected'}
                                onChange={() => !reviewData?.already_submitted && setSelectedDecision('selected')}
                                disabled={reviewData?.already_submitted}
                                style={{ width: '20px', height: '20px', cursor: reviewData?.already_submitted ? 'not-allowed' : 'pointer' }}
                            />
                            <CheckCircle style={{ width: '24px', height: '24px', color: '#22c55e' }} />
                            <div>
                                <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>Selected</p>
                                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Candidate is selected for the position</p>
                            </div>
                        </label>

                        <label style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '12px',
                            padding: '16px',
                            border: selectedDecision === 'selected_for_interview' ? '2px solid #3b82f6' : '2px solid #e2e8f0',
                            borderRadius: '8px',
                            cursor: reviewData?.already_submitted ? 'not-allowed' : 'pointer',
                            background: selectedDecision === 'selected_for_interview' ? '#eff6ff' : '#ffffff',
                            opacity: reviewData?.already_submitted ? 0.6 : 1,
                            transition: 'all 0.15s ease'
                        }}
                        onClick={() => !reviewData?.already_submitted && setSelectedDecision('selected_for_interview')}
                        >
                            <input 
                                type="radio" 
                                name="decision" 
                                value="selected_for_interview"
                                checked={selectedDecision === 'selected_for_interview'}
                                onChange={() => !reviewData?.already_submitted && setSelectedDecision('selected_for_interview')}
                                disabled={reviewData?.already_submitted}
                                style={{ width: '20px', height: '20px', cursor: reviewData?.already_submitted ? 'not-allowed' : 'pointer' }}
                            />
                            <UserCheck style={{ width: '24px', height: '24px', color: '#3b82f6' }} />
                            <div>
                                <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>Interview</p>
                                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Candidate should proceed to interview rounds</p>
                            </div>
                        </label>

                        <label style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '12px',
                            padding: '16px',
                            border: selectedDecision === 'rejected' ? '2px solid #dc2626' : '2px solid #e2e8f0',
                            borderRadius: '8px',
                            cursor: reviewData?.already_submitted ? 'not-allowed' : 'pointer',
                            background: selectedDecision === 'rejected' ? '#fef2f2' : '#ffffff',
                            opacity: reviewData?.already_submitted ? 0.6 : 1,
                            transition: 'all 0.15s ease'
                        }}
                        onClick={() => !reviewData?.already_submitted && setSelectedDecision('rejected')}
                        >
                            <input 
                                type="radio" 
                                name="decision" 
                                value="rejected"
                                checked={selectedDecision === 'rejected'}
                                onChange={() => !reviewData?.already_submitted && setSelectedDecision('rejected')}
                                disabled={reviewData?.already_submitted}
                                style={{ width: '20px', height: '20px', cursor: reviewData?.already_submitted ? 'not-allowed' : 'pointer' }}
                            />
                            <XCircle style={{ width: '24px', height: '24px', color: '#dc2626' }} />
                            <div>
                                <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>Rejected</p>
                                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Candidate is not suitable for this position</p>
                            </div>
                        </label>
                    </div>

                    {message && (
                        <div style={{ 
                            padding: '12px 16px',
                            borderRadius: '8px',
                            marginBottom: '16px',
                            background: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
                            border: `1px solid ${message.type === 'success' ? '#86efac' : '#fca5a5'}`,
                            color: message.type === 'success' ? '#15803d' : '#dc2626'
                        }}>
                            {message.text}
                        </div>
                    )}

                    {reviewData?.already_submitted ? (
                        <div style={{
                            padding: '16px',
                            background: '#f0fdf4',
                            border: '2px solid #22c55e',
                            borderRadius: '8px',
                            textAlign: 'center'
                        }}>
                            <p style={{ margin: 0, color: '#15803d', fontWeight: '600' }}>
                                ✓ Review already submitted: {reviewData.status === 'selected' ? 'Selected' : reviewData.status === 'rejected' ? 'Rejected' : 'Interview'}
                            </p>
                        </div>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={!selectedDecision || submitting || reviewData?.already_submitted}
                            style={{
                                width: '100%',
                                padding: '14px 24px',
                                fontSize: '16px',
                                fontWeight: '600',
                                color: '#ffffff',
                                background: (!selectedDecision || submitting || reviewData?.already_submitted) 
                                    ? '#cbd5e1' 
                                    : 'linear-gradient(to right, #2563eb, #1d4ed8)',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: (!selectedDecision || submitting || reviewData?.already_submitted) ? 'not-allowed' : 'pointer',
                                transition: 'all 0.15s ease',
                                boxShadow: (!selectedDecision || submitting || reviewData?.already_submitted) 
                                    ? 'none' 
                                    : '0 4px 12px rgba(37, 99, 235, 0.3)'
                            }}
                            onMouseEnter={(e) => {
                                if (selectedDecision && !submitting && !reviewData?.already_submitted) {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.4)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (selectedDecision && !submitting && !reviewData?.already_submitted) {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)';
                                }
                            }}
                        >
                            {submitting ? (
                                <>
                                    <div style={{ 
                                        display: 'inline-block',
                                        width: '16px', 
                                        height: '16px', 
                                        border: '2px solid #ffffff', 
                                        borderTop: '2px solid transparent', 
                                        borderRadius: '50%', 
                                        animation: 'spin 1s linear infinite',
                                        marginRight: '8px',
                                        verticalAlign: 'middle'
                                    }}></div>
                                    Submitting...
                                </>
                            ) : (
                                'Submit Review'
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Add keyframe animations */}
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

