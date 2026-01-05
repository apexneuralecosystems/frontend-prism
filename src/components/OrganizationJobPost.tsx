import React, { useState, useEffect } from 'react';
import {
    Briefcase, Plus, X, FileText, MapPin, Users, Calendar,
    DollarSign, CheckCircle, AlertCircle, Upload, LogOut, Building2,
    ChevronDown, ChevronRight, Eye
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
    offer_accepted_count?: number;
    created_at: string;
    closed_at?: string;
}

// --- Helper Components ---

const JobCard = ({
    job,
    status,
    onClose,
    onViewApplicants
}: {
    job: JobPost;
    status: 'open' | 'ongoing' | 'closed';
    onClose?: (jobId: string) => void;
    onViewApplicants?: (job: JobPost, filterStatus?: string) => void;
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
            case 'internship': return { bg: 'linear-gradient(to bottom right, #fef3c7, #fde68a)', color: '#92400e', border: '#fcd34d' };
            case 'unpaid': return { bg: 'linear-gradient(to bottom right, #f3e8ff, #e9d5ff)', color: '#6b21a8', border: '#d8b4fe' };
            default: return { bg: 'linear-gradient(to bottom right, #dbeafe, #bfdbfe)', color: '#1e40af', border: '#93c5fd' };
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
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', margin: '0 0 8px 0' }}>{job.role}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                        <p style={{ color: '#64748b', margin: 0, fontSize: '14px', fontWeight: '500' }}>{job.company.name}</p>
                        {status === 'closed' ? (
                            // For closed jobs, show offer_accepted count
                            job.offer_accepted_count !== undefined && job.offer_accepted_count > 0 && onViewApplicants && (
                                <button
                                    onClick={() => onViewApplicants(job, 'offer_accepted')}
                                    style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '4px', 
                                        fontSize: '12px', 
                                        color: '#2563eb',
                                        background: '#dbeafe',
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontWeight: '500',
                                        transition: 'all 0.15s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = '#2563eb';
                                        e.currentTarget.style.color = '#ffffff';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = '#dbeafe';
                                        e.currentTarget.style.color = '#2563eb';
                                    }}
                                >
                                    <Eye style={{ width: '12px', height: '12px' }} />
                                    {job.offer_accepted_count} offer accepted{job.offer_accepted_count !== 1 ? 's' : ''}
                                </button>
                            )
                        ) : (
                            // For open/ongoing jobs, show total applicants
                            job.applied_candidates && job.applied_candidates.length > 0 && onViewApplicants && (
                                <button
                                    onClick={() => onViewApplicants(job)}
                                    style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '4px', 
                                        fontSize: '12px', 
                                        color: '#2563eb',
                                        background: '#dbeafe',
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontWeight: '500',
                                        transition: 'all 0.15s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = '#2563eb';
                                        e.currentTarget.style.color = '#ffffff';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = '#dbeafe';
                                        e.currentTarget.style.color = '#2563eb';
                                    }}
                                >
                                    <Eye style={{ width: '12px', height: '12px' }} />
                                    {job.applied_candidates.length} applicant{job.applied_candidates.length !== 1 ? 's' : ''}
                                </button>
                            )
                        )}
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        padding: '6px 12px', 
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
                    <span style={{ fontSize: '14px', color: '#475569' }}>Closes: {formatDate(job.application_close_date)}</span>
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

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText style={{ width: '16px', height: '16px', color: '#64748b' }} />
                    <a
                        href={`${API_ENDPOINTS.ORGANIZATION_JOBPOST.replace('/api/organization-jobpost', '')}${job.file_path}`}
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
                    {status === 'ongoing' && onClose && (
                        <button
                            onClick={() => onClose(job.job_id)}
                            style={{ 
                                padding: '6px 16px', 
                                fontSize: '13px', 
                                background: 'linear-gradient(to bottom right, #dc2626, #b91c1c)',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '500',
                                boxShadow: '0 2px 6px rgba(220, 38, 38, 0.3)',
                                transition: 'all 0.15s ease',
                                transform: 'translateY(0)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 2px 6px rgba(220, 38, 38, 0.3)';
                            }}
                        >
                            Close Job
                        </button>
                    )}
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                        {status === 'closed' && job.closed_at ?
                            `Closed ${formatDate(job.closed_at)}` :
                            `Posted ${formatDate(job.created_at)}`
                        }
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- Applicants Modal Component ---

const ApplicantsModal = ({
    job,
    isOpen,
    onClose,
    filterStatus
}: {
    job: JobPost | null;
    isOpen: boolean;
    onClose: () => void;
    filterStatus?: string | null;
}) => {
    if (!isOpen || !job) return null;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Filter candidates based on filterStatus
    const filteredCandidates = filterStatus
        ? job.applied_candidates?.filter(candidate => candidate.status === filterStatus) || []
        : job.applied_candidates || [];

    const displayTitle = filterStatus === 'offer_accepted' ? 'Candidates Who Accepted Offer' : 'All Applicants';

    return (
        <div style={{ 
            position: 'fixed', 
            inset: 0, 
            background: 'rgba(0, 0, 0, 0.5)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 50, 
            padding: '16px',
            backdropFilter: 'blur(4px)'
        }}>
            <div style={{ 
                background: '#ffffff', 
                borderRadius: '16px', 
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.2)', 
                maxWidth: '800px', 
                width: '100%', 
                maxHeight: '80vh', 
                overflow: 'hidden',
                animation: 'slideIn 0.2s ease-out'
            }}>
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    padding: '24px', 
                    borderBottom: '1px solid #e2e8f0',
                    background: 'linear-gradient(to right, #6366f1, #8b5cf6)'
                }}>
                    <div>
                        <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#ffffff', margin: 0 }}>{job.role}</h2>
                        <p style={{ color: 'rgba(255, 255, 255, 0.9)', margin: '4px 0 0 0', fontSize: '14px' }}>{job.company.name}</p>
                        <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.8)', margin: '4px 0 0 0' }}>
                            {filterStatus 
                                ? `${displayTitle}: ${filteredCandidates.length} candidate${filteredCandidates.length !== 1 ? 's' : ''}`
                                : `${filteredCandidates.length} applicant${filteredCandidates.length !== 1 ? 's' : ''}`
                            }
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{ 
                            padding: '8px', 
                            background: 'rgba(255, 255, 255, 0.2)',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                    >
                        <X style={{ width: '20px', height: '20px', color: '#ffffff' }} />
                    </button>
                </div>

                <div style={{ padding: '24px', overflowY: 'auto', maxHeight: '60vh' }}>
                    {filteredCandidates && filteredCandidates.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {filteredCandidates.map((candidate: any, index: number) => (
                                <div key={index} style={{ 
                                    border: '1px solid #e2e8f0', 
                                    borderRadius: '12px', 
                                    padding: '16px',
                                    background: 'linear-gradient(to bottom right, #f8fafc, #f1f5f9)',
                                    transition: 'all 0.15s ease',
                                    transform: 'translateY(0)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                                        <div>
                                            <h4 style={{ fontWeight: '500', color: '#1e293b', margin: '0 0 4px 0', fontSize: '15px' }}>{candidate.name}</h4>
                                            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>{candidate.email}</p>
                                        </div>
                                        {candidate.applied_at && (
                                            <p style={{ 
                                                fontSize: '12px', 
                                                color: '#94a3b8',
                                                margin: 0,
                                                padding: '4px 8px',
                                                background: '#ffffff',
                                                borderRadius: '6px',
                                                border: '1px solid #e2e8f0'
                                            }}>
                                                Applied on {formatDate(candidate.applied_at)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                            <div style={{ 
                                background: filterStatus === 'offer_accepted' 
                                    ? 'linear-gradient(to bottom right, #dcfce7, #bbf7d0)' 
                                    : 'linear-gradient(to bottom right, #dbeafe, #e0e7ff)',
                                borderRadius: '20px',
                                width: '100px',
                                height: '100px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 20px'
                            }}>
                                <Users style={{ 
                                    width: '48px', 
                                    height: '48px', 
                                    color: filterStatus === 'offer_accepted' ? '#16a34a' : '#3b82f6' 
                                }} />
                            </div>
                            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', margin: '0 0 8px 0' }}>
                                {filterStatus === 'offer_accepted' 
                                    ? 'No one accepted the offer yet' 
                                    : 'No applicants yet'
                                }
                            </h3>
                            <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>
                                {filterStatus === 'offer_accepted'
                                    ? 'Candidates who accept your offer will appear here.'
                                    : 'Applicants will appear here once candidates apply for this job.'
                                }
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---

export function OrganizationJobPost() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'open' | 'ongoing' | 'closed'>('open');
    const [jobs, setJobs] = useState<{open: JobPost[], ongoing: JobPost[], closed: JobPost[]}>({
        open: [],
        ongoing: [],
        closed: []
    });
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [userData, setUserData] = useState<any>(null);
    const [showApplicantsModal, setShowApplicantsModal] = useState(false);
    const [selectedJobForApplicants, setSelectedJobForApplicants] = useState<JobPost | null>(null);
    const [applicantFilterStatus, setApplicantFilterStatus] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        role: '',
        location: '',
        number_of_openings: 1,
        application_close_date: '',
        job_package_lpa: 0,
        job_type: 'full_time',
        notes: '',
        jd_file: null as File | null
    });

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
            if (parsedUser.user_type !== 'organization') {
                navigate('/');
                return;
            }
            setUserData(parsedUser);
        }

        // Fetch jobs data
        fetchAllJobs();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchAllJobs = async () => {
        try {
            setLoading(true);
            // Fetch jobs from all three collections
            const [openRes, ongoingRes, closedRes] = await Promise.all([
                authenticatedFetch(API_ENDPOINTS.ORGANIZATION_JOBPOST, { method: 'GET' }, navigate),
                authenticatedFetch(API_ENDPOINTS.ORGANIZATION_JOBPOST_ONGOING, { method: 'GET' }, navigate),
                authenticatedFetch(API_ENDPOINTS.ORGANIZATION_JOBPOST_CLOSED, { method: 'GET' }, navigate)
            ]);

            let openJobs: JobPost[] = [];
            let ongoingJobs: JobPost[] = [];
            let closedJobs: JobPost[] = [];

            // Handle open jobs
            if (openRes && openRes.ok) {
                const result = await openRes.json();
                openJobs = Array.isArray(result.jobs) ? [...result.jobs] : [];
            } else if (openRes && openRes.status === 401) {
                clearAuthAndRedirect(navigate);
                return;
            }

            // Handle ongoing jobs
            if (ongoingRes && ongoingRes.ok) {
                const result = await ongoingRes.json();
                ongoingJobs = Array.isArray(result.jobs) ? [...result.jobs] : [];
            }

            // Handle closed jobs
            if (closedRes && closedRes.ok) {
                const result = await closedRes.json();
                closedJobs = Array.isArray(result.jobs) ? [...result.jobs] : [];
            }

            // Update state with completely new object and arrays
            setJobs({
                open: openJobs,
                ongoing: ongoingJobs,
                closed: closedJobs
            });
            setMessage(null); // Clear any error messages on successful fetch

        } catch (err) {
            console.error('Failed to fetch jobs:', err);
            setMessage({ type: 'error', text: 'Error loading job postings' });
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData(prev => ({ ...prev, jd_file: file }));
        }
    };

    const handleInputChange = (field: string, value: any) => {
        // If changing job type to unpaid, automatically set LPA to 0
        if (field === 'job_type' && value === 'unpaid') {
            setFormData(prev => ({ ...prev, [field]: value, job_package_lpa: 0 }));
        } else {
        setFormData(prev => ({ ...prev, [field]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.role.trim()) {
            setMessage({ type: 'error', text: 'Role is required' });
            return;
        }
        if (!formData.location.trim()) {
            setMessage({ type: 'error', text: 'Location is required' });
            return;
        }
        if (!formData.application_close_date) {
            setMessage({ type: 'error', text: 'Application close date is required' });
            return;
        }
        // Validate LPA based on job type
        if (formData.job_type === 'unpaid') {
            // For unpaid jobs, LPA should be 0
            if (formData.job_package_lpa !== 0) {
                setMessage({ type: 'error', text: 'Job package for unpaid positions must be 0' });
                return;
            }
        } else {
            // For full_time and internship, LPA must be greater than 0
        if (formData.job_package_lpa <= 0) {
                setMessage({ type: 'error', text: 'Job package must be greater than 0 for paid positions' });
            return;
            }
        }
        if (!formData.jd_file) {
            setMessage({ type: 'error', text: 'Job description file is required' });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('role', formData.role);
            formDataToSend.append('location', formData.location);
            formDataToSend.append('number_of_openings', formData.number_of_openings.toString());
            formDataToSend.append('application_close_date', formData.application_close_date);
            formDataToSend.append('job_package_lpa', formData.job_package_lpa.toString());
            formDataToSend.append('job_type', formData.job_type);
            formDataToSend.append('notes', formData.notes);
            formDataToSend.append('jd_file', formData.jd_file);

            const res = await authenticatedFetch(
                API_ENDPOINTS.ORGANIZATION_JOBPOST,
                {
                    method: 'POST',
                    body: formDataToSend
                },
                navigate
            );

            if (!res) return;

            if (res.ok) {
                const result = await res.json();
                setMessage({ type: 'success', text: 'Job posting created successfully!' });
                setShowForm(false);
                // Reset form
                setFormData({
                    role: '',
                    location: '',
                    number_of_openings: 1,
                    application_close_date: '',
                    job_package_lpa: 0,
                    job_type: 'full_time',
                    notes: '',
                    jd_file: null
                });
                // Refresh jobs list
                fetchAllJobs();
            } else {
                const error = await res.json();
                setMessage({ type: 'error', text: error.detail || 'Failed to create job posting' });
            }
        } catch (err) {
            console.error('Failed to create job post:', err);
            setMessage({ type: 'error', text: 'Error creating job posting' });
        } finally {
            setLoading(false);
        }
    };

    const handleViewApplicants = (job: JobPost, filterStatus?: string) => {
        setSelectedJobForApplicants(job);
        setApplicantFilterStatus(filterStatus || null);
        setShowApplicantsModal(true);
    };

    const handleCloseApplicantsModal = () => {
        setShowApplicantsModal(false);
        setSelectedJobForApplicants(null);
        setApplicantFilterStatus(null);
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

    const handleCloseJob = async (jobId: string) => {
        if (!confirm('Are you sure you want to close this job posting? This action cannot be undone.')) {
            return;
        }

        setMessage(null);

        try {
            const res = await authenticatedFetch(
                `${API_ENDPOINTS.ORGANIZATION_JOBPOST}/${jobId}/close`,
                { method: 'PUT' },
                navigate
            );

            if (!res) return;

            if (res.ok) {
                setMessage({ type: 'success', text: 'Job posting closed successfully!' });
                // Refresh jobs list after closing
                await fetchAllJobs();
            } else {
                const error = await res.json();
                setMessage({ type: 'error', text: error.detail || 'Failed to close job posting' });
            }
        } catch (err) {
            console.error('Failed to close job:', err);
            setMessage({ type: 'error', text: 'Error closing job posting' });
        }
    };

    const handleManageJobStatus = async () => {
        setLoading(true);
        setMessage(null);

        try {
            const res = await fetch(API_ENDPOINTS.ADMIN_MANAGE_JOB_STATUS, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (res.ok) {
                const result = await res.json();
                setMessage({ type: 'success', text: result.message });
                // Refresh jobs list
                fetchAllJobs();
            } else {
                setMessage({ type: 'error', text: 'Failed to update job statuses' });
            }
        } catch (err) {
            console.error('Failed to manage job status:', err);
            setMessage({ type: 'error', text: 'Error updating job statuses' });
        } finally {
            setLoading(false);
        }
    };


    if (loading && jobs.open.length === 0 && jobs.ongoing.length === 0 && jobs.closed.length === 0) {
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
                    <p style={{ color: '#475569', fontSize: '16px', fontWeight: '500' }}>Loading job postings...</p>
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
                            <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff', margin: 0, lineHeight: '1.2' }}>Job Postings</h1>
                            <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.9)', margin: '2px 0 0 0' }}>Manage your job openings</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => navigate('/organization-profile')}
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
                            onClick={() => navigate('/organization-team')}
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
                            Teams
                        </button>
                        <button
                            onClick={() => setShowForm(!showForm)}
                            style={{ 
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 20px',
                                borderRadius: '8px',
                                fontWeight: '500',
                                fontSize: '14px',
                                color: '#ffffff',
                                background: '#2563eb',
                                border: 'none',
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
                                transition: 'all 0.15s ease',
                                transform: 'translateY(0)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#1d4ed8';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.5)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#2563eb';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.4)';
                            }}
                        >
                            <Plus style={{ width: '16px', height: '16px' }} />
                            Post Job
                        </button>
                        <button
                            onClick={handleManageJobStatus}
                            style={{ 
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 14px',
                                borderRadius: '8px',
                                fontWeight: '500',
                                fontSize: '13px',
                                color: '#ffffff',
                                background: '#16a34a',
                                border: 'none',
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(22, 163, 74, 0.3)',
                                transition: 'all 0.15s ease',
                                transform: 'translateY(0)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#15803d';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#16a34a';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                            title="Move expired jobs to ongoing"
                        >
                            🔄 Update Status
                        </button>
                        <button
                            onClick={handleLogout}
                            style={{ 
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 14px',
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

            {/* Job Posting Form */}
            {showForm && (
                <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px' }}>
                    <div style={{ 
                        background: '#ffffff', 
                        borderRadius: '16px', 
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)', 
                        border: '1px solid #e2e8f0',
                        overflow: 'hidden'
                    }}>
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between', 
                            padding: '24px',
                            borderBottom: '1px solid #e2e8f0',
                            background: 'linear-gradient(to right, #6366f1, #8b5cf6)'
                        }}>
                            <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#ffffff', margin: 0 }}>Create Job Posting</h2>
                            <button
                                onClick={() => setShowForm(false)}
                                style={{ 
                                    padding: '8px', 
                                    background: 'rgba(255, 255, 255, 0.2)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                            >
                                <X style={{ width: '20px', height: '20px', color: '#ffffff' }} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                                {/* Role */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#475569', marginBottom: '8px' }}>
                                        Job Role *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.role}
                                        onChange={(e) => handleInputChange('role', e.target.value)}
                                        style={{ 
                                            width: '100%', 
                                            padding: '10px 14px', 
                                            border: '1px solid #cbd5e1', 
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            outline: 'none',
                                            transition: 'all 0.15s ease',
                                            boxSizing: 'border-box'
                                        }}
                                        onFocus={(e) => {
                                            e.currentTarget.style.borderColor = '#2563eb';
                                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                                        }}
                                        onBlur={(e) => {
                                            e.currentTarget.style.borderColor = '#cbd5e1';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                        placeholder="e.g., Software Engineer"
                                        required
                                    />
                                </div>

                                {/* Location */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#475569', marginBottom: '8px' }}>
                                        Location *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={(e) => handleInputChange('location', e.target.value)}
                                        style={{ 
                                            width: '100%', 
                                            padding: '10px 14px', 
                                            border: '1px solid #cbd5e1', 
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            outline: 'none',
                                            transition: 'all 0.15s ease',
                                            boxSizing: 'border-box'
                                        }}
                                        onFocus={(e) => {
                                            e.currentTarget.style.borderColor = '#2563eb';
                                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                                        }}
                                        onBlur={(e) => {
                                            e.currentTarget.style.borderColor = '#cbd5e1';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                        placeholder="e.g., Bangalore, India"
                                        required
                                    />
                                </div>

                                {/* Number of Openings */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#475569', marginBottom: '8px' }}>
                                        Number of Openings *
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.number_of_openings}
                                        onChange={(e) => handleInputChange('number_of_openings', parseInt(e.target.value) || 1)}
                                        style={{ 
                                            width: '100%', 
                                            padding: '10px 14px', 
                                            border: '1px solid #cbd5e1', 
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            outline: 'none',
                                            transition: 'all 0.15s ease',
                                            boxSizing: 'border-box'
                                        }}
                                        onFocus={(e) => {
                                            e.currentTarget.style.borderColor = '#2563eb';
                                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                                        }}
                                        onBlur={(e) => {
                                            e.currentTarget.style.borderColor = '#cbd5e1';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                        required
                                    />
                                </div>

                                {/* Application Close Date */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#475569', marginBottom: '8px' }}>
                                        Application Close Date *
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.application_close_date}
                                        onChange={(e) => handleInputChange('application_close_date', e.target.value)}
                                        style={{ 
                                            width: '100%', 
                                            padding: '10px 14px', 
                                            border: '1px solid #cbd5e1', 
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            outline: 'none',
                                            transition: 'all 0.15s ease',
                                            boxSizing: 'border-box'
                                        }}
                                        onFocus={(e) => {
                                            e.currentTarget.style.borderColor = '#2563eb';
                                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                                        }}
                                        onBlur={(e) => {
                                            e.currentTarget.style.borderColor = '#cbd5e1';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                        required
                                    />
                                </div>

                                {/* Job Package */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#475569', marginBottom: '8px' }}>
                                        Job Package (LPA) * {formData.job_type === 'unpaid' && <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '400' }}>(Auto-set to 0 for unpaid)</span>}
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        value={formData.job_package_lpa}
                                        onChange={(e) => handleInputChange('job_package_lpa', parseFloat(e.target.value) || 0)}
                                        disabled={formData.job_type === 'unpaid'}
                                        style={{ 
                                            width: '100%', 
                                            padding: '10px 14px', 
                                            border: '1px solid #cbd5e1', 
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            outline: 'none',
                                            transition: 'all 0.15s ease',
                                            boxSizing: 'border-box',
                                            background: formData.job_type === 'unpaid' ? '#f1f5f9' : '#ffffff',
                                            cursor: formData.job_type === 'unpaid' ? 'not-allowed' : 'text',
                                            color: formData.job_type === 'unpaid' ? '#94a3b8' : '#1e293b'
                                        }}
                                        onFocus={(e) => {
                                            if (formData.job_type !== 'unpaid') {
                                                e.currentTarget.style.borderColor = '#2563eb';
                                                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                                            }
                                        }}
                                        onBlur={(e) => {
                                            e.currentTarget.style.borderColor = '#cbd5e1';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                        placeholder={formData.job_type === 'unpaid' ? '0 (Unpaid)' : 'e.g., 4.5'}
                                        required
                                    />
                                    {formData.job_type !== 'unpaid' && (
                                        <p style={{ fontSize: '12px', color: '#64748b', margin: '6px 0 0 0' }}>
                                            Enter the annual package for this position
                                        </p>
                                    )}
                                </div>

                                {/* Job Type */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#475569', marginBottom: '8px' }}>
                                        Job Type *
                                    </label>
                                    <select
                                        value={formData.job_type}
                                        onChange={(e) => handleInputChange('job_type', e.target.value)}
                                        style={{ 
                                            width: '100%', 
                                            padding: '10px 14px', 
                                            border: '1px solid #cbd5e1', 
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            outline: 'none',
                                            transition: 'all 0.15s ease',
                                            boxSizing: 'border-box',
                                            background: '#ffffff'
                                        }}
                                        onFocus={(e) => {
                                            e.currentTarget.style.borderColor = '#2563eb';
                                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                                        }}
                                        onBlur={(e) => {
                                            e.currentTarget.style.borderColor = '#cbd5e1';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                        required
                                    >
                                        <option value="full_time">Full Time</option>
                                        <option value="internship">Internship</option>
                                        <option value="unpaid">Unpaid</option>
                                    </select>
                                    <p style={{ fontSize: '12px', color: '#64748b', margin: '6px 0 0 0' }}>
                                        {formData.job_type === 'unpaid' ? '💡 Package will be set to 0 LPA' : '💰 Package must be specified for paid positions'}
                                    </p>
                                </div>
                            </div>

                            {/* Job Description File */}
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#475569', marginBottom: '8px' }}>
                                    Job Description File *
                                </label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                                    <input
                                        type="file"
                                        accept=".pdf,.doc,.docx"
                                        onChange={handleFileChange}
                                        style={{ display: 'none' }}
                                        id="jd-file"
                                        required
                                    />
                                    <label
                                        htmlFor="jd-file"
                                        style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '8px', 
                                            padding: '10px 16px', 
                                            background: 'linear-gradient(to bottom right, #f1f5f9, #e2e8f0)',
                                            color: '#475569',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            border: '1px solid #cbd5e1',
                                            fontWeight: '500',
                                            fontSize: '14px',
                                            transition: 'all 0.15s ease'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(to bottom right, #e2e8f0, #cbd5e1)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(to bottom right, #f1f5f9, #e2e8f0)'}
                                    >
                                        <Upload style={{ width: '16px', height: '16px' }} />
                                        Choose File
                                    </label>
                                    {formData.jd_file && (
                                        <span style={{ 
                                            fontSize: '14px', 
                                            color: '#16a34a',
                                            fontWeight: '500',
                                            padding: '6px 12px',
                                            background: '#dcfce7',
                                            borderRadius: '6px',
                                            border: '1px solid #86efac'
                                        }}>
                                            ✓ {formData.jd_file.name}
                                        </span>
                                    )}
                                </div>
                                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '8px 0 0 0' }}>
                                    Supported formats: PDF, DOC, DOCX
                                </p>
                            </div>

                            {/* Notes */}
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#475569', marginBottom: '8px' }}>
                                    Additional Notes
                                </label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => handleInputChange('notes', e.target.value)}
                                    style={{ 
                                        width: '100%', 
                                        padding: '12px 14px', 
                                        border: '1px solid #cbd5e1', 
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        outline: 'none',
                                        transition: 'all 0.15s ease',
                                        boxSizing: 'border-box',
                                        resize: 'vertical',
                                        fontFamily: 'inherit',
                                        lineHeight: '1.5'
                                    }}
                                    onFocus={(e) => {
                                        e.currentTarget.style.borderColor = '#2563eb';
                                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                                    }}
                                    onBlur={(e) => {
                                        e.currentTarget.style.borderColor = '#cbd5e1';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                    rows={4}
                                    placeholder="Any additional information about the job..."
                                />
                            </div>

                            {/* Submit Button */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    disabled={loading}
                                    style={{ 
                                        padding: '10px 20px',
                                        color: '#475569',
                                        background: '#ffffff',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '8px',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.15s ease',
                                        fontWeight: '500',
                                        fontSize: '14px',
                                        opacity: loading ? 0.5 : 1
                                    }}
                                    onMouseEnter={(e) => !loading && (e.currentTarget.style.background = '#f1f5f9')}
                                    onMouseLeave={(e) => !loading && (e.currentTarget.style.background = '#ffffff')}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '8px', 
                                        padding: '10px 24px',
                                        background: loading ? '#94a3b8' : 'linear-gradient(to bottom right, #2563eb, #1d4ed8)',
                                        color: '#ffffff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        opacity: loading ? 0.7 : 1,
                                        transition: 'all 0.15s ease',
                                        fontWeight: '600',
                                        fontSize: '14px',
                                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                                        transform: 'translateY(0)'
                                    }}
                                    onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')}
                                    onMouseLeave={(e) => !loading && (e.currentTarget.style.transform = 'translateY(0)')}
                                >
                                    {loading ? (
                                        <>
                                            <div style={{ 
                                                width: '16px', 
                                                height: '16px', 
                                                border: '2px solid white', 
                                                borderTop: '2px solid transparent', 
                                                borderRadius: '50%', 
                                                animation: 'spin 1s linear infinite' 
                                            }}></div>
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <Briefcase style={{ width: '16px', height: '16px' }} />
                                            Create Job Posting
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Content */}
            {!showForm && (
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
                    {/* Tabs */}
                    <div style={{ marginBottom: '24px' }}>
                        <div style={{ borderBottom: '2px solid #e2e8f0' }}>
                            <nav style={{ display: 'flex', gap: '32px', marginBottom: '-2px', flexWrap: 'wrap' }}>
                                {[
                                    { id: 'open', label: 'Open Jobs', count: jobs.open.length },
                                    { id: 'ongoing', label: 'Ongoing Jobs', count: jobs.ongoing.length },
                                    { id: 'closed', label: 'Closed Jobs', count: jobs.closed.length }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        style={{ 
                                            padding: '12px 4px',
                                            fontWeight: '600',
                                            fontSize: '15px',
                                            color: activeTab === tab.id ? '#2563eb' : '#64748b',
                                            background: 'none',
                                            border: 'none',
                                            borderBottom: activeTab === tab.id ? '3px solid #2563eb' : '3px solid transparent',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s ease',
                                            whiteSpace: 'nowrap'
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
                    <div key={activeTab}>
                    {(() => {
                        const currentJobs = jobs[activeTab] || [];
                        return currentJobs.length === 0 ? (
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
                                <h3 style={{ fontSize: '24px', fontWeight: '600', color: '#1e293b', margin: '0 0 8px 0' }}>
                                    No {activeTab} job postings
                                </h3>
                                <p style={{ color: '#64748b', margin: '0 0 32px 0', fontSize: '15px' }}>
                                    {activeTab === 'open' && "Create job postings to attract talented candidates"}
                                    {activeTab === 'ongoing' && "Jobs with expired deadlines will appear here"}
                                    {activeTab === 'closed' && "Closed job postings will appear here"}
                                </p>
                                {activeTab === 'open' && (
                                    <button
                                        onClick={() => setShowForm(true)}
                                        style={{ 
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            background: 'linear-gradient(to bottom right, #2563eb, #1d4ed8)',
                                            color: '#ffffff',
                                            padding: '14px 28px',
                                            borderRadius: '10px',
                                            fontWeight: '600',
                                            fontSize: '15px',
                                            border: 'none',
                                            cursor: 'pointer',
                                            boxShadow: '0 4px 16px rgba(37, 99, 235, 0.4)',
                                            transition: 'all 0.2s ease',
                                            transform: 'translateY(0)'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-3px)';
                                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(37, 99, 235, 0.5)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 4px 16px rgba(37, 99, 235, 0.4)';
                                        }}
                                    >
                                        <Plus style={{ width: '20px', height: '20px' }} />
                                        Create Your First Job Posting
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', 
                                gap: '24px' 
                            }}>
                                {currentJobs.map((job) => (
                                    <JobCard
                                        key={job.job_id}
                                        job={job}
                                        status={activeTab}
                                        onClose={activeTab === 'ongoing' ? handleCloseJob : undefined}
                                        onViewApplicants={handleViewApplicants}
                                    />
                                ))}
                            </div>
                        );
                    })()}
                    </div>
                </div>
            )}

            {/* Applicants Modal */}
            <ApplicantsModal
                job={selectedJobForApplicants}
                isOpen={showApplicantsModal}
                onClose={handleCloseApplicantsModal}
                filterStatus={applicantFilterStatus}
            />

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
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
            `}</style>
        </div>
    );
}
