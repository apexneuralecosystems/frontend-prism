import React, { useState, useEffect } from 'react';
import {
    Briefcase, MapPin, Users, Calendar, DollarSign, FileText,
    CheckCircle, AlertCircle, UserCheck, LogOut, Building2, X
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
    isApplied,
    applicationStatus,
    showApplyButton = true,
    isProcessing = false
}: {
    job: JobPost;
    onApply?: (jobId: string) => void;
    isApplied: boolean;
    applicationStatus?: string;
    showApplyButton?: boolean;
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
                        href={`${API_ENDPOINTS.JOBS.replace('/api/jobs', '')}${job.file_path}`}
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

                    {showApplyButton && (
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
    const [activeTab, setActiveTab] = useState<'all' | 'applied'>('all');
    const [jobs, setJobs] = useState<JobPost[]>([]);
    const [appliedJobs, setAppliedJobs] = useState<JobPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [userData, setUserData] = useState<any>(null);
    const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
    const [processingJobId, setProcessingJobId] = useState<string | null>(null);

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
            setUserData(parsedUser);
        }

        // Fetch jobs data
        fetchAllJobs();
    }, [navigate]);

    const fetchAllJobs = async () => {
        try {
            // Fetch both all jobs and applied jobs
            const [allJobsRes, appliedJobsRes] = await Promise.all([
                authenticatedFetch(API_ENDPOINTS.JOBS, { method: 'GET' }, navigate),
                authenticatedFetch(API_ENDPOINTS.JOBS_APPLIED, { method: 'GET' }, navigate)
            ]);

            // First, get applied jobs to create a set of applied job IDs
            const appliedJobIdsSet = new Set<string>();
            if (appliedJobsRes && appliedJobsRes.ok) {
                const appliedResult = await appliedJobsRes.json();
                const appliedJobsList = appliedResult.jobs || [];
                appliedJobsList.forEach((appliedJob: any) => {
                    if (appliedJob.job_id) {
                        appliedJobIdsSet.add(appliedJob.job_id);
                    }
                });
                setAppliedJobs(appliedJobsList);
                setAppliedJobIds(appliedJobIdsSet);
            }

            // Handle all jobs - filter out any jobs that are in the applied jobs list
            if (allJobsRes && allJobsRes.ok) {
                const result = await allJobsRes.json();
                const openJobs = result.jobs || [];

                // Filter out applied jobs from the all jobs list
                const unappliedJobs = openJobs.filter((job: JobPost) => 
                    !appliedJobIdsSet.has(job.job_id)
                );

                setJobs(unappliedJobs);
            } else if (allJobsRes && allJobsRes.status === 401) {
                clearAuthAndRedirect(navigate);
                return;
            }

            setMessage(null);
        } catch (err) {
            console.error('Failed to fetch jobs:', err);
            setMessage({ type: 'error', text: 'Error loading jobs' });
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async (jobId: string) => {
        if (!userData || processingJobId) return; // Prevent multiple clicks

        setProcessingJobId(jobId); // Set processing state
        setMessage({ type: 'success', text: 'Processing your application...' });

        try {
            // Fetch user's profile to get resume_url
            let resumeUrl = '';
            try {
                const profileRes = await authenticatedFetch(
                    API_ENDPOINTS.USER_PROFILE,
                    { method: 'GET' },
                    navigate
                );
                if (profileRes && profileRes.ok) {
                    const profile = await profileRes.json();
                    // Check both camelCase and snake_case (frontend uses camelCase, backend might use snake_case)
                    resumeUrl = profile?.profile?.resumeUrl || profile?.profile?.resume_url || '';
                    console.log('📄 [Frontend] Resume URL from profile:', resumeUrl);
                }
            } catch (err) {
                console.error('Failed to fetch profile:', err);
                setMessage({ type: 'error', text: 'Please complete your profile with a resume before applying' });
                setProcessingJobId(null);
                return;
            }

            if (!resumeUrl) {
                setMessage({ type: 'error', text: 'Please upload your resume in your profile before applying' });
                setProcessingJobId(null);
                return;
            }

            // Send application - backend will handle LLM processing
            const res = await authenticatedFetch(
                `${API_ENDPOINTS.ORGANIZATION_JOBPOST}/${jobId}/apply`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: userData.name,
                        email: userData.email,
                        resume_url: resumeUrl
                    })
                },
                navigate
            );

            if (!res) {
                setMessage({ type: 'error', text: 'Failed to connect to server' });
                setProcessingJobId(null);
                return;
            }

            if (res.ok) {
                // Remove job from all jobs list
                const appliedJob = jobs.find(job => job.job_id === jobId);
                setJobs(prevJobs => prevJobs.filter(job => job.job_id !== jobId));
                
                // Add to applied job IDs set
                setAppliedJobIds(prev => new Set([...prev, jobId]));
                
                // Add to applied jobs list with pending status
                if (appliedJob) {
                    setAppliedJobs(prev => [...prev, { ...appliedJob, application_status: 'pending' } as any]);
                }
                
                setMessage({ type: 'success', text: 'Application submitted successfully! Your profile is being processed...' });
                
                // Refresh applied jobs after a delay to get the processed data
                setTimeout(async () => {
                    try {
                        const appliedRes = await authenticatedFetch(API_ENDPOINTS.JOBS_APPLIED, { method: 'GET' }, navigate);
                        if (appliedRes && appliedRes.ok) {
                            const result = await appliedRes.json();
                            setAppliedJobs(result.jobs || []);
                        }
                    } catch (err) {
                        console.error('Failed to refresh applied jobs:', err);
                    }
                }, 5000); // Wait 5 seconds for backend LLM processing
            } else {
                const error = await res.json();
                setMessage({ type: 'error', text: error.detail || 'Failed to apply for the job' });
            }
        } catch (err: any) {
            console.error('Failed to apply for job:', err);
            setMessage({ type: 'error', text: err.message || 'Error applying for the job' });
        } finally {
            setProcessingJobId(null);
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

    if (loading && jobs.length === 0 && appliedJobs.length === 0) {
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
                    <p style={{ color: '#475569', fontSize: '16px', fontWeight: '500' }}>Loading jobs...</p>
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
                    maxWidth: '1200px', 
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
                            <Briefcase style={{ width: '24px', height: '24px', color: '#ffffff' }} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff', margin: 0, lineHeight: '1.2' }}>Available Jobs</h1>
                            <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.9)', margin: '2px 0 0 0' }}>Discover and apply to opportunities</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button
                            onClick={() => navigate('/user-profile')}
                            style={{ 
                                padding: '8px 14px',
                                borderRadius: '8px',
                                fontWeight: '500',
                                fontSize: '14px',
                                color: '#ffffff',
                                background: 'rgba(255, 255, 255, 0.15)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                transform: 'translateY(0)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            Profile
                        </button>
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
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px 24px 0' }}>
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
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
                {/* Tabs */}
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ borderBottom: '2px solid #e2e8f0' }}>
                        <nav style={{ display: 'flex', gap: '32px', marginBottom: '-2px' }}>
                            {[
                                { id: 'all', label: 'All Jobs', count: jobs.length },
                                { id: 'applied', label: 'Applied Jobs', count: appliedJobs.length }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    style={{ 
                                        padding: '12px 4px',
                                        borderBottom: activeTab === tab.id ? '3px solid #2563eb' : '3px solid transparent',
                                        fontWeight: '600',
                                        fontSize: '15px',
                                        color: activeTab === tab.id ? '#2563eb' : '#64748b',
                                        background: 'none',
                                        border: 'none',
                                        borderBottom: activeTab === tab.id ? '3px solid #2563eb' : '3px solid transparent',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (activeTab !== tab.id) {
                                            e.currentTarget.style.color = '#475569';
                                            e.currentTarget.style.borderBottom = '3px solid #cbd5e1';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (activeTab !== tab.id) {
                                            e.currentTarget.style.color = '#64748b';
                                            e.currentTarget.style.borderBottom = '3px solid transparent';
                                        }
                                    }}
                                >
                                    {tab.label} ({tab.count})
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Job Listings */}
                {(() => {
                    if (activeTab === 'all') {
                        return jobs.length === 0 ? (
                            <div style={{ 
                                textAlign: 'center', 
                                padding: '80px 20px',
                                background: '#ffffff',
                                borderRadius: '16px',
                                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)'
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
                                <h3 style={{ fontSize: '24px', fontWeight: '600', color: '#1e293b', margin: '0 0 8px 0' }}>No jobs available</h3>
                                <p style={{ color: '#64748b', margin: 0, fontSize: '15px' }}>There are no open job positions at the moment. Check back later!</p>
                            </div>
                        ) : (
                            <>
                                <div style={{ marginBottom: '24px', padding: '20px', background: '#ffffff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }}>
                                    <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', margin: '0 0 4px 0' }}>
                                        Found {jobs.length} job{jobs.length !== 1 ? 's' : ''} available
                                    </h2>
                                    <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>Apply to positions that match your skills and interests</p>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                                    {jobs.map((job) => (
                                        <JobCard
                                            key={job.job_id}
                                            job={job}
                                            onApply={handleApply}
                                            isApplied={appliedJobIds.has(job.job_id)}
                                            isProcessing={processingJobId === job.job_id}
                                        />
                                    ))}
                                </div>
                            </>
                        );
                    } else {
                        return appliedJobs.length === 0 ? (
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
                                <h3 style={{ fontSize: '24px', fontWeight: '600', color: '#1e293b', margin: '0 0 8px 0' }}>No applied jobs</h3>
                                <p style={{ color: '#64748b', margin: 0, fontSize: '15px' }}>You haven't applied to any jobs yet. Browse available jobs to get started!</p>
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
                                            onApply={undefined}
                                            isApplied={true}
                                            applicationStatus={job.application_status}
                                            showApplyButton={false}
                                        />
                                    ))}
                                </div>
                            </>
                        );
                    }
                })()}
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
    );
}
