import React, { useState, useEffect } from 'react';
import {
    Pencil, Save, X, Upload, CheckCircle, MapPin, Mail, Phone,
    Briefcase, Globe, Users, Building2, Calendar, FileText, LogOut, Linkedin, Trash2, CreditCard, Menu, UserCircle, Cloud
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authenticatedFetch, clearAuthAndRedirect } from '../utils/auth';
import { API_BASE_URL, API_ENDPOINTS, getStorageUrl } from '../config/api';

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
                background: '#FFFFFF',
                borderRadius: 12,
                boxShadow: isHovered
                    ? '0 18px 45px rgba(15, 23, 42, 0.10)'
                    : '0 10px 30px rgba(15, 23, 42, 0.06)',
                border: '1px solid #E2E8F0',
                marginBottom: 24,
                overflow: 'hidden',
                transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                transition: 'transform 200ms ease-out, box-shadow 200ms ease-out, border-color 200ms ease-out'
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {title && (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px 24px',
                        borderBottom: '1px solid #E5E7EB',
                        background: '#F9FAFB'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {Icon && (
                            <Icon
                                style={{
                                    width: 20,
                                    height: 20,
                                    color: '#0052FF'
                                }}
                            />
                        )}
                        <h2
                            style={{
                                fontSize: 16,
                                fontWeight: 600,
                                letterSpacing: 0.2,
                                color: '#111827'
                            }}
                        >
                            {title}
                        </h2>
                    </div>
                </div>
            )}
            <div
                style={{
                    padding: 24
                }}
            >
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
    const [creditPriceUsd, setCreditPriceUsd] = useState<number>(1);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [paymentError, setPaymentError] = useState<string | null>(null);
    const [paymentHistory, setPaymentHistory] = useState<Array<{
        id: string;
        amount: number;
        currency: string;
        num_credits: number;
        description: string;
        created_at: string;
    }>>([]);
    const [linkedInConnected, setLinkedInConnected] = useState<boolean | null>(null);
    const [linkedInConnecting, setLinkedInConnecting] = useState(false);
    const [salesforceConnected, setSalesforceConnected] = useState<boolean | null>(null);
    const [salesforceConnecting, setSalesforceConnecting] = useState(false);

    useEffect(() => {
        if (!showBuyCreditsModal) return;
        fetch(API_ENDPOINTS.PAYMENTS_CONFIG)
            .then((res) => res.ok ? res.json() : null)
            .then((data) => {
                if (data && typeof data.credit_price_usd === 'number') setCreditPriceUsd(data.credit_price_usd);
            })
            .catch(() => {});
    }, [showBuyCreditsModal]);

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

        const fetchLinkedInStatus = async () => {
            try {
                const res = await authenticatedFetch(
                    API_ENDPOINTS.LINKEDIN_STATUS,
                    { method: 'GET' },
                    navigate
                );
                if (res?.ok) {
                    const result = await res.json();
                    setLinkedInConnected(result.connected === true);
                } else {
                    setLinkedInConnected(false);
                }
            } catch {
                setLinkedInConnected(false);
            }
        };

        const fetchSalesforceStatus = async () => {
            try {
                const res = await authenticatedFetch(
                    API_ENDPOINTS.SALESFORCE_STATUS,
                    { method: 'GET' },
                    navigate
                );
                if (res?.ok) {
                    const result = await res.json();
                    setSalesforceConnected(result.connected === true);
                } else {
                    setSalesforceConnected(false);
                }
            } catch {
                setSalesforceConnected(false);
            }
        };
        
        // Fetch credits, payment history, LinkedIn and Salesforce status (org)
        const fetchAll = async () => {
            await Promise.all([
                fetchCredits(),
                fetchPaymentHistory(),
                fetchLinkedInStatus(),
                fetchSalesforceStatus(),
            ]);
        };
        
        fetchAll();
        
        // If returning from payment, LinkedIn connect, or Salesforce connect, refresh immediately
        const salesforceConnectedParam = urlParams.get('salesforce_connected') === '1';
        if (paymentSuccess || urlParams.get('linkedin_connected') === '1' || salesforceConnectedParam) {
            if (urlParams.get('linkedin_connected') === '1') {
                window.history.replaceState({}, '', window.location.pathname);
            }
            if (salesforceConnectedParam) {
                window.history.replaceState({}, '', window.location.pathname);
            }
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
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
            const logoPath = dataToSave.logoUrl || '';

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

    const handleBuyCredits = async (paymentMethod: 'paypal' | 'razorpay') => {
        if (numCreditsToBuy < 1) {
            setPaymentError('Please select at least 1 credit');
            return;
        }
        
        setPaymentLoading(true);
        setPaymentError(null);
        setMessage(null);
        try {
            const res = await authenticatedFetch(
                API_ENDPOINTS.BUY_CREDITS,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        num_credits: numCreditsToBuy,
                        payment_method: paymentMethod
                    })
                },
                navigate
            );
            
            if (res === null) {
                setPaymentError('Session expired or not authorized. Please log in again.');
                setPaymentLoading(false);
                return;
            }
            
            if (!res.ok) {
                let detail = 'Failed to create payment order';
                try {
                    const error = await res.json();
                    const d = error?.detail;
                    detail = Array.isArray(d) ? (d[0]?.msg || String(d[0])) : (typeof d === 'string' ? d : detail);
                } catch (_) {}
                setPaymentError(detail);
                setPaymentLoading(false);
                return;
            }

            const result = await res.json();
            if (paymentMethod === 'paypal' && result.approval_url) {
                window.location.href = result.approval_url;
                return;
            }

            // Razorpay: accept razorpay_order_id or order_id (backend may return both)
            const razorpayOrderId = result.razorpay_order_id ?? result.order_id;
            const razorpayKeyId = result.razorpay_key_id;
            if (paymentMethod === 'razorpay' && razorpayOrderId && razorpayKeyId) {
                const Razorpay = (window as any).Razorpay;
                if (!Razorpay) {
                    setPaymentError('Razorpay checkout script did not load. Please refresh the page and try again.');
                    setPaymentLoading(false);
                    return;
                }
                const userData = localStorage.getItem('user');
                const parsedUser = userData ? JSON.parse(userData) : {};
                const orgEmail = parsedUser.org_email || parsedUser.email;
                const options = {
                    key: razorpayKeyId,
                    amount: result.amount_paise,
                    currency: result.currency || 'INR',
                    order_id: razorpayOrderId,
                    name: 'Prism ApexNeural',
                    description: `Purchase ${result.num_credits} credit(s)`,
                    handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
                        try {
                            const captureRes = await authenticatedFetch(
                                API_ENDPOINTS.CAPTURE_ORDER,
                                {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        order_id: result.order_id,
                                        org_email: orgEmail,
                                        payment_id: response.razorpay_payment_id,
                                        signature: response.razorpay_signature
                                    })
                                },
                                navigate
                            );
                            if (captureRes?.ok) {
                                sessionStorage.setItem('razorpay_order_id', result.order_id);
                                sessionStorage.setItem('payment_success', 'true');
                                navigate(`/payment/success?order_id=${result.order_id}`);
                            } else {
                                const errData = await captureRes?.json();
                                setPaymentError(errData?.detail || 'Payment verification failed');
                                setPaymentLoading(false);
                            }
                        } catch (e) {
                            console.error('Razorpay verify error:', e);
                            setPaymentError('Payment verification failed');
                            setPaymentLoading(false);
                        }
                    },
                    modal: {
                        ondismiss: () => setPaymentLoading(false)
                    }
                };
                try {
                    const rzp = new Razorpay(options);
                    rzp.on('payment.failed', () => {
                        setPaymentError('Payment failed or was cancelled');
                        setPaymentLoading(false);
                    });
                    rzp.open();
                } catch (rzpErr: any) {
                    console.error('Razorpay open error:', rzpErr);
                    setPaymentError(rzpErr?.message || 'Could not open Razorpay checkout');
                }
                setPaymentLoading(false);
                return;
            }

            if (paymentMethod === 'razorpay') {
                if (result.approval_url) {
                    setPaymentError('Server returned PayPal instead of Razorpay. Check backend received payment_method.');
                } else if (!razorpayKeyId) {
                    setPaymentError('Server did not return Razorpay key. Set RAZORPAY_KEY_ID in backend .env and restart.');
                } else {
                    setPaymentError('Server response missing Razorpay order. Check backend logs for errors.');
                }
            } else {
                setPaymentError('Invalid response from payment server');
            }
            setPaymentLoading(false);
        } catch (err: any) {
            console.error('Failed to buy credits:', err);
            setPaymentError(err?.message || 'Failed to initiate payment');
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
                                    src={getStorageUrl(data.logoUrl)} 
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
            <div
                    style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
                    gap: 24
                    }}
                >
                {/* Contact / location */}
                <div
                    style={{
                        gridColumn: '1 / -1',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                        gap: 16
                    }}
                >
                    {/* Website */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 4
                        }}
                    >
                        <span
                            style={{
                                fontSize: 12,
                                fontWeight: 500,
                                textTransform: 'uppercase',
                                letterSpacing: 0.6,
                                color: '#6B7280'
                            }}
                        >
                            Website
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Globe style={{ width: 16, height: 16, color: '#6B7280', flexShrink: 0 }} />
                            {data.website ? (
                                <a
                                    href={data.website}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                        fontSize: 14,
                                        color: '#0052FF',
                                        textDecoration: 'none',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    {data.website}
                                </a>
                            ) : (
                                <span
                                    style={{
                                        fontSize: 14,
                                        color: '#9CA3AF',
                                        fontStyle: 'italic'
                                    }}
                                >
                                    Not provided
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Email */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 4
                        }}
                    >
                        <span
                            style={{
                                fontSize: 12,
                                fontWeight: 500,
                                textTransform: 'uppercase',
                                letterSpacing: 0.6,
                                color: '#6B7280'
                            }}
                        >
                            Email
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Mail style={{ width: 16, height: 16, color: '#6B7280', flexShrink: 0 }} />
                            <span
                                style={{
                                    fontSize: 14,
                                    color: '#111827',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {data.email}
                            </span>
                        </div>
                    </div>

                    {/* Phone */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 4
                        }}
                    >
                        <span
                            style={{
                                fontSize: 12,
                                fontWeight: 500,
                                textTransform: 'uppercase',
                                letterSpacing: 0.6,
                                color: '#6B7280'
                            }}
                        >
                            Phone
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Phone style={{ width: 16, height: 16, color: '#6B7280', flexShrink: 0 }} />
                            <span
                                style={{
                                    fontSize: 14,
                                    color: data.phone ? '#111827' : '#9CA3AF',
                                    fontStyle: data.phone ? 'normal' : 'italic'
                                }}
                            >
                                {data.phone || 'Not provided'}
                            </span>
                        </div>
                    </div>

                    {/* Location */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 4
                        }}
                    >
                        <span
                            style={{
                                fontSize: 12,
                                fontWeight: 500,
                                textTransform: 'uppercase',
                                letterSpacing: 0.6,
                                color: '#6B7280'
                            }}
                        >
                            Location
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <MapPin style={{ width: 16, height: 16, color: '#6B7280', flexShrink: 0 }} />
                            <span
                                style={{
                                    fontSize: 14,
                                    color: data.location ? '#111827' : '#9CA3AF',
                                    fontStyle: data.location ? 'normal' : 'italic'
                                }}
                            >
                                {data.location || 'Not provided'}
                            </span>
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
                padding: '18px 20px',
                background: '#FFFFFF',
                borderRadius: 10,
                border: '1px solid #E5E7EB'
            }}>
                <p style={{
                    color: '#111827',
                    lineHeight: 1.7,
                    whiteSpace: 'pre-wrap',
                    fontSize: 14
                }}>
                    {data.description || (
                        <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>
                            No description provided yet. Share how your team hires, grows, and collaborates.
                        </span>
                    )}
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {data.linkedinUrl && (
                    <a 
                        href={data.linkedinUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '12px 14px',
                            background: '#FFFFFF',
                            borderRadius: 10,
                            border: '1px solid #E5E7EB',
                            color: '#111827',
                            textDecoration: 'none',
                            transition: 'background 200ms ease-out, border-color 200ms ease-out, box-shadow 200ms ease-out'
                        }}
                    >
                        <div style={{
                            padding: 8,
                            background: '#EFF6FF',
                            borderRadius: 8,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Linkedin style={{ width: '24px', height: '24px', color: '#0a66c2' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 600, fontSize: 14 }}>LinkedIn</span>
                            <span style={{ fontSize: 12, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {data.linkedinUrl}
                            </span>
                        </div>
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
                            gap: 12,
                            padding: '12px 14px',
                            background: '#FFFFFF',
                            borderRadius: 10,
                            border: '1px solid #E5E7EB',
                            color: '#111827',
                            textDecoration: 'none',
                            transition: 'background 200ms ease-out, border-color 200ms ease-out, box-shadow 200ms ease-out'
                        }}
                    >
                        <div style={{
                            padding: 8,
                            background: '#F9FAFB',
                            borderRadius: 8,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Globe style={{ width: 24, height: 24, color: '#4B5563' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 600, fontSize: 14 }}>Social</span>
                            <span style={{ fontSize: 12, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {data.twitterUrl}
                            </span>
                        </div>
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
                    <p style={{ color: '#9CA3AF', fontStyle: 'italic', fontSize: 14 }}>No employees added yet.</p>
                ) : (
                    data.employees.map((employee, index) => (
                        <div 
                            key={index} 
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '12px 14px',
                                background: '#FFFFFF',
                                borderRadius: 10,
                                border: '1px solid #E5E7EB',
                                boxShadow: '0 6px 18px rgba(15, 23, 42, 0.04)'
                            }}
                        >
                            <div style={{ flex: 1 }}>
                                <p style={{ fontWeight: 600, color: '#111827', marginBottom: 2, fontSize: 14 }}>
                                    {employee.name}
                                </p>
                                <p style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>
                                    {employee.role}
                                </p>
                            </div>
                            {employee.parsedResumeData && (
                                <span style={{
                                    padding: '4px 10px',
                                    background: '#ECFDF3',
                                    color: '#15803D',
                                    fontSize: 11,
                                    fontWeight: 600,
                                    borderRadius: 999,
                                    border: '1px solid #BBF7D0'
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

    const [editHovered, setEditHovered] = useState(false);
    const [menuHovered, setMenuHovered] = useState(false);

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

    return (
        <>
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(4px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .org-header-inner {
                    max-width: 1360px;
                }

                .org-content {
                    max-width: 1360px;
                }

                .org-bento-grid {
                    display: grid;
                    grid-template-columns: repeat(12, minmax(0, 1fr));
                    gap: 24px;
                    margin-bottom: 32px;
                }

                .org-bento-company {
                    grid-column: span 5;
                }

                .org-bento-credits {
                    grid-column: span 3;
                }

                .org-bento-integrations {
                    grid-column: span 4;
                }

                @media (max-width: 1024px) {
                    .org-header-inner {
                        padding: 12px 16px !important;
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 16px;
                    }

                    .org-content {
                        padding: 20px 16px 32px !important;
                    }

                    .org-bento-company,
                    .org-bento-people,
                    .org-bento-integrations {
                        grid-column: span 12;
                    }
                }

                @media (max-width: 768px) {
                    .org-bento-grid {
                        grid-template-columns: 1fr;
                    }

                    .org-bento-company,
                    .org-bento-credits,
                    .org-bento-integrations {
                        grid-column: span 12;
                    }

                    .org-content {
                        padding: 16px 12px 28px !important;
                    }
                }
            `}</style>
            <div
                style={{
                    minHeight: '100vh',
                    background: '#F5F7FA',
                    color: '#111827'
                }}
            >
                {/* Top shell / hero */}
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
                        className="org-header-inner"
                        style={{
                            margin: '0 auto',
                            padding: '16px 32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
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
                                <Building2
                                    style={{
                                        width: 22,
                                        height: 22,
                                        color: '#FFFFFF'
                                    }}
                                />
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
                                    Prism · Organization
                                </p>
                                <h1
                                    style={{
                                        fontSize: 22,
                                        fontWeight: 700,
                                        letterSpacing: 0.2,
                                        margin: '4px 0 0',
                                        color: '#111827'
                                    }}
                                >
                                    Organization Profile
                                </h1>
                            </div>
                        </div>

                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12
                            }}
                        >
                            {!isEditMode && isOwner ? (
                                <button
                                    onClick={() => setIsEditMode(true)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        padding: '9px 18px',
                                        borderRadius: 999,
                                        fontWeight: 600,
                                        fontSize: 13,
                                        letterSpacing: 0.3,
                                        textTransform: 'uppercase',
                                        color: '#FFFFFF',
                                        background: '#0052FF',
                                        border: 'none',
                                        cursor: 'pointer',
                                        boxShadow: '0 12px 30px rgba(0, 82, 255, 0.35)',
                                        transition: 'background 200ms ease-out, box-shadow 200ms ease-out, transform 200ms ease-out',
                                        transform: editHovered ? 'translateY(-1px)' : 'translateY(0)'
                                    }}
                                    onMouseEnter={() => setEditHovered(true)}
                                    onMouseLeave={() => setEditHovered(false)}
                                >
                                    <Pencil style={{ width: 14, height: 14 }} />
                                    Edit Profile
                                </button>
                            ) : isOwner ? (
                                <button
                                    onClick={handleSave}
                                    disabled={loading}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        padding: '9px 18px',
                                        borderRadius: 999,
                                        fontWeight: 600,
                                        fontSize: 13,
                                        letterSpacing: 0.3,
                                        textTransform: 'uppercase',
                                        color: '#FFFFFF',
                                        background: loading ? '#16A34A' : '#059669',
                                        border: 'none',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        opacity: loading ? 0.85 : 1,
                                        boxShadow: '0 10px 25px rgba(5, 150, 105, 0.35)',
                                        transition: 'background 200ms ease-out, box-shadow 200ms ease-out, transform 200ms ease-out'
                                    }}
                                >
                                    {loading ? (
                                        <>
                                            <div
                                                style={{
                                                    width: 16,
                                                    height: 16,
                                                    borderRadius: '50%',
                                                    border: '2px solid rgba(255,255,255,0.6)',
                                                    borderTopColor: 'transparent',
                                                    animation: 'spin 800ms linear infinite'
                                                }}
                                            />
                                            Saving
                                        </>
                                    ) : (
                                        <>
                                            <Save style={{ width: 14, height: 14 }} />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            ) : null}

                            <button
                                data-menu-button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                onMouseEnter={() => setMenuHovered(true)}
                                onMouseLeave={() => setMenuHovered(false)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 40,
                                    height: 40,
                                    borderRadius: 999,
                                    border: '1px solid #E5E7EB',
                                    background: menuHovered ? '#EEF2FF' : '#FFFFFF',
                                    cursor: 'pointer',
                                    transition: 'background 200ms ease-out, border-color 200ms ease-out',
                                    boxShadow: '0 4px 10px rgba(15, 23, 42, 0.08)'
                                }}
                            >
                                <Menu style={{ width: 18, height: 18, color: '#111827' }} />
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
                            inset: 0,
                            background: 'rgba(15, 23, 42, 0.40)',
                            zIndex: 30,
                            animation: 'fadeIn 200ms ease-out'
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
                        background: '#FFFFFF',
                        boxShadow: '16px 0 45px rgba(15, 23, 42, 0.18)',
                        zIndex: 40,
                        transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
                        transition: 'transform 220ms ease-out',
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    {/* Sidebar Header */}
                    <div
                        style={{
                            padding: '20px 20px 16px',
                            borderBottom: '1px solid #E5E7EB',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}
                    >
                        <div>
                            <p
                                style={{
                                    fontSize: 11,
                                    letterSpacing: 1.8,
                                    textTransform: 'uppercase',
                                    color: '#9CA3AF',
                                    fontWeight: 500,
                                    margin: 0
                                }}
                            >
                                Navigation
                            </p>
                            <p
                                style={{
                                    fontSize: 13,
                                    color: '#4B5563',
                                    margin: '4px 0 0'
                                }}
                            >
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
                                transition: 'background 200ms ease-out, border-color 200ms ease-out'
                            }}
                        >
                            <X style={{ width: 16, height: 16, color: '#6B7280' }} />
                        </button>
                    </div>

                    {/* Sidebar Navigation */}
                    <div
                        style={{
                            flex: 1,
                            padding: '12px 8px'
                        }}
                    >
                        {[
                            {
                                label: 'Profile',
                                icon: UserCircle,
                                href: '/organization-profile'
                            },
                            {
                                label: 'Team',
                                icon: Users,
                                href: '/organization-team'
                            },
                            {
                                label: 'Post Job',
                                icon: Briefcase,
                                href: '/organization-jobpost'
                            },
                            {
                                label: 'Manage Jobs',
                                icon: FileText,
                                href: '/manage-jobs'
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
                    <div
                        style={{
                            borderTop: '1px solid #E5E7EB',
                            padding: '12px 12px 18px'
                        }}
                    >
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
                                color: '#B91C1C',
                                transition: 'background 200ms ease-out'
                            }}
                        >
                            <LogOut style={{ width: 18, height: 18, color: '#B91C1C' }} />
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
                            animation: 'fadeIn 200ms ease-out'
                        }}
                    >
                        <div
                            style={{
                                maxWidth: 360,
                                padding: '10px 12px',
                                borderRadius: 12,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                boxShadow: '0 18px 45px rgba(15, 23, 42, 0.12)',
                                background: message.type === 'success' ? '#ECFDF3' : '#FEF2F2',
                                color: message.type === 'success' ? '#166534' : '#B91C1C',
                                border: `1px solid ${
                                    message.type === 'success' ? '#BBF7D0' : '#FCA5A5'
                                }`
                            }}
                        >
                            {message.type === 'success' ? (
                                <CheckCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
                            ) : (
                                <X style={{ width: 16, height: 16, flexShrink: 0 }} />
                            )}
                            <span
                                style={{
                                    fontWeight: 500,
                                    fontSize: 13,
                                    lineHeight: 1.4
                                }}
                            >
                                {message.text}
                            </span>
                            <button
                                onClick={() => setMessage(null)}
                                style={{
                                    marginLeft: 'auto',
                                    background: 'transparent',
                                    border: 'none',
                                    borderRadius: 999,
                                    padding: 4,
                                    cursor: 'pointer'
                                }}
                            >
                                <X style={{ width: 12, height: 12 }} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Content */}
                <div
                    className="org-content"
                    style={{
                        margin: '0 auto',
                        padding: '24px 32px 40px'
                    }}
                >
                    {/* Bento-style overview row */}
                    <div
                        className="org-bento-grid"
                        style={{}}
                    >
                        {/* Org snapshot */}
                        <div
                            className="org-bento-company"
                            style={{
                                background: '#FFFFFF',
                                borderRadius: 12,
                                padding: 20,
                                boxShadow: '0 14px 40px rgba(15, 23, 42, 0.08)',
                                border: '1px solid #E5E7EB',
                                minHeight: 120
                            }}
                        >
                            <p
                                style={{
                                    fontSize: 12,
                                    fontWeight: 500,
                                    textTransform: 'uppercase',
                                    letterSpacing: 1.4,
                                    color: '#6B7280',
                                    margin: 0
                                }}
                            >
                                Company
                            </p>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 14,
                                    marginTop: 8
                                }}
                            >
                                <div
                                    style={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: 999,
                                        background: '#E5E7EB',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        overflow: 'hidden',
                                        flexShrink: 0
                                    }}
                                >
                                    {data.logoUrl ? (
                                        <img
                                            src={getStorageUrl(data.logoUrl)}
                                            alt="Logo"
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover'
                                            }}
                                        />
                                    ) : (
                                        <Building2 style={{ width: 28, height: 28, color: '#9CA3AF' }} />
                                    )}
                                </div>
                                <div>
                                    <h2
                                        style={{
                                            margin: 0,
                                            fontSize: 18,
                                            fontWeight: 700,
                                            color: '#111827'
                                        }}
                                    >
                                        {data.companyName || 'Organization'}
                                    </h2>
                                    <p
                                        style={{
                                            fontSize: 13,
                                            color: '#6B7280',
                                            margin: '4px 0 0'
                                        }}
                                    >
                                        {data.industry} · {data.companySize} · Since {data.foundedYear}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Credits summary */}
                        <div
                            className="org-bento-credits"
                            style={{
                                background: '#FFFFFF',
                                borderRadius: 12,
                                padding: 20,
                                boxShadow: '0 14px 40px rgba(15, 23, 42, 0.08)',
                                border: '1px solid #E5E7EB',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                minHeight: 120
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: 12
                                }}
                            >
                                <div>
                                    <p
                                        style={{
                                            fontSize: 12,
                                            fontWeight: 500,
                                            textTransform: 'uppercase',
                                            letterSpacing: 1.4,
                                            color: '#6B7280',
                                            margin: 0
                                        }}
                                    >
                                        Credits
                                    </p>
                                    <p
                                        style={{
                                            fontSize: 28,
                                            fontWeight: 700,
                                            margin: '8px 0 0',
                                            color: '#0052FF',
                                            fontFamily:
                                                '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
                                        }}
                                    >
                                        {credits}
                                    </p>
                                </div>
                                {isOwner && (
                                    <button
                                        onClick={() => setShowBuyCreditsModal(true)}
                                        style={{
                                            padding: '6px 12px',
                                            borderRadius: 999,
                                            border: '1px solid #0052FF',
                                            background: '#0052FF',
                                            color: '#FFFFFF',
                                            fontSize: 11,
                                            fontWeight: 500,
                                            letterSpacing: 0.4,
                                            textTransform: 'uppercase',
                                            cursor: 'pointer',
                                            whiteSpace: 'nowrap',
                                            transition: 'background 200ms ease-out, border-color 200ms ease-out'
                                        }}
                                    >
                                        Buy Credits
                                    </button>
                                )}
                            </div>
                            <p
                                style={{
                                    marginTop: 8,
                                    fontSize: 12,
                                    color: '#6B7280'
                                }}
                            >
                                Available credits
                            </p>
                        </div>

                        {/* AI / Integration status */}
                        <div
                            className="org-bento-integrations"
                            style={{
                                background: '#FFFFFF',
                                borderRadius: 12,
                                padding: 20,
                                boxShadow: '0 14px 40px rgba(15, 23, 42, 0.08)',
                                border: '1px solid #E5E7EB',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 8,
                                minHeight: 120
                            }}
                        >
                            <p
                                style={{
                                    fontSize: 12,
                                    fontWeight: 500,
                                    textTransform: 'uppercase',
                                    letterSpacing: 1.4,
                                    color: '#6B7280',
                                    margin: 0
                                }}
                            >
                                Integrations
                            </p>
                            <div
                                style={{
                                    display: 'flex',
                                    gap: 16,
                                    fontSize: 12
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8
                                    }}
                                >
                                    <Linkedin
                                        style={{
                                            width: 16,
                                            height: 16,
                                            color: '#0A66C2'
                                        }}
                                    />
                                    <span
                                        style={{
                                            padding: '3px 8px',
                                            borderRadius: 999,
                                            background:
                                                linkedInConnected === true
                                                    ? '#ECFDF3'
                                                    : linkedInConnected === false
                                                    ? '#F3F4F6'
                                                    : '#F9FAFB',
                                            color:
                                                linkedInConnected === true
                                                    ? '#15803D'
                                                    : '#4B5563',
                                            fontWeight: 500
                                        }}
                                    >
                                        {linkedInConnected === true
                                            ? 'LinkedIn Connected'
                                            : 'LinkedIn Not Connected'}
                                    </span>
                                </div>
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    gap: 16,
                                    fontSize: 12
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8
                                    }}
                                >
                                    <Cloud
                                        style={{
                                            width: 16,
                                            height: 16,
                                            color: '#00A1E0'
                                        }}
                                    />
                                    <span
                                        style={{
                                            padding: '3px 8px',
                                            borderRadius: 999,
                                            background:
                                                salesforceConnected === true
                                                    ? '#ECFDF3'
                                                    : salesforceConnected === false
                                                    ? '#F3F4F6'
                                                    : '#F9FAFB',
                                            color:
                                                salesforceConnected === true
                                                    ? '#15803D'
                                                    : '#4B5563',
                                            fontWeight: 500
                                        }}
                                    >
                                        {salesforceConnected === true
                                            ? 'Salesforce Connected'
                                            : 'Salesforce Not Connected'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main cards */}
                    <SectionCard>
                        {renderBasicInfo()}
                    </SectionCard>

                    <SectionCard title="About Company" icon={FileText}>
                        {renderDescription()}
                    </SectionCard>

                    <SectionCard title="Social Links" icon={Globe}>
                        {renderLinks()}
                    </SectionCard>

                    {/* LinkedIn Connect - owner only, below Social Links */}
                    {isOwner && (
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                                gap: 16,
                                marginBottom: 16
                            }}
                        >
                            <div
                                style={{
                                    padding: '14px 16px',
                                    borderRadius: 10,
                                    border: '1px solid #E5E7EB',
                                    background: '#FFFFFF',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 8
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Linkedin style={{ width: 18, height: 18, color: '#0A66C2' }} />
                                    <span style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>
                                        LinkedIn Connect
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                    <span
                                        style={{
                                            padding: '3px 10px',
                                            borderRadius: 999,
                                            fontSize: 11,
                                            fontWeight: 600,
                                            background:
                                                linkedInConnected === true
                                                    ? '#ECFDF3'
                                                    : linkedInConnected === false
                                                    ? '#F3F4F6'
                                                    : '#F9FAFB',
                                            color:
                                                linkedInConnected === true
                                                    ? '#15803D'
                                                    : '#4B5563'
                                        }}
                                    >
                                        {linkedInConnected === true
                                            ? 'Connected'
                                            : linkedInConnected === false
                                            ? 'Not connected'
                                            : 'Checking…'}
                                    </span>
                                    {linkedInConnected === false && (
                                        <button
                                            type="button"
                                            disabled={linkedInConnecting}
                                            onClick={async () => {
                                                setLinkedInConnecting(true);
                                                try {
                                                    const res = await authenticatedFetch(
                                                        API_ENDPOINTS.LINKEDIN_CONNECT,
                                                        { method: 'GET' },
                                                        navigate
                                                    );
                                                    if (res?.ok) {
                                                        const data = await res.json();
                                                        if (data.authorization_url) {
                                                            window.location.href = data.authorization_url;
                                                        }
                                                    }
                                                } finally {
                                                    setLinkedInConnecting(false);
                                                }
                                            }}
                                            style={{
                                                padding: '6px 10px',
                                                borderRadius: 999,
                                                border: '1px solid #0A66C2',
                                                background: '#0A66C2',
                                                color: '#FFFFFF',
                                                fontSize: 11,
                                                fontWeight: 500,
                                                cursor: linkedInConnecting ? 'not-allowed' : 'pointer'
                                            }}
                                        >
                                            {linkedInConnecting ? 'Connecting…' : 'Connect'}
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div
                                style={{
                                    padding: '14px 16px',
                                    borderRadius: 10,
                                    border: '1px solid #E5E7EB',
                                    background: '#FFFFFF',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 8
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Cloud style={{ width: 18, height: 18, color: '#00A1E0' }} />
                                    <span style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>
                                        Salesforce Connect
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                    <span
                                        style={{
                                            padding: '3px 10px',
                                            borderRadius: 999,
                                            fontSize: 11,
                                            fontWeight: 600,
                                            background:
                                                salesforceConnected === true
                                                    ? '#ECFDF3'
                                                    : salesforceConnected === false
                                                    ? '#F3F4F6'
                                                    : '#F9FAFB',
                                            color:
                                                salesforceConnected === true
                                                    ? '#15803D'
                                                    : '#4B5563'
                                        }}
                                    >
                                        {salesforceConnected === true
                                            ? 'Connected'
                                            : salesforceConnected === false
                                            ? 'Not connected'
                                            : 'Checking…'}
                                    </span>
                                    {salesforceConnected === false && (
                                        <button
                                            type="button"
                                            disabled={salesforceConnecting}
                                            onClick={async () => {
                                                setSalesforceConnecting(true);
                                                try {
                                                    const res = await authenticatedFetch(
                                                        API_ENDPOINTS.SALESFORCE_CONNECT,
                                                        { method: 'GET' },
                                                        navigate
                                                    );
                                                    if (res?.ok) {
                                                        const data = await res.json();
                                                        if (data.authorization_url) {
                                                            window.location.href = data.authorization_url;
                                                        }
                                                    }
                                                } finally {
                                                    setSalesforceConnecting(false);
                                                }
                                            }}
                                            style={{
                                                padding: '6px 10px',
                                                borderRadius: 999,
                                                border: '1px solid #00A1E0',
                                                background: '#00A1E0',
                                                color: '#FFFFFF',
                                                fontSize: 11,
                                                fontWeight: 500,
                                                cursor: salesforceConnecting ? 'not-allowed' : 'pointer'
                                            }}
                                        >
                                            {salesforceConnecting ? 'Connecting…' : 'Connect'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

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
                                padding: '12px'
                            }}>
                                No transactions yet. Purchase credits to see your transaction history here.
                            </p>
                        ) : (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px'
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
                                                padding: '10px 12px',
                                                background: '#f9fafb',
                                                borderRadius: 8,
                                                border: '1px solid #e5e7eb',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'flex-start',
                                                gap: 12,
                                                transition: 'background 0.15s ease'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = '#f8fafc'}
                                        >
                                            <div style={{ flex: 1 }}>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 10,
                                                    marginBottom: 4
                                                }}>
                                                    {transaction.status === 'completed' ? (
                                                        <CheckCircle style={{
                                                            width: 16,
                                                            height: 16,
                                                            color: '#16a34a',
                                                            flexShrink: 0
                                                        }} />
                                                    ) : (
                                                        <div style={{
                                                            width: 16,
                                                            height: 16,
                                                            borderRadius: '50%',
                                                            background: transaction.status === 'created' ? '#fbbf24' : '#ef4444',
                                                            flexShrink: 0,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}>
                                                            <div style={{
                                                                width: 6,
                                                                height: 6,
                                                                borderRadius: '50%',
                                                                background: '#ffffff'
                                                            }} />
            </div>
                                                    )}
                                                    <div>
                                                        <div style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 6
                                                        }}>
                                                            <p style={{
                                                                fontSize: 14,
                                                                fontWeight: 600,
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
                                                            fontSize: 12,
                                                            color: '#64748b',
                                                            margin: '2px 0 0 0'
                                                        }}>
                                                            {formattedDate}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{
                                                textAlign: 'right',
                                                minWidth: 110
                                            }}>
                                                <p style={{
                                                    fontSize: 14,
                                                    fontWeight: 600,
                                                    color: '#16a34a',
                                                    margin: '0 0 2px 0'
                                                }}>
                                                    ${transaction.amount.toFixed(2)} {transaction.currency}
                                                </p>
                                                <p style={{
                                                    fontSize: 12,
                                                    color: '#2563eb',
                                                    fontWeight: 500,
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
                        setPaymentError(null);
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
                            1 credit = ${creditPriceUsd}
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
                                Total: ${numCreditsToBuy * creditPriceUsd}
                            </p>
                        </div>
                        
                        {paymentError && (
                            <div style={{
                                padding: '12px',
                                background: '#fef2f2',
                                border: '1px solid #fecaca',
                                borderRadius: '8px',
                                marginBottom: '16px',
                                color: '#991b1b',
                                fontSize: '14px'
                            }}>
                                {paymentError}
                            </div>
                        )}
                        <p style={{
                            fontSize: '13px',
                            color: '#64748b',
                            marginBottom: '12px'
                        }}>
                            Choose payment method:
                        </p>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px'
                        }}>
                            <button
                                onClick={() => handleBuyCredits('paypal')}
                                disabled={paymentLoading}
                                style={{
                                    padding: '10px 20px',
                                    background: paymentLoading ? '#94a3b8' : '#003087',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: '500',
                                    cursor: paymentLoading ? 'not-allowed' : 'pointer',
                                    transition: 'background 0.15s ease',
                                    fontSize: '14px'
                                }}
                            >
                                {paymentLoading ? 'Processing...' : 'Pay with PayPal'}
                            </button>
                            <button
                                onClick={() => handleBuyCredits('razorpay')}
                                disabled={paymentLoading}
                                style={{
                                    padding: '10px 20px',
                                    background: paymentLoading ? '#94a3b8' : '#3395ff',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: '500',
                                    cursor: paymentLoading ? 'not-allowed' : 'pointer',
                                    transition: 'background 0.15s ease',
                                    fontSize: '14px'
                                }}
                            >
                                {paymentLoading ? 'Processing...' : 'Pay with Razorpay (INR)'}
                            </button>
                        </div>
                        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => {
                                    setShowBuyCreditsModal(false);
                                    setNumCreditsToBuy(1);
                                    setPaymentError(null);
                                }}
                                disabled={paymentLoading}
                                style={{
                                    padding: '8px 16px',
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
