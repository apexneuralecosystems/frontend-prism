import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

export function InviteAccept() {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [action, setAction] = useState<'accept' | 'reject' | null>(null);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleRespond = async (actionType: 'accept' | 'reject') => {
        if (actionType === 'accept') {
            if (!password) {
                setMessage({ type: 'error', text: 'Please enter a password' });
                return;
            }
            if (password.length < 8) {
                setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
                return;
            }
            if (password !== confirmPassword) {
                setMessage({ type: 'error', text: 'Passwords do not match' });
                return;
            }
        }

        setLoading(true);
        setMessage(null);

        try {
            const res = await fetch(API_ENDPOINTS.RESPOND_INVITE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    action: actionType,
                    password: actionType === 'accept' ? password : undefined
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.detail || 'Failed to respond to invitation');
            }

            if (actionType === 'accept') {
                setMessage({ type: 'success', text: 'Account created successfully! You can now login.' });
                setTimeout(() => {
                    navigate('/');
                }, 3000);
            } else {
                setMessage({ type: 'success', text: 'Invitation rejected.' });
            }
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'An error occurred' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '20px'
        }}>
            <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '40px',
                maxWidth: '500px',
                width: '100%',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}>
                <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '20px', textAlign: 'center' }}>
                    Organization Invitation
                </h1>

                {!action ? (
                    <div>
                        <p style={{ marginBottom: '20px', textAlign: 'center' }}>
                            You have been invited to join an organization. Would you like to accept or reject this invitation?
                        </p>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => setAction('accept')}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    background: '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    fontWeight: '600'
                                }}
                            >
                                <CheckCircle style={{ width: '20px', height: '20px', display: 'inline', marginRight: '8px' }} />
                                Accept
                            </button>
                            <button
                                onClick={() => setAction('reject')}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    background: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    fontWeight: '600'
                                }}
                            >
                                <XCircle style={{ width: '20px', height: '20px', display: 'inline', marginRight: '8px' }} />
                                Reject
                            </button>
                        </div>
                    </div>
                ) : action === 'accept' ? (
                    <div>
                        <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Set Your Password</h2>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter password (min 8 characters)"
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '1px solid #ddd',
                                    borderRadius: '6px',
                                    fontSize: '16px'
                                }}
                            />
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm password"
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '1px solid #ddd',
                                    borderRadius: '6px',
                                    fontSize: '16px'
                                }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => handleRespond('accept')}
                                disabled={loading}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    background: '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    opacity: loading ? 0.6 : 1
                                }}
                            >
                                {loading ? 'Processing...' : 'Accept & Create Account'}
                            </button>
                            <button
                                onClick={() => setAction(null)}
                                style={{
                                    padding: '12px 20px',
                                    background: '#e5e7eb',
                                    color: '#374151',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '16px'
                                }}
                            >
                                Back
                            </button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <p style={{ marginBottom: '20px' }}>Are you sure you want to reject this invitation?</p>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => handleRespond('reject')}
                                disabled={loading}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    background: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    opacity: loading ? 0.6 : 1
                                }}
                            >
                                {loading ? 'Processing...' : 'Confirm Reject'}
                            </button>
                            <button
                                onClick={() => setAction(null)}
                                style={{
                                    padding: '12px 20px',
                                    background: '#e5e7eb',
                                    color: '#374151',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '16px'
                                }}
                            >
                                Back
                            </button>
                        </div>
                    </div>
                )}

                {message && (
                    <div style={{
                        marginTop: '20px',
                        padding: '12px',
                        background: message.type === 'success' ? '#d1fae5' : '#fee2e2',
                        color: message.type === 'success' ? '#065f46' : '#991b1b',
                        borderRadius: '6px',
                        textAlign: 'center'
                    }}>
                        {message.text}
                    </div>
                )}
            </div>
        </div>
    );
}
