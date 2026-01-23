import React, { useState, useEffect } from 'react';
import {
    Pencil, Save, X, Upload, CheckCircle, MapPin, Mail, Phone,
    Briefcase, Globe, Users, Building2, Calendar, FileText, LogOut, Linkedin, Trash2, CreditCard
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authenticatedFetch, clearAuthAndRedirect } from '../utils/auth';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';

// --- Types ---

interface Employee {
    name: string;
    role: string;
    resumeFile?: File | null;
    resumeUrl?: string;
    parsedResumeData?: any; // Store parsed resume data
}

interface OrganizationProfileData {
    // Basic Info
    companyName: string;
    industry: string;
    companySize: string;
    foundedYear: string;
    website: string;
    email: string;
    phone: string;
    location: string;

    // Description
    description: string;

    // Logo
    logo: File | null;
    logoUrl: string;

    // Social Links
    linkedinUrl: string;
    twitterUrl: string;

    // Employees
    employees: Employee[];
}

// --- Initial Data ---

const INITIAL_DATA: OrganizationProfileData = {
    companyName: "",
    industry: "Technology",
    companySize: "1-10",
    foundedYear: new Date().getFullYear().toString(),
    website: "",
    email: "",
    phone: "",
    location: "",
    description: "",
    logo: null,
    logoUrl: "",
    linkedinUrl: "",
    twitterUrl: "",
    employees: []
};

// --- Helper Components ---

const SectionCard = ({
    title,
    icon: Icon,
    children
}: {
    title?: string;
    icon?: any;
    children: React.ReactNode;
}) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div 
            style={{
                background: '#ffffff',
                borderRadius: '12px',
                boxShadow: isHovered ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                border: '1px solid #e2e8f0',
                marginBottom: '24px',
                overflow: 'hidden',
                transition: 'box-shadow 0.3s ease'
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {title && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 24px',
                    borderBottom: '1px solid #f1f5f9',
                    background: 'linear-gradient(to right, #f8fafc, #ffffff)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {Icon && <Icon style={{ width: '20px', height: '20px', color: '#2563eb' }} />}
                        <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>{title}</h2>
                    </div>
                </div>
            )}
            <div style={{ padding: '24px' }}>
                {children}
            </div>
        </div>
    );
};

// --- Validation Functions ---

const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validatePhone = (phone: string) => {
    return /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/.test(phone);
};

const validateUrl = (url: string) => {
    if (!url) return true;
    return /^https?:\/\/.+/.test(url);
};

const validateYear = (year: string) => {
    const yearNum = parseInt(year);
    const currentYear = new Date().getFullYear();
    return yearNum >= 1800 && yearNum <= currentYear;
};

// --- Main Component ---

export function OrganizationProfile() {
    const navigate = useNavigate();
    const [data, setData] = useState<OrganizationProfileData>(INITIAL_DATA);
    const [members, setMembers] = useState<any[]>([]);
    const [inviteForm, setInviteForm] = useState({ name: '', email: '' });
    const [inviteList, setInviteList] = useState<Array<{ name: string; email: string }>>([]);
    const [isOwner, setIsOwner] = useState(true);
    const [credits, setCredits] = useState<number>(0);
    const [showBuyCreditsModal, setShowBuyCreditsModal] = useState(false);
    const [numCreditsToBuy, setNumCreditsToBuy] = useState<number>(1);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [paymentHistory, setPaymentHistory] = useState<Array<{
        id: string;
        amount: number;
        currency: string;
        num_credits: number;
        description: string;
        created_at: string;
    }>>([]);

    useEffect(() => {
        // Check if we're returning from a payment (check URL params or localStorage flag)
        const urlParams = new URLSearchParams(window.location.search);
        const paymentSuccess = urlParams.get('payment_success') === 'true' || localStorage.getItem('payment_success') === 'true';
        if (paymentSuccess) {
            localStorage.removeItem('payment_success');
            // Remove the query param from URL
            window.history.replaceState({}, '', window.location.pathname);
        }
        
        // Check authentication
        const token = localStorage.getItem('access_token');
        const userData = localStorage.getItem('user');

        if (!token) {
            navigate('/auth');
            return;
        }

        // Check if user is actually an organization (not user)
        if (userData) {
            const parsedUser = JSON.parse(userData);
            if (parsedUser.user_type !== 'organization') {
                navigate('/user-profile');
                return;
            }
            setData(prev => ({ ...prev, email: parsedUser.email, companyName: parsedUser.name || prev.companyName }));
            setIsOwner(!parsedUser.is_org_member || parsedUser.role === 'owner');
        }

        // Fetch profile data
        const fetchProfile = async () => {
            try {
                const res = await authenticatedFetch(
                    API_ENDPOINTS.ORGANIZATION_PROFILE,
                    {
                        method: 'GET'
                    },
                    navigate
                );

                if (!res) {
                    // Already redirected by authenticatedFetch
                    return;
                }

                if (res.ok) {
                    const result = await res.json();
                    if (result.profile) {
                        // Map backend fields to frontend fields
                        const mappedData = {
                            companyName: result.profile.name || '',
                            email: result.profile.email || '',
                            logoUrl: result.profile.logo_path || '',
                            industry: result.profile.category || 'Technology',
                            companySize: result.profile.company_size || '1-10',
                            foundedYear: result.profile.founded || new Date().getFullYear().toString(),
                            website: result.profile.website || '',
                            phone: result.profile.number || '',
                            location: result.profile.location || '',
                            description: result.profile.about_company || '',
                            linkedinUrl: result.profile.linkedin_link || '',
                            twitterUrl: result.profile.instagram_link || '',
                            logo: null,
                            employees: (result.profile.employees_details || []).map((emp: any) => ({
                                name: emp.name || '',
                                role: emp.role || '',
                                resumeUrl: emp.resume_url || '',
                                parsedResumeData: emp.parsed_resume_data || null
                            }))
                        };
                        setData(prev => ({ ...prev, ...mappedData }));
                    }
                } else if (res.status === 401) {
                    // Unauthorized - redirect to auth
                    clearAuthAndRedirect(navigate);
                }
            } catch (err) {
                console.error("Failed to fetch profile:", err);
                clearAuthAndRedirect(navigate);
            }
        };

        fetchProfile();
        
        // Fetch members if owner
        const fetchMembers = async () => {
            try {
                const userData = localStorage.getItem('user');
                if (userData) {
                    const parsedUser = JSON.parse(userData);
                    if (parsedUser.is_org_member && parsedUser.role !== 'owner') {
                        return; // Members can't view members list
                    }
                }
                
                const res = await authenticatedFetch(
                    API_ENDPOINTS.ORGANIZATION_MEMBERS,
                    { method: 'GET' },
                    navigate
                );
                if (res?.ok) {
                    const result = await res.json();
                    setMembers(result.members || []);
                }
            } catch (err) {
                console.error('Failed to fetch members:', err);
            }
        };
        
        fetchMembers();
        
        // Fetch credits and payment history
        const fetchCredits = async () => {
            try {
                const res = await authenticatedFetch(
                    API_ENDPOINTS.ORGANIZATION_CREDITS,
                    { method: 'GET' },
                    navigate
                );
                if (res?.ok) {
                    const result = await res.json();
                    setCredits(result.credits || 0);
                }
            } catch (err) {
                console.error('Failed to fetch credits:', err);
            }
        };
        
        const fetchPaymentHistory = async () => {
            // Only fetch payment history if user is owner
            const userData = localStorage.getItem('user');
            if (userData) {
                const parsedUser = JSON.parse(userData);
                const userIsOwner = !parsedUser.is_org_member || parsedUser.role === 'owner';
                if (!userIsOwner) {
                    setPaymentHistory([]);
                    return;
                }
            }
            
            try {
                const res = await authenticatedFetch(
                    API_ENDPOINTS.PAYMENT_HISTORY,
                    { method: 'GET' },
                    navigate
                );
                if (res?.ok) {
                    const result = await res.json();
                    console.log('📊 Payment history fetched:', {
                        total: result.total_transactions,
                        transactions: result.transactions?.length || 0,
                        data: result.transactions
                    });
                    setPaymentHistory(result.transactions || []);
                } else {
                    const errorData = await res?.json().catch(() => ({}));
                    console.error('❌ Failed to fetch payment history:', {
                        status: res?.status,
                        error: errorData
                    });
                    // Still set empty array to show "no transactions" message
                    setPaymentHistory([]);
                }
            } catch (err) {
                console.error('❌ Error fetching payment history:', err);
                // Still set empty array to show "no transactions" message
                setPaymentHistory([]);
            }
        };
        
        // Fetch credits and payment history
        const fetchAll = async () => {
            await Promise.all([
                fetchCredits(),
                fetchPaymentHistory()
            ]);
        };
        
        fetchAll();
        
        // If returning from payment, refresh immediately
        if (paymentSuccess) {
            setTimeout(() => {
                fetchAll();
            }, 1000);
        }
        
        // Refresh payment history when component becomes visible (e.g., returning from payment page)
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                fetchAll();
            }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [navigate]);

    const [isEditMode, setIsEditMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        
        if (data.phone && !validatePhone(data.phone)) {
            newErrors.phone = "Please enter a valid phone number";
        }
        if (data.website && !validateUrl(data.website)) {
            newErrors.website = "Please enter a valid URL starting with http:// or https://";
        }
        if (data.linkedinUrl && !validateUrl(data.linkedinUrl)) {
            newErrors.linkedinUrl = "Please enter a valid URL starting with http:// or https://";
        }
        if (data.twitterUrl && !validateUrl(data.twitterUrl)) {
            newErrors.twitterUrl = "Please enter a valid URL starting with http:// or https://";
        }
        if (data.foundedYear && !validateYear(data.foundedYear)) {
            newErrors.foundedYear = "Please enter a valid year";
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const saveToBackend = async (dataToSave: OrganizationProfileData) => {
        setLoading(true);
        setMessage(null);
        try {
            // Ensure we store only the relative path (e.g., /static/uploads/...)
            const logoPath = dataToSave.logoUrl
                ? dataToSave.logoUrl.replace(/^https?:\/\/[^/]+/, '')
                : '';

            // Map frontend fields to backend schema
            const employeesForBackend = (dataToSave.employees || []).map(emp => ({
                name: emp.name,
                role: emp.role,
                resume_url: emp.resumeUrl || '',
                parsed_resume_data: emp.parsedResumeData || null
            }));

            const backendData = {
                name: dataToSave.companyName,
                email: dataToSave.email,
                logo_path: logoPath,
                category: dataToSave.industry,
                company_size: dataToSave.companySize,
                website: dataToSave.website,
                number: dataToSave.phone,
                founded: dataToSave.foundedYear,
                location: dataToSave.location,
                about_company: dataToSave.description,
                linkedin_link: dataToSave.linkedinUrl,
                instagram_link: dataToSave.twitterUrl,
                employees_details: employeesForBackend
            };

            const res = await authenticatedFetch(
                API_ENDPOINTS.ORGANIZATION_PROFILE,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(backendData)
                },
                navigate
            );

            if (!res) {
                // Already redirected by authenticatedFetch
                return false;
            }

            if (res.ok) {
                setMessage({ type: 'success', text: 'Profile saved successfully!' });
                return true;
            } else {
                setMessage({ type: 'error', text: 'Failed to save profile' });
                return false;
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Error saving profile' });
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!validateForm()) {
            setMessage({ type: 'error', text: 'Please fix validation errors before saving' });
            return;
        }

        setLoading(true);
        setMessage(null);
        
        let newData = { ...data };

        // Handle logo upload if a new file was selected
        if (data.logo instanceof File) {
            try {
                const formData = new FormData();
                formData.append('file', data.logo);

                const uploadRes = await authenticatedFetch(
                    API_ENDPOINTS.UPLOAD,
                    {
                        method: 'POST',
                        body: formData
                    },
                    navigate
                );

                if (!uploadRes) {
                    setLoading(false);
                    return;
                }

                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    newData.logoUrl = uploadData.url;
                    newData.logo = null; // Clear file object after upload
                } else {
                    console.error("Upload failed");
                    setMessage({ type: 'error', text: 'Failed to upload logo' });
                    setLoading(false);
                    return;
                }
            } catch (err) {
                console.error("Upload error", err);
                setMessage({ type: 'error', text: 'Error uploading logo' });
                setLoading(false);
                return;
            }
        }

        // Handle employee resume uploads and parsing (one by one) - ONLY when saving
        const employeesWithFiles = data.employees.filter((emp, idx) => emp.resumeFile instanceof File);
        
        if (employeesWithFiles.length > 0) {
            setMessage({ type: 'success', text: `Processing ${employeesWithFiles.length} resume(s)...` });
            
            // Process each employee one by one
            for (let i = 0; i < data.employees.length; i++) {
                const employee = data.employees[i];
                
                // If there's a file that hasn't been processed yet, process it now
                if (employee.resumeFile instanceof File) {
                    setMessage({ type: 'success', text: `Processing resume for ${employee.name || `Employee ${i + 1}`} (${i + 1}/${employeesWithFiles.length})...` });
                    
                    const result = await processEmployeeResume(i, employee.resumeFile);
                    
                    if (result) {
                        // Update employee data with URL and parsed data
                        newData.employees[i] = {
                            ...newData.employees[i],
                            resumeUrl: result.resumeUrl,
                            resumeFile: null,
                            parsedResumeData: result.parsedData || newData.employees[i].parsedResumeData || null
                        };
                    } else {
                        // If processing failed, keep the file so user can try again
                        setMessage({ type: 'error', text: `Failed to process resume for ${employee.name || `Employee ${i + 1}`}. Please try again.` });
                        // Don't update this employee, keep the file
                        continue;
                    }
                }
            }
            
            setMessage({ type: 'success', text: 'All resumes processed successfully!' });
        }

        // Create a clean copy for storage - remove File object
        const finalData = { ...newData };
        if (finalData.logo instanceof File) {
            // @ts-ignore
            finalData.logo = null;
        }
        
        // Prepare employees data for backend (remove File objects, keep parsed data)
        const employeesForBackend = finalData.employees.map(emp => ({
            name: emp.name,
            role: emp.role,
            resume_url: emp.resumeUrl || '',
            parsed_resume_data: emp.parsedResumeData || null
        }));

        setData(newData);
        const saved = await saveToBackend(finalData);
        
        if (saved) {
            setIsEditMode(false);
            setMessage({ type: 'success', text: 'Profile saved successfully!' });
            // Auto-hide success message after 3 seconds
            setTimeout(() => setMessage(null), 3000);
        }
        
        setLoading(false);
    };

    const processEmployeeResume = async (index: number, file: File): Promise<{ resumeUrl: string; parsedData: any } | null> => {
        try {
            // Step 1: Upload the file first to get the URL
            const uploadFormData = new FormData();
            uploadFormData.append('file', file);

            const uploadRes = await authenticatedFetch(
                API_ENDPOINTS.UPLOAD,
                {
                    method: 'POST',
                    body: uploadFormData
                },
                navigate
            );

            if (!uploadRes || !uploadRes.ok) {
                console.error("Resume upload failed for employee", index);
                return null;
            }

            const uploadData = await uploadRes.json();
            const resumeUrl = uploadData.url;

            // Step 2: Parse the resume using the uploaded file
            const parseFormData = new FormData();
            parseFormData.append('file', file);

            const parseRes = await authenticatedFetch(
                API_ENDPOINTS.PARSE_RESUME,
                {
                    method: 'POST',
                    body: parseFormData
                },
                navigate
            );

            // Step 3: Return URL and parsed data
            if (parseRes && parseRes.ok) {
                const result = await parseRes.json();
                return {
                    resumeUrl: resumeUrl,
                    parsedData: result.parsed_data
                };
            } else {
                // If parsing fails, still return the URL
                return {
                    resumeUrl: resumeUrl,
                    parsedData: null
                };
            }
        } catch (err) {
            console.error(`Error processing resume for employee ${index}:`, err);
            return null;
        }
    };

    const handleChange = (field: keyof OrganizationProfileData, value: any) => {
        setData(prev => ({ ...prev, [field]: value }));
        // Clear error for this field when user starts typing
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const addToInviteList = () => {
        if (!inviteForm.name || !inviteForm.email) {
            setMessage({ type: 'error', text: 'Please fill in both name and email' });
            return;
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(inviteForm.email)) {
            setMessage({ type: 'error', text: 'Please enter a valid email address' });
            return;
        }
        
        // Check if email already in list
        if (inviteList.some(item => item.email === inviteForm.email)) {
            setMessage({ type: 'error', text: 'This email is already in the invite list' });
            return;
        }
        
        setInviteList(prev => [...prev, { name: inviteForm.name, email: inviteForm.email }]);
        setInviteForm({ name: '', email: '' });
        setMessage(null);
    };

    const removeFromInviteList = (index: number) => {
        setInviteList(prev => prev.filter((_, i) => i !== index));
    };

    const handleInviteMembers = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (inviteList.length === 0) {
            setMessage({ type: 'error', text: 'Please add at least one member to invite' });
            return;
        }
        
        setLoading(true);
        setMessage(null);
        
        try {
            const res = await authenticatedFetch(
                API_ENDPOINTS.INVITE_MEMBERS_BULK,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ members: inviteList })
                },
                navigate
            );
            
            if (res?.ok) {
                const result = await res.json();
                const successCount = result.results?.success?.length || 0;
                const failedCount = result.results?.failed?.length || 0;
                
                if (failedCount > 0) {
                    const failedEmails = result.results.failed.map((f: any) => `${f.email} (${f.reason})`).join(', ');
                    setMessage({ 
                        type: 'error', 
                        text: `${successCount} invited, ${failedCount} failed: ${failedEmails}` 
                    });
                } else {
                    setMessage({ type: 'success', text: `Successfully invited ${successCount} member(s)!` });
                }
                
                setTimeout(() => setMessage(null), 5000);
                setInviteList([]);
                
                // Refresh members list
                const membersRes = await authenticatedFetch(
                    API_ENDPOINTS.ORGANIZATION_MEMBERS,
                    { method: 'GET' },
                    navigate
                );
                if (membersRes?.ok) {
                    const membersResult = await membersRes.json();
                    setMembers(membersResult.members || []);
                }
            } else {
                const error = await res?.json();
                setMessage({ type: 'error', text: error.detail || 'Failed to send invitations' });
            }
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to send invitations' });
        } finally {
            setLoading(false);
        }
    };

    const handleResendInvite = async (memberEmail: string) => {
        setLoading(true);
        setMessage(null);
        
        try {
            const res = await authenticatedFetch(
                API_ENDPOINTS.RESEND_INVITE,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ member_email: memberEmail })
                },
                navigate
            );
            
            if (res?.ok) {
                setMessage({ type: 'success', text: 'Invitation resent successfully!' });
                setTimeout(() => setMessage(null), 3000);
            } else {
                const error = await res?.json();
                setMessage({ type: 'error', text: error.detail || 'Failed to resend invitation' });
            }
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to resend invitation' });
        } finally {
            setLoading(false);
        }
    };

    const handleBuyCredits = async () => {
        if (numCreditsToBuy < 1) {
            setMessage({ type: 'error', text: 'Please select at least 1 credit' });
            return;
        }
        
        setPaymentLoading(true);
        setMessage(null);
        try {
            const res = await authenticatedFetch(
                API_ENDPOINTS.BUY_CREDITS,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ num_credits: numCreditsToBuy })
                },
                navigate
            );
            
            if (res?.ok) {
                const result = await res.json();
                if (result.approval_url) {
                    // Redirect to PayPal
                    window.location.href = result.approval_url;
                }
            } else {
                const error = await res?.json();
                setMessage({ type: 'error', text: error.detail || 'Failed to create payment order' });
                setPaymentLoading(false);
            }
        } catch (err) {
            console.error('Failed to buy credits:', err);
            setMessage({ type: 'error', text: 'Failed to initiate payment' });
            setPaymentLoading(false);
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

    // --- Render Functions ---

    const renderBasicInfo = () => {

        const labelStyle = {
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#334155',
            marginBottom: '8px'
        };

        const inputStyle = {
            width: '100%',
            padding: '10px 16px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            background: '#ffffff',
            fontSize: '14px',
            color: '#0f172a',
            transition: 'all 0.15s ease'
        };

        const inputDisabledStyle = {
            ...inputStyle,
            background: '#f1f5f9',
            color: '#64748b',
            cursor: 'not-allowed'
        };

        if (isEditMode) {
            return (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
                    gap: '24px'
                }}>
                    {/* Logo Section */}
                    <div style={{
                        gridColumn: '1 / -1',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        marginBottom: '16px'
                    }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            background: '#e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            position: 'relative'
                        }}>
                            {data.logoUrl ? (
                                <img 
                                    src={data.logoUrl.startsWith('http') ? data.logoUrl : `${API_BASE_URL}${data.logoUrl}`} 
                                    alt="Logo" 
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover'
                                    }}
                                />
                            ) : (
                                <Building2 style={{ width: '40px', height: '40px', color: '#94a3b8' }} />
                            )}
                        </div>
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: '500',
                                color: '#334155',
                                marginBottom: '4px'
                            }}>Company Logo</label>
                            <input
                                type="file"
                                accept="image/*"
                                style={{
                                    fontSize: '14px',
                                    color: '#64748b'
                                }}
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const url = URL.createObjectURL(file);
                                        setData(prev => ({ ...prev, logo: file, logoUrl: url }));
                                    }
                                }}
                            />
                        </div>
                    </div>

                    {/* Grid for inputs - now 2 columns on larger screens */}
                    <div style={{
                        gridColumn: '1 / -1',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
                        gap: '24px'
                    }}>
                        <div>
                            <label style={labelStyle}>Company Name <span style={{ color: '#dc2626' }}>*</span></label>
                            <input
                                type="text"
                                style={inputDisabledStyle}
                                value={data.companyName}
                                readOnly
                                disabled
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Industry</label>
                            <select
                                style={inputStyle}
                                value={data.industry}
                                onChange={e => handleChange('industry', e.target.value)}
                                onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                                onBlur={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
                            >
                                <option>Technology</option>
                                <option>Healthcare</option>
                                <option>Finance</option>
                                <option>Education</option>
                                <option>Retail</option>
                                <option>Manufacturing</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Company Size</label>
                            <select
                                style={inputStyle}
                                value={data.companySize}
                                onChange={e => handleChange('companySize', e.target.value)}
                                onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                                onBlur={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
                            >
                                <option>1-10</option>
                                <option>11-50</option>
                                <option>51-200</option>
                                <option>201-500</option>
                                <option>501-1000</option>
                                <option>1000+</option>
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Founded Year</label>
                            <input
                                type="number"
                                style={{
                                    ...inputStyle,
                                    borderColor: errors.foundedYear ? '#ef4444' : '#cbd5e1'
                                }}
                                value={data.foundedYear}
                                onChange={e => {
                                    handleChange('foundedYear', e.target.value);
                                    if (errors.foundedYear) {
                                        setErrors(prev => {
                                            const newErrors = { ...prev };
                                            delete newErrors.foundedYear;
                                            return newErrors;
                                        });
                                    }
                                }}
                                onBlur={(e) => {
                                    if (!validateYear(e.target.value)) {
                                        setErrors(prev => ({ ...prev, foundedYear: 'Please enter a valid year' }));
                                    }
                                    e.currentTarget.style.borderColor = errors.foundedYear ? '#ef4444' : '#cbd5e1';
                                }}
                                onFocus={(e) => e.currentTarget.style.borderColor = errors.foundedYear ? '#ef4444' : '#3b82f6'}
                            />
                            {errors.foundedYear && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.foundedYear}</p>}
                        </div>
                        <div>
                            <label style={labelStyle}>Website</label>
                            <input
                                type="url"
                                style={{
                                    ...inputStyle,
                                    borderColor: errors.website ? '#ef4444' : '#cbd5e1'
                                }}
                                value={data.website}
                                onChange={e => {
                                    handleChange('website', e.target.value);
                                    if (errors.website) {
                                        setErrors(prev => {
                                            const newErrors = { ...prev };
                                            delete newErrors.website;
                                            return newErrors;
                                        });
                                    }
                                }}
                                onBlur={(e) => {
                                    if (!validateUrl(e.target.value)) {
                                        setErrors(prev => ({ ...prev, website: 'Please enter a valid URL starting with http:// or https://' }));
                                    }
                                    e.currentTarget.style.borderColor = errors.website ? '#ef4444' : '#cbd5e1';
                                }}
                                onFocus={(e) => e.currentTarget.style.borderColor = errors.website ? '#ef4444' : '#3b82f6'}
                                placeholder="https://example.com"
                            />
                            {errors.website && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.website}</p>}
                        </div>
                        <div>
                            <label style={labelStyle}>Email <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '400' }}>(Read Only)</span></label>
                            <input
                                type="email"
                                style={inputDisabledStyle}
                                value={data.email}
                                readOnly
                                disabled
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Phone</label>
                            <input
                                type="tel"
                                style={{
                                    ...inputStyle,
                                    borderColor: errors.phone ? '#ef4444' : '#cbd5e1'
                                }}
                                value={data.phone}
                                onChange={e => {
                                    const value = e.target.value;
                                    if (/^[+\d\s\-()]*$/.test(value)) {
                                        handleChange('phone', value);
                                        if (errors.phone) {
                                            setErrors(prev => {
                                                const newErrors = { ...prev };
                                                delete newErrors.phone;
                                                return newErrors;
                                            });
                                        }
                                    }
                                }}
                                onBlur={(e) => {
                                    if (data.phone && !validatePhone(data.phone)) {
                                        setErrors(prev => ({ ...prev, phone: 'Please enter a valid phone number' }));
                                    }
                                    e.currentTarget.style.borderColor = errors.phone ? '#ef4444' : '#cbd5e1';
                                }}
                                onFocus={(e) => e.currentTarget.style.borderColor = errors.phone ? '#ef4444' : '#3b82f6'}
                                placeholder="+1 234 567 8900"
                            />
                            {errors.phone && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.phone}</p>}
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={labelStyle}>Location</label>
                            <input
                                type="text"
                                style={inputStyle}
                                value={data.location}
                                onChange={e => handleChange('location', e.target.value)}
                                onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                                onBlur={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
                                placeholder="City, State, Country"
                            />
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, minmax(0, 1fr))', gap: '24px' }}>
                {/* Company Header */}
                <div style={{
                    gridColumn: '1 / -1',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    marginBottom: '16px'
                }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: '#e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden'
                    }}>
                        {data.logoUrl ? (
                            <img 
                                src={data.logoUrl.startsWith('http') ? data.logoUrl : `${API_BASE_URL}${data.logoUrl}`} 
                                alt="Logo" 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : (
                            <Building2 style={{ width: '40px', height: '40px', color: '#94a3b8' }} />
                        )}
                    </div>
                    <div>
                        <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>
                            {data.companyName || 'Company Name'}
                        </h3>
                        <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
                            {data.industry}
                        </p>
                    </div>
                </div>

                {/* Company Details Grid */}
                <div style={{
                    gridColumn: '1 / -1',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
                    gap: '24px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <Users style={{ width: '20px', height: '20px', color: '#64748b', marginTop: '2px', flexShrink: 0 }} />
                        <div>
                            <p style={{ fontSize: '14px', fontWeight: '500', color: '#334155', marginBottom: '4px' }}>Company Size</p>
                            <p style={{ color: '#0f172a', fontWeight: '500' }}>{data.companySize} employees</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <Calendar style={{ width: '20px', height: '20px', color: '#64748b', marginTop: '2px', flexShrink: 0 }} />
                        <div>
                            <p style={{ fontSize: '14px', fontWeight: '500', color: '#334155', marginBottom: '4px' }}>Founded</p>
                            <p style={{ color: '#0f172a', fontWeight: '500' }}>{data.foundedYear}</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <Globe style={{ width: '20px', height: '20px', color: '#64748b', marginTop: '2px', flexShrink: 0 }} />
                        <div>
                            <p style={{ fontSize: '14px', fontWeight: '500', color: '#334155', marginBottom: '4px' }}>Website</p>
                            {data.website ? (
                                <a 
                                    href={data.website} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    style={{ color: '#2563eb', fontWeight: '500', textDecoration: 'none' }}
                                    onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                                    onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                                >
                                    {data.website}
                                </a>
                            ) : (
                                <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>Not provided</p>
                            )}
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <Mail style={{ width: '20px', height: '20px', color: '#64748b', marginTop: '2px', flexShrink: 0 }} />
                        <div>
                            <p style={{ fontSize: '14px', fontWeight: '500', color: '#334155', marginBottom: '4px' }}>Email</p>
                            <p style={{ color: '#0f172a', fontWeight: '500' }}>{data.email}</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <Phone style={{ width: '20px', height: '20px', color: '#64748b', marginTop: '2px', flexShrink: 0 }} />
                        <div>
                            <p style={{ fontSize: '14px', fontWeight: '500', color: '#334155', marginBottom: '4px' }}>Phone</p>
                            <p style={{ color: '#0f172a', fontWeight: '500' }}>{data.phone || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Not provided</span>}</p>
                        </div>
                    </div>
                    <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <MapPin style={{ width: '20px', height: '20px', color: '#64748b', marginTop: '2px', flexShrink: 0 }} />
                        <div>
                            <p style={{ fontSize: '14px', fontWeight: '500', color: '#334155', marginBottom: '4px' }}>Location</p>
                            <p style={{ color: '#0f172a', fontWeight: '500' }}>{data.location || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Not provided</span>}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderDescription = () => {
        if (isEditMode) {
            return (
                <div>
                    <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#334155',
                        marginBottom: '8px'
                    }}>Company Description</label>
                    <textarea
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            fontSize: '14px',
                            color: '#0f172a',
                            minHeight: '150px',
                            resize: 'vertical',
                            transition: 'all 0.15s ease'
                        }}
                        value={data.description}
                        onChange={e => handleChange('description', e.target.value)}
                        onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                        onBlur={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
                        placeholder="Tell us about your company..."
                    />
                </div>
            );
        }

        return (
            <div style={{
                padding: '16px',
                background: 'linear-gradient(135deg, #ede9fe, #f3e8ff)',
                borderRadius: '8px',
                border: '1px solid #ddd6fe'
            }}>
                <p style={{
                    color: '#334155',
                    lineHeight: '1.75',
                    whiteSpace: 'pre-wrap'
                }}>
                    {data.description || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>No description provided.</span>}
                </p>
            </div>
        );
    };

    const renderLinks = () => {
        const labelStyle = {
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#334155',
            marginBottom: '8px'
        };

        const inputStyle = {
            width: '100%',
            padding: '10px 16px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            background: '#ffffff',
            fontSize: '14px',
            color: '#0f172a',
            transition: 'all 0.15s ease'
        };

        if (isEditMode) {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={labelStyle}>
                            <Linkedin style={{ width: '16px', height: '16px', display: 'inline', marginRight: '4px' }} />
                            LinkedIn URL
                        </label>
                        <input
                            type="url"
                            style={{
                                ...inputStyle,
                                borderColor: errors.linkedinUrl ? '#ef4444' : '#cbd5e1'
                            }}
                            value={data.linkedinUrl}
                            onChange={e => {
                                handleChange('linkedinUrl', e.target.value);
                                if (errors.linkedinUrl) {
                                    setErrors(prev => {
                                        const newErrors = { ...prev };
                                        delete newErrors.linkedinUrl;
                                        return newErrors;
                                    });
                                }
                            }}
                            onBlur={(e) => {
                                if (!validateUrl(e.target.value)) {
                                    setErrors(prev => ({ ...prev, linkedinUrl: 'Please enter a valid URL starting with http:// or https://' }));
                                }
                                e.currentTarget.style.borderColor = errors.linkedinUrl ? '#ef4444' : '#cbd5e1';
                            }}
                            onFocus={(e) => e.currentTarget.style.borderColor = errors.linkedinUrl ? '#ef4444' : '#3b82f6'}
                            placeholder="https://linkedin.com/company/..."
                        />
                        {errors.linkedinUrl && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.linkedinUrl}</p>}
                    </div>
                    <div>
                        <label style={labelStyle}>
                            <Globe style={{ width: '16px', height: '16px', display: 'inline', marginRight: '4px' }} />
                            Twitter/Instagram URL
                        </label>
                        <input
                            type="url"
                            style={{
                                ...inputStyle,
                                borderColor: errors.twitterUrl ? '#ef4444' : '#cbd5e1'
                            }}
                            value={data.twitterUrl}
                            onChange={e => {
                                handleChange('twitterUrl', e.target.value);
                                if (errors.twitterUrl) {
                                    setErrors(prev => {
                                        const newErrors = { ...prev };
                                        delete newErrors.twitterUrl;
                                        return newErrors;
                                    });
                                }
                            }}
                            onBlur={(e) => {
                                if (!validateUrl(e.target.value)) {
                                    setErrors(prev => ({ ...prev, twitterUrl: 'Please enter a valid URL starting with http:// or https://' }));
                                }
                                e.currentTarget.style.borderColor = errors.twitterUrl ? '#ef4444' : '#cbd5e1';
                            }}
                            onFocus={(e) => e.currentTarget.style.borderColor = errors.twitterUrl ? '#ef4444' : '#3b82f6'}
                            placeholder="https://twitter.com/..."
                        />
                        {errors.twitterUrl && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.twitterUrl}</p>}
                    </div>
                </div>
            );
        }

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.linkedinUrl && (
                    <a 
                        href={data.linkedinUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '16px',
                            background: 'linear-gradient(135deg, #dbeafe, #e0f2fe)',
                            borderRadius: '8px',
                            border: '1px solid #bae6fd',
                            color: '#0c4a6e',
                            textDecoration: 'none',
                            transition: 'all 0.15s ease',
                            boxShadow: '0 2px 4px rgba(14, 165, 233, 0.1)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, #bfdbfe, #bae6fd)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, #dbeafe, #e0f2fe)';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        <div style={{
                            padding: '8px',
                            background: '#ffffff',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Linkedin style={{ width: '24px', height: '24px', color: '#0a66c2' }} />
                        </div>
                        <span style={{ fontWeight: '600' }}>{data.linkedinUrl}</span>
                    </a>
                )}
                {data.twitterUrl && (
                    <a 
                        href={data.twitterUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '16px',
                            background: 'linear-gradient(135deg, #fce7f3, #fae8ff)',
                            borderRadius: '8px',
                            border: '1px solid #f9a8d4',
                            color: '#831843',
                            textDecoration: 'none',
                            transition: 'all 0.15s ease',
                            boxShadow: '0 2px 4px rgba(236, 72, 153, 0.1)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, #fbcfe8, #f5d0fe)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, #fce7f3, #fae8ff)';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        <div style={{
                            padding: '8px',
                            background: '#ffffff',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Globe style={{ width: '24px', height: '24px', color: '#ec4899' }} />
                        </div>
                        <span style={{ fontWeight: '600' }}>{data.twitterUrl}</span>
                    </a>
                )}
                {!data.linkedinUrl && !data.twitterUrl && (
                    <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>No links added.</p>
                )}
            </div>
        );
    };

    const renderTeamMembers = () => {
        if (!isOwner) {
            return (
                <p style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>
                    Only organization owners can manage team members.
                </p>
            );
        }

        return (
            <div>
                {/* Invite Form */}
                <div style={{ marginBottom: '30px', padding: '20px', background: '#f8fafc', borderRadius: '8px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px' }}>Invite Team Members</h3>
                    
                    {/* Add Member Form */}
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '5px' }}>
                                    Name
                                </label>
                                <input
                                    type="text"
                                    value={inviteForm.name}
                                    onChange={(e) => setInviteForm(prev => ({ ...prev, name: e.target.value }))}
                                    onKeyPress={(e) => e.key === 'Enter' && addToInviteList()}
                                    placeholder="Member name"
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '6px',
                                        fontSize: '14px'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '5px' }}>
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={inviteForm.email}
                                    onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                                    onKeyPress={(e) => e.key === 'Enter' && addToInviteList()}
                                    placeholder="member@example.com"
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '6px',
                                        fontSize: '14px'
                                    }}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={addToInviteList}
                                style={{
                                    padding: '10px 20px',
                                    background: '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                Add to List
                            </button>
                        </div>
                    </div>

                    {/* Invite List */}
                    {inviteList.length > 0 && (
                        <div style={{ marginBottom: '20px', padding: '15px', background: 'white', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>
                                    Invite List ({inviteList.length})
                                </h4>
                                <button
                                    type="button"
                                    onClick={() => setInviteList([])}
                                    style={{
                                        padding: '4px 12px',
                                        background: '#ef4444',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '12px'
                                    }}
                                >
                                    Clear All
                                </button>
                            </div>
                            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                {inviteList.map((item, index) => (
                                    <div key={index} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '8px',
                                        marginBottom: '5px',
                                        background: '#f8fafc',
                                        borderRadius: '4px'
                                    }}>
                                        <div>
                                            <span style={{ fontWeight: '500', marginRight: '10px' }}>{item.name}</span>
                                            <span style={{ color: '#64748b', fontSize: '13px' }}>{item.email}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeFromInviteList(index)}
                                            style={{
                                                padding: '4px 8px',
                                                background: '#fee2e2',
                                                color: '#991b1b',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '12px'
                                            }}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Send Invitations Button */}
                    {inviteList.length > 0 && (
                        <form onSubmit={handleInviteMembers}>
                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    padding: '12px 24px',
                                    background: '#667eea',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    opacity: loading ? 0.6 : 1,
                                    width: '100%'
                                }}
                            >
                                {loading ? 'Sending Invitations...' : `Send Invitations to ${inviteList.length} Member(s)`}
                            </button>
                        </form>
                    )}
                </div>

                {/* Members List */}
                <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px' }}>Team Members</h3>
                    {members.length === 0 ? (
                        <p style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>
                            No team members yet. Invite someone to get started!
                        </p>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
                                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#334155' }}>Name</th>
                                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#334155' }}>Email</th>
                                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#334155' }}>Role</th>
                                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#334155' }}>Status</th>
                                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#334155' }}>Invited At</th>
                                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#334155' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {members.map((member, index) => (
                                        <tr key={member._id || index} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                            <td style={{ padding: '12px', fontSize: '14px', color: '#0f172a' }}>{member.member_name}</td>
                                            <td style={{ padding: '12px', fontSize: '14px', color: '#0f172a' }}>{member.member_email}</td>
                                            <td style={{ padding: '12px', fontSize: '14px', color: '#0f172a' }}>
                                                <span style={{
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    background: member.role === 'owner' ? '#dbeafe' : '#e0e7ff',
                                                    color: member.role === 'owner' ? '#1e40af' : '#3730a3',
                                                    fontSize: '12px',
                                                    fontWeight: '500'
                                                }}>
                                                    {member.role}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px', fontSize: '14px', color: '#0f172a' }}>
                                                <span style={{
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    background: member.status === 'accepted' ? '#d1fae5' : member.status === 'pending' ? '#fef3c7' : member.status === 'rejected' ? '#fee2e2' : '#e5e7eb',
                                                    color: member.status === 'accepted' ? '#065f46' : member.status === 'pending' ? '#92400e' : member.status === 'rejected' ? '#991b1b' : '#374151',
                                                    fontSize: '12px',
                                                    fontWeight: '500',
                                                    textTransform: 'capitalize'
                                                }}>
                                                    {member.status || 'pending'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px', fontSize: '13px', color: '#64748b' }}>
                                                {member.invited_at ? new Date(member.invited_at).toLocaleDateString() : '-'}
                                            </td>
                                            <td style={{ padding: '12px', fontSize: '14px' }}>
                                                {member.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleResendInvite(member.member_email)}
                                                        disabled={loading}
                                                        style={{
                                                            padding: '6px 12px',
                                                            background: '#667eea',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: loading ? 'not-allowed' : 'pointer',
                                                            fontSize: '12px',
                                                            fontWeight: '500',
                                                            opacity: loading ? 0.6 : 1
                                                        }}
                                                    >
                                                        Resend
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderEmployees = () => {
        const labelStyle = {
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#334155',
            marginBottom: '8px'
        };

        const inputStyle = {
            width: '100%',
            padding: '10px 16px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            background: '#ffffff',
            fontSize: '14px',
            color: '#0f172a',
            transition: 'all 0.15s ease'
        };

        const removeEmployee = (index: number) => {
            const updated = data.employees.filter((_, i) => i !== index);
            setData(prev => ({ ...prev, employees: updated }));
        };

        if (isEditMode) {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {data.employees.map((employee, index) => (
                        <div 
                            key={index} 
                            style={{
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                padding: '16px',
                                paddingRight: '60px',
                                background: 'linear-gradient(to right, #fef3c7, #fef9e7)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '16px',
                                position: 'relative'
                            }}
                        >
                            {/* Delete Button */}
                            <button
                                onClick={() => removeEmployee(index)}
                                style={{
                                    position: 'absolute',
                                    top: '16px',
                                    right: '16px',
                                    padding: '10px',
                                    background: '#fef2f2',
                                    border: '1px solid #fee2e2',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    boxShadow: '0 2px 4px rgba(239, 68, 68, 0.1)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#fee2e2';
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#fef2f2';
                                    e.currentTarget.style.transform = 'scale(1)';
                                }}
                            >
                                <Trash2 style={{ width: '16px', height: '16px', color: '#dc2626' }} />
                            </button>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
                                gap: '16px'
                            }}>
                                <div>
                                    <label style={labelStyle}>Employee Name</label>
                                    <input
                                        type="text"
                                        style={inputStyle}
                                        value={employee.name}
                                        onChange={e => {
                                            const updated = [...data.employees];
                                            updated[index] = { ...updated[index], name: e.target.value };
                                            setData(prev => ({ ...prev, employees: updated }));
                                        }}
                                        onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                                        onBlur={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
                                        placeholder="Enter employee name"
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Role/Designation</label>
                                    <input
                                        type="text"
                                        style={inputStyle}
                                        value={employee.role}
                                        onChange={e => {
                                            const updated = [...data.employees];
                                            updated[index] = { ...updated[index], role: e.target.value };
                                            setData(prev => ({ ...prev, employees: updated }));
                                        }}
                                        onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                                        onBlur={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
                                        placeholder="Enter role/designation"
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={labelStyle}>Resume File (PDF)</label>
                                {employee.resumeUrl && !employee.resumeFile && (
                                    <div style={{
                                        marginBottom: '8px',
                                        padding: '8px',
                                        background: '#f0fdf4',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        color: '#166534',
                                        border: '1px solid #bbf7d0'
                                    }}>
                                        Current file: {employee.resumeUrl.split('/').pop()}
                                        {employee.parsedResumeData ? (
                                            <span style={{ marginLeft: '8px', color: '#16a34a', fontWeight: '600' }}>✓ Parsed</span>
                                        ) : (
                                            <span style={{ marginLeft: '8px', color: '#ea580c', fontWeight: '600' }}>⚠ Not parsed</span>
                                        )}
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept=".pdf"
                                    style={{
                                        fontSize: '14px',
                                        color: '#64748b'
                                    }}
                                    disabled={loading}
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const updated = [...data.employees];
                                            updated[index] = { ...updated[index], resumeFile: file };
                                            setData(prev => ({ ...prev, employees: updated }));
                                        }
                                    }}
                                />
                                {employee.resumeFile && (
                                    <p style={{ fontSize: '12px', color: '#2563eb', marginTop: '4px', fontWeight: '600' }}>
                                        ⏳ Processing: {employee.resumeFile.name}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => {
                            setData(prev => ({
                                ...prev,
                                employees: [...prev.employees, { name: '', role: '', resumeFile: null }]
                            }));
                        }}
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: '2px dashed #cbd5e1',
                            borderRadius: '8px',
                            color: '#64748b',
                            background: 'transparent',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.5 : 1,
                            transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                            if (!loading) {
                                e.currentTarget.style.borderColor = '#2563eb';
                                e.currentTarget.style.color = '#2563eb';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!loading) {
                                e.currentTarget.style.borderColor = '#cbd5e1';
                                e.currentTarget.style.color = '#64748b';
                            }
                        }}
                    >
                        + Add Employee
                    </button>
                </div>
            );
        }

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {data.employees.length === 0 ? (
                    <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>No employees added yet.</p>
                ) : (
                    data.employees.map((employee, index) => (
                        <div 
                            key={index} 
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '16px',
                                background: 'linear-gradient(135deg, #fef9e7, #fff7ed)',
                                borderRadius: '8px',
                                border: '1px solid #fed7aa',
                                boxShadow: '0 1px 3px rgba(251, 146, 60, 0.1)'
                            }}
                        >
                            <div style={{ flex: 1 }}>
                                <p style={{ fontWeight: '600', color: '#0f172a', marginBottom: '4px', fontSize: '16px' }}>
                                    {employee.name}
                                </p>
                                <p style={{ fontSize: '14px', color: '#78350f', fontWeight: '500' }}>
                                    {employee.role}
                                </p>
                            </div>
                            {employee.parsedResumeData && (
                                <span style={{
                                    padding: '6px 14px',
                                    background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
                                    color: '#166534',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    borderRadius: '20px',
                                    border: '1px solid #86efac',
                                    boxShadow: '0 2px 4px rgba(22, 163, 74, 0.1)'
                                }}>
                                    ✓ Resume Parsed
                                </span>
                            )}
                        </div>
                    ))
                )}
            </div>
        );
    };

    const [logoutHovered, setLogoutHovered] = useState(false);
    const [editHovered, setEditHovered] = useState(false);

    return (
        <>
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
            <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #f8fafc, #dbeafe)', paddingBottom: '80px' }}>
                {/* Header */}
                <div style={{
                    background: '#ffffff',
                    borderBottom: '1px solid #e2e8f0',
                    position: 'sticky',
                    top: 0,
                    zIndex: 20,
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
                }}>
                    <div style={{
                        maxWidth: '1152px',
                        margin: '0 auto',
                        padding: '16px 24px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div>
                            <h1 style={{
                                fontSize: '24px',
                                fontWeight: '700',
                                color: '#0f172a',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <Building2 style={{ width: '28px', height: '28px', color: '#2563eb' }} />
                                Organization Profile
                            </h1>
                            <p style={{ fontSize: '14px', color: '#64748b', marginTop: '2px' }}>
                                Manage your company information
                            </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {!isEditMode && isOwner ? (
                                <button
                                    onClick={() => setIsEditMode(true)}
                                    onMouseEnter={() => setEditHovered(true)}
                                    onMouseLeave={() => setEditHovered(false)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '10px 20px',
                                        borderRadius: '8px',
                                        fontWeight: '500',
                                        color: '#ffffff',
                                        background: editHovered ? '#1d4ed8' : '#2563eb',
                                        border: 'none',
                                        cursor: 'pointer',
                                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                                        transition: 'all 0.15s ease'
                                    }}
                                >
                                    <Pencil style={{ width: '16px', height: '16px' }} />
                                    Edit Profile
                                </button>
                            ) : isOwner ? (
                                <button
                                    onClick={handleSave}
                                    disabled={loading}
                                    onMouseEnter={() => setEditHovered(true)}
                                    onMouseLeave={() => setEditHovered(false)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '10px 20px',
                                        borderRadius: '8px',
                                        fontWeight: '500',
                                        color: '#ffffff',
                                        background: loading ? '#16a34a' : (editHovered ? '#15803d' : '#16a34a'),
                                        border: 'none',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        opacity: loading ? 0.5 : 1,
                                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                                        transition: 'all 0.15s ease'
                                    }}
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
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save style={{ width: '16px', height: '16px' }} />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            ) : null}
                            <button
                                onClick={handleLogout}
                                onMouseEnter={() => setLogoutHovered(true)}
                                onMouseLeave={() => setLogoutHovered(false)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '10px 20px',
                                    borderRadius: '8px',
                                    fontWeight: '500',
                                    color: '#ffffff',
                                    background: logoutHovered ? '#b91c1c' : '#dc2626',
                                    border: 'none',
                                    cursor: 'pointer',
                                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                                    transition: 'all 0.15s ease'
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
                    <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '16px 24px 0' }}>
                        <div style={{
                            padding: '16px 20px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                            background: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
                            color: message.type === 'success' ? '#166534' : '#991b1b',
                            border: message.type === 'success' ? '1px solid #bbf7d0' : '1px solid #fecaca'
                        }}>
                            {message.type === 'success' ? (
                                <CheckCircle style={{ width: '20px', height: '20px', flexShrink: 0 }} />
                            ) : (
                                <X style={{ width: '20px', height: '20px', flexShrink: 0 }} />
                            )}
                            <span style={{ fontWeight: '500' }}>{message.text}</span>
                            <button
                                onClick={() => setMessage(null)}
                                style={{
                                    marginLeft: 'auto',
                                    background: 'rgba(0, 0, 0, 0.05)',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '4px',
                                    cursor: 'pointer',
                                    transition: 'background 0.15s ease'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)'}
                            >
                                <X style={{ width: '16px', height: '16px' }} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Content */}
                <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '32px 24px' }}>

                    <SectionCard>
                        {renderBasicInfo()}
                    </SectionCard>

                    {/* Credits Section - Visible to all org members */}
                    <SectionCard title="Credits" icon={Briefcase}>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px',
                            padding: '16px',
                            background: 'linear-gradient(135deg, #dbeafe, #e0f2fe)',
                            borderRadius: '8px',
                            border: '1px solid #bfdbfe'
                        }}>
                            <div>
                                <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>
                                    Credits remaining for job postings
                                </p>
                                <p style={{ fontSize: '36px', fontWeight: '700', color: '#2563eb', margin: 0 }}>
                                    {credits}
                                </p>
                            </div>
                            
                            {isOwner && (
                                <button
                                    onClick={() => setShowBuyCreditsModal(true)}
                                    style={{
                                        padding: '10px 20px',
                                        background: '#2563eb',
                                        color: '#ffffff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontWeight: '500',
                                        cursor: 'pointer',
                                        transition: 'background 0.15s ease',
                                        fontSize: '14px'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#1d4ed8'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = '#2563eb'}
                                >
                                    Buy Credits
                                </button>
                            )}
                        </div>
                    </SectionCard>

                    <SectionCard title="About Company" icon={FileText}>
                        {renderDescription()}
                    </SectionCard>

                    <SectionCard title="Social Links" icon={Globe}>
                        {renderLinks()}
                    </SectionCard>

                    <SectionCard title="Our Employees" icon={Users}>
                        {renderEmployees()}
                    </SectionCard>

                    {isOwner && (
                        <SectionCard title="Team Members" icon={Users}>
                            {renderTeamMembers()}
                        </SectionCard>
                    )}

                    {/* Payment Transaction History - Owner only */}
                    {isOwner && (
                        <SectionCard title="Transaction History" icon={CreditCard}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '16px'
                        }}>
                            <span style={{ fontSize: '14px', color: '#64748b' }}>
                                {paymentHistory.length} transaction{paymentHistory.length !== 1 ? 's' : ''}
                            </span>
                            <button
                                onClick={async () => {
                                    try {
                                        const res = await authenticatedFetch(
                                            API_ENDPOINTS.PAYMENT_HISTORY,
                                            { method: 'GET' },
                                            navigate
                                        );
                                        if (res?.ok) {
                                            const result = await res.json();
                                            setPaymentHistory(result.transactions || []);
                                            // Also refresh credits
                                            const creditsRes = await authenticatedFetch(
                                                API_ENDPOINTS.ORGANIZATION_CREDITS,
                                                { method: 'GET' },
                                                navigate
                                            );
                                            if (creditsRes?.ok) {
                                                const creditsResult = await creditsRes.json();
                                                setCredits(creditsResult.credits || 0);
                                            }
                                        }
                                    } catch (err) {
                                        console.error('Failed to refresh payment history:', err);
                                    }
                                }}
                                style={{
                                    padding: '6px 12px',
                                    background: '#f1f5f9',
                                    color: '#334155',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    transition: 'background 0.15s ease'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'}
                                onMouseLeave={(e) => e.currentTarget.style.background = '#f1f5f9'}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                                </svg>
                                Refresh
                            </button>
                </div>
                        {paymentHistory.length === 0 ? (
                            <p style={{
                                color: '#94a3b8',
                                fontStyle: 'italic',
                                textAlign: 'center',
                                padding: '20px'
                            }}>
                                No transactions yet. Purchase credits to see your transaction history here.
                            </p>
                        ) : (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px'
                            }}>
                                {paymentHistory.map((transaction) => {
                                    const date = new Date(transaction.created_at);
                                    const formattedDate = date.toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    });
                                    
                                    return (
                                        <div
                                            key={transaction.id}
                                            style={{
                                                padding: '16px',
                                                background: '#f8fafc',
                                                borderRadius: '8px',
                                                border: '1px solid #e2e8f0',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                transition: 'background 0.15s ease'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = '#f8fafc'}
                                        >
                                            <div style={{ flex: 1 }}>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '12px',
                                                    marginBottom: '8px'
                                                }}>
                                                    {transaction.status === 'completed' ? (
                                                        <CheckCircle style={{
                                                            width: '20px',
                                                            height: '20px',
                                                            color: '#16a34a',
                                                            flexShrink: 0
                                                        }} />
                                                    ) : (
                                                        <div style={{
                                                            width: '20px',
                                                            height: '20px',
                                                            borderRadius: '50%',
                                                            background: transaction.status === 'created' ? '#fbbf24' : '#ef4444',
                                                            flexShrink: 0,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}>
                                                            <div style={{
                                                                width: '8px',
                                                                height: '8px',
                                                                borderRadius: '50%',
                                                                background: '#ffffff'
                                                            }} />
            </div>
                                                    )}
                                                    <div>
                                                        <div style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px'
                                                        }}>
                                                            <p style={{
                                                                fontSize: '16px',
                                                                fontWeight: '600',
                                                                color: '#0f172a',
                                                                margin: 0
                                                            }}>
                                                                {transaction.description || `Purchase ${transaction.num_credits} credit(s)`}
                                                            </p>
                                                            <span style={{
                                                                padding: '2px 8px',
                                                                borderRadius: '4px',
                                                                fontSize: '11px',
                                                                fontWeight: '600',
                                                                textTransform: 'uppercase',
                                                                background: transaction.status === 'completed' ? '#dcfce7' : 
                                                                           transaction.status === 'created' ? '#fef9c3' : '#fee2e2',
                                                                color: transaction.status === 'completed' ? '#16a34a' : 
                                                                       transaction.status === 'created' ? '#a16207' : '#dc2626'
                                                            }}>
                                                                {transaction.status || 'unknown'}
                                                            </span>
                                                        </div>
                                                        <p style={{
                                                            fontSize: '14px',
                                                            color: '#64748b',
                                                            margin: '4px 0 0 0'
                                                        }}>
                                                            {formattedDate}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{
                                                textAlign: 'right',
                                                minWidth: '120px'
                                            }}>
                                                <p style={{
                                                    fontSize: '18px',
                                                    fontWeight: '700',
                                                    color: '#16a34a',
                                                    margin: '0 0 4px 0'
                                                }}>
                                                    ${transaction.amount.toFixed(2)} {transaction.currency}
                                                </p>
                                                <p style={{
                                                    fontSize: '14px',
                                                    color: '#2563eb',
                                                    fontWeight: '600',
                                                    margin: 0
                                                }}>
                                                    +{transaction.num_credits} credit{transaction.num_credits !== 1 ? 's' : ''}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </SectionCard>
                    )}

                </div>
            </div>

            {/* Buy Credits Modal */}
            {showBuyCreditsModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 50,
                    padding: '20px'
                }}
                onClick={() => {
                    if (!paymentLoading) {
                        setShowBuyCreditsModal(false);
                        setNumCreditsToBuy(1);
                    }
                }}
                >
                    <div style={{
                        background: '#ffffff',
                        padding: '24px',
                        borderRadius: '12px',
                        maxWidth: '400px',
                        width: '100%',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                    }}
                    onClick={(e) => e.stopPropagation()}
                    >
                        <h2 style={{
                            fontSize: '20px',
                            fontWeight: '600',
                            marginBottom: '16px',
                            color: '#0f172a'
                        }}>
                            Buy Credits
                        </h2>
                        <p style={{
                            fontSize: '14px',
                            color: '#64748b',
                            marginBottom: '20px'
                        }}>
                            1 credit = $10 USD
                        </p>
                        
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#334155',
                            marginBottom: '8px'
                        }}>
                            Number of Credits:
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={numCreditsToBuy}
                            onChange={(e) => {
                                const value = parseInt(e.target.value) || 1;
                                setNumCreditsToBuy(Math.max(1, value));
                            }}
                            style={{
                                width: '100%',
                                padding: '10px 16px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                fontSize: '14px',
                                marginBottom: '16px'
                            }}
                            disabled={paymentLoading}
                        />
                        
                        <div style={{
                            padding: '12px',
                            background: '#f8fafc',
                            borderRadius: '8px',
                            marginBottom: '20px'
                        }}>
                            <p style={{
                                fontSize: '16px',
                                fontWeight: '600',
                                color: '#0f172a',
                                margin: 0
                            }}>
                                Total: ${numCreditsToBuy * 10} USD
                            </p>
                        </div>
                        
                        <div style={{
                            display: 'flex',
                            gap: '12px'
                        }}>
                            <button
                                onClick={handleBuyCredits}
                                disabled={paymentLoading}
                                style={{
                                    flex: 1,
                                    padding: '10px 20px',
                                    background: paymentLoading ? '#94a3b8' : '#2563eb',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: '500',
                                    cursor: paymentLoading ? 'not-allowed' : 'pointer',
                                    transition: 'background 0.15s ease',
                                    fontSize: '14px'
                                }}
                            >
                                {paymentLoading ? 'Processing...' : 'Proceed to Payment'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowBuyCreditsModal(false);
                                    setNumCreditsToBuy(1);
                                }}
                                disabled={paymentLoading}
                                style={{
                                    padding: '10px 20px',
                                    background: '#f1f5f9',
                                    color: '#334155',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: '500',
                                    cursor: paymentLoading ? 'not-allowed' : 'pointer',
                                    transition: 'background 0.15s ease',
                                    fontSize: '14px'
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
