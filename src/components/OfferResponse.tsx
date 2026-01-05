import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

export function OfferResponse() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    
    const offerId = searchParams.get('offer_id');
    const response = searchParams.get('response'); // 'accept' or 'reject'
    
    useEffect(() => {
        if (!offerId) {
            setError('Invalid offer link');
        }
    }, [offerId]);
    
    const handleSubmit = async () => {
        if (!offerId || !response) return;
        
        setLoading(true);
        setError('');
        
        try {
            const res = await fetch(`${API_BASE_URL}/api/submit-offer-response`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    offer_id: offerId,
                    response: response
                })
            });
            
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.detail || 'Failed to submit response');
            }
            
            setSubmitted(true);
        } catch (err: any) {
            setError(err.message || 'Error submitting response');
        } finally {
            setLoading(false);
        }
    };
    
    if (submitted) {
        return (
            <div style={{
                minHeight: '100vh',
                background: response === 'accept' 
                    ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' 
                    : 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
                padding: '48px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div style={{
                    background: 'white',
                    borderRadius: '20px',
                    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
                    padding: '48px',
                    maxWidth: '500px',
                    width: '100%',
                    textAlign: 'center'
                }}>
                    <div style={{
                        width: '100px',
                        height: '100px',
                        background: response === 'accept' 
                            ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' 
                            : 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 24px',
                        boxShadow: response === 'accept' 
                            ? '0 8px 20px rgba(16, 185, 129, 0.3)' 
                            : '0 8px 20px rgba(239, 68, 68, 0.3)'
                    }}>
                        <span style={{ fontSize: '50px' }}>
                            {response === 'accept' ? '✅' : '❌'}
                        </span>
                    </div>
                    <h2 style={{
                        fontSize: '32px',
                        fontWeight: '800',
                        color: '#1e293b',
                        margin: '0 0 16px 0'
                    }}>
                        {response === 'accept' ? 'Offer Accepted!' : 'Offer Declined'}
                    </h2>
                    <p style={{
                        fontSize: '16px',
                        color: '#64748b',
                        margin: '0 0 32px 0',
                        lineHeight: '1.6'
                    }}>
                        {response === 'accept' 
                            ? 'Thank you for accepting the offer! We are thrilled to have you join our team. We will be in touch with you soon with next steps.'
                            : 'Thank you for your response. We appreciate your time and wish you the best in your future endeavors.'}
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        style={{
                            padding: '14px 32px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '16px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 12px 28px rgba(102, 126, 234, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.3)';
                        }}
                    >
                        Go to Home
                    </button>
                </div>
            </div>
        );
    }
    
    return (
        <div style={{
            minHeight: '100vh',
            background: response === 'accept' 
                ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' 
                : 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
            padding: '48px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <div style={{
                background: 'white',
                borderRadius: '20px',
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
                padding: '48px',
                maxWidth: '500px',
                width: '100%'
            }}>
                {/* Header */}
                <div style={{
                    textAlign: 'center',
                    marginBottom: '32px'
                }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        background: response === 'accept' 
                            ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' 
                            : 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 20px',
                        border: `2px solid ${response === 'accept' ? '#10b981' : '#ef4444'}`
                    }}>
                        <span style={{ fontSize: '40px' }}>
                            {response === 'accept' ? '🎉' : '⚠️'}
                        </span>
                    </div>
                    <h2 style={{
                        fontSize: '28px',
                        fontWeight: '800',
                        color: '#1e293b',
                        margin: '0 0 12px 0'
                    }}>
                        {response === 'accept' ? 'Accept Offer' : 'Reject Offer'}
                    </h2>
                    <p style={{
                        fontSize: '15px',
                        color: '#64748b',
                        margin: 0
                    }}>
                        Please confirm your decision
                    </p>
                </div>
                
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
                
                <div style={{
                    background: response === 'accept' 
                        ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' 
                        : 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                    border: `2px solid ${response === 'accept' ? '#10b981' : '#ef4444'}`,
                    borderRadius: '16px',
                    padding: '24px',
                    marginBottom: '32px',
                    textAlign: 'center'
                }}>
                    <p style={{
                        fontSize: '16px',
                        color: '#1e293b',
                        margin: 0,
                        fontWeight: '600',
                        lineHeight: '1.6'
                    }}>
                        Are you sure you want to <strong style={{ color: response === 'accept' ? '#10b981' : '#ef4444' }}>
                            {response === 'accept' ? 'accept' : 'reject'}
                        </strong> this offer?
                    </p>
                    <p style={{
                        fontSize: '14px',
                        color: '#64748b',
                        margin: '12px 0 0 0'
                    }}>
                        {response === 'accept' 
                            ? 'This action will confirm your acceptance of the job offer.'
                            : 'This action will decline the job offer. This cannot be undone.'}
                    </p>
                </div>
                
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                }}>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '18px',
                            background: loading 
                                ? 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)' 
                                : response === 'accept'
                                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                    : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '16px',
                            fontWeight: '700',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: loading 
                                ? 'none' 
                                : response === 'accept'
                                    ? '0 8px 20px rgba(16, 185, 129, 0.3)'
                                    : '0 8px 20px rgba(239, 68, 68, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px'
                        }}
                        onMouseEnter={(e) => {
                            if (!loading) {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = response === 'accept'
                                    ? '0 12px 28px rgba(16, 185, 129, 0.4)'
                                    : '0 12px 28px rgba(239, 68, 68, 0.4)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!loading) {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = response === 'accept'
                                    ? '0 8px 20px rgba(16, 185, 129, 0.3)'
                                    : '0 8px 20px rgba(239, 68, 68, 0.3)';
                            }
                        }}
                    >
                        {loading ? (
                            <>
                                <div style={{
                                    width: '20px',
                                    height: '20px',
                                    border: '3px solid rgba(255, 255, 255, 0.3)',
                                    borderTop: '3px solid white',
                                    borderRadius: '50%',
                                    animation: 'spin 1s linear infinite'
                                }} />
                                <span>Processing...</span>
                            </>
                        ) : (
                            <>
                                <span style={{ fontSize: '20px' }}>
                                    {response === 'accept' ? '✅' : '❌'}
                                </span>
                                <span>{response === 'accept' ? 'Yes, Accept Offer' : 'Yes, Reject Offer'}</span>
                            </>
                        )}
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        style={{
                            width: '100%',
                            padding: '16px',
                            background: 'white',
                            color: '#64748b',
                            border: '2px solid #e2e8f0',
                            borderRadius: '12px',
                            fontSize: '15px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f8fafc';
                            e.currentTarget.style.borderColor = '#cbd5e1';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'white';
                            e.currentTarget.style.borderColor = '#e2e8f0';
                        }}
                    >
                        Cancel
                    </button>
                </div>
                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        </div>
    );
}

