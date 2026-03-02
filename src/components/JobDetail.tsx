import React, { useState, useEffect } from 'react';
import {
    Briefcase, MapPin, Users, Calendar, IndianRupee, FileText,
    ArrowLeft, UserCheck, X, Menu, UserCircle, LogOut, CheckCircle, AlertCircle
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { authenticatedFetch } from '../utils/auth';
import { API_ENDPOINTS, API_BASE_URL, getStorageUrl } from '../config/api';

interface JobPost {
    job_id: string;
    company: { name: string; email: string };
    role: string;
    file_path: string;
    location: string;
    number_of_openings: number;
    application_close_date: string;
    job_package_lpa?: number;
    job_package_lpa_min?: number;
    job_package_lpa_max?: number;
    job_type: string;
    notes: string;
    created_at: string;
    job_status?: 'open' | 'ongoing' | 'closed';
}

function formatPackageLpa(job: JobPost): string {
    const min = job.job_package_lpa_min ?? job.job_package_lpa;
    const max = job.job_package_lpa_max ?? job.job_package_lpa;
    if (min != null && max != null && min !== max) return `${min} - ${max} LPA`;
    if (min != null) return `${min} LPA`;
    return 'Info not given';
}

export function JobDetail() {
    const { jobId } = useParams<{ jobId: string }>();
    const navigate = useNavigate();
    const [job, setJob] = useState<JobPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userData, setUserData] = useState<any>(null);
    const [showApplyForm, setShowApplyForm] = useState(false);
    const [applyForm, setApplyForm] = useState({
        currentCtc: '', expectedCtc: '', noticePeriod: '', expectedDoj: ''
    });
    const [formError, setFormError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [applied, setApplied] = useState(false);
    const [viewerType, setViewerType] = useState<'guest' | 'user' | 'organization'>('guest');
    const [showUnauthApplyModal, setShowUnauthApplyModal] = useState(false);
    const [countdown, setCountdown] = useState(10);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [menuHovered, setMenuHovered] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        const storedUser = localStorage.getItem('user');
        if (!token) {
            setViewerType('guest');
            setUserData(null);
        } else if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser);
                setUserData(parsed);
                setViewerType(parsed.user_type === 'organization' ? 'organization' : parsed.user_type === 'user' ? 'user' : 'guest');
            } catch {
                setViewerType('guest');
            }
        } else {
            setViewerType('guest');
        }
        if (!jobId) {
            setError('Invalid job');
            setLoading(false);
            return;
        }
        const fetchJob = async () => {
            try {
                // Always load job from public endpoint so auth issues never show "Job not found"
                const publicUrl = API_ENDPOINTS.PUBLIC_GET_JOB(jobId);
                const res = await fetch(publicUrl);
                if (!res.ok) {
                    if (res.status === 404) setError('Job not found');
                    else setError('Failed to load job');
                    setLoading(false);
                    return;
                }
                const data = await res.json();
                const jobData = data.job || null;
                setJob(jobData);
                if (!jobData) {
                    setError('Job not found');
                    setLoading(false);
                    return;
                }
                // If authenticated candidate, get user_has_applied from protected endpoint
                if (token && storedUser) {
                    try {
                        const parsed = JSON.parse(storedUser);
                        if (parsed.user_type === 'user') {
                            const authRes = await authenticatedFetch(
                                API_ENDPOINTS.GET_JOB(jobId),
                                { method: 'GET' },
                                navigate
                            );
                            if (authRes?.ok) {
                                const authData = await authRes.json();
                                if (authData.user_has_applied === true) setApplied(true);
                            }
                        }
                    } catch {
                        // ignore; we already have the job
                    }
                }
            } catch (err) {
                console.error(err);
                setError('Failed to load job');
            } finally {
                setLoading(false);
            }
        };
        fetchJob();
    }, [jobId, navigate]);

    // Countdown and redirect when unauthenticated user clicks Apply
    useEffect(() => {
        if (!showUnauthApplyModal) return;
        setCountdown(10);
        const t = setInterval(() => {
            setCountdown((c) => {
                if (c <= 1) {
                    clearInterval(t);
                    navigate('/auth');
                    return 0;
                }
                return c - 1;
            });
        }, 1000);
        return () => clearInterval(t);
    }, [showUnauthApplyModal, navigate]);

    const handleApply = async (additionalDetails?: string) => {
        if (!jobId || !userData || processing) return;
        setProcessing(true);
        setMessage({ type: 'success', text: 'Processing your application...' });
        try {
            let resumeUrl = '';
            const profileRes = await authenticatedFetch(
                API_ENDPOINTS.USER_PROFILE,
                { method: 'GET' },
                navigate
            );
            if (profileRes?.ok) {
                const profile = await profileRes.json();
                resumeUrl = profile?.profile?.resumeUrl || profile?.profile?.resume_url || '';
            }
            if (!resumeUrl) {
                setMessage({ type: 'error', text: 'Please upload your resume in your profile before applying' });
                setProcessing(false);
                return;
            }
            const res = await authenticatedFetch(
                `${API_ENDPOINTS.ORGANIZATION_JOBPOST}/${jobId}/apply`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: userData.name,
                        email: userData.email,
                        resume_url: resumeUrl,
                        additional_details: additionalDetails || ''
                    })
                },
                navigate
            );
            if (!res) {
                setMessage({ type: 'error', text: 'Failed to connect to server' });
                setProcessing(false);
                return;
            }
            if (res.ok) {
                const data = await res.json();
                setApplied(true);
                setMessage({ type: 'success', text: data.message || 'Job applied' });
            } else {
                const errData = await res.json();
                const detail = (typeof errData.detail === 'string' ? errData.detail : '') || 'Failed to apply';
                const isAlreadyRegistered = detail.toLowerCase().includes('already registered');
                if (isAlreadyRegistered) {
                    setApplied(true);
                    setMessage({ type: 'success', text: 'Already registered for this job.' });
                } else {
                    setMessage({ type: 'error', text: detail });
                }
            }
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Error applying' });
        } finally {
            setProcessing(false);
        }
    };

    const submitApplyForm = async () => {
        if (!jobId) return;
        if (!applyForm.currentCtc || !applyForm.expectedCtc || !applyForm.noticePeriod || !applyForm.expectedDoj) {
            setFormError('Please fill all fields');
            return;
        }
        const details = [
            `Current CTC: ${applyForm.currentCtc}`,
            `Expected CTC: ${applyForm.expectedCtc}`,
            `Notice Period: ${applyForm.noticePeriod}`,
            `Expected Date of Joining: ${applyForm.expectedDoj}`
        ].join('\n');
        setShowApplyForm(false);
        await handleApply(details);
        setApplyForm({ currentCtc: '', expectedCtc: '', noticePeriod: '', expectedDoj: '' });
    };

    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });

    const getJobTypeLabel = (type: string) => {
        switch (type) {
            case 'full_time': return 'Full Time';
            case 'internship': return 'Internship';
            case 'unpaid': return 'Unpaid';
            default: return type;
        }
    };

    const getJobTypeColor = (type: string) => {
        switch (type) {
            case 'full_time': return { bg: 'linear-gradient(to bottom right, #dbeafe, #bfdbfe)', color: '#1e40af', border: '#93c5fd' };
            case 'internship': return { bg: 'linear-gradient(to bottom right, #dcfce7, #bbf7d0)', color: '#15803d', border: '#86efac' };
            case 'unpaid': return { bg: 'linear-gradient(to bottom right, #f3e8ff, #e9d5ff)', color: '#6b21a8', border: '#d8b4fe' };
            default: return { bg: 'linear-gradient(to bottom right, #f1f5f9, #e2e8f0)', color: '#475569', border: '#cbd5e1' };
        }
    };

    const handleLogout = async () => {
        const refreshToken = localStorage.getItem('refresh_token');

        if (refreshToken) {
            try {
                await fetch(API_ENDPOINTS.AUTH.LOGOUT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refresh_token: refreshToken })
                });
            } catch (error) {
                console.error('Logout error:', error);
            }
        }

        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        navigate('/');
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (isSidebarOpen && !target.closest('[data-sidebar-container]') && !target.closest('[data-menu-button]')) {
                setIsSidebarOpen(false);
            }
        };

        if (isSidebarOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isSidebarOpen]);

    if (loading) {
        return (
            <div
                style={{
                    minHeight: '100vh',
                    background: 'linear-gradient(to bottom right, #f8fafc, #dbeafe)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <div style={{ textAlign: 'center' }}>
                    <div
                        style={{
                            width: 56,
                            height: 56,
                            border: '5px solid #0052FF',
                            borderTop: '5px solid transparent',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto 16px'
                        }}
                    />
                    <p
                        style={{
                            color: '#6B7280',
                            fontSize: 14,
                            fontWeight: 500
                        }}
                    >
                        Loading job...
                    </p>
                </div>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (error || !job) {
        return (
            <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #f8fafc, #e0f2fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                <div style={{ textAlign: 'center', background: '#fff', padding: '32px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', maxWidth: '400px' }}>
                    <p style={{ color: '#64748b', marginBottom: '16px' }}>{error || 'Job not found'}</p>
                    <button
                        onClick={() => navigate('/jobs')}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: 500, cursor: 'pointer', fontSize: '14px' }}
                    >
                        <ArrowLeft style={{ width: '18px', height: '18px' }} /> Back to Jobs
                    </button>
                </div>
            </div>
        );
    }

    const typeColors = getJobTypeColor(job.job_type);
    const jdUrl = job.file_path ? getStorageUrl(job.file_path) : '';
    const isPdf = (job.file_path || '').toLowerCase().endsWith('.pdf');
    const applicationsOpen = job.job_status === 'open';

    return (
        <>
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes slideInLeft {
                    from {
                        transform: translateX(-100%);
                    }
                    to {
                        transform: translateX(0);
                    }
                }
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
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
            `}</style>
            <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #f8fafc, #dbeafe)', paddingBottom: '80px' }}>
                {/* Header */}
                <div
                    style={{
                        position: 'sticky',
                        top: 0,
                        zIndex: 10,
                        background: 'rgba(245, 247, 250, 0.92)',
                        backdropFilter: 'blur(16px)',
                        borderBottom: '1px solid #E5E7EB'
                    }}
                >
                    <div
                        style={{
                            maxWidth: 1360,
                            margin: '0 auto',
                            padding: '16px 32px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 24
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 12,
                                    background: '#0052FF',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 10px 25px rgba(0, 82, 255, 0.45)'
                                }}
                            >
                                <Briefcase style={{ width: 22, height: 22, color: '#ffffff' }} />
                            </div>
                            <div>
                                <p
                                    style={{
                                        fontSize: 12,
                                        letterSpacing: 2,
                                        textTransform: 'uppercase',
                                        fontWeight: 500,
                                        color: '#6B7280',
                                        margin: 0
                                    }}
                                >
                                    Prism · Candidate
                                </p>
                                <h1
                                    style={{
                                        fontSize: 22,
                                        fontWeight: 700,
                                        color: '#111827',
                                        margin: '4px 0 0',
                                        lineHeight: 1.2
                                    }}
                                >
                                    Job Details
                                </h1>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <button
                                onClick={() => navigate('/jobs')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '9px 16px',
                                    borderRadius: 999,
                                    border: '1px solid #E5E7EB',
                                    background: '#FFFFFF',
                                    cursor: 'pointer',
                                    fontSize: 13,
                                    fontWeight: 500,
                                    color: '#374151',
                                    boxShadow: '0 4px 10px rgba(15, 23, 42, 0.06)',
                                    transition: 'background 200ms ease-out, box-shadow 200ms ease-out, transform 200ms ease-out',
                                    transform: 'translateY(0)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                    e.currentTarget.style.boxShadow = '0 12px 30px rgba(15, 23, 42, 0.14)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 10px rgba(15, 23, 42, 0.06)';
                                }}
                            >
                                <ArrowLeft style={{ width: 16, height: 16 }} />
                                Back to Jobs
                            </button>
                            <button
                                data-menu-button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 40,
                                    height: 40,
                                    borderRadius: 999,
                                    fontWeight: 500,
                                    color: '#111827',
                                    background: menuHovered ? '#EEF2FF' : '#FFFFFF',
                                    border: '1px solid #E5E7EB',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 10px rgba(15, 23, 42, 0.08)',
                                    transition: 'background 200ms ease-out, border-color 200ms ease-out'
                                }}
                                onMouseEnter={() => setMenuHovered(true)}
                                onMouseLeave={() => setMenuHovered(false)}
                            >
                                <Menu style={{ width: 18, height: 18 }} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sidebar Overlay */}
                {isSidebarOpen && (
                    <div
                        onClick={() => setIsSidebarOpen(false)}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(15, 23, 42, 0.40)',
                            zIndex: 30,
                            animation: 'fadeIn 0.2s ease'
                        }}
                    />
                )}

                {/* Left Sidebar */}
                <div
                    data-sidebar-container
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        height: '100vh',
                        width: 260,
                        background: '#ffffff',
                        boxShadow: '16px 0 45px rgba(15, 23, 42, 0.18)',
                        zIndex: 40,
                        transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
                        transition: 'transform 0.22s ease-out',
                        display: 'flex',
                        flexDirection: 'column',
                        overflowY: 'auto'
                    }}
                >
                    {/* Sidebar Header */}
                    <div style={{
                        padding: '20px 20px 16px',
                        borderBottom: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#ffffff'
                    }}>
                        <div>
                            <p style={{
                                fontSize: 11,
                                letterSpacing: 1.8,
                                textTransform: 'uppercase',
                                color: '#9CA3AF',
                                fontWeight: 500,
                                margin: 0
                            }}>
                                Navigation
                            </p>
                            <p style={{
                                fontSize: 13,
                                color: '#4B5563',
                                margin: '4px 0 0 0'
                            }}>
                                Move across Prism
                            </p>
                        </div>
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 30,
                                height: 30,
                                borderRadius: 999,
                                border: '1px solid #E5E7EB',
                                background: '#F9FAFB',
                                cursor: 'pointer',
                                transition: 'background 0.15s ease'
                            }}
                        >
                            <X style={{ width: 16, height: 16, color: '#64748b' }} />
                        </button>
                    </div>

                    {/* Sidebar Navigation */}
                    <div style={{
                        flex: 1,
                        padding: '12px 8px'
                    }}>
                        {[
                            {
                                label: 'Profile',
                                icon: UserCircle,
                                href: '/user-profile'
                            },
                            {
                                label: 'Jobs',
                                icon: Briefcase,
                                href: '/jobs'
                            }
                        ].map((item) => {
                            const isActive = window.location.pathname === item.href;
                            return (
                                <button
                                    key={item.href}
                                    onClick={() => {
                                        navigate(item.href);
                                        setIsSidebarOpen(false);
                                    }}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'flex-start',
                                        gap: 10,
                                        padding: '10px 14px',
                                        margin: '2px 4px',
                                        borderRadius: 10,
                                        border: 'none',
                                        background: isActive ? '#EEF2FF' : 'transparent',
                                        cursor: 'pointer',
                                        fontSize: 13,
                                        fontWeight: 500,
                                        letterSpacing: 0.4,
                                        textTransform: 'uppercase',
                                        color: isActive ? '#111827' : '#4B5563',
                                        transition: 'background 200ms ease-out, color 200ms ease-out'
                                    }}
                                >
                                    <item.icon
                                        style={{
                                            width: 18,
                                            height: 18,
                                            color: isActive ? '#0052FF' : '#6B7280'
                                        }}
                                    />
                                    {item.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Sidebar Footer with Logout */}
                    <div style={{
                        padding: '12px 12px 18px',
                        borderTop: '1px solid #e2e8f0',
                        marginTop: 'auto'
                    }}>
                        <button
                            onClick={() => {
                                handleLogout();
                                setIsSidebarOpen(false);
                            }}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                gap: 10,
                                padding: '10px 14px',
                                borderRadius: 10,
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                fontSize: 13,
                                fontWeight: 500,
                                letterSpacing: 0.4,
                                textTransform: 'uppercase',
                                color: '#dc2626',
                                transition: 'background 0.15s ease'
                            }}
                        >
                            <LogOut style={{ width: 18, height: 18, color: '#dc2626' }} />
                            Logout
                        </button>
                    </div>
                </div>

                {/* Message Toast */}
                {message && (
                    <div
                        style={{
                            position: 'fixed',
                            top: 72,
                            right: 24,
                            zIndex: 60,
                            animation: 'fadeIn 0.2s ease'
                        }}
                    >
                        <div style={{
                            maxWidth: 360,
                            padding: '10px 12px',
                            borderRadius: 12,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            background: message.type === 'success' ? '#ECFDF3' : '#FEF2F2',
                            border: `1px solid ${message.type === 'success' ? '#BBF7D0' : '#FCA5A5'}`,
                            color: message.type === 'success' ? '#166534' : '#B91C1C',
                            boxShadow: '0 18px 45px rgba(15, 23, 42, 0.12)',
                            fontWeight: 500
                        }}>
                            {message.type === 'success'
                                ? <CheckCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
                                : <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
                            }
                            <span style={{ flex: 1, fontSize: 13 }}>{message.text}</span>
                            <button
                                onClick={() => setMessage(null)}
                                style={{
                                    padding: 4,
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    borderRadius: 999,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <X style={{ width: 12, height: 12 }} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Content */}
                <div style={{ maxWidth: 1360, margin: '0 auto', padding: '24px 32px 40px' }}>
                    <div
                        style={{
                            background: '#ffffff',
                            borderRadius: 16,
                            boxShadow: '0 14px 40px rgba(15, 23, 42, 0.08)',
                            border: '1px solid #E2E8F0',
                            overflow: 'hidden',
                            animation: 'slideDown 0.25s ease-out'
                        }}
                    >
                        <div style={{ padding: 24, borderBottom: '1px solid #f1f5f9' }}>
                            <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>Job ID: {job.job_id}</p>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                                <div>
                                    <h2 style={{ fontSize: 24, fontWeight: 600, color: '#1e293b', margin: '0 0 8px 0' }}>{job.role}</h2>
                                    <p style={{ color: '#64748b', margin: '0 0 4px 0', fontSize: 16, fontWeight: 500 }}>{job.company.name}</p>
                                    <p style={{ fontSize: 14, color: '#94a3b8', margin: 0 }}>{job.company.email}</p>
                                </div>
                                <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    padding: '8px 16px',
                                    borderRadius: 20,
                                    fontSize: 13,
                                    fontWeight: 600,
                                    background: typeColors.bg,
                                    color: typeColors.color,
                                    border: `1px solid ${typeColors.border}`
                                }}>
                                    {getJobTypeLabel(job.job_type)}
                                </span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginTop: 20 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <MapPin style={{ width: 18, height: 18, color: '#64748b' }} />
                                    <span style={{ fontSize: 15, color: '#475569' }}>{job.location}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Users style={{ width: 18, height: 18, color: '#64748b' }} />
                                    <span style={{ fontSize: 15, color: '#475569' }}>{job.number_of_openings} opening(s)</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Calendar style={{ width: 18, height: 18, color: '#64748b' }} />
                                    <span style={{ fontSize: 15, color: '#475569' }}>Apply by: {formatDate(job.application_close_date)}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <IndianRupee style={{ width: 18, height: 18, color: '#64748b' }} />
                                    <span style={{ fontSize: 15, color: '#475569', fontWeight: 600 }}>{formatPackageLpa(job)}</span>
                                </div>
                            </div>
                            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 16, marginBottom: 0 }}>Posted {formatDate(job.created_at)}</p>
                            {job.notes && (
                                <div style={{ marginTop: 16, padding: 16, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                                    <p style={{ fontSize: 14, color: '#475569', margin: 0, lineHeight: 1.6 }}>{job.notes}</p>
                                </div>
                            )}
                        </div>

                        {/* JD Section */}
                        {job.file_path && (
                            <div style={{ padding: 24, borderBottom: '1px solid #f1f5f9' }}>
                                <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1e293b', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <FileText style={{ width: 20, height: 20, color: '#2563eb' }} /> Job Description
                                </h3>
                                {isPdf && jdUrl ? (
                                    <iframe
                                        src={jdUrl}
                                        title="Job Description PDF"
                                        style={{ width: '100%', height: 600, border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8fafc' }}
                                    />
                                ) : (
                                    <a href={jdUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 15, color: '#2563eb', fontWeight: 500, textDecoration: 'none' }}>
                                        View Job Description (opens in new tab)
                                    </a>
                                )}
                            </div>
                        )}

                        {/* Apply at end: hide for org; guest = popup + 10s redirect; candidate = normal */}
                        <div style={{ padding: 24 }}>
                            {viewerType === 'organization' ? (
                                null
                            ) : applied ? (
                                <div style={{ padding: 16, background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0', color: '#166534', fontWeight: 500 }}>
                                    Job applied.
                                </div>
                            ) : !applicationsOpen ? (
                                <div style={{ padding: 16, background: '#fef3c7', borderRadius: 8, border: '1px solid #fcd34d', color: '#92400e', fontWeight: 500 }}>
                                    Applications are closed for this position.
                                </div>
                            ) : viewerType === 'guest' ? (
                                <button
                                    onClick={() => { setShowUnauthApplyModal(true); }}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        padding: '12px 24px',
                                        borderRadius: 999,
                                        border: 'none',
                                        background: '#0052FF',
                                        color: '#ffffff',
                                        fontWeight: 600,
                                        fontSize: 15,
                                        cursor: 'pointer',
                                        boxShadow: '0 12px 30px rgba(0, 82, 255, 0.35)',
                                        transition: 'background 0.2s ease-out, box-shadow 0.2s ease-out, transform 0.2s ease-out',
                                        transform: 'translateY(0)'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                        e.currentTarget.style.boxShadow = '0 16px 40px rgba(0, 82, 255, 0.40)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 12px 30px rgba(0, 82, 255, 0.35)';
                                    }}
                                >
                                    <UserCheck style={{ width: 18, height: 18 }} /> Apply for this job
                                </button>
                            ) : (
                                <button
                                    onClick={() => { setFormError(null); setShowApplyForm(true); }}
                                    disabled={processing}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        padding: '12px 24px',
                                        borderRadius: 999,
                                        border: 'none',
                                        background: processing ? '#93C5FD' : '#0052FF',
                                        color: '#ffffff',
                                        fontWeight: 600,
                                        fontSize: 15,
                                        cursor: processing ? 'not-allowed' : 'pointer',
                                        boxShadow: '0 12px 30px rgba(0, 82, 255, 0.35)',
                                        transition: 'background 0.2s ease-out, box-shadow 0.2s ease-out, transform 0.2s ease-out',
                                        transform: 'translateY(0)'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!processing) {
                                            e.currentTarget.style.transform = 'translateY(-1px)';
                                            e.currentTarget.style.boxShadow = '0 16px 40px rgba(0, 82, 255, 0.40)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!processing) {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 12px 30px rgba(0, 82, 255, 0.35)';
                                        }
                                    }}
                                >
                                    {processing ? 'Processing...' : (
                                        <>
                                            <UserCheck style={{ width: 18, height: 18 }} /> Apply for this job
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Unauthenticated Apply modal: create profile + 10s redirect to signup */}
            {showUnauthApplyModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
                    <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: 'min(420px, 90vw)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                        <p style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#334155', lineHeight: 1.6 }}>
                            Create a profile, upload your resume, and then come back here to apply again.
                        </p>
                        <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                            Redirecting you to sign up in <strong>{countdown}</strong> second{countdown !== 1 ? 's' : ''}...
                        </p>
                        <button
                            onClick={() => { setShowUnauthApplyModal(false); navigate('/auth'); }}
                            style={{ marginTop: '16px', padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: '500' }}
                        >
                            Go to Sign up now
                        </button>
                    </div>
                </div>
            )}

            {showApplyForm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
                    <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: 'min(480px, 90vw)', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', display: 'grid', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>Application Details</h3>
                            <button onClick={() => setShowApplyForm(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}><X /></button>
                        </div>
                        <label style={{ display: 'grid', gap: '6px', fontSize: '14px' }}>Current CTC <input type="number" value={applyForm.currentCtc} onChange={e => setApplyForm(f => ({ ...f, currentCtc: e.target.value }))} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }} /></label>
                        <label style={{ display: 'grid', gap: '6px', fontSize: '14px' }}>Expected CTC <input type="number" value={applyForm.expectedCtc} onChange={e => setApplyForm(f => ({ ...f, expectedCtc: e.target.value }))} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }} /></label>
                        <label style={{ display: 'grid', gap: '6px', fontSize: '14px' }}>Notice Period <input type="text" placeholder="e.g., 30 days" value={applyForm.noticePeriod} onChange={e => setApplyForm(f => ({ ...f, noticePeriod: e.target.value }))} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }} /></label>
                        <label style={{ display: 'grid', gap: '6px', fontSize: '14px' }}>Expected Date of Joining <input type="date" value={applyForm.expectedDoj} onChange={e => setApplyForm(f => ({ ...f, expectedDoj: e.target.value }))} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }} /></label>
                        {formError && <div style={{ color: '#dc2626', fontSize: '13px' }}>{formError}</div>}
                        <button onClick={submitApplyForm} style={{ padding: '12px', borderRadius: '8px', border: 'none', background: 'linear-gradient(to right, #2563eb, #1d4ed8)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Submit</button>
                    </div>
                </div>
            )}
        </>
    );
}
