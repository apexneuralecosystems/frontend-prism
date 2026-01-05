import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import { Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export function ScheduleInterview() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const webhookId = searchParams.get('webhook_id');
    const orgEmail = searchParams.get('orgEmail');
    const orgName = searchParams.get('orgName');
    const round = searchParams.get('round');
    const team = searchParams.get('team');
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [freeSlots, setFreeSlots] = useState<Record<string, any[]>>({});
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedSlot, setSelectedSlot] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [alreadyScheduled, setAlreadyScheduled] = useState(false);
    const [scheduledData, setScheduledData] = useState<any>(null);
    
    useEffect(() => {
        if (!webhookId || !orgEmail || !orgName || !team) {
            setError('Invalid form link. Missing required parameters.');
            return;
        }
        
        // Check if already scheduled first
        checkWebhookStatus();
    }, [webhookId, orgEmail, orgName, team]);
    
    const checkWebhookStatus = async () => {
        if (!webhookId) {
            // If no webhook_id, just fetch slots
            fetchFreeSlots();
            return;
        }
        
        try {
            const res = await fetch(`${API_BASE_URL}/api/check-webhook-status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ webhook_id: webhookId })
            });
            
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.submitted) {
                    // Already scheduled - show message
                    setAlreadyScheduled(true);
                    setScheduledData(data.data);
                    setLoading(false);
                } else {
                    // Not scheduled yet, fetch free slots (which will exclude already booked slots)
                    fetchFreeSlots();
                }
            } else {
                // If check fails, still try to fetch slots
                fetchFreeSlots();
            }
        } catch (err) {
            // If check fails, still try to fetch slots
            fetchFreeSlots();
        }
    };
    
    const fetchFreeSlots = async () => {
        setLoading(true);
        setError('');
        
        try {
            const res = await fetch(`${API_BASE_URL}/api/get-free-slots`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orgEmail,
                    orgName,
                    teamName: team,
                    webhook_id: webhookId || undefined
                })
            });
            
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.detail || 'Failed to fetch available slots');
            }
            
            const data = await res.json();
            if (data.success) {
                if (data.no_slots_available || Object.keys(data.free_slots || {}).length === 0) {
                    setError('No interview slots are available for the next 5 working days. All team members are busy. Please try again later or contact the organization for alternative arrangements.');
                } else if (data.free_slots) {
                    setFreeSlots(data.free_slots);
                } else {
                    setError('No available slots found. Please contact the organization.');
                }
            } else {
                setError('No available slots found. Please contact the organization.');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load available time slots');
        } finally {
            setLoading(false);
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!selectedDate || !selectedSlot) {
            setError('Please select a date and time slot');
            return;
        }
        
        setSubmitting(true);
        setError('');
        
        try {
            // Find the selected slot details
            const slotsForDate = freeSlots[selectedDate] || [];
            const slotDetails = slotsForDate.find(s => s.slot_id === selectedSlot);
            
            if (!slotDetails) {
                throw new Error('Invalid slot selected');
            }
            
            const res = await fetch(`${API_BASE_URL}/api/submit-interview-form`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    webhook_id: webhookId,
                    selected_date: selectedDate,
                    selected_slot_id: selectedSlot,
                    selected_time: `${slotDetails.start} - ${slotDetails.end}`
                })
            });
            
            if (!res.ok) {
                const errorData = await res.json();
                const errorMessage = errorData.detail || 'Failed to submit form';
                
                // Check if it's a conflict (slot already booked)
                if (res.status === 409) {
                    setError(`${errorMessage} Please refresh the page and select a different time slot.`);
                } else {
                    throw new Error(errorMessage);
                }
                return;
            }
            
            const data = await res.json();
            
            if (data.success) {
                // Show success message
                setError(''); // Clear any errors
                alert('✅ Interview scheduled successfully! You will receive a confirmation email shortly.');
                // Redirect to home page
                setTimeout(() => {
                    navigate('/');
                }, 2000);
            } else {
                throw new Error(data.message || 'Failed to schedule interview');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to submit form. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };
    
    const availableDates = Object.keys(freeSlots);
    const slotsForSelectedDate = selectedDate ? freeSlots[selectedDate] || [] : [];
    
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
                maxWidth: '700px',
                width: '100%',
                background: '#ffffff',
                borderRadius: '24px',
                boxShadow: '0 25px 70px rgba(0, 0, 0, 0.3)',
                overflow: 'hidden',
                animation: 'slideUp 0.4s ease-out'
            }}>
                {/* Header */}
                <div style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    padding: '36px 32px',
                    textAlign: 'center',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        background: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 20px',
                        backdropFilter: 'blur(10px)'
                    }}>
                        <Calendar style={{ width: '40px', height: '40px', color: '#ffffff' }} />
                    </div>
                    <h1 style={{
                        fontSize: '32px',
                        fontWeight: '800',
                        color: '#ffffff',
                        margin: '0 0 12px 0',
                        letterSpacing: '-0.5px'
                    }}>
                        Schedule Your Interview
                    </h1>
                    <p style={{
                        fontSize: '16px',
                        color: 'rgba(255, 255, 255, 0.9)',
                        margin: '0',
                        fontWeight: '500'
                    }}>
                        {round} at <strong>{orgName}</strong>
                    </p>
                    {team && (
                        <p style={{
                            fontSize: '14px',
                            color: 'rgba(255, 255, 255, 0.8)',
                            margin: '8px 0 0 0',
                            fontWeight: '400'
                        }}>
                            Team: {team}
                        </p>
                    )}
                </div>

                {/* Content */}
                <div style={{ padding: '32px' }}>
                    {alreadyScheduled && scheduledData && (
                        <div style={{
                            background: 'linear-gradient(to bottom right, #d1fae5, #a7f3d0)',
                            border: '2px solid #10b981',
                            borderRadius: '16px',
                            padding: '24px',
                            textAlign: 'center'
                        }}>
                            <div style={{
                                width: '60px',
                                height: '60px',
                                background: '#10b981',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 16px'
                            }}>
                                <CheckCircle style={{ width: '32px', height: '32px', color: '#ffffff' }} />
                            </div>
                            <h3 style={{
                                fontSize: '20px',
                                fontWeight: '700',
                                color: '#065f46',
                                margin: '0 0 12px 0'
                            }}>
                                ✅ Interview Already Scheduled
                            </h3>
                            <p style={{
                                fontSize: '14px',
                                color: '#047857',
                                margin: '0 0 20px 0',
                                fontWeight: '500'
                            }}>
                                Your interview has already been scheduled for:
                            </p>
                            <div style={{
                                background: '#ffffff',
                                borderRadius: '12px',
                                padding: '20px',
                                border: '1px solid #6ee7b7'
                            }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <p style={{
                                        fontSize: '15px',
                                        color: '#1f2937',
                                        margin: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        justifyContent: 'center'
                                    }}>
                                        <Calendar style={{ width: '18px', height: '18px', color: '#10b981' }} />
                                        <strong>Date:</strong> {scheduledData.selected_date}
                                    </p>
                                    <p style={{
                                        fontSize: '15px',
                                        color: '#1f2937',
                                        margin: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        justifyContent: 'center'
                                    }}>
                                        <Clock style={{ width: '18px', height: '18px', color: '#10b981' }} />
                                        <strong>Time:</strong> {scheduledData.selected_time}
                                    </p>
                                    {scheduledData.location_type && (
                                        <p style={{
                                            fontSize: '15px',
                                            color: '#1f2937',
                                            margin: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            justifyContent: 'center'
                                        }}>
                                            <strong>Location:</strong> {scheduledData.location_type === 'online' ? '💻 Online' : '🏢 Offline'}
                                        </p>
                                    )}
                                    {scheduledData.location && (
                                        <p style={{
                                            fontSize: '14px',
                                            color: '#4b5563',
                                            margin: '8px 0 0 0',
                                            padding: '12px',
                                            background: '#f3f4f6',
                                            borderRadius: '8px'
                                        }}>
                                            <strong>Address:</strong> {scheduledData.location}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <p style={{
                                fontSize: '13px',
                                color: '#047857',
                                margin: '16px 0 0 0',
                                lineHeight: '1.6',
                                fontWeight: '500'
                            }}>
                                You will receive a confirmation email with the interview details. If you need to reschedule, please contact {orgName}.
                            </p>
                        </div>
                    )}
                    
                    {loading && !alreadyScheduled && (
                        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                            <div style={{
                                width: '60px',
                                height: '60px',
                                border: '4px solid #e5e7eb',
                                borderTop: '4px solid #667eea',
                                borderRadius: '50%',
                                margin: '0 auto 20px',
                                animation: 'spin 1s linear infinite'
                            }}></div>
                            <p style={{
                                fontSize: '16px',
                                color: '#6b7280',
                                margin: 0,
                                fontWeight: '500'
                            }}>
                                Loading available time slots...
                            </p>
                        </div>
                    )}
                    
                    {error && !alreadyScheduled && (
                        <div style={{
                            background: 'linear-gradient(to bottom right, #fee2e2, #fecaca)',
                            border: '2px solid #ef4444',
                            borderRadius: '12px',
                            padding: '16px',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '12px',
                            marginBottom: '20px'
                        }}>
                            <AlertCircle style={{ width: '22px', height: '22px', color: '#dc2626', flexShrink: 0, marginTop: '2px' }} />
                            <p style={{
                                fontSize: '14px',
                                color: '#991b1b',
                                margin: 0,
                                lineHeight: '1.6',
                                fontWeight: '500'
                            }}>
                                {error}
                            </p>
                        </div>
                    )}
                    
                    {!loading && !error && !alreadyScheduled && availableDates.length === 0 && (
                        <div style={{
                            background: 'linear-gradient(to bottom right, #fef3c7, #fde68a)',
                            border: '2px solid #f59e0b',
                            borderRadius: '12px',
                            padding: '20px',
                            textAlign: 'center'
                        }}>
                            <AlertCircle style={{ width: '40px', height: '40px', color: '#d97706', margin: '0 auto 12px' }} />
                            <p style={{
                                fontSize: '14px',
                                color: '#92400e',
                                margin: 0,
                                fontWeight: '500'
                            }}>
                                No available time slots found. Please contact {orgName} for alternative arrangements.
                            </p>
                        </div>
                    )}
                    
                    {!loading && !error && !alreadyScheduled && availableDates.length > 0 && (
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {/* Select Date */}
                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#374151',
                                    marginBottom: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <Calendar style={{ width: '18px', height: '18px', color: '#667eea' }} />
                                    Select Interview Date
                                </label>
                                <select
                                    value={selectedDate}
                                    onChange={(e) => {
                                        setSelectedDate(e.target.value);
                                        setSelectedSlot(''); // Reset slot when date changes
                                    }}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '14px 16px',
                                        fontSize: '15px',
                                        border: '2px solid #e5e7eb',
                                        borderRadius: '12px',
                                        background: '#f9fafb',
                                        color: '#1f2937',
                                        outline: 'none',
                                        appearance: 'none',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        fontWeight: '500'
                                    }}
                                    onFocus={(e) => {
                                        e.currentTarget.style.borderColor = '#667eea';
                                        e.currentTarget.style.background = '#ffffff';
                                        e.currentTarget.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.1)';
                                    }}
                                    onBlur={(e) => {
                                        e.currentTarget.style.borderColor = '#e5e7eb';
                                        e.currentTarget.style.background = '#f9fafb';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    <option value="">Choose a date...</option>
                                    {availableDates.map(date => (
                                        <option key={date} value={date}>
                                            {date}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            {selectedDate && slotsForSelectedDate.length > 0 && (
                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: '#374151',
                                        marginBottom: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        <Clock style={{ width: '18px', height: '18px', color: '#667eea' }} />
                                        Select Time Slot
                                    </label>
                                    <select
                                        value={selectedSlot}
                                        onChange={(e) => setSelectedSlot(e.target.value)}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '14px 16px',
                                            fontSize: '15px',
                                            border: '2px solid #e5e7eb',
                                            borderRadius: '12px',
                                            background: '#f9fafb',
                                            color: '#1f2937',
                                            outline: 'none',
                                            appearance: 'none',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            fontWeight: '500'
                                        }}
                                        onFocus={(e) => {
                                            e.currentTarget.style.borderColor = '#667eea';
                                            e.currentTarget.style.background = '#ffffff';
                                            e.currentTarget.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.1)';
                                        }}
                                        onBlur={(e) => {
                                            e.currentTarget.style.borderColor = '#e5e7eb';
                                            e.currentTarget.style.background = '#f9fafb';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    >
                                        <option value="">Choose a time slot...</option>
                                        {slotsForSelectedDate.map(slot => (
                                            <option key={slot.slot_id} value={slot.slot_id}>
                                                {slot.start} - {slot.end}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            
                            {selectedDate && slotsForSelectedDate.length === 0 && (
                                <div style={{
                                    background: 'linear-gradient(to bottom right, #fef3c7, #fde68a)',
                                    border: '2px solid #f59e0b',
                                    borderRadius: '12px',
                                    padding: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px'
                                }}>
                                    <AlertCircle style={{ width: '20px', height: '20px', color: '#d97706', flexShrink: 0 }} />
                                    <p style={{
                                        fontSize: '13px',
                                        color: '#92400e',
                                        margin: 0,
                                        fontWeight: '500'
                                    }}>
                                        No available slots for this date. Please select another date.
                                    </p>
                                </div>
                            )}
                            
                            
                            {submitting && (
                                <div style={{
                                    background: 'linear-gradient(to bottom right, #dbeafe, #bfdbfe)',
                                    border: '2px solid #3b82f6',
                                    borderRadius: '12px',
                                    padding: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px'
                                }}>
                                    <div style={{
                                        width: '20px',
                                        height: '20px',
                                        border: '2px solid #3b82f6',
                                        borderTop: '2px solid transparent',
                                        borderRadius: '50%',
                                        animation: 'spin 1s linear infinite',
                                        flexShrink: 0
                                    }}></div>
                                    <span style={{
                                        fontSize: '14px',
                                        color: '#1e40af',
                                        fontWeight: '500'
                                    }}>
                                        Checking slot availability and scheduling interview...
                                    </span>
                                </div>
                            )}
                            
                            <button
                                type="submit"
                                disabled={!selectedDate || !selectedSlot || submitting}
                                style={{
                                    width: '100%',
                                    background: (!selectedDate || !selectedSlot || submitting) 
                                        ? '#d1d5db' 
                                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    color: '#ffffff',
                                    padding: '16px 24px',
                                    borderRadius: '12px',
                                    fontSize: '16px',
                                    fontWeight: '700',
                                    border: 'none',
                                    cursor: (!selectedDate || !selectedSlot || submitting) ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s ease',
                                    boxShadow: (!selectedDate || !selectedSlot || submitting) 
                                        ? 'none' 
                                        : '0 6px 20px rgba(102, 126, 234, 0.4)',
                                    letterSpacing: '0.3px'
                                }}
                                onMouseEnter={(e) => {
                                    if (selectedDate && selectedSlot && !submitting) {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.5)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (selectedDate && selectedSlot && !submitting) {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
                                    }
                                }}
                            >
                                {submitting ? '⏳ Scheduling...' : '✓ Confirm Interview Time'}
                            </button>
                        </form>
                    )}
                </div>
            </div>

            {/* Add animations */}
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
}
