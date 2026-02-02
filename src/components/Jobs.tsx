import React, { useState, useEffect } from 'react';
import {
    Briefcase, MapPin, Users, Calendar, DollarSign, FileText,
    CheckCircle, AlertCircle, UserCheck, LogOut, Building2, X, Menu, UserCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authenticatedFetch, clearAuthAndRedirect } from '../utils/auth';
import { API_ENDPOINTS } from '../config/api';

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
    job_package_lpa: number;
    job_type: string;
    notes: string;
    applied_candidates: any[];
    created_at: string;
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
            case 'full_time': return { bg: 'linear-gradient(to bottom right, #dbeafe, #bfdbfe)', color: '#1e40af', border: '#93c5fd' };
            case 'internship': return { bg: 'linear-gradient(to bottom right, #dcfce7, #bbf7d0)', color: '#15803d', border: '#86efac' };
            case 'unpaid': return { bg: 'linear-gradient(to bottom right, #f3e8ff, #e9d5ff)', color: '#6b21a8', border: '#d8b4fe' };
            default: return { bg: 'linear-gradient(to bottom right, #f1f5f9, #e2e8f0)', color: '#475569', border: '#cbd5e1' };
        }
    };

    const typeColors = getJobTypeColor(job.job_type);

    return (
        <div style={{ 
            background: '#ffffff', 
            borderRadius: '12px', 
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', 
            border: '1px solid #e2e8f0',
            padding: '24px',
            transition: 'all 0.2s ease-in-out',
            transform: 'translateY(0)'
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.1)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)';
        }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1e293b', margin: '0 0 8px 0' }}>{job.role}</h3>
                    <p style={{ color: '#64748b', margin: '0 0 4px 0', fontSize: '15px', fontWeight: '500' }}>{job.company.name}</p>
                    <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>{job.company.email}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        padding: '6px 14px', 
                        borderRadius: '20px', 
                        fontSize: '12px', 
                        fontWeight: '600', 
                        background: typeColors.bg,
                        color: typeColors.color,
                        border: `1px solid ${typeColors.border}`
                    }}>
                        {getJobTypeLabel(job.job_type)}
                    </span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
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
                    <DollarSign style={{ width: '16px', height: '16px', color: '#64748b' }} />
                    <span style={{ fontSize: '14px', color: '#475569', fontWeight: '600' }}>{job.job_package_lpa} LPA</span>
                </div>
            </div>

            {job.notes && (
                <div style={{ marginBottom: '16px', padding: '12px', background: 'linear-gradient(to bottom right, #f8fafc, #f1f5f9)', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <p style={{ fontSize: '13px', color: '#475569', margin: 0, lineHeight: '1.5' }}>{job.notes}</p>
                </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText style={{ width: '16px', height: '16px', color: '#64748b' }} />
                    <a
                        href={job.file_path?.startsWith('http') ? job.file_path : `${API_ENDPOINTS.JOBS.replace('/api/jobs', '')}${job.file_path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ 
                            fontSize: '14px', 
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

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>
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
                                gap: '8px', 
                                padding: '10px 20px',
                                borderRadius: '8px',
                                fontWeight: '500',
                                fontSize: '14px',
                                border: 'none',
                                cursor: 'pointer',
                                background: 'linear-gradient(to bottom right, #2563eb, #1d4ed8)',
                                color: '#ffffff',
                                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                                transition: 'all 0.15s ease',
                                transform: 'translateY(0)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)';
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
                                gap: '8px', 
                                padding: '10px 20px',
                                borderRadius: '8px',
                                fontWeight: '500',
                                fontSize: '14px',
                                border: 'none',
                                cursor: (isApplied || isProcessing) ? 'not-allowed' : 'pointer',
                                background: (isApplied || isProcessing) ? 'linear-gradient(to bottom right, #d1fae5, #a7f3d0)' : 'linear-gradient(to bottom right, #2563eb, #1d4ed8)',
                                color: (isApplied || isProcessing) ? '#15803d' : '#ffffff',
                                boxShadow: (isApplied || isProcessing) ? '0 2px 8px rgba(34, 197, 94, 0.2)' : '0 4px 12px rgba(37, 99, 235, 0.3)',
                                transition: 'all 0.15s ease',
                                transform: 'translateY(0)'
                            }}
                            onMouseEnter={(e) => {
                                if (!isApplied && !isProcessing) {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.4)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isApplied && !isProcessing) {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)';
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
        // Check authentication and user type
        const token = localStorage.getItem('access_token');
        const storedUserData = localStorage.getItem('user');

        if (!token) {
            navigate('/');
            return;
        }

        if (storedUserData) {
            const parsedUser = JSON.parse(storedUserData);
            if (parsedUser.user_type !== 'user') {
                navigate('/');
                return;
            }
        }

        // Fetch jobs data
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
                    <p style={{ color: '#475569', fontSize: '16px', fontWeight: '500' }}>Loading applications...</p>
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
                <div style={{ 
                    background: 'linear-gradient(to right, #6366f1, #8b5cf6)',
                    borderBottom: '1px solid #e2e8f0',
                    position: 'sticky',
                    top: 0,
                    zIndex: 20,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}>
                    <div style={{ 
                        maxWidth: '1152px', 
                        margin: '0 auto', 
                        padding: '16px 24px', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center'
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
                                <Briefcase style={{ width: '24px', height: '24px', color: '#ffffff' }} />
                            </div>
                            <div>
                                <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff', margin: 0, lineHeight: '1.2' }}>My Applications</h1>
                                <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.9)', margin: '2px 0 0 0' }}>Track your job applications</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <button
                                data-menu-button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: '8px',
                                    fontWeight: '500',
                                    color: '#ffffff',
                                    background: menuHovered ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.15)',
                                    border: '1px solid rgba(255, 255, 255, 0.3)',
                                    cursor: 'pointer',
                                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                                    transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={() => setMenuHovered(true)}
                                onMouseLeave={() => setMenuHovered(false)}
                            >
                                <Menu style={{ width: '20px', height: '20px' }} />
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
                            background: 'rgba(0, 0, 0, 0.5)',
                            zIndex: 999,
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
                        width: '280px',
                        background: '#ffffff',
                        boxShadow: '2px 0 10px rgba(0, 0, 0, 0.1)',
                        zIndex: 1000,
                        transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
                        transition: 'transform 0.3s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        overflowY: 'auto'
                    }}
                >
                    {/* Sidebar Header */}
                    <div style={{
                        padding: '24px 20px',
                        borderBottom: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'linear-gradient(to right, #f8fafc, #ffffff)'
                    }}>
                        <div>
                            <h2 style={{
                                fontSize: '18px',
                                fontWeight: '700',
                                color: '#0f172a',
                                margin: 0
                            }}>
                                Navigation
                            </h2>
                            <p style={{
                                fontSize: '12px',
                                color: '#64748b',
                                margin: '4px 0 0 0'
                            }}>
                                Quick access menu
                            </p>
                        </div>
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '32px',
                                height: '32px',
                                borderRadius: '6px',
                                border: 'none',
                                background: '#f1f5f9',
                                cursor: 'pointer',
                                transition: 'background 0.15s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#f1f5f9'}
                        >
                            <X style={{ width: '18px', height: '18px', color: '#64748b' }} />
                        </button>
                    </div>

                    {/* Sidebar Navigation */}
                    <div style={{
                        flex: 1,
                        padding: '16px 0'
                    }}>
                        <button
                            onClick={() => {
                                navigate('/user-profile');
                                setIsSidebarOpen(false);
                            }}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '14px 20px',
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                fontSize: '15px',
                                fontWeight: '500',
                                color: '#1e293b',
                                transition: 'all 0.15s ease',
                                textAlign: 'left',
                                borderLeft: '3px solid transparent'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#f1f5f9';
                                e.currentTarget.style.borderLeftColor = '#2563eb';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.borderLeftColor = 'transparent';
                            }}
                        >
                            <UserCircle style={{ width: '20px', height: '20px', color: '#2563eb' }} />
                            Profile
                        </button>
                        <button
                            onClick={() => {
                                navigate('/jobs');
                                setIsSidebarOpen(false);
                            }}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '14px 20px',
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                fontSize: '15px',
                                fontWeight: '500',
                                color: '#1e293b',
                                transition: 'all 0.15s ease',
                                textAlign: 'left',
                                borderLeft: '3px solid transparent'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#f1f5f9';
                                e.currentTarget.style.borderLeftColor = '#2563eb';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.borderLeftColor = 'transparent';
                            }}
                        >
                            <Briefcase style={{ width: '20px', height: '20px', color: '#2563eb' }} />
                            Jobs
                        </button>
                    </div>

                    {/* Sidebar Footer with Logout */}
                    <div style={{
                        padding: '16px 0',
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
                                gap: '12px',
                                padding: '14px 20px',
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                fontSize: '15px',
                                fontWeight: '500',
                                color: '#dc2626',
                                transition: 'all 0.15s ease',
                                textAlign: 'left',
                                borderLeft: '3px solid transparent'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#fef2f2';
                                e.currentTarget.style.borderLeftColor = '#dc2626';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.borderLeftColor = 'transparent';
                            }}
                        >
                            <LogOut style={{ width: '20px', height: '20px', color: '#dc2626' }} />
                            Logout
                        </button>
                    </div>
                </div>

            {/* Message Toast */}
            {message && (
                <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '16px 24px 0' }}>
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
                            <AlertCircle style={{ width: '20px', height: '20px', flexShrink: 0 }} />
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
            <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '32px 24px' }}>
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
