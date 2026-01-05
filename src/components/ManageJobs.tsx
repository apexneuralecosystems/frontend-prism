import React, { useState, useEffect } from 'react';
import {
    Briefcase, Users, CheckCircle, X, Clock, UserCheck, LogOut,
    ChevronDown, Mail, FileText, Download, Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authenticatedFetch, clearAuthAndRedirect, refreshAccessToken } from '../utils/auth';
import { API_ENDPOINTS, API_BASE_URL } from '../config/api';

interface Job {
    job_id: string;
    role: string;
    location: string;
    company: {
        name: string;
        email: string;
    };
}

interface Applicant {
    _id: string;
    job_id: string;
    name: string;
    email: string;
    status: string;
    applied_at: string;
    resume_url?: string;
    additional_details?: string;
    ongoing_rounds?: any[];
    previous_rounds?: any[];
    profile?: {
        name: string;
        resume_url: string;
        parsed_resume_data?: any;
        additional_details?: string;
    };
}

export function ManageJobs() {
    const navigate = useNavigate();
    const [ongoingJobs, setOngoingJobs] = useState<Job[]>([]);
    const [selectedJobId, setSelectedJobId] = useState<string>('');
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [userData, setUserData] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'pending' | 'ongoing' | 'conduct_rounds' | 'selected' | 'invitation_sent' | 'offer_sent' | 'offer_accepted'>('pending');
    
    // Schedule Interview form state
    const [teams, setTeams] = useState<any[]>([]);
    const [showScheduleForm, setShowScheduleForm] = useState<string | null>(null);
    const [selectedRound, setSelectedRound] = useState<string>('');
    const [selectedTeam, setSelectedTeam] = useState<string>('');
    const [selectedLocationType, setSelectedLocationType] = useState<string>('');
    
    // Offer form state
    const [showOfferForm, setShowOfferForm] = useState<string | null>(null);
    const [offerLetterFile, setOfferLetterFile] = useState<File | null>(null);
    const [sendingOffer, setSendingOffer] = useState(false);
    
    // Expandable details state
    const [expandedDetails, setExpandedDetails] = useState<Set<string>>(new Set());
    const [expandedRounds, setExpandedRounds] = useState<Set<string>>(new Set());

    // Round options for interview scheduling
    const roundOptions = [
        'Initial Screening Round',
        'Technical Round 1',
        'Technical Round 2',
        'Managerial Round',
        'Final Technical Round',
        'Discussion Round',
        'Negotiation / Offer Round'
    ];

    useEffect(() => {
        // Check authentication
        const token = localStorage.getItem('access_token');
        const storedUserData = localStorage.getItem('user');

        if (!token) {
            navigate('/auth');
            return;
        }

        if (storedUserData) {
            const parsedUser = JSON.parse(storedUserData);
            if (parsedUser.user_type !== 'organization') {
                navigate('/organization-profile');
                return;
            }
            setUserData(parsedUser);
        }

        fetchOngoingJobs();
    }, [navigate]);

    const fetchOngoingJobs = async () => {
        try {
            const res = await authenticatedFetch(
                API_ENDPOINTS.ORGANIZATION_JOBPOST_ONGOING,
                { method: 'GET' },
                navigate
            );

            if (!res) return;

            if (res.ok) {
                const result = await res.json();
                setOngoingJobs(result.jobs || []);
            }
        } catch (err) {
            console.error('Failed to fetch ongoing jobs:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchApplicants = async (jobId: string) => {
        if (!jobId) {
            setApplicants([]);
            return;
        }

        setLoading(true);
        try {
            const res = await authenticatedFetch(
                API_ENDPOINTS.GET_JOB_APPLICANTS(jobId),
                { method: 'GET' },
                navigate
            );

            if (!res) {
                setLoading(false);
                return;
            }

            if (res.ok) {
                const result = await res.json();
                setApplicants(result.applicants || []);
            }
        } catch (err) {
            console.error('Failed to fetch applicants:', err);
            setMessage({ type: 'error', text: 'Error loading applicants' });
        } finally {
            setLoading(false);
        }
    };

    const handleJobSelect = (jobId: string) => {
        setSelectedJobId(jobId);
        if (jobId) {
            fetchApplicants(jobId);
        }
    };

    const handleStatusChange = async (applicantEmail: string, newStatus: string) => {
        if (!selectedJobId) return;

        setUpdatingStatus(applicantEmail);
        setMessage(null);

        try {
            const res = await authenticatedFetch(
                API_ENDPOINTS.UPDATE_APPLICANT_STATUS(selectedJobId, applicantEmail),
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: newStatus })
                },
                navigate
            );

            if (!res) {
                setUpdatingStatus(null);
                return;
            }

            if (res.ok) {
                setMessage({ type: 'success', text: 'Status updated successfully!' });
                // Refresh applicants
                fetchApplicants(selectedJobId);
                
                // Navigate to appropriate tab based on status
                if (newStatus === 'selected_for_interview') {
                    setActiveTab('conduct_rounds');
                } else if (newStatus === 'selected') {
                    setActiveTab('selected');
                } else if (newStatus === 'processing') {
                    setActiveTab('ongoing');
                } else if (newStatus === 'offer_sent') {
                    setActiveTab('offer_sent');
                } else if (newStatus === 'offer_accepted') {
                    setActiveTab('offer_accepted');
                } else if (newStatus === 'decision_pending' || newStatus === 'applied') {
                    setActiveTab('pending');
                }
            } else {
                const error = await res.json();
                setMessage({ type: 'error', text: error.detail || 'Failed to update status' });
            }
        } catch (err) {
            console.error('Failed to update status:', err);
            setMessage({ type: 'error', text: 'Error updating status' });
        } finally {
            setUpdatingStatus(null);
        }
    };

    const handleSendOffer = async (applicant: Applicant) => {
        if (!offerLetterFile || !selectedJobId) return;
        
        setSendingOffer(true);
        setMessage(null);
        
        try {
            const formData = new FormData();
            formData.append('applicantEmail', applicant.email);
            formData.append('applicantName', applicant.name);
            formData.append('orgEmail', userData?.email || '');
            formData.append('orgName', userData?.name || '');
            formData.append('job_id', selectedJobId);
            formData.append('offer_letter', offerLetterFile);
            
            // Get access token for manual header setting (FormData needs special handling)
            let accessToken = localStorage.getItem('access_token');
            
            // Make request with proper headers for FormData
            const headers: HeadersInit = {};
            if (accessToken) {
                headers['Authorization'] = `Bearer ${accessToken}`;
            }
            // Don't set Content-Type - browser will set it with boundary for FormData
            
            const res = await fetch(API_ENDPOINTS.SEND_OFFER_LETTER, {
                method: 'POST',
                headers: headers,
                body: formData
            });
            
            // Handle 401 - try token refresh
            if (res.status === 401) {
                const newToken = await refreshAccessToken();
                if (newToken) {
                    headers['Authorization'] = `Bearer ${newToken}`;
                    const retryRes = await fetch(API_ENDPOINTS.SEND_OFFER_LETTER, {
                        method: 'POST',
                        headers: headers,
                        body: formData
                    });
                    
                    if (retryRes.status === 401) {
                        clearAuthAndRedirect(navigate);
                        setSendingOffer(false);
                        return;
                    }
                    
                    if (retryRes.ok) {
                        setMessage({ type: 'success', text: 'Offer letter sent successfully!' });
                        setShowOfferForm(null);
                        setOfferLetterFile(null);
                        await fetchApplicants(selectedJobId);
                        setActiveTab('offer_sent');
                    } else {
                        const error = await retryRes.json();
                        setMessage({ type: 'error', text: error.detail || 'Failed to send offer letter' });
                    }
                } else {
                    clearAuthAndRedirect(navigate);
                    setSendingOffer(false);
                    return;
                }
            } else if (res.ok) {
                setMessage({ type: 'success', text: 'Offer letter sent successfully!' });
                setShowOfferForm(null);
                setOfferLetterFile(null);
                await fetchApplicants(selectedJobId);
                setActiveTab('offer_sent');
            } else {
                const error = await res.json();
                setMessage({ type: 'error', text: error.detail || 'Failed to send offer letter' });
            }
        } catch (err) {
            console.error('Failed to send offer:', err);
            setMessage({ type: 'error', text: 'Error sending offer letter' });
        } finally {
            setSendingOffer(false);
        }
    };

    const handleLogout = async () => {
        const refreshToken = localStorage.getItem("refresh_token");

        if (refreshToken) {
            try {
                await fetch(API_ENDPOINTS.AUTH.LOGOUT, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ refresh_token: refreshToken })
                });
            } catch (error) {
                console.error("Logout error:", error);
            }
        }

        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        navigate("/auth");
    };

    // Fetch teams for schedule interview
    const fetchTeams = async () => {
        try {
            const res = await authenticatedFetch(
                API_ENDPOINTS.ORGANIZATION_TEAMS,
                { method: 'GET' },
                navigate
            );

            if (!res) return;

            if (res.ok) {
                const result = await res.json();
                setTeams(result.teams || []);
            }
        } catch (err) {
            console.error('Failed to fetch teams:', err);
        }
    };

    // Handle schedule interview submit
    const handleScheduleSubmit = async (email: string) => {
        const applicant = conductRounds.find(a => a.email === email);
        
        if (!applicant) {
            console.error('Applicant not found');
            return;
        }
        
        if (!selectedLocationType) {
            setMessage({ type: 'error', text: 'Please select interview location type (Online or Offline)' });
            return;
        }
        
        const scheduleData = {
            applicantName: applicant.name,
            applicantEmail: email,
            round: selectedRound,
            team: selectedTeam,
            orgName: userData?.name,
            orgEmail: userData?.email,
            job_id: selectedJobId,
            location_type: selectedLocationType
        };
        
        console.log('Schedule Interview Details:', scheduleData);
        
        try {
            // Call backend to send interview form email
            const res = await authenticatedFetch(
                `${API_BASE_URL}/api/send-interview-form`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(scheduleData)
                },
                navigate
            );
            
            if (res && res.ok) {
                const result = await res.json();
                console.log('✅ Interview form email sent:', result);
                setMessage({ type: 'success', text: 'Interview scheduling form has been sent to the applicant!' });
                
                // Close form and reset
                setShowScheduleForm(null);
                setSelectedRound('');
                setSelectedTeam('');
                setSelectedLocationType('');
                
                // Refresh applicants to update status and move to invitation_sent tab
                if (selectedJobId) {
                    await fetchApplicants(selectedJobId);
                    // Switch to invitation_sent tab after refresh
                    setTimeout(() => {
                        setActiveTab('invitation_sent');
                    }, 100);
                }
            } else {
                const errorData = await res?.json();
                console.error('Failed to send interview form:', errorData);
                setMessage({ type: 'error', text: errorData?.detail || 'Failed to send interview form. Please try again.' });
            }
        } catch (error: any) {
            console.error('Error sending interview form:', error);
            setMessage({ type: 'error', text: 'Error sending interview form. Please try again.' });
        }
    };

    // Categorize applicants into panels
    const decisionPending = applicants.filter(app => 
        app.status === 'applied' || app.status === 'decision_pending' || !app.status
    );
    const invitationSent = applicants.filter(app => 
        app.status === 'invitation_sent'
    );
    const ongoingRounds = applicants.filter(app => 
        app.status === 'processing'
    );
    const conductRounds = applicants.filter(app => 
        app.status === 'selected_for_interview'
    );
    const selected = applicants.filter(app => app.status === 'selected');
    const offerSent = applicants.filter(app => app.status === 'offer_sent');
    const offerAccepted = applicants.filter(app => app.status === 'offer_accepted');

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'selected': return 'bg-green-100 text-green-700';
            case 'selected_for_interview': return 'bg-blue-100 text-blue-700';
            case 'rejected': return 'bg-red-100 text-red-700';
            case 'decision_pending': return 'bg-yellow-100 text-yellow-700';
            case 'invitation_sent': return 'bg-orange-100 text-orange-700';
            case 'processing': return 'bg-blue-100 text-blue-700';
            case 'offer_sent': return 'bg-orange-100 text-orange-700';
            case 'offer_accepted': return 'bg-green-100 text-green-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    if (loading && ongoingJobs.length === 0) {
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
                    <p style={{ color: '#475569', fontSize: '16px', fontWeight: '500' }}>Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #f8fafc, #e0f2fe)', paddingBottom: '80px' }}>
            {/* Header */}
            <div style={{ 
                background: 'linear-gradient(to right, #6366f1, #8b5cf6)',
                borderBottom: '1px solid #e2e8f0',
                position: 'sticky',
                top: 0,
                zIndex: 10,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
            }}>
                <div style={{ 
                    maxWidth: '1400px', 
                    margin: '0 auto', 
                    padding: '16px 24px', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ 
                            background: 'rgba(255, 255, 255, 0.2)', 
                            borderRadius: '10px', 
                            padding: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Users style={{ width: '24px', height: '24px', color: '#ffffff' }} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff', margin: 0, lineHeight: '1.2' }}>Manage Jobs</h1>
                            <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.9)', margin: '2px 0 0 0' }}>Manage applicants across recruitment stages</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button
                            onClick={handleLogout}
                            style={{ 
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 16px',
                                borderRadius: '8px',
                                fontWeight: '500',
                                fontSize: '14px',
                                color: '#ffffff',
                                background: '#dc2626',
                                border: 'none',
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)',
                                transition: 'all 0.15s ease',
                                transform: 'translateY(0)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#b91c1c';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#dc2626';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            <LogOut style={{ width: '16px', height: '16px' }} />
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* Message Toast */}
            {message && (
                <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '16px 24px 0' }}>
                    <div style={{ 
                        padding: '16px 20px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        background: message.type === 'success' ? 'linear-gradient(to right, #d1fae5, #a7f3d0)' : 'linear-gradient(to right, #fee2e2, #fecaca)',
                        border: `1px solid ${message.type === 'success' ? '#86efac' : '#fca5a5'}`,
                        color: message.type === 'success' ? '#065f46' : '#991b1b',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                        fontWeight: '500',
                        animation: 'slideDown 0.3s ease-out'
                    }}>
                        {message.type === 'success' ? 
                            <CheckCircle style={{ width: '20px', height: '20px', flexShrink: 0 }} /> : 
                            <X style={{ width: '20px', height: '20px', flexShrink: 0 }} />
                        }
                        <span style={{ flex: 1 }}>{message.text}</span>
                        <button
                            onClick={() => setMessage(null)}
                            style={{ 
                                padding: '4px',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <X style={{ width: '16px', height: '16px' }} />
                        </button>
                    </div>
                </div>
            )}

            {/* Content */}
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
                {/* Job Selection Dropdown */}
                <div style={{ 
                    background: '#ffffff', 
                    borderRadius: '12px', 
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', 
                    border: '1px solid #e2e8f0',
                    padding: '24px',
                    marginBottom: '24px'
                }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#475569', marginBottom: '12px' }}>
                        <Briefcase style={{ width: '16px', height: '16px', display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom', color: '#2563eb' }} />
                        Select Ongoing Job
                    </label>
                    <div style={{ position: 'relative' }}>
                        <select
                            value={selectedJobId}
                            onChange={(e) => handleJobSelect(e.target.value)}
                            style={{ 
                                width: '100%', 
                                padding: '12px 40px 12px 16px', 
                                border: '1px solid #cbd5e1', 
                                borderRadius: '10px',
                                fontSize: '14px',
                                fontWeight: '500',
                                outline: 'none',
                                transition: 'all 0.15s ease',
                                background: '#ffffff',
                                appearance: 'none',
                                cursor: 'pointer',
                                color: selectedJobId ? '#1e293b' : '#94a3b8'
                            }}
                            onFocus={(e) => {
                                e.currentTarget.style.borderColor = '#2563eb';
                                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                            }}
                            onBlur={(e) => {
                                e.currentTarget.style.borderColor = '#cbd5e1';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <option value="">-- Select a job to manage --</option>
                            {ongoingJobs.map((job) => (
                                <option key={job.job_id} value={job.job_id}>
                                    {job.role} - {job.location}
                                </option>
                            ))}
                        </select>
                        <ChevronDown style={{ 
                            position: 'absolute', 
                            right: '12px', 
                            top: '50%', 
                            transform: 'translateY(-50%)', 
                            width: '20px', 
                            height: '20px', 
                            color: '#64748b', 
                            pointerEvents: 'none' 
                        }} />
                    </div>
                    {ongoingJobs.length === 0 && (
                        <p style={{ fontSize: '12px', color: '#64748b', margin: '8px 0 0 0', fontStyle: 'italic' }}>
                            No ongoing jobs available. Jobs will appear here once they pass their application deadline.
                        </p>
                    )}
                </div>

                {selectedJobId ? (
                    <>
                        {/* Tabs */}
                        <div style={{ 
                            background: '#ffffff', 
                            borderRadius: '12px', 
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', 
                            border: '1px solid #e2e8f0',
                            overflow: 'hidden'
                        }}>
                            <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', overflowX: 'auto', flexWrap: 'wrap' }}>
                                <button
                                    onClick={() => setActiveTab('pending')}
                                    style={{ 
                                        flex: '1 1 auto',
                                        minWidth: '140px',
                                        padding: '14px 20px',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        transition: 'all 0.15s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        border: 'none',
                                        borderBottom: activeTab === 'pending' ? '3px solid #eab308' : '3px solid transparent',
                                        background: activeTab === 'pending' ? 'linear-gradient(to bottom, #fef9c3, #fef08a)' : 'transparent',
                                        color: activeTab === 'pending' ? '#a16207' : '#64748b',
                                        cursor: 'pointer'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (activeTab !== 'pending') {
                                            e.currentTarget.style.background = '#f8fafc';
                                            e.currentTarget.style.color = '#475569';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (activeTab !== 'pending') {
                                            e.currentTarget.style.background = 'transparent';
                                            e.currentTarget.style.color = '#64748b';
                                        }
                                    }}
                                >
                                    <Clock style={{ width: '16px', height: '16px' }} />
                                    <span>Decision Pending ({decisionPending.length})</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('conduct_rounds')}
                                    style={{ 
                                        flex: '1 1 auto',
                                        minWidth: '140px',
                                        padding: '14px 20px',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        transition: 'all 0.15s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        border: 'none',
                                        borderBottom: activeTab === 'conduct_rounds' ? '3px solid #a855f7' : '3px solid transparent',
                                        background: activeTab === 'conduct_rounds' ? 'linear-gradient(to bottom, #f3e8ff, #e9d5ff)' : 'transparent',
                                        color: activeTab === 'conduct_rounds' ? '#7e22ce' : '#64748b',
                                        cursor: 'pointer'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (activeTab !== 'conduct_rounds') {
                                            e.currentTarget.style.background = '#f8fafc';
                                            e.currentTarget.style.color = '#475569';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (activeTab !== 'conduct_rounds') {
                                            e.currentTarget.style.background = 'transparent';
                                            e.currentTarget.style.color = '#64748b';
                                        }
                                    }}
                                >
                                    <UserCheck style={{ width: '16px', height: '16px' }} />
                                    <span>Conduct Rounds ({conductRounds.length})</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('invitation_sent')}
                                    style={{ 
                                        flex: '1 1 auto',
                                        minWidth: '140px',
                                        padding: '14px 20px',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        transition: 'all 0.15s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        border: 'none',
                                        borderBottom: activeTab === 'invitation_sent' ? '3px solid #f97316' : '3px solid transparent',
                                        background: activeTab === 'invitation_sent' ? 'linear-gradient(to bottom, #fed7aa, #fdba74)' : 'transparent',
                                        color: activeTab === 'invitation_sent' ? '#c2410c' : '#64748b',
                                        cursor: 'pointer'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (activeTab !== 'invitation_sent') {
                                            e.currentTarget.style.background = '#f8fafc';
                                            e.currentTarget.style.color = '#475569';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (activeTab !== 'invitation_sent') {
                                            e.currentTarget.style.background = 'transparent';
                                            e.currentTarget.style.color = '#64748b';
                                        }
                                    }}
                                >
                                    <Calendar style={{ width: '16px', height: '16px' }} />
                                    <span>Invitation Sent ({invitationSent.length})</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('ongoing')}
                                    style={{ 
                                        flex: '1 1 auto',
                                        minWidth: '140px',
                                        padding: '14px 20px',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        transition: 'all 0.15s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        border: 'none',
                                        borderBottom: activeTab === 'ongoing' ? '3px solid #3b82f6' : '3px solid transparent',
                                        background: activeTab === 'ongoing' ? 'linear-gradient(to bottom, #dbeafe, #bfdbfe)' : 'transparent',
                                        color: activeTab === 'ongoing' ? '#1e40af' : '#64748b',
                                        cursor: 'pointer'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (activeTab !== 'ongoing') {
                                            e.currentTarget.style.background = '#f8fafc';
                                            e.currentTarget.style.color = '#475569';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (activeTab !== 'ongoing') {
                                            e.currentTarget.style.background = 'transparent';
                                            e.currentTarget.style.color = '#64748b';
                                        }
                                    }}
                                >
                                    <UserCheck style={{ width: '16px', height: '16px' }} />
                                    <span>Ongoing Rounds ({ongoingRounds.length})</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('selected')}
                                    style={{ 
                                        flex: '1 1 auto',
                                        minWidth: '130px',
                                        padding: '14px 20px',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        transition: 'all 0.15s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        border: 'none',
                                        borderBottom: activeTab === 'selected' ? '3px solid #22c55e' : '3px solid transparent',
                                        background: activeTab === 'selected' ? 'linear-gradient(to bottom, #dcfce7, #bbf7d0)' : 'transparent',
                                        color: activeTab === 'selected' ? '#15803d' : '#64748b',
                                        cursor: 'pointer'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (activeTab !== 'selected') {
                                            e.currentTarget.style.background = '#f8fafc';
                                            e.currentTarget.style.color = '#475569';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (activeTab !== 'selected') {
                                            e.currentTarget.style.background = 'transparent';
                                            e.currentTarget.style.color = '#64748b';
                                        }
                                    }}
                                >
                                    <CheckCircle style={{ width: '16px', height: '16px' }} />
                                    <span>Selected ({selected.length})</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('offer_sent')}
                                    style={{ 
                                        flex: '1 1 auto',
                                        minWidth: '130px',
                                        padding: '14px 20px',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        transition: 'all 0.15s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        border: 'none',
                                        borderBottom: activeTab === 'offer_sent' ? '3px solid #f97316' : '3px solid transparent',
                                        background: activeTab === 'offer_sent' ? 'linear-gradient(to bottom, #fed7aa, #fdba74)' : 'transparent',
                                        color: activeTab === 'offer_sent' ? '#c2410c' : '#64748b',
                                        cursor: 'pointer'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (activeTab !== 'offer_sent') {
                                            e.currentTarget.style.background = '#f8fafc';
                                            e.currentTarget.style.color = '#475569';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (activeTab !== 'offer_sent') {
                                            e.currentTarget.style.background = 'transparent';
                                            e.currentTarget.style.color = '#64748b';
                                        }
                                    }}
                                >
                                    <Mail style={{ width: '16px', height: '16px' }} />
                                    <span>Offer Sent ({offerSent.length})</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('offer_accepted')}
                                    style={{ 
                                        flex: '1 1 auto',
                                        minWidth: '150px',
                                        padding: '14px 20px',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        transition: 'all 0.15s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        border: 'none',
                                        borderBottom: activeTab === 'offer_accepted' ? '3px solid #22c55e' : '3px solid transparent',
                                        background: activeTab === 'offer_accepted' ? 'linear-gradient(to bottom, #dcfce7, #bbf7d0)' : 'transparent',
                                        color: activeTab === 'offer_accepted' ? '#15803d' : '#64748b',
                                        cursor: 'pointer'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (activeTab !== 'offer_accepted') {
                                            e.currentTarget.style.background = '#f8fafc';
                                            e.currentTarget.style.color = '#475569';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (activeTab !== 'offer_accepted') {
                                            e.currentTarget.style.background = 'transparent';
                                            e.currentTarget.style.color = '#64748b';
                                        }
                                    }}
                                >
                                    <CheckCircle style={{ width: '16px', height: '16px' }} />
                                    <span>Offer Accepted ({offerAccepted.length})</span>
                                </button>
                            </div>

                            {/* Tab Content */}
                            <div style={{ padding: '24px' }}>
                                {activeTab === 'pending' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '600px', overflowY: 'auto' }}>
                                        {decisionPending.length === 0 ? (
                                            <div style={{ 
                                                textAlign: 'center', 
                                                padding: '40px 20px',
                                                background: 'linear-gradient(to bottom right, #fef9c3, #fef08a)',
                                                borderRadius: '12px',
                                                border: '1px solid #fde047'
                                            }}>
                                                <Clock style={{ width: '48px', height: '48px', color: '#a16207', margin: '0 auto 12px' }} />
                                                <p style={{ color: '#713f12', fontSize: '14px', fontWeight: '500', margin: 0 }}>No applicants pending decision</p>
                                            </div>
                                        ) : (
                                            decisionPending.map((applicant) => {
                                                const showDetails = expandedDetails.has(applicant.email);
                                                const showRounds = expandedRounds.has(applicant.email);
                                                return (
                                                    <div key={applicant._id} style={{ 
                                                        background: 'linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)', 
                                                        border: '1px solid #fde047', 
                                                        borderRadius: '12px', 
                                                        padding: '16px',
                                                        boxShadow: '0 2px 10px rgba(234, 179, 8, 0.15)',
                                                        transition: 'all 0.15s ease',
                                                        transform: 'translateY(0)'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(234, 179, 8, 0.25)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                        e.currentTarget.style.boxShadow = '0 2px 10px rgba(234, 179, 8, 0.15)';
                                                    }}>
                                                        {/* Name/Email on Left, Buttons on Right - SAME LINE */}
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '12px' }}>
                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                <h3 style={{ fontWeight: '600', color: '#854d0e', fontSize: '15px', margin: '0 0 4px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{applicant.name}</h3>
                                                                <p style={{ fontSize: '12px', color: '#a16207', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{applicant.email}</p>
                                                            </div>
                                                            
                                                            {/* Buttons on Right */}
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                                                <button
                                                                    onClick={() => {
                                                                        const newSet = new Set(expandedDetails);
                                                                        if (newSet.has(applicant.email)) {
                                                                            newSet.delete(applicant.email);
                                                                        } else {
                                                                            newSet.add(applicant.email);
                                                                        }
                                                                        setExpandedDetails(newSet);
                                                                    }}
                                                                    style={{
                                                                        padding: '6px 12px',
                                                                        fontSize: '11px',
                                                                        color: '#2563eb',
                                                                        background: showDetails ? '#dbeafe' : '#eff6ff',
                                                                        border: `1px solid ${showDetails ? '#93c5fd' : '#bfdbfe'}`,
                                                                        borderRadius: '6px',
                                                                        cursor: 'pointer',
                                                                        fontWeight: '500',
                                                                        transition: 'all 0.15s ease',
                                                                        whiteSpace: 'nowrap'
                                                                    }}
                                                                    onMouseEnter={(e) => e.currentTarget.style.background = '#bfdbfe'}
                                                                    onMouseLeave={(e) => e.currentTarget.style.background = showDetails ? '#dbeafe' : '#eff6ff'}
                                                                >
                                                                    {showDetails ? '▼' : '▶'} Details
                                                                </button>
                                                                
                                                                {/* Status Dropdown - Small */}
                                                                <div style={{ position: 'relative', minWidth: '180px' }}>
                                                                    <select
                                                                        value={applicant.status || 'decision_pending'}
                                                                        onChange={(e) => handleStatusChange(applicant.email, e.target.value)}
                                                                        disabled={updatingStatus === applicant.email}
                                                                        style={{
                                                                            width: '100%',
                                                                            padding: '6px 12px',
                                                                            fontSize: '11px',
                                                                            border: '1px solid #cbd5e1',
                                                                            borderRadius: '6px',
                                                                            background: '#ffffff',
                                                                            color: '#1e293b',
                                                                            fontWeight: '500',
                                                                            cursor: updatingStatus === applicant.email ? 'not-allowed' : 'pointer',
                                                                            opacity: updatingStatus === applicant.email ? 0.5 : 1,
                                                                            outline: 'none',
                                                                            transition: 'all 0.15s ease',
                                                                            appearance: 'none',
                                                                            paddingRight: '32px',
                                                                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)'
                                                                        }}
                                                                        onFocus={(e) => {
                                                                            e.currentTarget.style.borderColor = '#2563eb';
                                                                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                                                                        }}
                                                                        onBlur={(e) => {
                                                                            e.currentTarget.style.borderColor = '#cbd5e1';
                                                                            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.08)';
                                                                        }}
                                                                    >
                                                                        <option value="decision_pending">⏳ Pending</option>
                                                                        <option value="selected_for_interview">✅ Interview</option>
                                                                        <option value="selected">🎯 Selected</option>
                                                                        <option value="rejected">❌ Rejected</option>
                                                                    </select>
                                                                    <ChevronDown style={{ 
                                                                        position: 'absolute', 
                                                                        right: '10px', 
                                                                        top: '50%', 
                                                                        transform: 'translateY(-50%)',
                                                                        width: '14px', 
                                                                        height: '14px', 
                                                                        color: '#94a3b8', 
                                                                        pointerEvents: 'none' 
                                                                    }} />
                                                                    {updatingStatus === applicant.email && (
                                                                        <div style={{ 
                                                                            position: 'absolute',
                                                                            right: '36px',
                                                                            top: '50%',
                                                                            transform: 'translateY(-50%)',
                                                                            width: '12px', 
                                                                            height: '12px', 
                                                                            border: '2px solid #2563eb', 
                                                                            borderTop: '2px solid transparent', 
                                                                            borderRadius: '50%', 
                                                                            animation: 'spin 1s linear infinite'
                                                                        }}></div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        {showDetails && (
                                                            <div style={{
                                                                marginTop: '12px',
                                                                padding: '14px',
                                                                background: 'linear-gradient(to bottom right, #f8fafc, #f1f5f9)',
                                                                borderRadius: '10px',
                                                                border: '1px solid #e2e8f0',
                                                                fontSize: '11px'
                                                            }}>
                                                                {(applicant.resume_url || applicant.profile?.resume_url) && (
                                                                    <div style={{ marginBottom: '12px', padding: '10px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                                        <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                            <span style={{ fontWeight: '600', color: '#475569' }}>📄 Resume:</span>
                                                                            <a 
                                                                                href={`${API_BASE_URL}${applicant.resume_url || applicant.profile?.resume_url}`} 
                                                                                target="_blank" 
                                                                                rel="noopener noreferrer" 
                                                                                style={{
                                                                                    color: '#2563eb',
                                                                                    textDecoration: 'none',
                                                                                    fontWeight: '500',
                                                                                    transition: 'all 0.15s ease'
                                                                                }}
                                                                                onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                                                                                onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                                                                            >
                                                                                View Resume →
                                                                            </a>
                                                                        </p>
                                                                    </div>
                                                                )}
                                                                {(applicant.additional_details || applicant.profile?.additional_details) && (
                                                                    <div style={{
                                                                        marginBottom: '12px',
                                                                        padding: '14px',
                                                                        background: 'linear-gradient(to bottom right, #f0f9ff, #e0f2fe)',
                                                                        borderRadius: '8px',
                                                                        border: '1px solid #bae6fd',
                                                                        maxHeight: '350px',
                                                                        overflowY: 'auto'
                                                                    }}>
                                                                        <div style={{ fontSize: '11px', lineHeight: '1.8', color: '#475569' }}>
                                                                            {(() => {
                                                                                const details = applicant.additional_details || applicant.profile?.additional_details || '';
                                                                                const lines = details.split('\n').filter((l: string) => l.trim());
                                                                                return lines.map((line: string, idx: number) => {
                                                                                    const trimmed = line.trim();
                                                                                    
                                                                                    // Main section headers (no colon, all caps or title case without value)
                                                                                    if (!trimmed.includes(':') || trimmed.match(/^[A-Z][a-z\s]+$/)) {
                                                                                        return (
                                                                                            <p key={idx} style={{
                                                                                                fontWeight: '700',
                                                                                                color: '#1e40af',
                                                                                                fontSize: '12px',
                                                                                                margin: idx === 0 ? '0 0 12px 0' : '16px 0 12px 0',
                                                                                                textTransform: 'uppercase',
                                                                                                letterSpacing: '0.5px'
                                                                                            }}>
                                                                                                {trimmed}
                                                                                            </p>
                                                                                        );
                                                                                    }
                                                                                    
                                                                                    // Key-value pairs
                                                                                    const colonIndex = trimmed.indexOf(':');
                                                                                    if (colonIndex > 0) {
                                                                                        const key = trimmed.substring(0, colonIndex).trim();
                                                                                        const value = trimmed.substring(colonIndex + 1).trim();
                                                                                        
                                                                                        return (
                                                                                            <div key={idx} style={{ marginBottom: '8px', paddingLeft: '0' }}>
                                                                                                <p style={{ margin: 0 }}>
                                                                                                    <span style={{ 
                                                                                                        fontWeight: '600', 
                                                                                                        color: '#0c4a6e',
                                                                                                        fontSize: '11px'
                                                                                                    }}>
                                                                                                        {key}:
                                                                                                    </span>
                                                                                                    <span style={{ 
                                                                                                        color: '#475569',
                                                                                                        fontSize: '11px',
                                                                                                        marginLeft: '6px'
                                                                                                    }}>
                                                                                                        {value}
                                                                                                    </span>
                                                                                                </p>
                                                                                            </div>
                                                                                        );
                                                                                    }
                                                                                    
                                                                                    // Regular text
                                                                                    return (
                                                                                        <p key={idx} style={{ 
                                                                                            margin: '6px 0', 
                                                                                            color: '#64748b',
                                                                                            fontSize: '11px'
                                                                                        }}>
                                                                                            {trimmed}
                                                                                        </p>
                                                                                    );
                                                                                });
                                                                            })()}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {applicant.applied_at && (
                                                                    <div style={{ padding: '8px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                                        <p style={{ margin: 0, color: '#64748b', fontSize: '10px' }}>
                                                                            <span style={{ fontWeight: '600' }}>📅 Applied:</span> {formatDate(applicant.applied_at)}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                        
                                                        {showRounds && applicant.previous_rounds && applicant.previous_rounds.length > 0 && (
                                                            <div style={{
                                                                marginTop: '12px',
                                                                padding: '12px',
                                                                background: 'linear-gradient(to bottom right, #f8fafc, #f1f5f9)',
                                                                borderRadius: '10px',
                                                                border: '1px solid #e2e8f0'
                                                            }}>
                                                                <p style={{ fontSize: '11px', fontWeight: '600', color: '#475569', margin: '0 0 10px 0' }}>📜 Previous Rounds:</p>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                    {applicant.previous_rounds.map((round: any, idx: number) => (
                                                                        <div key={idx} style={{
                                                                            fontSize: '10px',
                                                                            background: '#ffffff',
                                                                            padding: '10px',
                                                                            borderRadius: '8px',
                                                                            border: '1px solid #e2e8f0',
                                                                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                                                                        }}>
                                                                            <p style={{ margin: '0 0 4px 0', color: '#1e293b' }}>
                                                                                <span style={{ fontWeight: '600', color: '#2563eb' }}>Round:</span> {round.round}
                                                                            </p>
                                                                            {round.interviewer_name && (
                                                                                <p style={{ margin: '4px 0', color: '#475569' }}>
                                                                                    <span style={{ fontWeight: '600' }}>Interviewer:</span> {round.interviewer_name}
                                                                                </p>
                                                                            )}
                                                                            {round.interview_date && (
                                                                                <p style={{ margin: '4px 0', color: '#475569' }}>
                                                                                    <span style={{ fontWeight: '600' }}>Date:</span> {round.interview_date}
                                                                                </p>
                                                                            )}
                                                                            {round.interview_time && (
                                                                                <p style={{ margin: '4px 0', color: '#475569' }}>
                                                                                    <span style={{ fontWeight: '600' }}>Time:</span> {round.interview_time}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                )}

                                {activeTab === 'invitation_sent' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '600px', overflowY: 'auto' }}>
                                        {invitationSent.length === 0 ? (
                                            <p style={{ color: '#64748b', fontSize: '14px', textAlign: 'center', padding: '32px 0' }}>No invitations sent</p>
                                        ) : (
                                            invitationSent.map((applicant) => {
                                                const showDetails = expandedDetails.has(applicant.email);
                                                const showRounds = expandedRounds.has(applicant.email);
                                                return (
                                                    <div key={applicant._id} style={{
                                                        background: 'linear-gradient(135deg, #fff7ed, #ffedd5)',
                                                        border: '1px solid #fed7aa',
                                                        borderRadius: '10px',
                                                        padding: '16px',
                                                        boxShadow: '0 4px 12px rgba(249, 115, 22, 0.15)',
                                                        transition: 'all 0.2s ease-in-out',
                                                        transform: 'translateY(0)'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(-3px)';
                                                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(249, 115, 22, 0.25)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(249, 115, 22, 0.15)';
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                <h3 style={{ fontWeight: '700', color: '#9a3412', fontSize: '15px', margin: '0 0 2px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{applicant.name}</h3>
                                                                <p style={{ fontSize: '12px', color: '#c2410c', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{applicant.email}</p>
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px', flexShrink: 0 }}>
                                                                <button
                                                                    onClick={() => {
                                                                        const newSet = new Set(expandedDetails);
                                                                        if (newSet.has(applicant.email)) {
                                                                            newSet.delete(applicant.email);
                                                                        } else {
                                                                            newSet.add(applicant.email);
                                                                        }
                                                                        setExpandedDetails(newSet);
                                                                    }}
                                                                    style={{
                                                                        padding: '6px 12px',
                                                                        fontSize: '11px',
                                                                        fontWeight: '600',
                                                                        color: '#ffffff',
                                                                        background: 'linear-gradient(to right, #3b82f6, #2563eb)',
                                                                        border: 'none',
                                                                        borderRadius: '8px',
                                                                        cursor: 'pointer',
                                                                        boxShadow: '0 2px 6px rgba(37, 99, 235, 0.2)',
                                                                        transition: 'all 0.15s ease',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '4px',
                                                                        minWidth: '80px',
                                                                        justifyContent: 'center'
                                                                    }}
                                                                    onMouseEnter={(e) => { e.currentTarget.style.background = 'linear-gradient(to right, #2563eb, #1d4ed8)'; e.currentTarget.style.boxShadow = '0 3px 8px rgba(37, 99, 235, 0.3)'; }}
                                                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'linear-gradient(to right, #3b82f6, #2563eb)'; e.currentTarget.style.boxShadow = '0 2px 6px rgba(37, 99, 235, 0.2)'; }}
                                                                >
                                                                    {showDetails ? 'Hide' : '▶'} Details
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        const newSet = new Set(expandedRounds);
                                                                        if (newSet.has(applicant.email)) {
                                                                            newSet.delete(applicant.email);
                                                                        } else {
                                                                            newSet.add(applicant.email);
                                                                        }
                                                                        setExpandedRounds(newSet);
                                                                    }}
                                                                    style={{
                                                                        padding: '6px 12px',
                                                                        fontSize: '11px',
                                                                        fontWeight: '600',
                                                                        color: '#ffffff',
                                                                        background: 'linear-gradient(to right, #f97316, #ea580c)',
                                                                        border: 'none',
                                                                        borderRadius: '8px',
                                                                        cursor: 'pointer',
                                                                        boxShadow: '0 2px 6px rgba(249, 115, 22, 0.3)',
                                                                        transition: 'all 0.15s ease',
                                                                        whiteSpace: 'nowrap',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '4px'
                                                                    }}
                                                                    onMouseEnter={(e) => {
                                                                        e.currentTarget.style.background = 'linear-gradient(to right, #ea580c, #c2410c)';
                                                                        e.currentTarget.style.boxShadow = '0 3px 8px rgba(249, 115, 22, 0.4)';
                                                                    }}
                                                                    onMouseLeave={(e) => {
                                                                        e.currentTarget.style.background = 'linear-gradient(to right, #f97316, #ea580c)';
                                                                        e.currentTarget.style.boxShadow = '0 2px 6px rgba(249, 115, 22, 0.3)';
                                                                    }}
                                                                >
                                                                    📅 {showRounds ? 'Hide' : 'View'} Rounds
                                                                </button>
                                                            </div>
                                                        </div>
                                                        
                                                        {showDetails && (
                                                            <div style={{
                                                                marginTop: '12px',
                                                                padding: '14px',
                                                                background: 'linear-gradient(to bottom right, #f8fafc, #f1f5f9)',
                                                                borderRadius: '10px',
                                                                border: '1px solid #e2e8f0',
                                                                fontSize: '11px'
                                                            }}>
                                                                {(applicant.resume_url || applicant.profile?.resume_url) && (
                                                                    <div style={{ marginBottom: '12px', padding: '10px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                                        <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                            <span style={{ fontWeight: '600', color: '#475569' }}>📄 Resume:</span>
                                                                            <a 
                                                                                href={`${API_BASE_URL}${applicant.resume_url || applicant.profile?.resume_url}`} 
                                                                                target="_blank" 
                                                                                rel="noopener noreferrer" 
                                                                                style={{
                                                                                    color: '#2563eb',
                                                                                    textDecoration: 'none',
                                                                                    fontWeight: '500',
                                                                                    transition: 'all 0.15s ease'
                                                                                }}
                                                                                onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                                                                                onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                                                                            >
                                                                                View Resume →
                                                                            </a>
                                                                        </p>
                                                                    </div>
                                                                )}
                                                                {(applicant.additional_details || applicant.profile?.additional_details) && (
                                                                    <div style={{
                                                                        marginBottom: '12px',
                                                                        padding: '14px',
                                                                        background: 'linear-gradient(to bottom right, #f0f9ff, #e0f2fe)',
                                                                        borderRadius: '8px',
                                                                        border: '1px solid #bae6fd',
                                                                        maxHeight: '350px',
                                                                        overflowY: 'auto'
                                                                    }}>
                                                                        <div style={{ fontSize: '11px', lineHeight: '1.8', color: '#475569' }}>
                                                                            {(() => {
                                                                                const details = applicant.additional_details || applicant.profile?.additional_details || '';
                                                                                const lines = details.split('\n').filter((l: string) => l.trim());
                                                                                return lines.map((line: string, idx: number) => {
                                                                                    const trimmed = line.trim();
                                                                                    
                                                                                    if (!trimmed.includes(':') || trimmed.match(/^[A-Z][a-z\s]+$/)) {
                                                                                        return (
                                                                                            <p key={idx} style={{
                                                                                                fontWeight: '700',
                                                                                                color: '#1e40af',
                                                                                                fontSize: '12px',
                                                                                                margin: idx === 0 ? '0 0 12px 0' : '16px 0 12px 0',
                                                                                                textTransform: 'uppercase',
                                                                                                letterSpacing: '0.5px'
                                                                                            }}>
                                                                                                {trimmed}
                                                                                            </p>
                                                                                        );
                                                                                    }
                                                                                    
                                                                                    const colonIndex = trimmed.indexOf(':');
                                                                                    if (colonIndex > 0) {
                                                                                        const key = trimmed.substring(0, colonIndex).trim();
                                                                                        const value = trimmed.substring(colonIndex + 1).trim();
                                                                                        
                                                                                        return (
                                                                                            <div key={idx} style={{ marginBottom: '8px', paddingLeft: '0' }}>
                                                                                                <p style={{ margin: 0 }}>
                                                                                                    <span style={{ 
                                                                                                        fontWeight: '600', 
                                                                                                        color: '#0c4a6e',
                                                                                                        fontSize: '11px'
                                                                                                    }}>
                                                                                                        {key}:
                                                                                                    </span>
                                                                                                    <span style={{ 
                                                                                                        marginLeft: '6px',
                                                                                                        color: '#475569'
                                                                                                    }}>
                                                                                                        {value}
                                                                                                    </span>
                                                                                                </p>
                                                                                            </div>
                                                                                        );
                                                                                    }
                                                                                    
                                                                                    return (
                                                                                        <p key={idx} style={{ margin: '4px 0', color: '#64748b' }}>
                                                                                            {trimmed}
                                                                                        </p>
                                                                                    );
                                                                                });
                                                                            })()}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {applicant.applied_at && (
                                                                    <div style={{ padding: '10px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                                        <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
                                                                            <span style={{ fontWeight: '600', color: '#475569' }}>📅 Applied:</span> {formatDate(applicant.applied_at)}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                        
                                                        {showRounds && (
                                                            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                                {/* Current Invited Round */}
                                                                {applicant.ongoing_rounds && applicant.ongoing_rounds.length > 0 ? (
                                                                    <div>
                                                                        <div style={{
                                                                            padding: '12px 16px',
                                                                            background: 'linear-gradient(to right, #fff7ed, #ffedd5)',
                                                                            borderRadius: '10px',
                                                                            marginBottom: '12px',
                                                                            border: '2px solid #f97316'
                                                                        }}>
                                                                            <p style={{ fontSize: '14px', fontWeight: '700', color: '#f97316', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                                📨 Invitation Sent For Interview Round
                                                                            </p>
                                                                        </div>
                                                                        {applicant.ongoing_rounds.map((round: any, idx: number) => (
                                                                            <div key={idx} style={{
                                                                                background: round.status === 'scheduled' 
                                                                                    ? 'linear-gradient(to bottom right, #f0f9ff, #e0f2fe)' 
                                                                                    : 'linear-gradient(to bottom right, #fefce8, #fef3c7)',
                                                                                border: round.status === 'scheduled' 
                                                                                    ? '2px solid #3b82f6' 
                                                                                    : '2px solid #eab308',
                                                                                borderRadius: '12px',
                                                                                padding: '18px',
                                                                                fontSize: '12px',
                                                                                boxShadow: round.status === 'scheduled' 
                                                                                    ? '0 4px 12px rgba(59, 130, 246, 0.2)' 
                                                                                    : '0 4px 12px rgba(234, 179, 8, 0.2)',
                                                                                marginBottom: '10px'
                                                                            }}>
                                                                                <p style={{ fontWeight: '800', color: round.status === 'scheduled' ? '#1e40af' : '#713f12', margin: '0 0 12px 0', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                                    {round.status === 'scheduled' ? '🎯' : '⏳'} <span style={{ color: round.status === 'scheduled' ? '#2563eb' : '#ca8a04' }}>Interview Round:</span> {round.round}
                                                                                </p>
                                                                                
                                                                                {round.team && (
                                                                                    <div style={{
                                                                                        background: 'rgba(255, 255, 255, 0.7)',
                                                                                        padding: '8px 12px',
                                                                                        borderRadius: '6px',
                                                                                        marginBottom: '8px'
                                                                                    }}>
                                                                                        <p style={{ color: '#475569', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                                                                                            <span style={{ fontWeight: '700', color: '#64748b' }}>👥 Team:</span> {round.team}
                                                                                        </p>
                                                                                    </div>
                                                                                )}
                                                                                
                                                                                {round.status === 'scheduled' ? (
                                                                                    <>
                                                                                        <div style={{
                                                                                            background: 'rgba(255, 255, 255, 0.7)',
                                                                                            padding: '12px',
                                                                                            borderRadius: '8px',
                                                                                            marginTop: '8px'
                                                                                        }}>
                                                                                            {round.interviewer_name && (
                                                                                                <p style={{ color: '#475569', margin: '6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                                                    <span style={{ fontWeight: '700', color: '#1e40af' }}>👤 Interviewer:</span> {round.interviewer_name} ({round.interviewer_email})
                                                                                                </p>
                                                                                            )}
                                                                                            {round.interview_date && (
                                                                                                <p style={{ color: '#475569', margin: '6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                                                    <span style={{ fontWeight: '700', color: '#1e40af' }}>📅 Date:</span> {round.interview_date}
                                                                                                </p>
                                                                                            )}
                                                                                            {round.interview_time && (
                                                                                                <p style={{ color: '#475569', margin: '6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                                                    <span style={{ fontWeight: '700', color: '#1e40af' }}>⏰ Time:</span> {round.interview_time}
                                                                                                </p>
                                                                                            )}
                                                                                            {round.location_type && (
                                                                                                <p style={{ color: '#475569', margin: '6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                                                    <span style={{ fontWeight: '700', color: '#1e40af' }}>📍 Location:</span> {round.location_type === 'online' ? '💻 Online' : '🏢 Offline'}
                                                                                                </p>
                                                                                            )}
                                                                                            {round.location_type === 'online' && round.meeting_link && (
                                                                                                <p style={{ color: '#475569', margin: '6px 0' }}>
                                                                                                    <span style={{ fontWeight: '700', color: '#1e40af', display: 'block', marginBottom: '4px' }}>🔗 Meeting Link:</span>
                                                                                                    <a href={round.meeting_link} target="_blank" rel="noopener noreferrer" style={{
                                                                                                        color: '#2563eb',
                                                                                                        textDecoration: 'none',
                                                                                                        wordBreak: 'break-all',
                                                                                                        transition: 'all 0.15s ease',
                                                                                                        fontWeight: '500'
                                                                                                    }}
                                                                                                    onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                                                                                                    onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}>
                                                                                                        {round.meeting_link}
                                                                                                    </a>
                                                                                                </p>
                                                                                            )}
                                                                                            {round.location_type === 'offline' && round.location && (
                                                                                                <p style={{ color: '#475569', margin: '6px 0', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                                                                                    <span style={{ fontWeight: '700', color: '#1e40af' }}>📍 Address:</span> {round.location}
                                                                                                </p>
                                                                                            )}
                                                                                        </div>
                                                                                        <div style={{
                                                                                            marginTop: '12px',
                                                                                            padding: '10px',
                                                                                            background: 'linear-gradient(to right, #d1fae5, #a7f3d0)',
                                                                                            borderRadius: '8px',
                                                                                            border: '1px solid #10b981'
                                                                                        }}>
                                                                                            <p style={{ fontSize: '11px', color: '#065f46', margin: 0, fontWeight: '600' }}>
                                                                                                ✅ Interview scheduled successfully. Both parties have been notified.
                                                                                            </p>
                                                                                        </div>
                                                                                    </>
                                                                                ) : (
                                                                                    <div style={{
                                                                                        marginTop: '12px',
                                                                                        padding: '14px',
                                                                                        background: 'linear-gradient(to right, #fef3c7, #fde68a)',
                                                                                        borderRadius: '8px',
                                                                                        border: '1px solid #f59e0b',
                                                                                        textAlign: 'center'
                                                                                    }}>
                                                                                        <p style={{ fontSize: '12px', color: '#92400e', margin: '0 0 4px 0', fontWeight: '700' }}>
                                                                                            ⏳ Awaiting Candidate Response
                                                                                        </p>
                                                                                        <p style={{ fontSize: '11px', color: '#78350f', margin: 0, fontWeight: '500' }}>
                                                                                            Invitation email has been sent. Waiting for the candidate to select their preferred interview slot.
                                                                                        </p>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <div style={{
                                                                        padding: '20px',
                                                                        background: 'linear-gradient(to bottom right, #fee2e2, #fecaca)',
                                                                        border: '2px solid #ef4444',
                                                                        borderRadius: '12px',
                                                                        textAlign: 'center'
                                                                    }}>
                                                                        <p style={{ fontSize: '13px', color: '#991b1b', margin: 0, fontWeight: '600' }}>
                                                                            ⚠️ No invitation details found for this candidate.
                                                                        </p>
                                                                        <p style={{ fontSize: '11px', color: '#b91c1c', margin: '6px 0 0 0', fontWeight: '500' }}>
                                                                            This may be a data inconsistency. Please try sending the invitation again.
                                                                        </p>
                                                                    </div>
                                                                )}

                                                                {/* Previous Completed Rounds */}
                                                                {applicant.previous_rounds && applicant.previous_rounds.length > 0 && (
                                                                    <div>
                                                                        <p style={{ fontSize: '13px', fontWeight: '700', color: '#64748b', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                            📜 Previous Completed Rounds
                                                                        </p>
                                                                        {applicant.previous_rounds.map((round: any, idx: number) => (
                                                                            <div key={idx} style={{
                                                                                background: 'linear-gradient(to bottom right, #f8fafc, #f1f5f9)',
                                                                                border: '1px solid #e2e8f0',
                                                                                borderRadius: '10px',
                                                                                padding: '14px',
                                                                                fontSize: '12px',
                                                                                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
                                                                                marginBottom: '8px'
                                                                            }}>
                                                                                <p style={{ fontWeight: '700', color: '#1e293b', margin: '0 0 8px 0', fontSize: '13px' }}>
                                                                                    <span style={{ color: '#64748b' }}>Round:</span> {round.round}
                                                                                </p>
                                                                                {round.interviewer_name && (
                                                                                    <p style={{ color: '#475569', margin: '4px 0' }}>
                                                                                        <span style={{ fontWeight: '600' }}>Interviewer:</span> {round.interviewer_name}
                                                                                    </p>
                                                                                )}
                                                                                {round.interview_date && (
                                                                                    <p style={{ color: '#475569', margin: '4px 0' }}>
                                                                                        <span style={{ fontWeight: '600' }}>Date:</span> {round.interview_date}
                                                                                    </p>
                                                                                )}
                                                                                {round.interview_time && (
                                                                                    <p style={{ color: '#475569', margin: '4px 0' }}>
                                                                                        <span style={{ fontWeight: '600' }}>Time:</span> {round.interview_time}
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                )}

                                {activeTab === 'conduct_rounds' && (
                                    <div className="space-y-4 max-h-[600px] overflow-y-auto">
                                        {conductRounds.length === 0 ? (
                                            <p className="text-slate-500 text-sm text-center py-8">No applicants selected for interview</p>
                                        ) : (
                                            conductRounds.map((applicant) => (
                                                <ApplicantCard
                                                    key={applicant._id}
                                                    applicant={applicant}
                                                    onStatusChange={handleStatusChange}
                                                    updatingStatus={updatingStatus === applicant.email}
                                                    formatDate={formatDate}
                                                    getStatusColor={getStatusColor}
                                                    viewMode="conduct"
                                                    teams={teams}
                                                    showScheduleForm={showScheduleForm === applicant.email}
                                                    onOpenScheduleForm={(email) => {
                                                        setShowScheduleForm(email);
                                                        setSelectedRound('');
                                                        setSelectedTeam('');
                                                        fetchTeams();
                                                    }}
                                                    onCloseScheduleForm={() => {
                                                        setShowScheduleForm(null);
                                                        setSelectedRound('');
                                                        setSelectedTeam('');
                                                    }}
                                                    selectedRound={selectedRound}
                                                    selectedTeam={selectedTeam}
                                                    selectedLocationType={selectedLocationType}
                                                    onRoundChange={setSelectedRound}
                                                    onTeamChange={setSelectedTeam}
                                                    onLocationTypeChange={setSelectedLocationType}
                                                    onSubmitSchedule={handleScheduleSubmit}
                                                />
                                            ))
                                        )}
                                    </div>
                                )}

                                {activeTab === 'ongoing' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '600px', overflowY: 'auto' }}>
                                        {ongoingRounds.length === 0 ? (
                                            <p style={{ color: '#64748b', fontSize: '14px', textAlign: 'center', padding: '32px 0' }}>No applicants in ongoing rounds</p>
                                        ) : (
                                            ongoingRounds.map((applicant) => {
                                                const showDetails = expandedDetails.has(applicant.email);
                                                const showRounds = expandedRounds.has(applicant.email);
                                                return (
                                                    <div key={applicant._id} style={{
                                                        background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
                                                        border: '1px solid #93c5fd',
                                                        borderRadius: '10px',
                                                        padding: '16px',
                                                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)',
                                                        transition: 'all 0.2s ease-in-out',
                                                        transform: 'translateY(0)'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(-3px)';
                                                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.3)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.2)';
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                <h3 style={{ fontWeight: '700', color: '#1e40af', fontSize: '15px', margin: '0 0 2px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{applicant.name}</h3>
                                                                <p style={{ fontSize: '12px', color: '#2563eb', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{applicant.email}</p>
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px', flexShrink: 0 }}>
                                                                <button
                                                                    onClick={() => {
                                                                        const newSet = new Set(expandedDetails);
                                                                        if (newSet.has(applicant.email)) {
                                                                            newSet.delete(applicant.email);
                                                                        } else {
                                                                            newSet.add(applicant.email);
                                                                        }
                                                                        setExpandedDetails(newSet);
                                                                    }}
                                                                    style={{
                                                                        padding: '6px 12px',
                                                                        fontSize: '11px',
                                                                        fontWeight: '600',
                                                                        color: '#ffffff',
                                                                        background: 'linear-gradient(to right, #3b82f6, #2563eb)',
                                                                        border: 'none',
                                                                        borderRadius: '8px',
                                                                        cursor: 'pointer',
                                                                        boxShadow: '0 2px 6px rgba(37, 99, 235, 0.2)',
                                                                        transition: 'all 0.15s ease',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '4px',
                                                                        minWidth: '80px',
                                                                        justifyContent: 'center'
                                                                    }}
                                                                    onMouseEnter={(e) => { e.currentTarget.style.background = 'linear-gradient(to right, #2563eb, #1d4ed8)'; e.currentTarget.style.boxShadow = '0 3px 8px rgba(37, 99, 235, 0.3)'; }}
                                                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'linear-gradient(to right, #3b82f6, #2563eb)'; e.currentTarget.style.boxShadow = '0 2px 6px rgba(37, 99, 235, 0.2)'; }}
                                                                >
                                                                    {showDetails ? 'Hide' : '▶'} Details
                                                                </button>
                                                                {(applicant.previous_rounds && applicant.previous_rounds.length > 0) && (
                                                                    <button
                                                                        onClick={() => {
                                                                            const newSet = new Set(expandedRounds);
                                                                            if (newSet.has(applicant.email)) {
                                                                                newSet.delete(applicant.email);
                                                                            } else {
                                                                                newSet.add(applicant.email);
                                                                            }
                                                                            setExpandedRounds(newSet);
                                                                        }}
                                                                        style={{
                                                                            padding: '6px 12px',
                                                                            fontSize: '11px',
                                                                            fontWeight: '600',
                                                                            color: '#475569',
                                                                            background: '#ffffff',
                                                                            border: '1px solid #e2e8f0',
                                                                            borderRadius: '8px',
                                                                            cursor: 'pointer',
                                                                            transition: 'all 0.15s ease',
                                                                            whiteSpace: 'nowrap'
                                                                        }}
                                                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                                                                        onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
                                                                    >
                                                                        Rounds
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                        
                                                        {showDetails && (
                                                            <div style={{
                                                                marginTop: '12px',
                                                                padding: '14px',
                                                                background: 'linear-gradient(to bottom right, #f8fafc, #f1f5f9)',
                                                                borderRadius: '10px',
                                                                border: '1px solid #e2e8f0',
                                                                fontSize: '11px'
                                                            }}>
                                                                {(applicant.resume_url || applicant.profile?.resume_url) && (
                                                                    <div style={{ marginBottom: '12px', padding: '10px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                                        <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                            <span style={{ fontWeight: '600', color: '#475569' }}>📄 Resume:</span>
                                                                            <a 
                                                                                href={`${API_BASE_URL}${applicant.resume_url || applicant.profile?.resume_url}`} 
                                                                                target="_blank" 
                                                                                rel="noopener noreferrer" 
                                                                                style={{
                                                                                    color: '#2563eb',
                                                                                    textDecoration: 'none',
                                                                                    fontWeight: '500',
                                                                                    transition: 'all 0.15s ease'
                                                                                }}
                                                                                onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                                                                                onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                                                                            >
                                                                                View Resume →
                                                                            </a>
                                                                        </p>
                                                                    </div>
                                                                )}
                                                                {(applicant.additional_details || applicant.profile?.additional_details) && (
                                                                    <div style={{
                                                                        marginBottom: '12px',
                                                                        padding: '14px',
                                                                        background: 'linear-gradient(to bottom right, #f0f9ff, #e0f2fe)',
                                                                        borderRadius: '8px',
                                                                        border: '1px solid #bae6fd',
                                                                        maxHeight: '350px',
                                                                        overflowY: 'auto'
                                                                    }}>
                                                                        <div style={{ fontSize: '11px', lineHeight: '1.8', color: '#475569' }}>
                                                                            {(() => {
                                                                                const details = applicant.additional_details || applicant.profile?.additional_details || '';
                                                                                const lines = details.split('\n').filter((l: string) => l.trim());
                                                                                return lines.map((line: string, idx: number) => {
                                                                                    const trimmed = line.trim();
                                                                                    
                                                                                    if (!trimmed.includes(':') || trimmed.match(/^[A-Z][a-z\s]+$/)) {
                                                                                        return (
                                                                                            <p key={idx} style={{
                                                                                                fontWeight: '700',
                                                                                                color: '#1e40af',
                                                                                                fontSize: '12px',
                                                                                                margin: idx === 0 ? '0 0 12px 0' : '16px 0 12px 0',
                                                                                                textTransform: 'uppercase',
                                                                                                letterSpacing: '0.5px'
                                                                                            }}>
                                                                                                {trimmed}
                                                                                            </p>
                                                                                        );
                                                                                    }
                                                                                    
                                                                                    const colonIndex = trimmed.indexOf(':');
                                                                                    if (colonIndex > 0) {
                                                                                        const key = trimmed.substring(0, colonIndex).trim();
                                                                                        const value = trimmed.substring(colonIndex + 1).trim();
                                                                                        
                                                                                        return (
                                                                                            <div key={idx} style={{ marginBottom: '8px', paddingLeft: '0' }}>
                                                                                                <p style={{ margin: 0 }}>
                                                                                                    <span style={{ 
                                                                                                        fontWeight: '600', 
                                                                                                        color: '#0c4a6e',
                                                                                                        fontSize: '11px'
                                                                                                    }}>
                                                                                                        {key}:
                                                                                                    </span>
                                                                                                    <span style={{ 
                                                                                                        marginLeft: '6px',
                                                                                                        color: '#475569'
                                                                                                    }}>
                                                                                                        {value}
                                                                                                    </span>
                                                                                                </p>
                                                                                            </div>
                                                                                        );
                                                                                    }
                                                                                    
                                                                                    return (
                                                                                        <p key={idx} style={{ margin: '4px 0', color: '#64748b' }}>
                                                                                            {trimmed}
                                                                                        </p>
                                                                                    );
                                                                                });
                                                                            })()}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {applicant.applied_at && (
                                                                    <div style={{ padding: '10px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                                        <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
                                                                            <span style={{ fontWeight: '600', color: '#475569' }}>📅 Applied:</span> {formatDate(applicant.applied_at)}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                        
                                                        {showRounds && (
                                                            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                                {/* Show Ongoing Rounds */}
                                                                {applicant.ongoing_rounds && applicant.ongoing_rounds.length > 0 && (
                                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                                        <p style={{ fontSize: '12px', fontWeight: '700', color: '#1e40af', margin: 0 }}>📍 Ongoing Rounds:</p>
                                                                        {applicant.ongoing_rounds.map((round: any, idx: number) => {
                                                                            const roundDateTime = new Date(`${round.interview_date} ${round.interview_time}`);
                                                                            const now = new Date();
                                                                            const daysDiff = Math.floor((roundDateTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                                                                            const isToday = daysDiff === 0 && roundDateTime.toDateString() === now.toDateString();
                                                                            const isPast = roundDateTime < now;
                                                                            
                                                                            let statusBadge = { text: '📅 Scheduled', color: '#3b82f6', bg: '#dbeafe' };
                                                                            if (isToday) {
                                                                                statusBadge = { text: '🔴 Today', color: '#dc2626', bg: '#fee2e2' };
                                                                            } else if (isPast && round.status !== 'completed') {
                                                                                statusBadge = { text: '⏳ Pending Feedback', color: '#f59e0b', bg: '#fef3c7' };
                                                                            } else if (round.status === 'completed' || round.scores) {
                                                                                statusBadge = { text: '✅ Completed', color: '#16a34a', bg: '#dcfce7' };
                                                                            } else if (daysDiff === 1) {
                                                                                statusBadge = { text: '⚡ Tomorrow', color: '#8b5cf6', bg: '#ede9fe' };
                                                                            }
                                                                            
                                                                            return (
                                                                                <div key={idx} style={{
                                                                                    background: round.scores || round.status === 'completed' 
                                                                                        ? 'linear-gradient(to bottom right, #f0fdf4, #dcfce7)' 
                                                                                        : isToday 
                                                                                        ? 'linear-gradient(to bottom right, #fef2f2, #fee2e2)'
                                                                                        : 'linear-gradient(to bottom right, #dbeafe, #bfdbfe)',
                                                                                    border: round.scores || round.status === 'completed'
                                                                                        ? '2px solid #16a34a'
                                                                                        : isToday
                                                                                        ? '2px solid #dc2626'
                                                                                        : '1px solid #93c5fd',
                                                                                    borderRadius: '10px',
                                                                                    padding: '14px',
                                                                                    fontSize: '12px',
                                                                                    boxShadow: '0 2px 6px rgba(37, 99, 235, 0.1)',
                                                                                    position: 'relative'
                                                                                }}>
                                                                                    <div style={{
                                                                                        position: 'absolute',
                                                                                        top: '10px',
                                                                                        right: '10px',
                                                                                        padding: '4px 10px',
                                                                                        borderRadius: '12px',
                                                                                        fontSize: '10px',
                                                                                        fontWeight: '700',
                                                                                        color: statusBadge.color,
                                                                                        background: statusBadge.bg,
                                                                                        border: `1px solid ${statusBadge.color}30`
                                                                                    }}>
                                                                                        {statusBadge.text}
                                                                                    </div>
                                                                                    
                                                                                    <p style={{ fontWeight: '600', color: '#1e293b', margin: '0 0 6px 0', paddingRight: '120px' }}>
                                                                                        <span style={{ color: '#2563eb' }}>Round:</span> {round.round}
                                                                                    </p>
                                                                                    <p style={{ color: '#475569', margin: '4px 0' }}>
                                                                                        <span style={{ fontWeight: '600' }}>Interviewer:</span> {round.interviewer_name} ({round.interviewer_email})
                                                                                    </p>
                                                                                    <p style={{ color: '#475569', margin: '4px 0' }}>
                                                                                        <span style={{ fontWeight: '600' }}>Date:</span> {round.interview_date}
                                                                                    </p>
                                                                                    <p style={{ color: '#475569', margin: '4px 0' }}>
                                                                                        <span style={{ fontWeight: '600' }}>Time:</span> {round.interview_time}
                                                                                    </p>
                                                                                    {round.location_type && (
                                                                                        <p style={{ color: '#475569', margin: '4px 0' }}>
                                                                                            <span style={{ fontWeight: '600' }}>Location:</span> {round.location_type === 'online' ? '💻 Online' : '🏢 Offline'}
                                                                                        </p>
                                                                                    )}
                                                                                    {round.meeting_link && (
                                                                                        <p style={{ color: '#475569', margin: '4px 0' }}>
                                                                                            <span style={{ fontWeight: '600' }}>Meeting:</span>{' '}
                                                                                            <a href={round.meeting_link} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>
                                                                                                {round.meeting_link}
                                                                                            </a>
                                                                                        </p>
                                                                                    )}
                                                                                    {round.location && (
                                                                                        <p style={{ color: '#475569', margin: '4px 0' }}>
                                                                                            <span style={{ fontWeight: '600' }}>Address:</span> {round.location}
                                                                                        </p>
                                                                                    )}
                                                                                    
                                                                                    {round.scores && (
                                                                                        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '2px solid #86efac' }}>
                                                                                            <p style={{ fontWeight: '700', color: '#16a34a', margin: '0 0 8px 0', fontSize: '12px' }}>📊 Interview Scores:</p>
                                                                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', fontSize: '11px' }}>
                                                                                                {Object.entries(round.scores).map(([key, value]: [string, any]) => (
                                                                                                    <p key={key} style={{ color: '#475569', margin: 0 }}>
                                                                                                        <span style={{ fontWeight: '600' }}>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</span> {value}/5
                                                                                                    </p>
                                                                                                ))}
                                                                                            </div>
                                                                                            {(() => {
                                                                                                const scores = Object.values(round.scores) as number[];
                                                                                                const avg = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
                                                                                                return (
                                                                                                    <p style={{ 
                                                                                                        marginTop: '8px', 
                                                                                                        padding: '6px 10px',
                                                                                                        background: '#dcfce7',
                                                                                                        borderRadius: '6px',
                                                                                                        color: '#16a34a', 
                                                                                                        fontWeight: '700',
                                                                                                        fontSize: '11px',
                                                                                                        margin: '8px 0 0 0'
                                                                                                    }}>
                                                                                                        Average Score: {avg}/5
                                                                                                    </p>
                                                                                                );
                                                                                            })()}
                                                                                        </div>
                                                                                    )}
                                                                                    
                                                                                    {round.interview_outcome && (
                                                                                        <p style={{ 
                                                                                            marginTop: '8px', 
                                                                                            padding: '6px 10px',
                                                                                            background: round.interview_outcome === 'selected' || round.interview_outcome === 'proceed'
                                                                                                ? '#dcfce7' 
                                                                                                : '#fee2e2',
                                                                                            borderRadius: '6px',
                                                                                            color: round.interview_outcome === 'selected' || round.interview_outcome === 'proceed'
                                                                                                ? '#16a34a' 
                                                                                                : '#dc2626',
                                                                                            fontWeight: '600',
                                                                                            fontSize: '11px',
                                                                                            margin: '8px 0 0 0'
                                                                                        }}>
                                                                                            <span style={{ fontWeight: '700' }}>Outcome:</span> {round.interview_outcome.toUpperCase()}
                                                                                        </p>
                                                                                    )}
                                                                                    
                                                                                    {round.candidate_attended && (
                                                                                        <p style={{ color: '#475569', margin: '8px 0 0 0', fontSize: '11px' }}>
                                                                                            <span style={{ fontWeight: '600' }}>Attended:</span> {round.candidate_attended}
                                                                                        </p>
                                                                                    )}
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                )}
                                                                
                                                                {/* Show Previous Rounds */}
                                                                {applicant.previous_rounds && applicant.previous_rounds.length > 0 && (
                                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                                        <p style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', margin: 0 }}>📜 Previous Rounds:</p>
                                                                        {applicant.previous_rounds.map((round: any, idx: number) => (
                                                                            <div key={idx} style={{
                                                                                background: 'linear-gradient(to bottom right, #f8fafc, #f1f5f9)',
                                                                                border: '1px solid #e2e8f0',
                                                                                borderRadius: '10px',
                                                                                padding: '14px',
                                                                                fontSize: '12px',
                                                                                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)'
                                                                            }}>
                                                                                <p style={{ fontWeight: '600', color: '#1e293b', margin: '0 0 6px 0' }}>
                                                                                    <span style={{ color: '#64748b' }}>Round:</span> {round.round}
                                                                                </p>
                                                                                {round.interviewer_name && (
                                                                                    <p style={{ color: '#475569', margin: '4px 0' }}>
                                                                                        <span style={{ fontWeight: '600' }}>Interviewer:</span> {round.interviewer_name} ({round.interviewer_email})
                                                                                    </p>
                                                                                )}
                                                                                {round.interview_date && (
                                                                                    <p style={{ color: '#475569', margin: '4px 0' }}>
                                                                                        <span style={{ fontWeight: '600' }}>Date:</span> {round.interview_date}
                                                                                    </p>
                                                                                )}
                                                                                {round.interview_time && (
                                                                                    <p style={{ color: '#475569', margin: '4px 0' }}>
                                                                                        <span style={{ fontWeight: '600' }}>Time:</span> {round.interview_time}
                                                                                    </p>
                                                                                )}
                                                                                {round.candidate_attended && (
                                                                                    <p style={{ color: '#475569', margin: '4px 0' }}>
                                                                                        <span style={{ fontWeight: '600' }}>Attended:</span> {round.candidate_attended}
                                                                                    </p>
                                                                                )}
                                                                                {round.interview_outcome && (
                                                                                    <p style={{ color: '#475569', margin: '4px 0' }}>
                                                                                        <span style={{ fontWeight: '600' }}>Outcome:</span> {round.interview_outcome}
                                                                                    </p>
                                                                                )}
                                                                                {round.scores && (
                                                                                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #cbd5e1' }}>
                                                                                        <p style={{ fontWeight: '600', color: '#1e293b', margin: '0 0 8px 0', fontSize: '12px' }}>📊 Scores:</p>
                                                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', fontSize: '11px' }}>
                                                                                            {Object.entries(round.scores).map(([key, value]: [string, any]) => (
                                                                                                <p key={key} style={{ color: '#475569', margin: 0 }}>
                                                                                                    <span style={{ fontWeight: '600' }}>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</span> {value}/5
                                                                                                </p>
                                                                                            ))}
                                                                                        </div>
                                                                                        {(() => {
                                                                                            const scores = Object.values(round.scores) as number[];
                                                                                            const avg = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
                                                                                            return (
                                                                                                <p style={{ 
                                                                                                    marginTop: '8px', 
                                                                                                    padding: '6px 10px',
                                                                                                    background: '#f1f5f9',
                                                                                                    borderRadius: '6px',
                                                                                                    color: '#475569', 
                                                                                                    fontWeight: '700',
                                                                                                    fontSize: '11px',
                                                                                                    margin: '8px 0 0 0'
                                                                                                }}>
                                                                                                    Average Score: {avg}/5
                                                                                                </p>
                                                                                            );
                                                                                        })()}
                                                                                    </div>
                                                                                )}
                                                                                {round.reason && (
                                                                                    <p style={{ color: '#475569', margin: '8px 0 0 0', fontSize: '11px', fontStyle: 'italic' }}>
                                                                                        <span style={{ fontWeight: '600' }}>Reason:</span> {round.reason}
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                )}

                                {activeTab === 'selected' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '600px', overflowY: 'auto' }}>
                                        {selected.length === 0 ? (
                                            <p style={{ color: '#64748b', fontSize: '14px', textAlign: 'center', padding: '32px 0' }}>No selected applicants yet</p>
                                        ) : (
                                            selected.map((applicant) => {
                                                const showDetails = expandedDetails.has(applicant.email);
                                                const showRounds = expandedRounds.has(applicant.email);
                                                return (
                                                    <div key={applicant._id} style={{
                                                        background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
                                                        border: '1px solid #86efac',
                                                        borderRadius: '10px',
                                                        padding: '16px',
                                                        boxShadow: '0 4px 12px rgba(34, 197, 94, 0.2)',
                                                        transition: 'all 0.2s ease-in-out',
                                                        transform: 'translateY(0)'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(-3px)';
                                                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(34, 197, 94, 0.3)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.2)';
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                <h3 style={{ fontWeight: '700', color: '#15803d', fontSize: '15px', margin: '0 0 2px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{applicant.name}</h3>
                                                                <p style={{ fontSize: '12px', color: '#16a34a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{applicant.email}</p>
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px', flexShrink: 0 }}>
                                                                <button
                                                                    onClick={() => {
                                                                        const newSet = new Set(expandedDetails);
                                                                        if (newSet.has(applicant.email)) {
                                                                            newSet.delete(applicant.email);
                                                                        } else {
                                                                            newSet.add(applicant.email);
                                                                        }
                                                                        setExpandedDetails(newSet);
                                                                    }}
                                                                    style={{
                                                                        padding: '6px 12px',
                                                                        fontSize: '11px',
                                                                        fontWeight: '600',
                                                                        color: '#ffffff',
                                                                        background: 'linear-gradient(to right, #22c55e, #16a34a)',
                                                                        border: 'none',
                                                                        borderRadius: '8px',
                                                                        cursor: 'pointer',
                                                                        boxShadow: '0 2px 6px rgba(34, 197, 94, 0.2)',
                                                                        transition: 'all 0.15s ease',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '4px',
                                                                        minWidth: '80px',
                                                                        justifyContent: 'center'
                                                                    }}
                                                                    onMouseEnter={(e) => { e.currentTarget.style.background = 'linear-gradient(to right, #16a34a, #15803d)'; e.currentTarget.style.boxShadow = '0 3px 8px rgba(34, 197, 94, 0.3)'; }}
                                                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'linear-gradient(to right, #22c55e, #16a34a)'; e.currentTarget.style.boxShadow = '0 2px 6px rgba(34, 197, 94, 0.2)'; }}
                                                                >
                                                                    {showDetails ? 'Hide' : '▶'} Details
                                                                </button>
                                                                {(applicant.previous_rounds && applicant.previous_rounds.length > 0) && (
                                                                    <button
                                                                        onClick={() => {
                                                                            const newSet = new Set(expandedRounds);
                                                                            if (newSet.has(applicant.email)) {
                                                                                newSet.delete(applicant.email);
                                                                            } else {
                                                                                newSet.add(applicant.email);
                                                                            }
                                                                            setExpandedRounds(newSet);
                                                                        }}
                                                                        style={{
                                                                            padding: '6px 12px',
                                                                            fontSize: '11px',
                                                                            fontWeight: '600',
                                                                            color: '#475569',
                                                                            background: '#ffffff',
                                                                            border: '1px solid #e2e8f0',
                                                                            borderRadius: '8px',
                                                                            cursor: 'pointer',
                                                                            transition: 'all 0.15s ease',
                                                                            whiteSpace: 'nowrap'
                                                                        }}
                                                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                                                                        onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
                                                                    >
                                                                        Rounds
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => {
                                                                        if (showOfferForm === applicant.email) {
                                                                            setShowOfferForm(null);
                                                                            setOfferLetterFile(null);
                                                                        } else {
                                                                            setShowOfferForm(applicant.email);
                                                                            setOfferLetterFile(null);
                                                                        }
                                                                    }}
                                                                    style={{
                                                                        padding: '6px 12px',
                                                                        fontSize: '11px',
                                                                        fontWeight: '600',
                                                                        color: showOfferForm === applicant.email ? '#475569' : '#ffffff',
                                                                        background: showOfferForm === applicant.email ? '#cbd5e1' : 'linear-gradient(to right, #22c55e, #16a34a)',
                                                                        border: 'none',
                                                                        borderRadius: '8px',
                                                                        cursor: 'pointer',
                                                                        boxShadow: showOfferForm === applicant.email ? 'none' : '0 2px 6px rgba(34, 197, 94, 0.2)',
                                                                        transition: 'all 0.15s ease',
                                                                        whiteSpace: 'nowrap'
                                                                    }}
                                                                    onMouseEnter={(e) => { 
                                                                        if (showOfferForm !== applicant.email) {
                                                                            e.currentTarget.style.background = 'linear-gradient(to right, #16a34a, #15803d)';
                                                                            e.currentTarget.style.boxShadow = '0 3px 8px rgba(34, 197, 94, 0.3)';
                                                                        } else {
                                                                            e.currentTarget.style.background = '#94a3b8';
                                                                        }
                                                                    }}
                                                                    onMouseLeave={(e) => { 
                                                                        if (showOfferForm !== applicant.email) {
                                                                            e.currentTarget.style.background = 'linear-gradient(to right, #22c55e, #16a34a)';
                                                                            e.currentTarget.style.boxShadow = '0 2px 6px rgba(34, 197, 94, 0.2)';
                                                                        } else {
                                                                            e.currentTarget.style.background = '#cbd5e1';
                                                                        }
                                                                    }}
                                                                >
                                                                    {showOfferForm === applicant.email ? 'Cancel' : '📧 Send Offer'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                        
                                                        {showOfferForm === applicant.email && (
                                                            <div style={{
                                                                marginTop: '14px',
                                                                padding: '20px',
                                                                background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                                                                borderRadius: '12px',
                                                                border: '2px solid #86efac',
                                                                boxShadow: '0 4px 12px rgba(34, 197, 94, 0.15)'
                                                            }}>
                                                                <div style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '10px',
                                                                    marginBottom: '14px',
                                                                    paddingBottom: '12px',
                                                                    borderBottom: '2px solid #bbf7d0'
                                                                }}>
                                                                    <div style={{
                                                                        width: '36px',
                                                                        height: '36px',
                                                                        background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                                                                        borderRadius: '10px',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)'
                                                                    }}>
                                                                        <span style={{ fontSize: '18px' }}>📧</span>
                                                                    </div>
                                                                    <div>
                                                                        <h4 style={{
                                                                            fontSize: '14px',
                                                                            fontWeight: '700',
                                                                            color: '#15803d',
                                                                            margin: 0,
                                                                            letterSpacing: '-0.2px'
                                                                        }}>
                                                                            Send Offer Letter
                                                                        </h4>
                                                                        <p style={{
                                                                            fontSize: '11px',
                                                                            color: '#16a34a',
                                                                            margin: '2px 0 0 0',
                                                                            fontWeight: '500'
                                                                        }}>
                                                                            Upload and send offer to {applicant.name}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                <div>
                                                                    <label style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '6px',
                                                                        fontSize: '12px',
                                                                        fontWeight: '600',
                                                                        color: '#15803d',
                                                                        marginBottom: '10px'
                                                                    }}>
                                                                        📎 Offer Letter Document <span style={{ color: '#ef4444', fontSize: '14px' }}>*</span>
                                                                    </label>
                                                                    <div style={{
                                                                        position: 'relative',
                                                                        width: '100%'
                                                                    }}>
                                                                        <input
                                                                            type="file"
                                                                            accept=".pdf,.doc,.docx"
                                                                            onChange={(e) => {
                                                                                if (e.target.files && e.target.files[0]) {
                                                                                    setOfferLetterFile(e.target.files[0]);
                                                                                }
                                                                            }}
                                                                            style={{
                                                                                width: '100%',
                                                                                padding: '12px 14px',
                                                                                border: '2px dashed #86efac',
                                                                                borderRadius: '10px',
                                                                                fontSize: '12px',
                                                                                background: '#ffffff',
                                                                                cursor: 'pointer',
                                                                                transition: 'all 0.2s ease',
                                                                                fontWeight: '500',
                                                                                color: '#15803d'
                                                                            }}
                                                                            onMouseEnter={(e) => {
                                                                                e.currentTarget.style.borderColor = '#22c55e';
                                                                                e.currentTarget.style.background = '#f0fdf4';
                                                                            }}
                                                                            onMouseLeave={(e) => {
                                                                                e.currentTarget.style.borderColor = '#86efac';
                                                                                e.currentTarget.style.background = '#ffffff';
                                                                            }}
                                                                        />
                                                                    </div>
                                                                    {offerLetterFile && (
                                                                        <div style={{
                                                                            marginTop: '8px',
                                                                            padding: '8px 12px',
                                                                            background: '#ffffff',
                                                                            border: '1px solid #bbf7d0',
                                                                            borderRadius: '8px',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '8px'
                                                                        }}>
                                                                            <span style={{ fontSize: '14px' }}>✅</span>
                                                                            <span style={{
                                                                                fontSize: '11px',
                                                                                color: '#15803d',
                                                                                fontWeight: '600',
                                                                                overflow: 'hidden',
                                                                                textOverflow: 'ellipsis',
                                                                                whiteSpace: 'nowrap',
                                                                                flex: 1
                                                                            }}>
                                                                                {offerLetterFile.name}
                                                                            </span>
                                                                            <span style={{
                                                                                fontSize: '10px',
                                                                                color: '#16a34a',
                                                                                fontWeight: '500',
                                                                                padding: '2px 6px',
                                                                                background: '#dcfce7',
                                                                                borderRadius: '4px'
                                                                            }}>
                                                                                {(offerLetterFile.size / 1024).toFixed(1)} KB
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                    <p style={{
                                                                        fontSize: '10px',
                                                                        color: '#16a34a',
                                                                        margin: '8px 0 0 0',
                                                                        fontStyle: 'italic',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '4px'
                                                                    }}>
                                                                        <span>ℹ️</span>
                                                                        Accepted formats: PDF, DOC, DOCX
                                                                    </p>
                                                                </div>

                                                                <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                                                                    <button
                                                                        onClick={() => handleSendOffer(applicant)}
                                                                        disabled={!offerLetterFile || sendingOffer}
                                                                        style={{
                                                                            flex: 1,
                                                                            padding: '12px 20px',
                                                                            background: !offerLetterFile || sendingOffer 
                                                                                ? '#cbd5e1' 
                                                                                : 'linear-gradient(135deg, #22c55e, #16a34a)',
                                                                            color: '#ffffff',
                                                                            border: 'none',
                                                                            borderRadius: '10px',
                                                                            fontSize: '13px',
                                                                            fontWeight: '700',
                                                                            cursor: !offerLetterFile || sendingOffer ? 'not-allowed' : 'pointer',
                                                                            transition: 'all 0.2s ease',
                                                                            boxShadow: !offerLetterFile || sendingOffer 
                                                                                ? 'none' 
                                                                                : '0 4px 12px rgba(34, 197, 94, 0.3)',
                                                                            letterSpacing: '0.3px',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            gap: '6px'
                                                                        }}
                                                                        onMouseEnter={(e) => {
                                                                            if (offerLetterFile && !sendingOffer) {
                                                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                                                e.currentTarget.style.boxShadow = '0 6px 16px rgba(34, 197, 94, 0.4)';
                                                                            }
                                                                        }}
                                                                        onMouseLeave={(e) => {
                                                                            if (offerLetterFile && !sendingOffer) {
                                                                                e.currentTarget.style.transform = 'translateY(0)';
                                                                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.3)';
                                                                            }
                                                                        }}
                                                                    >
                                                                        {sendingOffer ? (
                                                                            <>
                                                                                <span style={{
                                                                                    width: '14px',
                                                                                    height: '14px',
                                                                                    border: '2px solid #ffffff',
                                                                                    borderTop: '2px solid transparent',
                                                                                    borderRadius: '50%',
                                                                                    animation: 'spin 1s linear infinite'
                                                                                }}></span>
                                                                                Sending Offer...
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <span style={{ fontSize: '16px' }}>📧</span>
                                                                                Send Offer Letter
                                                                            </>
                                                                        )}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            setShowOfferForm(null);
                                                                            setOfferLetterFile(null);
                                                                        }}
                                                                        disabled={sendingOffer}
                                                                        style={{
                                                                            padding: '12px 20px',
                                                                            background: sendingOffer ? '#e5e7eb' : '#f1f5f9',
                                                                            color: sendingOffer ? '#9ca3af' : '#475569',
                                                                            border: '2px solid',
                                                                            borderColor: sendingOffer ? '#e5e7eb' : '#e2e8f0',
                                                                            borderRadius: '10px',
                                                                            fontSize: '13px',
                                                                            fontWeight: '600',
                                                                            cursor: sendingOffer ? 'not-allowed' : 'pointer',
                                                                            transition: 'all 0.2s ease',
                                                                            whiteSpace: 'nowrap'
                                                                        }}
                                                                        onMouseEnter={(e) => {
                                                                            if (!sendingOffer) {
                                                                                e.currentTarget.style.background = '#e2e8f0';
                                                                                e.currentTarget.style.borderColor = '#cbd5e1';
                                                                            }
                                                                        }}
                                                                        onMouseLeave={(e) => {
                                                                            if (!sendingOffer) {
                                                                                e.currentTarget.style.background = '#f1f5f9';
                                                                                e.currentTarget.style.borderColor = '#e2e8f0';
                                                                            }
                                                                        }}
                                                                    >
                                                                        ✕ Cancel
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                        
                                                        {showDetails && (
                                                            <div style={{
                                                                marginTop: '12px',
                                                                padding: '14px',
                                                                background: 'linear-gradient(to bottom right, #f8fafc, #f1f5f9)',
                                                                borderRadius: '10px',
                                                                border: '1px solid #e2e8f0',
                                                                fontSize: '11px'
                                                            }}>
                                                                {(applicant.resume_url || applicant.profile?.resume_url) && (
                                                                    <div style={{ marginBottom: '12px', padding: '10px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                                        <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                            <span style={{ fontWeight: '600', color: '#475569' }}>📄 Resume:</span>
                                                                            <a 
                                                                                href={`${API_BASE_URL}${applicant.resume_url || applicant.profile?.resume_url}`} 
                                                                                target="_blank" 
                                                                                rel="noopener noreferrer" 
                                                                                style={{
                                                                                    color: '#22c55e',
                                                                                    textDecoration: 'none',
                                                                                    fontWeight: '500',
                                                                                    transition: 'all 0.15s ease'
                                                                                }}
                                                                                onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                                                                                onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                                                                            >
                                                                                View Resume →
                                                                            </a>
                                                                        </p>
                                                                    </div>
                                                                )}
                                                                {(applicant.additional_details || applicant.profile?.additional_details) && (
                                                                    <div style={{
                                                                        marginBottom: '12px',
                                                                        padding: '14px',
                                                                        background: 'linear-gradient(to bottom right, #f0fdf4, #dcfce7)',
                                                                        borderRadius: '8px',
                                                                        border: '1px solid #bbf7d0',
                                                                        maxHeight: '350px',
                                                                        overflowY: 'auto'
                                                                    }}>
                                                                        <div style={{ fontSize: '11px', lineHeight: '1.8', color: '#475569' }}>
                                                                            {(() => {
                                                                                const details = applicant.additional_details || applicant.profile?.additional_details || '';
                                                                                const lines = details.split('\n').filter((l: string) => l.trim());
                                                                                return lines.map((line: string, idx: number) => {
                                                                                    const trimmed = line.trim();
                                                                                    
                                                                                    if (!trimmed.includes(':') || trimmed.match(/^[A-Z][a-z\s]+$/)) {
                                                                                        return (
                                                                                            <p key={idx} style={{
                                                                                                fontWeight: '700',
                                                                                                color: '#15803d',
                                                                                                fontSize: '12px',
                                                                                                margin: idx === 0 ? '0 0 12px 0' : '16px 0 12px 0',
                                                                                                textTransform: 'uppercase',
                                                                                                letterSpacing: '0.5px'
                                                                                            }}>
                                                                                                {trimmed}
                                                                                            </p>
                                                                                        );
                                                                                    }
                                                                                    
                                                                                    const colonIndex = trimmed.indexOf(':');
                                                                                    if (colonIndex > 0) {
                                                                                        const key = trimmed.substring(0, colonIndex).trim();
                                                                                        const value = trimmed.substring(colonIndex + 1).trim();
                                                                                        
                                                                                        return (
                                                                                            <div key={idx} style={{ marginBottom: '8px', paddingLeft: '0' }}>
                                                                                                <p style={{ margin: 0 }}>
                                                                                                    <span style={{ 
                                                                                                        fontWeight: '600', 
                                                                                                        color: '#166534',
                                                                                                        fontSize: '11px'
                                                                                                    }}>
                                                                                                        {key}:
                                                                                                    </span>
                                                                                                    <span style={{ 
                                                                                                        marginLeft: '6px',
                                                                                                        color: '#475569'
                                                                                                    }}>
                                                                                                        {value}
                                                                                                    </span>
                                                                                                </p>
                                                                                            </div>
                                                                                        );
                                                                                    }
                                                                                    
                                                                                    return (
                                                                                        <p key={idx} style={{ margin: '4px 0', color: '#64748b' }}>
                                                                                            {trimmed}
                                                                                        </p>
                                                                                    );
                                                                                });
                                                                            })()}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {applicant.applied_at && (
                                                                    <div style={{ padding: '10px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                                        <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
                                                                            <span style={{ fontWeight: '600', color: '#475569' }}>📅 Applied:</span> {formatDate(applicant.applied_at)}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                        
                                                        {showRounds && applicant.previous_rounds && applicant.previous_rounds.length > 0 && (
                                                            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                                <p style={{ fontSize: '12px', fontWeight: '700', color: '#15803d', margin: 0 }}>📜 Interview Rounds:</p>
                                                                {applicant.previous_rounds.map((round: any, idx: number) => (
                                                                    <div key={idx} style={{
                                                                        background: 'linear-gradient(to bottom right, #f8fafc, #f1f5f9)',
                                                                        border: '1px solid #e2e8f0',
                                                                        borderRadius: '10px',
                                                                        padding: '14px',
                                                                        fontSize: '12px',
                                                                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)'
                                                                    }}>
                                                                        <p style={{ fontWeight: '600', color: '#1e293b', margin: '0 0 6px 0' }}>
                                                                            <span style={{ color: '#64748b' }}>Round:</span> {round.round}
                                                                        </p>
                                                                        {round.interviewer_name && (
                                                                            <p style={{ color: '#475569', margin: '4px 0' }}>
                                                                                <span style={{ fontWeight: '600' }}>Interviewer:</span> {round.interviewer_name} ({round.interviewer_email})
                                                                            </p>
                                                                        )}
                                                                        {round.interview_date && (
                                                                            <p style={{ color: '#475569', margin: '4px 0' }}>
                                                                                <span style={{ fontWeight: '600' }}>Date:</span> {round.interview_date}
                                                                            </p>
                                                                        )}
                                                                        {round.interview_time && (
                                                                            <p style={{ color: '#475569', margin: '4px 0' }}>
                                                                                <span style={{ fontWeight: '600' }}>Time:</span> {round.interview_time}
                                                                            </p>
                                                                        )}
                                                                        {round.candidate_attended && (
                                                                            <p style={{ color: '#475569', margin: '4px 0' }}>
                                                                                <span style={{ fontWeight: '600' }}>Attended:</span> {round.candidate_attended}
                                                                            </p>
                                                                        )}
                                                                        {round.interview_outcome && (
                                                                            <p style={{ color: '#475569', margin: '4px 0' }}>
                                                                                <span style={{ fontWeight: '600' }}>Outcome:</span> {round.interview_outcome}
                                                                            </p>
                                                                        )}
                                                                        {round.scores && (
                                                                            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #cbd5e1' }}>
                                                                                <p style={{ fontWeight: '600', color: '#1e293b', margin: '0 0 8px 0', fontSize: '12px' }}>📊 Scores:</p>
                                                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', fontSize: '11px' }}>
                                                                                    {Object.entries(round.scores).map(([key, value]: [string, any]) => (
                                                                                        <p key={key} style={{ color: '#475569', margin: 0 }}>
                                                                                            <span style={{ fontWeight: '600' }}>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</span> {value}/5
                                                                                        </p>
                                                                                    ))}
                                                                                </div>
                                                                                {(() => {
                                                                                    const scores = Object.values(round.scores) as number[];
                                                                                    const avg = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
                                                                                    return (
                                                                                        <p style={{ 
                                                                                            marginTop: '8px', 
                                                                                            padding: '6px 10px',
                                                                                            background: '#f1f5f9',
                                                                                            borderRadius: '6px',
                                                                                            color: '#475569', 
                                                                                            fontWeight: '700',
                                                                                            fontSize: '11px',
                                                                                            margin: '8px 0 0 0'
                                                                                        }}>
                                                                                            Average Score: {avg}/5
                                                                                        </p>
                                                                                    );
                                                                                })()}
                                                                            </div>
                                                                        )}
                                                                        {round.reason && (
                                                                            <p style={{ color: '#475569', margin: '8px 0 0 0', fontSize: '11px', fontStyle: 'italic' }}>
                                                                                <span style={{ fontWeight: '600' }}>Reason:</span> {round.reason}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                )}

                                {activeTab === 'offer_sent' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '600px', overflowY: 'auto' }}>
                                        {offerSent.length === 0 ? (
                                            <p style={{ color: '#64748b', fontSize: '14px', textAlign: 'center', padding: '32px 0' }}>No offers sent yet</p>
                                        ) : (
                                            offerSent.map((applicant) => {
                                                const showDetails = expandedDetails.has(applicant.email);
                                                const showRounds = expandedRounds.has(applicant.email);
                                                return (
                                                    <div key={applicant._id} style={{
                                                        background: 'linear-gradient(135deg, #fed7aa, #fdba74)',
                                                        border: '1px solid #fb923c',
                                                        borderRadius: '10px',
                                                        padding: '16px',
                                                        boxShadow: '0 4px 12px rgba(249, 115, 22, 0.2)',
                                                        transition: 'all 0.2s ease-in-out',
                                                        transform: 'translateY(0)'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(-3px)';
                                                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(249, 115, 22, 0.3)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(249, 115, 22, 0.2)';
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                <h3 style={{ fontWeight: '700', color: '#c2410c', fontSize: '15px', margin: '0 0 2px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{applicant.name}</h3>
                                                                <p style={{ fontSize: '12px', color: '#ea580c', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{applicant.email}</p>
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px', flexShrink: 0 }}>
                                                                <button
                                                                    onClick={() => {
                                                                        const newSet = new Set(expandedDetails);
                                                                        if (newSet.has(applicant.email)) {
                                                                            newSet.delete(applicant.email);
                                                                        } else {
                                                                            newSet.add(applicant.email);
                                                                        }
                                                                        setExpandedDetails(newSet);
                                                                    }}
                                                                    style={{
                                                                        padding: '6px 12px',
                                                                        fontSize: '11px',
                                                                        fontWeight: '600',
                                                                        color: '#ffffff',
                                                                        background: 'linear-gradient(to right, #f97316, #ea580c)',
                                                                        border: 'none',
                                                                        borderRadius: '8px',
                                                                        cursor: 'pointer',
                                                                        boxShadow: '0 2px 6px rgba(249, 115, 22, 0.2)',
                                                                        transition: 'all 0.15s ease',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '4px',
                                                                        minWidth: '80px',
                                                                        justifyContent: 'center'
                                                                    }}
                                                                    onMouseEnter={(e) => { e.currentTarget.style.background = 'linear-gradient(to right, #ea580c, #c2410c)'; e.currentTarget.style.boxShadow = '0 3px 8px rgba(249, 115, 22, 0.3)'; }}
                                                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'linear-gradient(to right, #f97316, #ea580c)'; e.currentTarget.style.boxShadow = '0 2px 6px rgba(249, 115, 22, 0.2)'; }}
                                                                >
                                                                    {showDetails ? 'Hide' : '▶'} Details
                                                                </button>
                                                                {(applicant.previous_rounds && applicant.previous_rounds.length > 0) && (
                                                                    <button
                                                                        onClick={() => {
                                                                            const newSet = new Set(expandedRounds);
                                                                            if (newSet.has(applicant.email)) {
                                                                                newSet.delete(applicant.email);
                                                                            } else {
                                                                                newSet.add(applicant.email);
                                                                            }
                                                                            setExpandedRounds(newSet);
                                                                        }}
                                                                        style={{
                                                                            padding: '6px 12px',
                                                                            fontSize: '11px',
                                                                            fontWeight: '600',
                                                                            color: '#475569',
                                                                            background: '#ffffff',
                                                                            border: '1px solid #e2e8f0',
                                                                            borderRadius: '8px',
                                                                            cursor: 'pointer',
                                                                            transition: 'all 0.15s ease',
                                                                            whiteSpace: 'nowrap'
                                                                        }}
                                                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                                                                        onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
                                                                    >
                                                                        Rounds
                                                                    </button>
                                                                )}
                                                                <span style={{
                                                                    padding: '6px 14px',
                                                                    background: 'linear-gradient(to right, #fff7ed, #ffedd5)',
                                                                    color: '#c2410c',
                                                                    borderRadius: '20px',
                                                                    fontSize: '11px',
                                                                    fontWeight: '700',
                                                                    border: '1px solid #fb923c',
                                                                    whiteSpace: 'nowrap',
                                                                    boxShadow: '0 2px 4px rgba(249, 115, 22, 0.1)'
                                                                }}>
                                                                    📧 Offer Sent
                                                                </span>
                                                            </div>
                                                        </div>
                                                        
                                                        {showDetails && (
                                                            <div style={{
                                                                marginTop: '12px',
                                                                padding: '14px',
                                                                background: 'linear-gradient(to bottom right, #f8fafc, #f1f5f9)',
                                                                borderRadius: '10px',
                                                                border: '1px solid #e2e8f0',
                                                                fontSize: '11px'
                                                            }}>
                                                                {(applicant.resume_url || applicant.profile?.resume_url) && (
                                                                    <div style={{ marginBottom: '12px', padding: '10px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                                        <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                            <span style={{ fontWeight: '600', color: '#475569' }}>📄 Resume:</span>
                                                                            <a 
                                                                                href={`${API_BASE_URL}${applicant.resume_url || applicant.profile?.resume_url}`} 
                                                                                target="_blank" 
                                                                                rel="noopener noreferrer" 
                                                                                style={{
                                                                                    color: '#f97316',
                                                                                    textDecoration: 'none',
                                                                                    fontWeight: '500',
                                                                                    transition: 'all 0.15s ease'
                                                                                }}
                                                                                onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                                                                                onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                                                                            >
                                                                                View Resume →
                                                                            </a>
                                                                        </p>
                                                                    </div>
                                                                )}
                                                                {(applicant.additional_details || applicant.profile?.additional_details) && (
                                                                    <div style={{
                                                                        marginBottom: '12px',
                                                                        padding: '14px',
                                                                        background: 'linear-gradient(to bottom right, #fff7ed, #ffedd5)',
                                                                        borderRadius: '8px',
                                                                        border: '1px solid #fed7aa',
                                                                        maxHeight: '350px',
                                                                        overflowY: 'auto'
                                                                    }}>
                                                                        <div style={{ fontSize: '11px', lineHeight: '1.8', color: '#475569' }}>
                                                                            {(() => {
                                                                                const details = applicant.additional_details || applicant.profile?.additional_details || '';
                                                                                const lines = details.split('\n').filter((l: string) => l.trim());
                                                                                return lines.map((line: string, idx: number) => {
                                                                                    const trimmed = line.trim();
                                                                                    
                                                                                    if (!trimmed.includes(':') || trimmed.match(/^[A-Z][a-z\s]+$/)) {
                                                                                        return (
                                                                                            <p key={idx} style={{
                                                                                                fontWeight: '700',
                                                                                                color: '#c2410c',
                                                                                                fontSize: '12px',
                                                                                                margin: idx === 0 ? '0 0 12px 0' : '16px 0 12px 0',
                                                                                                textTransform: 'uppercase',
                                                                                                letterSpacing: '0.5px'
                                                                                            }}>
                                                                                                {trimmed}
                                                                                            </p>
                                                                                        );
                                                                                    }
                                                                                    
                                                                                    const colonIndex = trimmed.indexOf(':');
                                                                                    if (colonIndex > 0) {
                                                                                        const key = trimmed.substring(0, colonIndex).trim();
                                                                                        const value = trimmed.substring(colonIndex + 1).trim();
                                                                                        
                                                                                        return (
                                                                                            <div key={idx} style={{ marginBottom: '8px', paddingLeft: '0' }}>
                                                                                                <p style={{ margin: 0 }}>
                                                                                                    <span style={{ 
                                                                                                        fontWeight: '600', 
                                                                                                        color: '#ea580c',
                                                                                                        fontSize: '11px'
                                                                                                    }}>
                                                                                                        {key}:
                                                                                                    </span>
                                                                                                    <span style={{ 
                                                                                                        marginLeft: '6px',
                                                                                                        color: '#475569'
                                                                                                    }}>
                                                                                                        {value}
                                                                                                    </span>
                                                                                                </p>
                                                                                            </div>
                                                                                        );
                                                                                    }
                                                                                    
                                                                                    return (
                                                                                        <p key={idx} style={{ margin: '4px 0', color: '#64748b' }}>
                                                                                            {trimmed}
                                                                                        </p>
                                                                                    );
                                                                                });
                                                                            })()}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {applicant.applied_at && (
                                                                    <div style={{ padding: '10px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                                        <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
                                                                            <span style={{ fontWeight: '600', color: '#475569' }}>📅 Applied:</span> {formatDate(applicant.applied_at)}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                        
                                                        {showRounds && applicant.previous_rounds && applicant.previous_rounds.length > 0 && (
                                                            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                                <p style={{ fontSize: '12px', fontWeight: '700', color: '#c2410c', margin: 0 }}>📜 Interview Rounds:</p>
                                                                {applicant.previous_rounds.map((round: any, idx: number) => (
                                                                    <div key={idx} style={{
                                                                        background: 'linear-gradient(to bottom right, #f8fafc, #f1f5f9)',
                                                                        border: '1px solid #e2e8f0',
                                                                        borderRadius: '10px',
                                                                        padding: '14px',
                                                                        fontSize: '12px',
                                                                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)'
                                                                    }}>
                                                                        <p style={{ fontWeight: '600', color: '#1e293b', margin: '0 0 6px 0' }}>
                                                                            <span style={{ color: '#64748b' }}>Round:</span> {round.round}
                                                                        </p>
                                                                        {round.interviewer_name && (
                                                                            <p style={{ color: '#475569', margin: '4px 0' }}>
                                                                                <span style={{ fontWeight: '600' }}>Interviewer:</span> {round.interviewer_name} ({round.interviewer_email})
                                                                            </p>
                                                                        )}
                                                                        {round.interview_date && (
                                                                            <p style={{ color: '#475569', margin: '4px 0' }}>
                                                                                <span style={{ fontWeight: '600' }}>Date:</span> {round.interview_date}
                                                                            </p>
                                                                        )}
                                                                        {round.interview_time && (
                                                                            <p style={{ color: '#475569', margin: '4px 0' }}>
                                                                                <span style={{ fontWeight: '600' }}>Time:</span> {round.interview_time}
                                                                            </p>
                                                                        )}
                                                                        {round.candidate_attended && (
                                                                            <p style={{ color: '#475569', margin: '4px 0' }}>
                                                                                <span style={{ fontWeight: '600' }}>Attended:</span> {round.candidate_attended}
                                                                            </p>
                                                                        )}
                                                                        {round.interview_outcome && (
                                                                            <p style={{ color: '#475569', margin: '4px 0' }}>
                                                                                <span style={{ fontWeight: '600' }}>Outcome:</span> {round.interview_outcome}
                                                                            </p>
                                                                        )}
                                                                        {round.scores && (
                                                                            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #cbd5e1' }}>
                                                                                <p style={{ fontWeight: '600', color: '#1e293b', margin: '0 0 8px 0', fontSize: '12px' }}>📊 Scores:</p>
                                                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', fontSize: '11px' }}>
                                                                                    {Object.entries(round.scores).map(([key, value]: [string, any]) => (
                                                                                        <p key={key} style={{ color: '#475569', margin: 0 }}>
                                                                                            <span style={{ fontWeight: '600' }}>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</span> {value}/5
                                                                                        </p>
                                                                                    ))}
                                                                                </div>
                                                                                {(() => {
                                                                                    const scores = Object.values(round.scores) as number[];
                                                                                    const avg = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
                                                                                    return (
                                                                                        <p style={{ 
                                                                                            marginTop: '8px', 
                                                                                            padding: '6px 10px',
                                                                                            background: '#f1f5f9',
                                                                                            borderRadius: '6px',
                                                                                            color: '#475569', 
                                                                                            fontWeight: '700',
                                                                                            fontSize: '11px',
                                                                                            margin: '8px 0 0 0'
                                                                                        }}>
                                                                                            Average Score: {avg}/5
                                                                                        </p>
                                                                                    );
                                                                                })()}
                                                                            </div>
                                                                        )}
                                                                        {round.reason && (
                                                                            <p style={{ color: '#475569', margin: '8px 0 0 0', fontSize: '11px', fontStyle: 'italic' }}>
                                                                                <span style={{ fontWeight: '600' }}>Reason:</span> {round.reason}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                )}

                                {activeTab === 'offer_accepted' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '600px', overflowY: 'auto' }}>
                                        {offerAccepted.length === 0 ? (
                                            <p style={{ color: '#64748b', fontSize: '14px', textAlign: 'center', padding: '32px 0' }}>No offers accepted yet</p>
                                        ) : (
                                            offerAccepted.map((applicant) => {
                                                const showDetails = expandedDetails.has(applicant.email);
                                                const showRounds = expandedRounds.has(applicant.email);
                                                return (
                                                    <div key={applicant._id} style={{
                                                        background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
                                                        border: '1px solid #6ee7b7',
                                                        borderRadius: '10px',
                                                        padding: '16px',
                                                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                                                        transition: 'all 0.2s ease-in-out',
                                                        transform: 'translateY(0)'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(-3px)';
                                                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.3)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.2)';
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                <h3 style={{ fontWeight: '700', color: '#047857', fontSize: '15px', margin: '0 0 2px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{applicant.name}</h3>
                                                                <p style={{ fontSize: '12px', color: '#059669', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{applicant.email}</p>
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px', flexShrink: 0 }}>
                                                                <button
                                                                    onClick={() => {
                                                                        const newSet = new Set(expandedDetails);
                                                                        if (newSet.has(applicant.email)) {
                                                                            newSet.delete(applicant.email);
                                                                        } else {
                                                                            newSet.add(applicant.email);
                                                                        }
                                                                        setExpandedDetails(newSet);
                                                                    }}
                                                                    style={{
                                                                        padding: '6px 12px',
                                                                        fontSize: '11px',
                                                                        fontWeight: '600',
                                                                        color: '#ffffff',
                                                                        background: 'linear-gradient(to right, #10b981, #059669)',
                                                                        border: 'none',
                                                                        borderRadius: '8px',
                                                                        cursor: 'pointer',
                                                                        boxShadow: '0 2px 6px rgba(16, 185, 129, 0.2)',
                                                                        transition: 'all 0.15s ease',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '4px',
                                                                        minWidth: '80px',
                                                                        justifyContent: 'center'
                                                                    }}
                                                                    onMouseEnter={(e) => { e.currentTarget.style.background = 'linear-gradient(to right, #059669, #047857)'; e.currentTarget.style.boxShadow = '0 3px 8px rgba(16, 185, 129, 0.3)'; }}
                                                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'linear-gradient(to right, #10b981, #059669)'; e.currentTarget.style.boxShadow = '0 2px 6px rgba(16, 185, 129, 0.2)'; }}
                                                                >
                                                                    {showDetails ? 'Hide' : '▶'} Details
                                                                </button>
                                                                {(applicant.previous_rounds && applicant.previous_rounds.length > 0) && (
                                                                    <button
                                                                        onClick={() => {
                                                                            const newSet = new Set(expandedRounds);
                                                                            if (newSet.has(applicant.email)) {
                                                                                newSet.delete(applicant.email);
                                                                            } else {
                                                                                newSet.add(applicant.email);
                                                                            }
                                                                            setExpandedRounds(newSet);
                                                                        }}
                                                                        style={{
                                                                            padding: '6px 12px',
                                                                            fontSize: '11px',
                                                                            fontWeight: '600',
                                                                            color: '#475569',
                                                                            background: '#ffffff',
                                                                            border: '1px solid #e2e8f0',
                                                                            borderRadius: '8px',
                                                                            cursor: 'pointer',
                                                                            transition: 'all 0.15s ease',
                                                                            whiteSpace: 'nowrap'
                                                                        }}
                                                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                                                                        onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
                                                                    >
                                                                        Rounds
                                                                    </button>
                                                                )}
                                                                <span style={{
                                                                    padding: '6px 14px',
                                                                    background: 'linear-gradient(to right, #ecfdf5, #d1fae5)',
                                                                    color: '#047857',
                                                                    borderRadius: '20px',
                                                                    fontSize: '11px',
                                                                    fontWeight: '700',
                                                                    border: '1px solid #6ee7b7',
                                                                    whiteSpace: 'nowrap',
                                                                    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.1)'
                                                                }}>
                                                                    ✓ Accepted
                                                                </span>
                                                            </div>
                                                        </div>
                                                        
                                                        {showDetails && (
                                                            <div style={{
                                                                marginTop: '12px',
                                                                padding: '14px',
                                                                background: 'linear-gradient(to bottom right, #f8fafc, #f1f5f9)',
                                                                borderRadius: '10px',
                                                                border: '1px solid #e2e8f0',
                                                                fontSize: '11px'
                                                            }}>
                                                                {(applicant.resume_url || applicant.profile?.resume_url) && (
                                                                    <div style={{ marginBottom: '12px', padding: '10px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                                        <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                            <span style={{ fontWeight: '600', color: '#475569' }}>📄 Resume:</span>
                                                                            <a 
                                                                                href={`${API_BASE_URL}${applicant.resume_url || applicant.profile?.resume_url}`} 
                                                                                target="_blank" 
                                                                                rel="noopener noreferrer" 
                                                                                style={{
                                                                                    color: '#10b981',
                                                                                    textDecoration: 'none',
                                                                                    fontWeight: '500',
                                                                                    transition: 'all 0.15s ease'
                                                                                }}
                                                                                onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                                                                                onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                                                                            >
                                                                                View Resume →
                                                                            </a>
                                                                        </p>
                                                                    </div>
                                                                )}
                                                                {(applicant.additional_details || applicant.profile?.additional_details) && (
                                                                    <div style={{
                                                                        marginBottom: '12px',
                                                                        padding: '14px',
                                                                        background: 'linear-gradient(to bottom right, #ecfdf5, #d1fae5)',
                                                                        borderRadius: '8px',
                                                                        border: '1px solid #a7f3d0',
                                                                        maxHeight: '350px',
                                                                        overflowY: 'auto'
                                                                    }}>
                                                                        <div style={{ fontSize: '11px', lineHeight: '1.8', color: '#475569' }}>
                                                                            {(() => {
                                                                                const details = applicant.additional_details || applicant.profile?.additional_details || '';
                                                                                const lines = details.split('\n').filter((l: string) => l.trim());
                                                                                return lines.map((line: string, idx: number) => {
                                                                                    const trimmed = line.trim();
                                                                                    
                                                                                    if (!trimmed.includes(':') || trimmed.match(/^[A-Z][a-z\s]+$/)) {
                                                                                        return (
                                                                                            <p key={idx} style={{
                                                                                                fontWeight: '700',
                                                                                                color: '#047857',
                                                                                                fontSize: '12px',
                                                                                                margin: idx === 0 ? '0 0 12px 0' : '16px 0 12px 0',
                                                                                                textTransform: 'uppercase',
                                                                                                letterSpacing: '0.5px'
                                                                                            }}>
                                                                                                {trimmed}
                                                                                            </p>
                                                                                        );
                                                                                    }
                                                                                    
                                                                                    const colonIndex = trimmed.indexOf(':');
                                                                                    if (colonIndex > 0) {
                                                                                        const key = trimmed.substring(0, colonIndex).trim();
                                                                                        const value = trimmed.substring(colonIndex + 1).trim();
                                                                                        
                                                                                        return (
                                                                                            <div key={idx} style={{ marginBottom: '8px', paddingLeft: '0' }}>
                                                                                                <p style={{ margin: 0 }}>
                                                                                                    <span style={{ 
                                                                                                        fontWeight: '600', 
                                                                                                        color: '#059669',
                                                                                                        fontSize: '11px'
                                                                                                    }}>
                                                                                                        {key}:
                                                                                                    </span>
                                                                                                    <span style={{ 
                                                                                                        marginLeft: '6px',
                                                                                                        color: '#475569'
                                                                                                    }}>
                                                                                                        {value}
                                                                                                    </span>
                                                                                                </p>
                                                                                            </div>
                                                                                        );
                                                                                    }
                                                                                    
                                                                                    return (
                                                                                        <p key={idx} style={{ margin: '4px 0', color: '#64748b' }}>
                                                                                            {trimmed}
                                                                                        </p>
                                                                                    );
                                                                                });
                                                                            })()}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {applicant.applied_at && (
                                                                    <div style={{ padding: '10px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                                        <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
                                                                            <span style={{ fontWeight: '600', color: '#475569' }}>📅 Applied:</span> {formatDate(applicant.applied_at)}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                        
                                                        {showRounds && applicant.previous_rounds && applicant.previous_rounds.length > 0 && (
                                                            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                                <p style={{ fontSize: '12px', fontWeight: '700', color: '#047857', margin: 0 }}>📜 Interview Rounds:</p>
                                                                {applicant.previous_rounds.map((round: any, idx: number) => (
                                                                    <div key={idx} style={{
                                                                        background: 'linear-gradient(to bottom right, #f8fafc, #f1f5f9)',
                                                                        border: '1px solid #e2e8f0',
                                                                        borderRadius: '10px',
                                                                        padding: '14px',
                                                                        fontSize: '12px',
                                                                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)'
                                                                    }}>
                                                                        <p style={{ fontWeight: '600', color: '#1e293b', margin: '0 0 6px 0' }}>
                                                                            <span style={{ color: '#64748b' }}>Round:</span> {round.round}
                                                                        </p>
                                                                        {round.interviewer_name && (
                                                                            <p style={{ color: '#475569', margin: '4px 0' }}>
                                                                                <span style={{ fontWeight: '600' }}>Interviewer:</span> {round.interviewer_name} ({round.interviewer_email})
                                                                            </p>
                                                                        )}
                                                                        {round.interview_date && (
                                                                            <p style={{ color: '#475569', margin: '4px 0' }}>
                                                                                <span style={{ fontWeight: '600' }}>Date:</span> {round.interview_date}
                                                                            </p>
                                                                        )}
                                                                        {round.interview_time && (
                                                                            <p style={{ color: '#475569', margin: '4px 0' }}>
                                                                                <span style={{ fontWeight: '600' }}>Time:</span> {round.interview_time}
                                                                            </p>
                                                                        )}
                                                                        {round.candidate_attended && (
                                                                            <p style={{ color: '#475569', margin: '4px 0' }}>
                                                                                <span style={{ fontWeight: '600' }}>Attended:</span> {round.candidate_attended}
                                                                            </p>
                                                                        )}
                                                                        {round.interview_outcome && (
                                                                            <p style={{ color: '#475569', margin: '4px 0' }}>
                                                                                <span style={{ fontWeight: '600' }}>Outcome:</span> {round.interview_outcome}
                                                                            </p>
                                                                        )}
                                                                        {round.scores && (
                                                                            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #cbd5e1' }}>
                                                                                <p style={{ fontWeight: '600', color: '#1e293b', margin: '0 0 8px 0', fontSize: '12px' }}>📊 Scores:</p>
                                                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', fontSize: '11px' }}>
                                                                                    {Object.entries(round.scores).map(([key, value]: [string, any]) => (
                                                                                        <p key={key} style={{ color: '#475569', margin: 0 }}>
                                                                                            <span style={{ fontWeight: '600' }}>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</span> {value}/5
                                                                                        </p>
                                                                                    ))}
                                                                                </div>
                                                                                {(() => {
                                                                                    const scores = Object.values(round.scores) as number[];
                                                                                    const avg = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
                                                                                    return (
                                                                                        <p style={{ 
                                                                                            marginTop: '8px', 
                                                                                            padding: '6px 10px',
                                                                                            background: '#f1f5f9',
                                                                                            borderRadius: '6px',
                                                                                            color: '#475569', 
                                                                                            fontWeight: '700',
                                                                                            fontSize: '11px',
                                                                                            margin: '8px 0 0 0'
                                                                                        }}>
                                                                                            Average Score: {avg}/5
                                                                                        </p>
                                                                                    );
                                                                                })()}
                                                                            </div>
                                                                        )}
                                                                        {round.reason && (
                                                                            <p style={{ color: '#475569', margin: '8px 0 0 0', fontSize: '11px', fontStyle: 'italic' }}>
                                                                                <span style={{ fontWeight: '600' }}>Reason:</span> {round.reason}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div style={{ 
                        textAlign: 'center', 
                        padding: '80px 20px',
                        background: '#ffffff',
                        borderRadius: '16px',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
                        border: '1px solid #e2e8f0'
                    }}>
                        <div style={{ 
                            background: 'linear-gradient(to bottom right, #dbeafe, #e0e7ff)',
                            borderRadius: '20px',
                            width: '120px',
                            height: '120px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 24px'
                        }}>
                            <Briefcase style={{ width: '64px', height: '64px', color: '#3b82f6' }} />
                        </div>
                        <h3 style={{ fontSize: '24px', fontWeight: '600', color: '#1e293b', margin: '0 0 8px 0' }}>
                            {ongoingJobs.length === 0 ? 'No ongoing jobs' : 'Select a job to manage applicants'}
                        </h3>
                        <p style={{ color: '#64748b', margin: 0, fontSize: '15px' }}>
                            {ongoingJobs.length === 0 
                                ? 'You don\'t have any ongoing jobs to manage.' 
                                : 'Please select a job from the dropdown above.'}
                        </p>
                    </div>
                )}
            </div>

            {/* Schedule Interview Form Modal - Rendered at Root Level */}
            {showScheduleForm && (
                <div style={{
                    position: 'fixed',
                    top: '0',
                    left: '0',
                    right: '0',
                    bottom: '0',
                    background: 'rgba(0, 0, 0, 0.6)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: '9999',
                    padding: '16px',
                    animation: 'fadeIn 0.2s ease-out'
                }}
                onClick={(e) => {
                    if (e.target === e.currentTarget) {
                        setShowScheduleForm(null);
                        setSelectedRound('');
                        setSelectedTeam('');
                    }
                }}>
                    <div style={{
                        background: '#ffffff',
                        borderRadius: '20px',
                        maxWidth: '520px',
                        width: '100%',
                        boxShadow: '0 25px 70px rgba(0, 0, 0, 0.35)',
                        overflow: 'hidden',
                        animation: 'slideUpFade 0.3s ease-out'
                    }}
                    onClick={(e) => e.stopPropagation()}>
                        {/* Header with Gradient */}
                        <div style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            padding: '24px 28px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                        }}>
                            <div>
                                <h3 style={{
                                    fontSize: '20px',
                                    fontWeight: '700',
                                    color: '#ffffff',
                                    margin: '0 0 4px 0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    letterSpacing: '-0.3px'
                                }}>
                                    📅 Schedule Interview
                                </h3>
                                <p style={{
                                    fontSize: '13px',
                                    color: 'rgba(255, 255, 255, 0.85)',
                                    margin: 0,
                                    fontWeight: '400'
                                }}>
                                    Send interview invitation to candidate
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowScheduleForm(null);
                                    setSelectedRound('');
                                    setSelectedTeam('');
                                }}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.2)',
                                    border: 'none',
                                    borderRadius: '10px',
                                    padding: '8px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.35)';
                                    e.currentTarget.style.transform = 'rotate(90deg)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                                    e.currentTarget.style.transform = 'rotate(0deg)';
                                }}
                            >
                                <X style={{ width: '22px', height: '22px', color: '#ffffff' }} />
                            </button>
                        </div>

                        {/* Form Content */}
                        <div style={{ padding: '28px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                                {/* Select Round */}
                                <div>
                                    <label style={{
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: '#334155',
                                        marginBottom: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}>
                                        🎯 Select Interview Round <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <select
                                            value={selectedRound}
                                            onChange={(e) => setSelectedRound(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '12px 14px',
                                                fontSize: '14px',
                                                border: '2px solid #e2e8f0',
                                                borderRadius: '12px',
                                                background: '#f8fafc',
                                                color: '#1e293b',
                                                outline: 'none',
                                                appearance: 'none',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                paddingRight: '40px',
                                                fontWeight: '500'
                                            }}
                                            onFocus={(e) => {
                                                e.currentTarget.style.borderColor = '#667eea';
                                                e.currentTarget.style.background = '#ffffff';
                                                e.currentTarget.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.12)';
                                            }}
                                            onBlur={(e) => {
                                                e.currentTarget.style.borderColor = '#e2e8f0';
                                                e.currentTarget.style.background = '#f8fafc';
                                                e.currentTarget.style.boxShadow = 'none';
                                            }}
                                        >
                                            <option value="">-- Choose Interview Round --</option>
                                            {roundOptions.map((round) => (
                                                <option key={round} value={round}>
                                                    {round}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown style={{
                                            position: 'absolute',
                                            right: '14px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            width: '18px',
                                            height: '18px',
                                            color: '#64748b',
                                            pointerEvents: 'none'
                                        }} />
                                    </div>
                                </div>

                                {/* Select Team */}
                                <div>
                                    <label style={{
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: '#334155',
                                        marginBottom: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}>
                                        👥 Select Interview Team <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <select
                                            value={selectedTeam}
                                            onChange={(e) => setSelectedTeam(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '12px 14px',
                                                fontSize: '14px',
                                                border: '2px solid #e2e8f0',
                                                borderRadius: '12px',
                                                background: '#f8fafc',
                                                color: '#1e293b',
                                                outline: 'none',
                                                appearance: 'none',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                paddingRight: '40px',
                                                fontWeight: '500'
                                            }}
                                            onFocus={(e) => {
                                                e.currentTarget.style.borderColor = '#667eea';
                                                e.currentTarget.style.background = '#ffffff';
                                                e.currentTarget.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.12)';
                                            }}
                                            onBlur={(e) => {
                                                e.currentTarget.style.borderColor = '#e2e8f0';
                                                e.currentTarget.style.background = '#f8fafc';
                                                e.currentTarget.style.boxShadow = 'none';
                                            }}
                                        >
                                            <option value="">-- Choose Interview Team --</option>
                                            {teams.map((team) => (
                                                <option key={team.team_id} value={team.team_name}>
                                                    {team.team_name}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown style={{
                                            position: 'absolute',
                                            right: '14px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            width: '18px',
                                            height: '18px',
                                            color: '#64748b',
                                            pointerEvents: 'none'
                                        }} />
                                    </div>
                                </div>

                                {/* Interview Location */}
                                <div>
                                    <label style={{
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: '#334155',
                                        marginBottom: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}>
                                        📍 Interview Location Type <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <select
                                            value={selectedLocationType}
                                            onChange={(e) => setSelectedLocationType(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '12px 14px',
                                                fontSize: '14px',
                                                border: '2px solid #e2e8f0',
                                                borderRadius: '12px',
                                                background: '#f8fafc',
                                                color: '#1e293b',
                                                outline: 'none',
                                                appearance: 'none',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                paddingRight: '40px',
                                                fontWeight: '500'
                                            }}
                                            onFocus={(e) => {
                                                e.currentTarget.style.borderColor = '#667eea';
                                                e.currentTarget.style.background = '#ffffff';
                                                e.currentTarget.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.12)';
                                            }}
                                            onBlur={(e) => {
                                                e.currentTarget.style.borderColor = '#e2e8f0';
                                                e.currentTarget.style.background = '#f8fafc';
                                                e.currentTarget.style.boxShadow = 'none';
                                            }}
                                        >
                                            <option value="">-- Choose Location Type --</option>
                                            <option value="online">💻 Online Interview</option>
                                            <option value="offline">🏢 Offline Interview</option>
                                        </select>
                                        <ChevronDown style={{
                                            position: 'absolute',
                                            right: '14px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            width: '18px',
                                            height: '18px',
                                            color: '#64748b',
                                            pointerEvents: 'none'
                                        }} />
                                    </div>
                                    {selectedLocationType === 'offline' && (
                                        <div style={{
                                            marginTop: '10px',
                                            padding: '12px 14px',
                                            background: 'linear-gradient(to right, #dbeafe, #e0e7ff)',
                                            border: '1px solid #93c5fd',
                                            borderRadius: '10px',
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: '8px'
                                        }}>
                                            <span style={{ fontSize: '16px', marginTop: '1px' }}>ℹ️</span>
                                            <p style={{
                                                fontSize: '12px',
                                                color: '#1e40af',
                                                margin: 0,
                                                lineHeight: '1.5',
                                                fontWeight: '500'
                                            }}>
                                                The interview location will be automatically fetched from your organization profile.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                                    <button
                                        onClick={() => {
                                            setShowScheduleForm(null);
                                            setSelectedRound('');
                                            setSelectedTeam('');
                                        }}
                                        style={{
                                            flex: '1',
                                            padding: '14px 18px',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            color: '#475569',
                                            background: '#f1f5f9',
                                            border: '2px solid #e2e8f0',
                                            borderRadius: '12px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = '#e2e8f0';
                                            e.currentTarget.style.borderColor = '#cbd5e1';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = '#f1f5f9';
                                            e.currentTarget.style.borderColor = '#e2e8f0';
                                        }}
                                    >
                                        ✕ Cancel
                                    </button>
                                    <button
                                        onClick={() => handleScheduleSubmit(showScheduleForm)}
                                        disabled={!selectedRound || !selectedTeam || !selectedLocationType}
                                        style={{
                                            flex: '1',
                                            padding: '14px 18px',
                                            fontSize: '14px',
                                            fontWeight: '700',
                                            color: '#ffffff',
                                            background: (!selectedRound || !selectedTeam || !selectedLocationType) 
                                                ? '#cbd5e1' 
                                                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            border: 'none',
                                            borderRadius: '12px',
                                            cursor: (!selectedRound || !selectedTeam || !selectedLocationType) ? 'not-allowed' : 'pointer',
                                            transition: 'all 0.2s ease',
                                            boxShadow: (!selectedRound || !selectedTeam || !selectedLocationType) 
                                                ? 'none' 
                                                : '0 6px 20px rgba(102, 126, 234, 0.4)',
                                            letterSpacing: '0.3px'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (selectedRound && selectedTeam && selectedLocationType) {
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.5)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (selectedRound && selectedTeam && selectedLocationType) {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
                                            }
                                        }}
                                    >
                                        ✉️ Send Invitation
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add keyframe animations */}
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUpFade {
                    from {
                        opacity: 0;
                        transform: translateY(20px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
            `}</style>
        </div>
    );
}

// Applicant Card Component
const ApplicantCard = ({
    applicant,
    onStatusChange,
    updatingStatus,
    formatDate,
    getStatusColor,
    viewMode = 'default',
    teams = [],
    showScheduleForm = false,
    onOpenScheduleForm,
    onCloseScheduleForm,
    selectedRound = '',
    selectedTeam = '',
    selectedLocationType = '',
    onRoundChange,
    onTeamChange,
    onLocationTypeChange,
    onSubmitSchedule
}: {
    applicant: Applicant;
    onStatusChange: (email: string, status: string) => void;
    updatingStatus: boolean;
    formatDate: (date: string) => string;
    getStatusColor: (status: string) => string;
    viewMode?: 'default' | 'conduct' | 'view_only';
    teams?: any[];
    showScheduleForm?: boolean;
    onOpenScheduleForm?: (email: string) => void;
    onCloseScheduleForm?: () => void;
    selectedRound?: string;
    selectedTeam?: string;
    selectedLocationType?: string;
    onRoundChange?: (round: string) => void;
    onTeamChange?: (team: string) => void;
    onLocationTypeChange?: (locationType: string) => void;
    onSubmitSchedule?: (email: string) => void;
}) => {
    const [showDetails, setShowDetails] = useState(false);
    const [showPreviousRounds, setShowPreviousRounds] = useState(false);
    const isConductMode = viewMode === 'conduct';
    const isViewOnly = viewMode === 'view_only';

    const statusOptions = [
        { value: 'decision_pending', label: 'Decision Pending' },
        { value: 'selected_for_interview', label: 'Selected for Interview' },
        { value: 'selected', label: 'Selected' },
        { value: 'rejected', label: 'Rejected' }
    ];

    if (isConductMode) {
        return (
            <div style={{
                border: '1px solid #d8b4fe',
                borderRadius: '12px',
                padding: '16px',
                transition: 'all 0.2s ease-in-out',
                boxShadow: '0 2px 10px rgba(168, 85, 247, 0.15)',
                background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
                transform: 'translateY(0)'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(168, 85, 247, 0.25)';
                e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 10px rgba(168, 85, 247, 0.15)';
                e.currentTarget.style.transform = 'translateY(0)';
            }}>
                {/* Name/Email on Left, Buttons on Right - SAME LINE */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '12px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ fontWeight: '600', color: '#6b21a8', fontSize: '15px', margin: '0 0 4px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {applicant.name || 'N/A'}
                        </h3>
                        <p style={{ fontSize: '12px', color: '#7e22ce', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {applicant.email}
                        </p>
                    </div>
                    
                    {/* Buttons on Right */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, flexWrap: 'wrap' }}>
                        {(applicant.resume_url || applicant.profile?.resume_url || applicant.additional_details || applicant.profile?.additional_details) && (
                            <button
                                onClick={() => setShowDetails(!showDetails)}
                                style={{
                                    fontSize: '11px',
                                    color: '#2563eb',
                                    fontWeight: '500',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '4px',
                                    padding: '6px 12px',
                                    background: showDetails ? '#dbeafe' : '#eff6ff',
                                    border: `1px solid ${showDetails ? '#93c5fd' : '#bfdbfe'}`,
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    whiteSpace: 'nowrap'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#bfdbfe'}
                                onMouseLeave={(e) => e.currentTarget.style.background = showDetails ? '#dbeafe' : '#eff6ff'}
                            >
                                {showDetails ? '▼' : '▶'} Details
                            </button>
                        )}
                        {(applicant.status !== 'decision_pending' && applicant.status !== 'applied') && (
                            <button
                                onClick={() => setShowPreviousRounds(!showPreviousRounds)}
                                disabled={!applicant.previous_rounds || applicant.previous_rounds.length === 0}
                                style={{
                                    fontSize: '11px',
                                    color: (!applicant.previous_rounds || applicant.previous_rounds.length === 0) ? '#94a3b8' : '#475569',
                                    fontWeight: '500',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '4px',
                                    padding: '6px 12px',
                                    background: showPreviousRounds ? '#f1f5f9' : '#ffffff',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '6px',
                                    cursor: (!applicant.previous_rounds || applicant.previous_rounds.length === 0) ? 'not-allowed' : 'pointer',
                                    opacity: (!applicant.previous_rounds || applicant.previous_rounds.length === 0) ? 0.5 : 1,
                                    transition: 'all 0.15s ease',
                                    whiteSpace: 'nowrap'
                                }}
                                onMouseEnter={(e) => {
                                    if (applicant.previous_rounds && applicant.previous_rounds.length > 0) {
                                        e.currentTarget.style.background = '#e2e8f0';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (applicant.previous_rounds && applicant.previous_rounds.length > 0) {
                                        e.currentTarget.style.background = showPreviousRounds ? '#f1f5f9' : '#ffffff';
                                    }
                                }}
                            >
                                Rounds {applicant.previous_rounds && applicant.previous_rounds.length > 0 && `(${applicant.previous_rounds.length})`}
                            </button>
                        )}
                        {applicant.status === 'invitation_sent' ? (
                            <div style={{
                                fontSize: '11px',
                                color: '#475569',
                                background: '#f1f5f9',
                                fontWeight: '500',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                borderRadius: '6px',
                                padding: '6px 12px',
                                border: '1px solid #cbd5e1',
                                whiteSpace: 'nowrap'
                            }}>
                                <Calendar style={{ width: '13px', height: '13px' }} />
                                Invited
                            </div>
                        ) : (
                            <button
                                onClick={() => onOpenScheduleForm?.(applicant.email)}
                                style={{
                                    fontSize: '11px',
                                    color: '#ffffff',
                                    background: 'linear-gradient(to right, #2563eb, #1d4ed8)',
                                    fontWeight: '500',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '4px',
                                    borderRadius: '6px',
                                    padding: '6px 12px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)',
                                    transition: 'all 0.15s ease',
                                    whiteSpace: 'nowrap'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'linear-gradient(to right, #1d4ed8, #1e40af)';
                                    e.currentTarget.style.boxShadow = '0 4px 10px rgba(37, 99, 235, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'linear-gradient(to right, #2563eb, #1d4ed8)';
                                    e.currentTarget.style.boxShadow = '0 2px 6px rgba(37, 99, 235, 0.3)';
                                }}
                            >
                                <Calendar style={{ width: '13px', height: '13px' }} />
                                Schedule
                            </button>
                        )}
                    </div>
                </div>

                {/* Details Section - Resume & AI Analysis */}
                {showDetails && (
                    <div style={{
                        marginTop: '12px',
                        padding: '14px',
                        background: 'linear-gradient(to bottom right, #f8fafc, #f1f5f9)',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        fontSize: '11px'
                    }}>
                        {(applicant.resume_url || applicant.profile?.resume_url) && (
                            <div style={{ marginBottom: '12px', padding: '10px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontWeight: '600', color: '#475569' }}>📄 Resume:</span>
                                    <a 
                                        href={`${API_BASE_URL}${applicant.resume_url || applicant.profile?.resume_url}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        style={{
                                            color: '#2563eb',
                                            textDecoration: 'none',
                                            fontWeight: '500',
                                            transition: 'all 0.15s ease'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                                        onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                                    >
                                        View Resume →
                                    </a>
                                </p>
                            </div>
                        )}
                        {(applicant.additional_details || applicant.profile?.additional_details) && (
                            <div style={{
                                marginBottom: '12px',
                                padding: '14px',
                                background: 'linear-gradient(to bottom right, #f0f9ff, #e0f2fe)',
                                borderRadius: '8px',
                                border: '1px solid #bae6fd',
                                maxHeight: '350px',
                                overflowY: 'auto'
                            }}>
                                <div style={{ fontSize: '11px', lineHeight: '1.8', color: '#475569' }}>
                                    {(() => {
                                        const details = applicant.additional_details || applicant.profile?.additional_details || '';
                                        const lines = details.split('\n').filter((l: string) => l.trim());
                                        return lines.map((line: string, idx: number) => {
                                            const trimmed = line.trim();
                                            
                                            // Main section headers (no colon, all caps or title case without value)
                                            if (!trimmed.includes(':') || trimmed.match(/^[A-Z][a-z\s]+$/)) {
                                                return (
                                                    <p key={idx} style={{
                                                        fontWeight: '700',
                                                        color: '#1e40af',
                                                        fontSize: '12px',
                                                        margin: idx === 0 ? '0 0 12px 0' : '16px 0 12px 0',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.5px'
                                                    }}>
                                                        {trimmed}
                                                    </p>
                                                );
                                            }
                                            
                                            // Key-value pairs
                                            const colonIndex = trimmed.indexOf(':');
                                            if (colonIndex > 0) {
                                                const key = trimmed.substring(0, colonIndex).trim();
                                                const value = trimmed.substring(colonIndex + 1).trim();
                                                
                                                return (
                                                    <div key={idx} style={{ marginBottom: '8px', paddingLeft: '0' }}>
                                                        <p style={{ margin: 0 }}>
                                                            <span style={{ 
                                                                fontWeight: '600', 
                                                                color: '#0c4a6e',
                                                                fontSize: '11px'
                                                            }}>
                                                                {key}:
                                                            </span>
                                                            <span style={{ 
                                                                marginLeft: '6px',
                                                                color: '#475569'
                                                            }}>
                                                                {value}
                                                            </span>
                                                        </p>
                                                    </div>
                                                );
                                            }
                                            
                                            // Regular text
                                            return (
                                                <p key={idx} style={{ margin: '4px 0', color: '#64748b' }}>
                                                    {trimmed}
                                                </p>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>
                        )}
                        {applicant.applied_at && (
                            <div style={{ padding: '10px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
                                    <span style={{ fontWeight: '600', color: '#475569' }}>📅 Applied:</span> {formatDate(applicant.applied_at)}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Show ongoing rounds */}
                {applicant.ongoing_rounds && applicant.ongoing_rounds.length > 0 && (
                    <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <p style={{ fontSize: '12px', fontWeight: '600', color: '#475569', margin: 0 }}>📍 Ongoing Rounds:</p>
                        {applicant.ongoing_rounds.map((round: any, idx: number) => {
                            // Determine if this round is currently ongoing based on date/time
                            const roundDateTime = new Date(`${round.interview_date} ${round.interview_time}`);
                            const now = new Date();
                            const daysDiff = Math.floor((roundDateTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                            const isToday = daysDiff === 0 && roundDateTime.toDateString() === now.toDateString();
                            const isPast = roundDateTime < now;
                            
                            // Determine status badge
                            let statusBadge = { text: '📅 Scheduled', color: '#3b82f6', bg: '#dbeafe' };
                            if (isToday) {
                                statusBadge = { text: '🔴 Today', color: '#dc2626', bg: '#fee2e2' };
                            } else if (isPast && round.status !== 'completed') {
                                statusBadge = { text: '⏳ Pending Feedback', color: '#f59e0b', bg: '#fef3c7' };
                            } else if (round.status === 'completed' || round.scores) {
                                statusBadge = { text: '✅ Completed', color: '#16a34a', bg: '#dcfce7' };
                            } else if (daysDiff === 1) {
                                statusBadge = { text: '⚡ Tomorrow', color: '#8b5cf6', bg: '#ede9fe' };
                            }
                            
                            return (
                                <div key={idx} style={{
                                    background: round.scores || round.status === 'completed' 
                                        ? 'linear-gradient(to bottom right, #f0fdf4, #dcfce7)' 
                                        : isToday 
                                        ? 'linear-gradient(to bottom right, #fef2f2, #fee2e2)'
                                        : 'linear-gradient(to bottom right, #dbeafe, #bfdbfe)',
                                    border: round.scores || round.status === 'completed'
                                        ? '2px solid #16a34a'
                                        : isToday
                                        ? '2px solid #dc2626'
                                        : '1px solid #93c5fd',
                                    borderRadius: '10px',
                                    padding: '14px',
                                    fontSize: '12px',
                                    boxShadow: '0 2px 6px rgba(37, 99, 235, 0.1)',
                                    position: 'relative'
                                }}>
                                    {/* Status Badge */}
                                    <div style={{
                                        position: 'absolute',
                                        top: '10px',
                                        right: '10px',
                                        padding: '4px 10px',
                                        borderRadius: '12px',
                                        fontSize: '10px',
                                        fontWeight: '700',
                                        color: statusBadge.color,
                                        background: statusBadge.bg,
                                        border: `1px solid ${statusBadge.color}30`
                                    }}>
                                        {statusBadge.text}
                                    </div>
                                    
                                    <p style={{ fontWeight: '600', color: '#1e293b', margin: '0 0 6px 0', paddingRight: '120px' }}>
                                        <span style={{ color: '#2563eb' }}>Round:</span> {round.round}
                                    </p>
                                    <p style={{ color: '#475569', margin: '4px 0' }}>
                                        <span style={{ fontWeight: '600' }}>Interviewer:</span> {round.interviewer_name} ({round.interviewer_email})
                                    </p>
                                    <p style={{ color: '#475569', margin: '4px 0' }}>
                                        <span style={{ fontWeight: '600' }}>Date:</span> {round.interview_date}
                                    </p>
                                    <p style={{ color: '#475569', margin: '4px 0' }}>
                                        <span style={{ fontWeight: '600' }}>Time:</span> {round.interview_time}
                                    </p>
                                    {round.location_type && (
                                        <p style={{ color: '#475569', margin: '4px 0' }}>
                                            <span style={{ fontWeight: '600' }}>Location Type:</span> {round.location_type === 'online' ? '💻 Online' : '🏢 Offline'}
                                        </p>
                                    )}
                                    {round.location_type === 'online' && round.meeting_link && (
                                        <p style={{ color: '#475569', margin: '4px 0' }}>
                                            <span style={{ fontWeight: '600' }}>Meeting:</span>{' '}
                                            <a href={round.meeting_link} target="_blank" rel="noopener noreferrer" style={{
                                                color: '#2563eb',
                                                textDecoration: 'none',
                                                wordBreak: 'break-all',
                                                transition: 'all 0.15s ease'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                                            onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}>
                                                {round.meeting_link}
                                            </a>
                                        </p>
                                    )}
                                    {round.location_type === 'offline' && round.location && (
                                        <p style={{ color: '#475569', margin: '4px 0' }}>
                                            <span style={{ fontWeight: '600' }}>Location:</span> {round.location}
                                        </p>
                                    )}
                                    
                                    {/* Show scores if available */}
                                    {round.scores && (
                                        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '2px solid #86efac' }}>
                                            <p style={{ fontWeight: '700', color: '#16a34a', margin: '0 0 8px 0', fontSize: '12px' }}>📊 Interview Scores:</p>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', fontSize: '11px' }}>
                                                {Object.entries(round.scores).map(([key, value]: [string, any]) => (
                                                    <p key={key} style={{ color: '#475569', margin: 0 }}>
                                                        <span style={{ fontWeight: '600' }}>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</span> {value}/5
                                                    </p>
                                                ))}
                                            </div>
                                            
                                            {/* Show average score */}
                                            {(() => {
                                                const scores = Object.values(round.scores) as number[];
                                                const avg = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
                                                return (
                                                    <p style={{ 
                                                        marginTop: '8px', 
                                                        padding: '6px 10px',
                                                        background: '#dcfce7',
                                                        borderRadius: '6px',
                                                        color: '#16a34a', 
                                                        fontWeight: '700',
                                                        fontSize: '11px',
                                                        margin: '8px 0 0 0'
                                                    }}>
                                                        Average Score: {avg}/5
                                                    </p>
                                                );
                                            })()}
                                        </div>
                                    )}
                                    
                                    {/* Show outcome if available */}
                                    {round.interview_outcome && (
                                        <p style={{ 
                                            marginTop: '8px', 
                                            padding: '6px 10px',
                                            background: round.interview_outcome === 'selected' || round.interview_outcome === 'proceed'
                                                ? '#dcfce7' 
                                                : '#fee2e2',
                                            borderRadius: '6px',
                                            color: round.interview_outcome === 'selected' || round.interview_outcome === 'proceed'
                                                ? '#16a34a' 
                                                : '#dc2626',
                                            fontWeight: '600',
                                            fontSize: '11px',
                                            margin: '8px 0 0 0'
                                        }}>
                                            <span style={{ fontWeight: '700' }}>Outcome:</span> {round.interview_outcome.toUpperCase()}
                                        </p>
                                    )}
                                    
                                    {/* Show candidate attendance if available */}
                                    {round.candidate_attended && (
                                        <p style={{ color: '#475569', margin: '8px 0 0 0', fontSize: '11px' }}>
                                            <span style={{ fontWeight: '600' }}>Attended:</span> {round.candidate_attended}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Show previous rounds - Hide for decision pending status */}
                {showPreviousRounds && applicant.previous_rounds && applicant.previous_rounds.length > 0 && 
                 applicant.status !== 'decision_pending' && applicant.status !== 'applied' && (
                    <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <p style={{ fontSize: '12px', fontWeight: '600', color: '#475569', margin: 0 }}>📜 Previous Rounds:</p>
                        {applicant.previous_rounds.map((round: any, idx: number) => (
                            <div key={idx} style={{
                                background: 'linear-gradient(to bottom right, #f8fafc, #f1f5f9)',
                                border: '1px solid #e2e8f0',
                                borderRadius: '10px',
                                padding: '14px',
                                fontSize: '12px',
                                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)'
                            }}>
                                <p style={{ fontWeight: '600', color: '#1e293b', margin: '0 0 6px 0' }}>
                                    <span style={{ color: '#64748b' }}>Round:</span> {round.round}
                                </p>
                                <p style={{ color: '#475569', margin: '4px 0' }}>
                                    <span style={{ fontWeight: '600' }}>Interviewer:</span> {round.interviewer_name} ({round.interviewer_email})
                                </p>
                                <p style={{ color: '#475569', margin: '4px 0' }}>
                                    <span style={{ fontWeight: '600' }}>Date:</span> {round.interview_date}
                                </p>
                                <p style={{ color: '#475569', margin: '4px 0' }}>
                                    <span style={{ fontWeight: '600' }}>Time:</span> {round.interview_time}
                                </p>
                                <p style={{ color: '#475569', margin: '4px 0' }}>
                                    <span style={{ fontWeight: '600' }}>Attended:</span> {round.candidate_attended}
                                </p>
                                <p style={{ color: '#475569', margin: '4px 0' }}>
                                    <span style={{ fontWeight: '600' }}>Outcome:</span> {round.interview_outcome}
                                </p>
                                {round.scores && (
                                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #cbd5e1' }}>
                                        <p style={{ fontWeight: '600', color: '#1e293b', margin: '0 0 8px 0', fontSize: '12px' }}>📊 Scores:</p>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', fontSize: '11px' }}>
                                            {Object.entries(round.scores).map(([key, value]: [string, any]) => (
                                                <p key={key} style={{ color: '#475569', margin: 0 }}>
                                                    <span style={{ fontWeight: '600' }}>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</span> {value}/5
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {round.reason && (
                                    <p style={{ color: '#475569', marginTop: '8px', margin: 0 }}>
                                        <span style={{ fontWeight: '600' }}>Reason:</span> {round.reason}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {(!applicant.previous_rounds || applicant.previous_rounds.length === 0) && 
                 applicant.status !== 'decision_pending' && applicant.status !== 'applied' && showPreviousRounds && (
                    <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px', marginBottom: '0', fontStyle: 'italic' }}>
                        No previous rounds yet.
                    </p>
                )}
            </div>
        );
    }

    return (
        <div style={{
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '20px',
            transition: 'all 0.2s ease-in-out',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            background: 'linear-gradient(to bottom right, #ffffff, #f8fafc)',
            transform: 'translateY(0)'
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.1)';
            e.currentTarget.style.transform = 'translateY(-4px)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
            e.currentTarget.style.transform = 'translateY(0)';
        }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                    <h3 style={{ fontWeight: '600', color: '#1e293b', fontSize: '16px', margin: 0 }}>{applicant.name || 'N/A'}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                        <Mail style={{ width: '14px', height: '14px', color: '#64748b' }} />
                        <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>{applicant.email}</p>
                    </div>
                    <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px', margin: 0 }}>
                        📅 Applied: {formatDate(applicant.applied_at)}
                    </p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(applicant.status || 'applied')}`}>
                    {(applicant.status || 'applied').replace('_', ' ').toUpperCase()}
                </span>
            </div>

            {/* Show ongoing rounds */}
            {applicant.ongoing_rounds && applicant.ongoing_rounds.length > 0 && (
                <div className="mb-3 space-y-2">
                    <p className="text-xs font-medium text-slate-700">Ongoing Rounds:</p>
                    {applicant.ongoing_rounds.map((round: any, idx: number) => (
                        <div key={idx} className="bg-blue-50 border border-blue-200 rounded p-3 text-xs">
                            <p className="font-medium text-slate-900"><strong>Round:</strong> {round.round}</p>
                            <p className="text-slate-700"><strong>Interviewer:</strong> {round.interviewer_name} ({round.interviewer_email})</p>
                            <p className="text-slate-700"><strong>Date:</strong> {round.interview_date}</p>
                            <p className="text-slate-700"><strong>Time:</strong> {round.interview_time}</p>
                            {round.location_type && (
                                <p className="text-slate-700"><strong>Location Type:</strong> {round.location_type === 'online' ? 'Online' : 'Offline'}</p>
                            )}
                            {round.location_type === 'online' && round.meeting_link && (
                                <p className="text-slate-700"><strong>Meeting:</strong> <a href={round.meeting_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{round.meeting_link}</a></p>
                            )}
                            {round.location_type === 'offline' && round.location && (
                                <p className="text-slate-700"><strong>Location:</strong> {round.location}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Previous Rounds Toggle - Hide for decision pending status */}
            {applicant.previous_rounds && applicant.previous_rounds.length > 0 && 
             applicant.status !== 'decision_pending' && applicant.status !== 'applied' && (
                <div className="mb-3">
                    <button
                        onClick={() => setShowPreviousRounds(!showPreviousRounds)}
                        className="w-full text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center gap-1 border border-blue-200 rounded-lg py-2 bg-blue-50"
                    >
                        <UserCheck className="w-3 h-3" />
                        {showPreviousRounds ? 'Hide' : 'View'} Previous Rounds ({applicant.previous_rounds.length})
                    </button>
                </div>
            )}

            {/* Show previous rounds */}
            {showPreviousRounds && applicant.previous_rounds && applicant.previous_rounds.length > 0 && (
                <div className="mb-3 space-y-2">
                    <p className="text-xs font-medium text-slate-700">Previous Rounds:</p>
                    {applicant.previous_rounds.map((round: any, idx: number) => (
                        <div key={idx} className="bg-slate-50 border border-slate-200 rounded p-3 text-xs">
                            <p className="font-medium text-slate-900"><strong>Round:</strong> {round.round}</p>
                            <p className="text-slate-700"><strong>Interviewer:</strong> {round.interviewer_name} ({round.interviewer_email})</p>
                            <p className="text-slate-700"><strong>Date:</strong> {round.interview_date}</p>
                            <p className="text-slate-700"><strong>Time:</strong> {round.interview_time}</p>
                            {round.location_type && (
                                <p className="text-slate-700"><strong>Location Type:</strong> {round.location_type === 'online' ? 'Online' : 'Offline'}</p>
                            )}
                            {round.location_type === 'online' && round.meeting_link && (
                                <p className="text-slate-700"><strong>Meeting:</strong> <a href={round.meeting_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{round.meeting_link}</a></p>
                            )}
                            {round.location_type === 'offline' && round.location && (
                                <p className="text-slate-700"><strong>Location:</strong> {round.location}</p>
                            )}
                            <p className="text-slate-700"><strong>Attended:</strong> {round.candidate_attended}</p>
                            <p className="text-slate-700"><strong>Outcome:</strong> {round.interview_outcome}</p>
                            {round.scores && (
                                <div className="mt-2 pt-2 border-t border-slate-300">
                                    <p className="font-medium text-slate-900 mb-1">Scores:</p>
                                    <div className="grid grid-cols-2 gap-1 text-xs">
                                        {Object.entries(round.scores).map(([key, value]: [string, any]) => (
                                            <p key={key} className="text-slate-700"><strong>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong> {value}/5</p>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {round.reason && (
                                <p className="text-slate-700 mt-1"><strong>Reason:</strong> {round.reason}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Status Dropdown - Only show if not in view-only mode and not in ongoing rounds */}
            {!isViewOnly && applicant.status !== 'processing' && (
                <div className="mb-3">
                    <select
                        value={applicant.status || 'decision_pending'}
                        onChange={(e) => onStatusChange(applicant.email, e.target.value)}
                        disabled={updatingStatus}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    {updatingStatus && (
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mt-2"></div>
                    )}
                </div>
            )}

            {/* View Details Button */}
            {(applicant.resume_url || applicant.additional_details || applicant.profile?.additional_details) && (
                <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center gap-1"
                >
                    <FileText className="w-4 h-4" />
                    {showDetails ? 'Hide' : 'View'} Details
                </button>
            )}

            {/* Additional Details */}
            {showDetails && (applicant.additional_details || applicant.profile?.additional_details) && (
                <div className="mt-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <h4 className="text-sm font-semibold text-slate-800 mb-2">AI Comparison Details</h4>
                    <div className="text-xs text-slate-700 whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed">
                        {applicant.additional_details || applicant.profile?.additional_details}
                    </div>
                </div>
            )}

            {/* Resume Link */}
            {(applicant.resume_url || applicant.profile?.resume_url) && (
                <a
                    href={`${API_BASE_URL}${applicant.resume_url || applicant.profile?.resume_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                >
                    <Download className="w-3 h-3" />
                    View Resume
                </a>
            )}
        </div>
    );
};

