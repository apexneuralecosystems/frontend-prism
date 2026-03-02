import React, { useState, useEffect } from 'react';
import {
    Briefcase, MapPin, Users, Calendar, IndianRupee, FileText,
    CheckCircle, AlertCircle, UserCheck, LogOut, Building2, X, Menu, UserCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authenticatedFetch, clearAuthAndRedirect } from '../utils/auth';
import { API_ENDPOINTS, getStorageUrl } from '../config/api';

// --- Types ---

interface JobPost {
    job_id: string;
    company: {
        name: string;
        email: string;
    };
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
    applied_candidates: any[];
    created_at: string;
}

function formatPackageLpa(job: JobPost): string {
    const min = job.job_package_lpa_min ?? job.job_package_lpa;
    const max = job.job_package_lpa_max ?? job.job_package_lpa;
    if (min != null && max != null && min !== max) return `${min} - ${max} LPA`;
    if (min != null) return `${min} LPA`;
    return 'Info not given';
}

// --- Helper Components ---

const JobCard = ({
    job,
    onApply,
    onShowMore,
    isApplied,
    applicationStatus,
    showApplyButton = true,
    showMoreOnly = false,
    isProcessing = false
}: {
    job: JobPost;
    onApply?: (jobId: string) => void;
    onShowMore?: (jobId: string) => void;
    isApplied: boolean;
    applicationStatus?: string;
    showApplyButton?: boolean;
    showMoreOnly?: boolean;
    isProcessing?: boolean;
}) => {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

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
            case 'full_time':
                return { bg: '#EEF2FF', color: '#1D4ED8', border: '#C7D2FE' };
            case 'internship':
                return { bg: '#ECFDF3', color: '#15803D', border: '#BBF7D0' };
            case 'unpaid':
                return { bg: '#F3E8FF', color: '#6B21A8', border: '#E9D5FF' };
            default:
                return { bg: '#F1F5F9', color: '#475569', border: '#CBD5E1' };
        }
    };

    const typeColors = getJobTypeColor(job.job_type);

    return (
        <div
            style={{
                background: '#FFFFFF',
                borderRadius: 12,
                boxShadow: '0 14px 40px rgba(15, 23, 42, 0.08)',
                border: '1px solid #E2E8F0',
                padding: 20,
                transition: 'transform 0.2s ease-out, box-shadow 0.2s ease-out',
                transform: 'translateY(0)'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 18px 45px rgba(15, 23, 42, 0.12)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 14px 40px rgba(15, 23, 42, 0.08)';
            }}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12, gap: 16 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 600, color: '#111827', margin: '0 0 4px 0' }}>{job.role}</h3>
                    <p style={{ color: '#4B5563', margin: '0 0 2px 0', fontSize: 14, fontWeight: 500 }}>
                        {job.company.name}
                    </p>
                    <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {job.company.email}
                    </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <span
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '4px 10px',
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 600,
                            background: typeColors.bg,
                            color: typeColors.color,
                            border: `1px solid ${typeColors.border}`,
                            textTransform: 'uppercase',
                            letterSpacing: 0.5
                        }}
                    >
                        {getJobTypeLabel(job.job_type)}
                    </span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin style={{ width: '16px', height: '16px', color: '#64748b' }} />
                    <span style={{ fontSize: '14px', color: '#475569' }}>{job.location}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users style={{ width: '16px', height: '16px', color: '#64748b' }} />
                    <span style={{ fontSize: '14px', color: '#475569' }}>{job.number_of_openings} openings</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar style={{ width: '16px', height: '16px', color: '#64748b' }} />
                    <span style={{ fontSize: '14px', color: '#475569' }}>Apply by: {formatDate(job.application_close_date)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <IndianRupee style={{ width: 16, height: 16, color: '#64748b' }} />
                    <span style={{ fontSize: 14, color: '#475569', fontWeight: 600 }}>{formatPackageLpa(job)}</span>
                </div>
            </div>

            {job.notes && (
                <div style={{ marginBottom: 12, padding: 12, background: '#F9FAFB', borderRadius: 8, border: '1px solid #E5E7EB' }}>
                    <p style={{ fontSize: 13, color: '#475569', margin: 0, lineHeight: 1.6 }}>{job.notes}</p>
                </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid #E5E7EB', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText style={{ width: '16px', height: '16px', color: '#64748b' }} />
                    <a
                        href={getStorageUrl(job.file_path)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            fontSize: 14,
                            color: '#2563eb',
                            textDecoration: 'none',
                            fontWeight: '500',
                            transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                    >
                        View Job Description
                    </a>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>
                        {applicationStatus ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                Status: <span style={{ fontWeight: '600', color: '#2563eb', textTransform: 'capitalize' }}>{applicationStatus}</span>
                            </span>
                        ) : (
                            `Posted ${formatDate(job.created_at)}`
                        )}
                    </div>

                    {(showMoreOnly && onShowMore) ? (
                        <button
                            onClick={() => onShowMore(job.job_id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '9px 18px',
                                borderRadius: 999,
                                fontWeight: 600,
                                fontSize: 13,
                                border: 'none',
                                cursor: 'pointer',
                                background: '#0052FF',
                                color: '#ffffff',
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
                            Show More
                        </button>
                    ) : showApplyButton && (
                        <button
                            onClick={() => onApply?.(job.job_id)}
                            disabled={isApplied || isProcessing}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '9px 18px',
                                borderRadius: 999,
                                fontWeight: 600,
                                fontSize: 13,
                                border: 'none',
                                cursor: (isApplied || isProcessing) ? 'not-allowed' : 'pointer',
                                background: (isApplied || isProcessing) ? '#ECFDF3' : '#0052FF',
                                color: (isApplied || isProcessing) ? '#15803D' : '#ffffff',
                                boxShadow: (isApplied || isProcessing)
                                    ? '0 4px 12px rgba(22, 163, 74, 0.25)'
                                    : '0 12px 30px rgba(0, 82, 255, 0.35)',
                                transition: 'background 0.2s ease-out, box-shadow 0.2s ease-out, transform 0.2s ease-out',
                                transform: 'translateY(0)'
                            }}
                            onMouseEnter={(e) => {
                                if (!isApplied && !isProcessing) {
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                    e.currentTarget.style.boxShadow = '0 16px 40px rgba(0, 82, 255, 0.40)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isApplied && !isProcessing) {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 12px 30px rgba(0, 82, 255, 0.35)';
                                }
                            }}
                        >
                            {isProcessing ? (
                                <>
                                    <div style={{ 
                                        width: '16px', 
                                        height: '16px', 
                                        border: '2px solid #15803d', 
                                        borderTop: '2px solid transparent', 
                                        borderRadius: '50%', 
                                        animation: 'spin 1s linear infinite' 
                                    }}></div>
                                    Processing...
                                </>
                            ) : isApplied ? (
                                <>
                                    <CheckCircle style={{ width: '16px', height: '16px' }} />
                                    Applied
                                </>
                            ) : (
                                <>
                                    <UserCheck style={{ width: '16px', height: '16px' }} />
                                    Apply Now
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---

export function Jobs() {
    const navigate = useNavigate();
    const [appliedJobs, setAppliedJobs] = useState<JobPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [menuHovered, setMenuHovered] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        const storedUserData = localStorage.getItem('user');

        if (!token) {
            navigate('/auth', { state: { message: 'Sign in to see applied jobs' } });
            return;
        }

        if (storedUserData) {
            try {
                const parsedUser = JSON.parse(storedUserData);
                if (parsedUser.user_type === 'organization') {
                    navigate('/organization-jobpost');
                    return;
                }
            } catch {
                navigate('/auth', { state: { message: 'Sign in to see applied jobs' } });
                return;
            }
        }

        fetchAllJobs();
    }, [navigate]);

    const fetchAllJobs = async () => {
        try {
            const appliedJobsRes = await authenticatedFetch(API_ENDPOINTS.JOBS_APPLIED, { method: 'GET' }, navigate);

            if (appliedJobsRes && appliedJobsRes.ok) {
                const appliedResult = await appliedJobsRes.json();
                setAppliedJobs(appliedResult.jobs || []);
            } else if (appliedJobsRes && appliedJobsRes.status === 401) {
                clearAuthAndRedirect(navigate);
                return;
            }

            setMessage(null);
        } catch (err) {
            console.error('Failed to fetch jobs:', err);
            setMessage({ type: 'error', text: 'Error loading applications' });
        } finally {
            setLoading(false);
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
        navigate("/");
    };

    // Close sidebar when clicking outside
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
                        Loading applications...
                    </p>
                </div>
            </div>
        );
    }

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
                                    My Applications
                                </h1>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
                        {message.type === 'success' ? 
                            <CheckCircle style={{ width: 16, height: 16, flexShrink: 0 }} /> : 
                            <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
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
                {appliedJobs.length === 0 ? (
                    <div style={{ 
                        textAlign: 'center', 
                        padding: '80px 20px',
                        background: '#ffffff',
                        borderRadius: '16px',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)'
                    }}>
                        <div style={{ 
                            background: 'linear-gradient(to bottom right, #dcfce7, #bbf7d0)',
                            borderRadius: '20px',
                            width: '120px',
                            height: '120px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 24px'
                        }}>
                            <UserCheck style={{ width: '64px', height: '64px', color: '#16a34a' }} />
                        </div>
                        <h3 style={{ fontSize: '24px', fontWeight: '600', color: '#1e293b', margin: '0 0 8px 0' }}>No applications yet</h3>
                        <p style={{ color: '#64748b', margin: 0, fontSize: '15px' }}>You haven't applied to any jobs yet. To apply, use the job link shared with you (e.g. /jobs/job-id).</p>
                    </div>
                ) : (
                    <>
                        <div style={{ marginBottom: '24px', padding: '20px', background: '#ffffff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', margin: '0 0 4px 0' }}>
                                Your Applications ({appliedJobs.length})
                            </h2>
                            <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>Track the status of jobs you've applied to</p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                            {appliedJobs.map((job: any) => (
                                <JobCard
                                    key={job.job_id}
                                    job={job}
                                    onShowMore={(id) => navigate(`/jobs/${id}`)}
                                    showMoreOnly
                                    onApply={undefined}
                                    isApplied={true}
                                    applicationStatus={job.application_status}
                                    showApplyButton={false}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>

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
            `}</style>
            </div>
        </>
    );
}
