import React, { useState, useEffect } from 'react';
import {
    Briefcase, MapPin, Users, Calendar, DollarSign, FileText,
    ArrowLeft, UserCheck, X
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { authenticatedFetch } from '../utils/auth';
import { API_ENDPOINTS, API_BASE_URL } from '../config/api';

interface JobPost {
    job_id: string;
    company: { name: string; email: string };
    role: string;
    file_path: string;
    location: string;
    number_of_openings: number;
    application_close_date: string;
    job_package_lpa: number;
    job_type: string;
    notes: string;
    created_at: string;
    job_status?: 'open' | 'ongoing' | 'closed';
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

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        const storedUser = localStorage.getItem('user');
        if (!token) {
            navigate('/');
            return;
        }
        if (storedUser) {
            const parsed = JSON.parse(storedUser);
            if (parsed.user_type !== 'user') {
                navigate('/');
                return;
            }
            setUserData(parsed);
        }
        if (!jobId) {
            setError('Invalid job');
            setLoading(false);
            return;
        }
        const fetchJob = async () => {
            try {
                const res = await authenticatedFetch(
                    API_ENDPOINTS.GET_JOB(jobId),
                    { method: 'GET' },
                    navigate
                );
                if (res === null) {
                    setLoading(false);
                    return;
                }
                if (!res.ok) {
                    if (res.status === 404) setError('Job not found');
                    else setError('Failed to load job');
                    setLoading(false);
                    return;
                }
                const data = await res.json();
                setJob(data.job || null);
                if (data.user_has_applied === true) setApplied(true);
                if (!data.job) setError('Job not found');
            } catch (err) {
                console.error(err);
                setError('Failed to load job');
            } finally {
                setLoading(false);
            }
        };
        fetchJob();
    }, [jobId, navigate]);

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

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #f8fafc, #e0f2fe)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '48px', height: '48px', border: '4px solid #2563eb', borderTop: '4px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                    <p style={{ color: '#475569', fontSize: '16px', fontWeight: '500' }}>Loading job...</p>
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
    const jdUrl = job.file_path ? (job.file_path.startsWith('http') ? job.file_path : `${API_BASE_URL}${job.file_path.startsWith('/') ? '' : '/'}${job.file_path}`) : '';
    const isPdf = (job.file_path || '').toLowerCase().endsWith('.pdf');
    const applicationsOpen = job.job_status === 'open';

    return (
        <>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #f8fafc, #dbeafe)', paddingBottom: '80px' }}>
                {/* Header */}
                <div style={{ background: 'linear-gradient(to right, #6366f1, #8b5cf6)', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <button
                            onClick={() => navigate('/jobs')}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 500, cursor: 'pointer', fontSize: '14px' }}
                        >
                            <ArrowLeft style={{ width: '18px', height: '18px' }} /> Back to Jobs
                        </button>
                        <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#ffffff', margin: 0 }}>Job Details</h1>
                        <div style={{ width: '100px' }} />
                    </div>
                </div>

                <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
                    {message && (
                        <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '8px', background: message.type === 'success' ? '#f0fdf4' : '#fef2f2', color: message.type === 'success' ? '#166534' : '#991b1b', border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}` }}>
                            {message.text}
                        </div>
                    )}

                    <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                        <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9' }}>
                            <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>Job ID: {job.job_id}</p>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                                <div>
                                    <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1e293b', margin: '0 0 8px 0' }}>{job.role}</h2>
                                    <p style={{ color: '#64748b', margin: '0 0 4px 0', fontSize: '16px', fontWeight: '500' }}>{job.company.name}</p>
                                    <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>{job.company.email}</p>
                                </div>
                                <span style={{ display: 'inline-flex', alignItems: 'center', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', background: typeColors.bg, color: typeColors.color, border: `1px solid ${typeColors.border}` }}>
                                    {getJobTypeLabel(job.job_type)}
                                </span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <MapPin style={{ width: '18px', height: '18px', color: '#64748b' }} />
                                    <span style={{ fontSize: '15px', color: '#475569' }}>{job.location}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Users style={{ width: '18px', height: '18px', color: '#64748b' }} />
                                    <span style={{ fontSize: '15px', color: '#475569' }}>{job.number_of_openings} opening(s)</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Calendar style={{ width: '18px', height: '18px', color: '#64748b' }} />
                                    <span style={{ fontSize: '15px', color: '#475569' }}>Apply by: {formatDate(job.application_close_date)}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <DollarSign style={{ width: '18px', height: '18px', color: '#64748b' }} />
                                    <span style={{ fontSize: '15px', color: '#475569', fontWeight: '600' }}>{job.job_package_lpa} LPA</span>
                                </div>
                            </div>
                            <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '16px', marginBottom: 0 }}>Posted {formatDate(job.created_at)}</p>
                            {job.notes && (
                                <div style={{ marginTop: '16px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <p style={{ fontSize: '14px', color: '#475569', margin: 0, lineHeight: 1.6 }}>{job.notes}</p>
                                </div>
                            )}
                        </div>

                        {/* JD Section */}
                        {job.file_path && (
                            <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FileText style={{ width: '20px', height: '20px', color: '#2563eb' }} /> Job Description
                                </h3>
                                {isPdf && jdUrl ? (
                                    <iframe
                                        src={jdUrl}
                                        title="Job Description PDF"
                                        style={{ width: '100%', height: '600px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc' }}
                                    />
                                ) : (
                                    <a href={jdUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '15px', color: '#2563eb', fontWeight: '500', textDecoration: 'none' }}>
                                        View Job Description (opens in new tab)
                                    </a>
                                )}
                            </div>
                        )}

                        {/* Apply at end */}
                        <div style={{ padding: '24px' }}>
                            {applied ? (
                                <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', color: '#166534', fontWeight: '500' }}>
                                    Job applied.
                                </div>
                            ) : !applicationsOpen ? (
                                <div style={{ padding: '16px', background: '#fef3c7', borderRadius: '8px', border: '1px solid #fcd34d', color: '#92400e', fontWeight: '500' }}>
                                    Applications are closed for this position.
                                </div>
                            ) : (
                                <button
                                    onClick={() => { setFormError(null); setShowApplyForm(true); }}
                                    disabled={processing}
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '8px', border: 'none',
                                        background: 'linear-gradient(to bottom right, #2563eb, #1d4ed8)', color: '#fff', fontWeight: '600', fontSize: '16px', cursor: processing ? 'not-allowed' : 'pointer',
                                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                                    }}
                                >
                                    <UserCheck style={{ width: '20px', height: '20px' }} /> Apply for this job
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

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
