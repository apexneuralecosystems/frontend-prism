import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authenticatedFetch } from '../utils/auth';
import { API_ENDPOINTS } from '../config/api';
import { CheckCircle, X, Loader2 } from 'lucide-react';

export function PaymentSuccess() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [creditsAdded, setCreditsAdded] = useState(0);
    const [totalCredits, setTotalCredits] = useState(0);

    useEffect(() => {
        const capturePayment = async () => {
            const orderId = searchParams.get('token') || searchParams.get('order_id');
            const userData = localStorage.getItem('user');
            
            if (!orderId) {
                setError('No order ID found in URL');
                setLoading(false);
                return;
            }

            if (!userData) {
                setError('User not authenticated');
                setLoading(false);
                return;
            }

            const parsedUser = JSON.parse(userData);
            const orgEmail = parsedUser.org_email || parsedUser.email;

            try {
                const res = await authenticatedFetch(
                    API_ENDPOINTS.CAPTURE_ORDER,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            order_id: orderId,
                            org_email: orgEmail
                        })
                    },
                    navigate
                );

                if (res?.ok) {
                    const result = await res.json();
                    setSuccess(true);
                    setCreditsAdded(result.credits_added || 0);
                    setTotalCredits(result.total_credits || 0);
                } else {
                    const errorData = await res?.json();
                    throw new Error(errorData.detail || 'Failed to capture payment');
                }
            } catch (err: any) {
                console.error('Payment capture error:', err);
                setError(err.message || 'Failed to process payment');
            } finally {
                setLoading(false);
            }
        };

        capturePayment();
    }, [searchParams, navigate]);

    if (loading) {
        return (
            <>
                <style>{`
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                `}</style>
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(to bottom right, #f8fafc, #dbeafe)'
                }}>
                    <div style={{
                        textAlign: 'center',
                        background: '#ffffff',
                        padding: '40px',
                        borderRadius: '12px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                    }}>
                        <Loader2 style={{
                            width: '48px',
                            height: '48px',
                            color: '#2563eb',
                            margin: '0 auto 16px',
                            animation: 'spin 1s linear infinite'
                        }} />
                        <p style={{
                            fontSize: '16px',
                            color: '#64748b',
                            margin: 0
                        }}>Processing payment...</p>
                    </div>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(to bottom right, #f8fafc, #dbeafe)'
            }}>
                <div style={{
                    textAlign: 'center',
                    background: '#ffffff',
                    padding: '40px',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    maxWidth: '500px'
                }}>
                    <X style={{
                        width: '64px',
                        height: '64px',
                        color: '#dc2626',
                        margin: '0 auto 16px'
                    }} />
                    <h2 style={{
                        fontSize: '24px',
                        fontWeight: '600',
                        marginBottom: '8px',
                        color: '#0f172a'
                    }}>Payment Failed</h2>
                    <p style={{
                        fontSize: '16px',
                        color: '#64748b',
                        marginBottom: '24px'
                    }}>{error}</p>
                    <button
                        onClick={() => navigate('/organization-profile')}
                        style={{
                            padding: '10px 24px',
                            background: '#2563eb',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            fontSize: '14px',
                            transition: 'background 0.15s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#1d4ed8'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#2563eb'}
                    >
                        Go to Profile
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(to bottom right, #f8fafc, #dbeafe)'
        }}>
            <div style={{
                textAlign: 'center',
                background: '#ffffff',
                padding: '40px',
                borderRadius: '12px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                maxWidth: '500px'
            }}>
                <CheckCircle style={{
                    width: '64px',
                    height: '64px',
                    color: '#16a34a',
                    margin: '0 auto 16px'
                }} />
                <h2 style={{
                    fontSize: '24px',
                    fontWeight: '600',
                    marginBottom: '8px',
                    color: '#0f172a'
                }}>Payment Successful!</h2>
                <p style={{
                    fontSize: '16px',
                    color: '#64748b',
                    marginBottom: '16px'
                }}>
                    {creditsAdded} credit(s) have been added to your account.
                </p>
                <div style={{
                    padding: '16px',
                    background: '#f0fdf4',
                    borderRadius: '8px',
                    marginBottom: '24px',
                    border: '1px solid #bbf7d0'
                }}>
                    <p style={{
                        fontSize: '14px',
                        color: '#64748b',
                        margin: '0 0 4px 0'
                    }}>Total Credits</p>
                    <p style={{
                        fontSize: '32px',
                        fontWeight: '700',
                        color: '#16a34a',
                        margin: 0
                    }}>{totalCredits}</p>
                </div>
                <button
                    onClick={() => {
                        // Set flag to trigger refresh on profile page
                        localStorage.setItem('payment_success', 'true');
                        navigate('/organization-profile?payment_success=true');
                    }}
                    style={{
                        padding: '10px 24px',
                        background: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        fontSize: '14px',
                        transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#1d4ed8'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#2563eb'}
                >
                    Go to Profile
                </button>
            </div>
        </div>
    );
}
