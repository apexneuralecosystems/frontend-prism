import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Pencil, Plus, Trash2, X, Save,
    Upload, CheckCircle, MapPin, Mail, Phone,
    Briefcase, GraduationCap, Award, Globe, Github, Linkedin, FileText, LogOut, User
} from 'lucide-react';
import { authenticatedFetch, clearAuthAndRedirect } from '../utils/auth';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';

// --- Types ---

interface Education {
    id: string;
    institute: string;
    degree: string;
    specialization: string;
    startDate: string;
    endDate: string;
    gradeType: 'Percentage' | 'CGPA';
    gradeValue: string;
}

interface Experience {
    id: string;
    company: string;
    role: string;
    location: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
    description: string;
}

interface Certification {
    id: string;
    name: string;
    organization: string;
    url: string;
    expiryDate: string;
    doesNotExpire: boolean;
}

interface UserProfileData {
    fullName: string;
    gender: string;
    dob: string;
    location: string;
    phone: string;
    email: string;
    profilePhoto: File | null;
    profilePhotoUrl: string;
    summary: string;
    education: Education[];
    skills: string[];
    experience: Experience[];
    certifications: Certification[];
    resume: File | null;
    resumeName: string;
    resumeUrl: string;
    githubUrl: string;
    linkedinUrl: string;
}

// --- Initial Data ---

const EMPTY_DATA: UserProfileData = {
    fullName: "",
    gender: "",
    dob: "",
    location: "",
    phone: "",
    email: "",
    profilePhoto: null,
    profilePhotoUrl: "",
    summary: "",
    education: [],
    skills: [],
    experience: [],
    certifications: [],
    resume: null,
    resumeName: "",
    resumeUrl: "",
    githubUrl: "",
    linkedinUrl: ""
};

// --- Helper Components ---

const SectionCard = ({
    title,
    icon: Icon,
    children
}: {
    title: string;
    icon?: any;
    children: React.ReactNode;
}) => {
    return (
        <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            border: '1px solid #e5e7eb',
            marginBottom: '24px',
            padding: '28px'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '24px',
                borderBottom: '2px solid #f3f4f6',
                paddingBottom: '12px'
            }}>
                {Icon && <Icon style={{ width: '22px', height: '22px', color: '#2563eb' }} />}
                <h2 style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    color: '#1f2937',
                    margin: 0
                }}>{title}</h2>
            </div>
            <div>
                {children}
            </div>
        </div>
    );
};

// --- Validation Functions ---
const validatePhone = (phone: string) => {
    if (!phone) return true; // Allow empty
    return /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/.test(phone);
};

const validateUrl = (url: string) => {
    if (!url) return true;
    return /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/.test(url);
};

const validateGrade = (value: string, type: 'Percentage' | 'CGPA') => {
    if (!value) return true;
    const num = parseFloat(value);
    if (isNaN(num)) return false;
    if (type === 'Percentage') {
        return num >= 0 && num <= 100;
    } else {
        return num >= 0 && num <= 10;
    }
};

const isValidNumber = (value: string) => {
    return /^\d*\.?\d*$/.test(value);
};

const isValidPhoneChar = (value: string) => {
    return /^[+\d\s\-()]*$/.test(value);
};

// --- Main Component ---

export function UserProfile() {
    const navigate = useNavigate();
    const [data, setData] = useState<UserProfileData>(EMPTY_DATA);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditMode, setIsEditMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        // Clear data on mount to prevent showing stale data
        setData(EMPTY_DATA);
        setIsLoading(true);

        // Check authentication
        const token = localStorage.getItem('access_token');
        const userData = localStorage.getItem('user');

        if (!token) {
            navigate('/auth');
            return;
        }

        // Check if user is actually a user (not organization)
        if (userData) {
            const parsedUser = JSON.parse(userData);
            if (parsedUser.user_type === 'organization') {
                navigate('/organization-profile');
                return;
            }
            // Only set email and name from localStorage, keep rest empty
            setData(prev => ({ 
                ...prev, 
                email: parsedUser.email || "", 
                fullName: parsedUser.name || "" 
            }));
        }

        // Fetch profile data
        const fetchProfile = async () => {
            try {
                const res = await authenticatedFetch(
                    API_ENDPOINTS.USER_PROFILE,
                    {
                        method: 'GET'
                    },
                    navigate
                );

                if (!res) {
                    setIsLoading(false);
                    return;
                }

                if (res.ok) {
                    const result = await res.json();
                    if (result.profile) {
                        // Merge fetched data with empty structure
                        setData(prev => ({ ...prev, ...result.profile }));
                    }
                } else if (res.status === 401) {
                    // Unauthorized - redirect to auth
                    clearAuthAndRedirect(navigate);
                }
            } catch (err) {
                console.error("Failed to fetch profile:", err);
                clearAuthAndRedirect(navigate);
            } finally {
                setIsLoading(false); // Set loading to false after fetch completes
            }
        };

        fetchProfile();
    }, [navigate]);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        // Phone validation
        if (data.phone && !validatePhone(data.phone)) {
            newErrors.phone = "Please enter a valid phone number (numbers, +, -, (), spaces only)";
        }

        // GitHub URL validation
        if (data.githubUrl && !validateUrl(data.githubUrl)) {
            newErrors.githubUrl = "Please enter a valid URL (e.g., https://github.com/username)";
        }

        // LinkedIn URL validation
        if (data.linkedinUrl && !validateUrl(data.linkedinUrl)) {
            newErrors.linkedinUrl = "Please enter a valid URL (e.g., https://linkedin.com/in/username)";
        }

        // Education validation
        data.education.forEach((edu, idx) => {
            if (edu.gradeValue && !validateGrade(edu.gradeValue, edu.gradeType)) {
                newErrors[`education_${idx}_grade`] = `${edu.gradeType} must be between 0-${edu.gradeType === 'Percentage' ? '100' : '10'}`;
            }
        });

        // Certification URL validation
        data.certifications.forEach((cert, idx) => {
            if (cert.url && !validateUrl(cert.url)) {
                newErrors[`cert_${idx}_url`] = "Please enter a valid URL";
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const saveToBackend = async (dataToSave: UserProfileData) => {
        setLoading(true);
        setMessage(null);
        try {
            // Handle profile photo upload
            if (dataToSave.profilePhoto instanceof File) {
                const formData = new FormData();
                formData.append('file', dataToSave.profilePhoto);

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
                    return false;
                }

                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    dataToSave.profilePhotoUrl = uploadData.url;
                    dataToSave.profilePhoto = null;
                } else {
                    setMessage({ type: 'error', text: 'Failed to upload profile photo' });
                    setLoading(false);
                    return false;
                }
            }

            // Handle resume upload
            if (dataToSave.resume instanceof File) {
                const formData = new FormData();
                formData.append('file', dataToSave.resume);

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
                    return false;
                }

                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    dataToSave.resumeUrl = uploadData.url;
                    dataToSave.resumeName = uploadData.filename;
                    dataToSave.resume = null;
                } else {
                    setMessage({ type: 'error', text: 'Failed to upload resume' });
                    setLoading(false);
                    return false;
                }
            }

            // Create clean copy for storage - remove File objects
            const finalData = { ...dataToSave };
            if (finalData.resume instanceof File) {
                // @ts-ignore
                finalData.resume = null;
            }
            if (finalData.profilePhoto instanceof File) {
                // @ts-ignore
                finalData.profilePhoto = null;
            }

            // Filter out empty strings from skills array
            finalData.skills = finalData.skills.filter(skill => skill && skill.trim() !== '');

            const res = await authenticatedFetch(
                API_ENDPOINTS.USER_PROFILE,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(finalData)
                },
                navigate
            );

            if (!res) {
                setLoading(false);
                return false;
            }

            if (res.ok) {
                setMessage({ type: 'success', text: 'Profile saved successfully!' });
                setIsEditMode(false);
                // Auto-hide success message after 3 seconds
                setTimeout(() => setMessage(null), 3000);
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

        await saveToBackend(data);
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
                console.error("Logout error", error); 
            }
        }
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        navigate("/auth");
    };

    const handleChange = (field: keyof UserProfileData, value: any) => {
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

    // --- Render Functions ---

    const renderBasicInfo = () => {
        if (!isEditMode) {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px' }}>
                        <div style={{
                            width: '140px',
                            height: '140px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            overflow: 'hidden',
                            boxShadow: '0 8px 16px rgba(102, 126, 234, 0.4)',
                            border: '4px solid #ffffff',
                            position: 'relative'
                        }}>
                            {data.profilePhotoUrl ? (
                                <img 
                                    src={data.profilePhotoUrl.startsWith('http') ? data.profilePhotoUrl : `${API_BASE_URL}${data.profilePhotoUrl}`}
                                    alt="Profile" 
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute' }}
                                />
                            ) : (
                                <User style={{ width: '70px', height: '70px', color: '#ffffff' }} />
                            )}
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                        <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
                                <User style={{ width: '16px', height: '16px' }} /> Name
                            </p>
                            <p style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a', margin: 0 }}>{data.fullName}</p>
                        </div>
                        <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
                                <MapPin style={{ width: '16px', height: '16px' }} /> Location
                            </p>
                            <p style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a', margin: 0 }}>{data.location || "Not specified"}</p>
                        </div>
                        <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
                                <Mail style={{ width: '16px', height: '16px' }} /> Email
                            </p>
                            <p style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a', margin: 0 }}>{data.email}</p>
                        </div>
                        <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
                                <Phone style={{ width: '16px', height: '16px' }} /> Phone
                            </p>
                            <p style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a', margin: 0 }}>{data.phone || "Not specified"}</p>
                        </div>
                        <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '6px', fontWeight: '500' }}>Gender</p>
                            <p style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a', margin: 0 }}>{data.gender || "Not specified"}</p>
                        </div>
                        <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '6px', fontWeight: '500' }}>Date of Birth</p>
                            <p style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a', margin: 0 }}>{data.dob || "Not specified"}</p>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div style={{
                        width: '140px',
                        height: '140px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        flexShrink: 0,
                        boxShadow: '0 8px 16px rgba(102, 126, 234, 0.4)',
                        border: '4px solid #ffffff'
                    }}>
                        {data.profilePhotoUrl ? (
                            <img 
                                src={data.profilePhotoUrl.startsWith('http') ? data.profilePhotoUrl : `${API_BASE_URL}${data.profilePhotoUrl}`} 
                                alt="Profile" 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : (
                            <User style={{ width: '70px', height: '70px', color: '#ffffff' }} />
                        )}
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Profile Photo</label>
                        <input
                            type="file"
                            accept="image/*"
                            style={{
                                display: 'block',
                                width: '100%',
                                fontSize: '14px',
                                color: '#4b5563',
                                padding: '10px',
                                border: '2px dashed #d1d5db',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                background: '#f9fafb'
                            }}
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    const url = URL.createObjectURL(file);
                                    handleChange('profilePhoto', file);
                                    handleChange('profilePhotoUrl', url);
                                }
                            }}
                        />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '18px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                            Full Name <span style={{ fontSize: '12px', color: '#9ca3af' }}>(Read Only)</span>
                        </label>
                        <input
                            type="text"
                            value={data.fullName}
                            readOnly
                            disabled
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                background: '#f3f4f6',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                color: '#6b7280',
                                fontSize: '14px',
                                cursor: 'not-allowed'
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Gender</label>
                        <select
                            value={data.gender}
                            onChange={e => handleChange('gender', e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                background: '#ffffff',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                fontSize: '14px',
                                color: '#111827',
                                cursor: 'pointer',
                                outline: 'none'
                            }}
                        >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Date of Birth</label>
                        <input
                            type="date"
                            value={data.dob}
                            onChange={e => handleChange('dob', e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                background: '#ffffff',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                fontSize: '14px',
                                color: '#111827',
                                outline: 'none'
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Location</label>
                        <input
                            type="text"
                            placeholder="City, State, Country"
                            value={data.location}
                            onChange={e => handleChange('location', e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                background: '#ffffff',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                fontSize: '14px',
                                color: '#111827',
                                outline: 'none'
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                            Phone Number <span style={{ color: '#9ca3af', fontSize: '12px' }}>(Numbers only)</span>
                        </label>
                        <input
                            type="tel"
                            placeholder="+1 234 567 8900"
                            value={data.phone}
                            onChange={e => {
                                const value = e.target.value;
                                // Only allow valid phone characters
                                if (isValidPhoneChar(value)) {
                                    handleChange('phone', value);
                                }
                            }}
                            onBlur={() => {
                                // Validate on blur
                                if (data.phone && !validatePhone(data.phone)) {
                                    setErrors(prev => ({ ...prev, phone: "Please enter a valid phone number" }));
                                } else {
                                    setErrors(prev => {
                                        const newErrors = { ...prev };
                                        delete newErrors.phone;
                                        return newErrors;
                                    });
                                }
                            }}
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                background: '#ffffff',
                                border: errors.phone ? '2px solid #ef4444' : '1px solid #d1d5db',
                                borderRadius: '8px',
                                fontSize: '14px',
                                color: '#111827',
                                outline: 'none'
                            }}
                        />
                        {errors.phone && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', fontWeight: '500' }}>⚠️ {errors.phone}</p>}
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                            Email Address <span style={{ fontSize: '12px', color: '#9ca3af' }}>(Read Only)</span>
                        </label>
                        <input
                            type="email"
                            value={data.email}
                            readOnly
                            disabled
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                background: '#f3f4f6',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                color: '#6b7280',
                                fontSize: '14px',
                                cursor: 'not-allowed'
                            }}
                        />
                    </div>
                </div>
            </div>
        );
    };

    const renderSummary = () => {
        if (!isEditMode) {
            return (
                <p style={{
                    color: '#374151',
                    lineHeight: '1.7',
                    fontSize: '15px',
                    margin: 0,
                    padding: '16px',
                    background: '#f8fafc',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0'
                }}>
                    {data.summary || "No summary added yet."}
                </p>
            );
        }
        return (
            <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Profile Summary</label>
                <textarea
                    value={data.summary}
                    onChange={e => handleChange('summary', e.target.value)}
                    placeholder="Write a short professional summary about yourself..."
                    rows={5}
                    style={{
                        width: '100%',
                        padding: '12px 14px',
                        background: '#ffffff',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: '#111827',
                        outline: 'none',
                        resize: 'vertical',
                        fontFamily: 'inherit',
                        lineHeight: '1.6'
                    }}
                />
            </div>
        );
    };

    const renderSkills = () => {
        const predefinedSkills = ['React', 'Angular', 'Vue', 'Python', 'Java', 'SQL', 'MongoDB', 'Node.js', 'Machine Learning', 'AWS', 'Docker', 'Kubernetes'];

        if (!isEditMode) {
            return (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {data.skills.map(skill => (
                        <span key={skill} style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: '#ffffff',
                            padding: '8px 20px',
                            borderRadius: '25px',
                            fontSize: '14px',
                            fontWeight: '500',
                            boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                            border: 'none'
                        }}>
                            {skill}
                        </span>
                    ))}
                    {data.skills.length === 0 && <p style={{ color: '#6b7280', fontStyle: 'italic', fontSize: '14px' }}>No skills added yet.</p>}
                </div>
            );
        }

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                    {data.skills.map(skill => (
                        <span key={skill} style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: '#ffffff',
                            padding: '8px 16px',
                            borderRadius: '25px',
                            fontSize: '14px',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
                        }}>
                            {skill}
                            <button
                                onClick={() => handleChange('skills', data.skills.filter(s => s !== skill))}
                                style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    border: 'none',
                                    borderRadius: '50%',
                                    padding: '2px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <X style={{ width: '14px', height: '14px', color: '#ffffff' }} />
                            </button>
                        </span>
                    ))}
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Add Skills</label>
                    <select
                        value=""
                        onChange={e => {
                            const selectedValue = e.target.value.trim();
                            if (selectedValue && !data.skills.includes(selectedValue)) {
                                handleChange('skills', [...data.skills, selectedValue]);
                            }
                        }}
                        style={{
                            width: '100%',
                            padding: '10px 14px',
                            background: '#ffffff',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '14px',
                            color: '#111827',
                            marginBottom: '12px',
                            cursor: 'pointer',
                            outline: 'none'
                        }}
                    >
                        <option value="">Select a skill...</option>
                        {predefinedSkills.filter(s => !data.skills.includes(s)).map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                    
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                            id="custom-skill"
                            type="text"
                            placeholder="Or type custom skill and click Add"
                            style={{
                                flex: 1,
                                padding: '10px 14px',
                                background: '#ffffff',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                fontSize: '14px',
                                color: '#111827',
                                outline: 'none'
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const input = e.currentTarget;
                                    const value = input.value.trim();
                                    if (value && !data.skills.includes(value)) {
                                        handleChange('skills', [...data.skills, value]);
                                        input.value = "";
                                    }
                                }
                            }}
                        />
                        <button
                            onClick={() => {
                                const input = document.getElementById('custom-skill') as HTMLInputElement;
                                const value = input.value.trim();
                                if (value && !data.skills.includes(value)) {
                                    handleChange('skills', [...data.skills, value]);
                                    input.value = "";
                                }
                            }}
                            style={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: '#ffffff',
                                padding: '10px 24px',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: '500',
                                border: 'none',
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
                            }}
                        >
                            Add
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderEducation = () => {
        const addEdu = () => {
            const newEdu: Education = {
                id: Date.now().toString(),
                institute: '', degree: '', specialization: '', startDate: '', endDate: '', gradeType: 'Percentage', gradeValue: ''
            };
            handleChange('education', [...data.education, newEdu]);
        };

        const updateEdu = (index: number, field: keyof Education, val: string) => {
            const newEdus = [...data.education];
            newEdus[index] = { ...newEdus[index], [field]: val };
            handleChange('education', newEdus);
        };

        const removeEdu = (index: number) => {
            const newEdus = data.education.filter((_, i) => i !== index);
            handleChange('education', newEdus);
        };

        if (!isEditMode) {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {data.education.map(edu => (
                        <div key={edu.id} style={{
                            display: 'flex',
                            gap: '16px',
                            alignItems: 'flex-start',
                            padding: '20px',
                            background: 'linear-gradient(135deg, #e0f2fe 0%, #e0e7ff 100%)',
                            borderRadius: '12px',
                            border: '1px solid #dbeafe',
                            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)'
                        }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                            }}>
                                <GraduationCap style={{ width: '24px', height: '24px', color: '#ffffff' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontWeight: '600', color: '#111827', fontSize: '16px', margin: 0 }}>{edu.degree} {edu.specialization ? `in ${edu.specialization}` : ''}</h3>
                                <p style={{ color: '#4b5563', fontWeight: '500', marginTop: '4px', fontSize: '14px' }}>{edu.institute}</p>
                                <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '8px' }}>{edu.startDate} - {edu.endDate} • {edu.gradeType}: {edu.gradeValue}</p>
                            </div>
                        </div>
                    ))}
                    {data.education.length === 0 && <p style={{ color: '#6b7280', fontStyle: 'italic', fontSize: '14px' }}>No education details added yet.</p>}
                </div>
            );
        }

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {data.education.map((edu, idx) => (
                    <div key={edu.id} style={{
                        padding: '24px',
                        paddingRight: '70px',
                        background: '#fafafa',
                        borderRadius: '12px',
                        position: 'relative',
                        border: '1px solid #e5e7eb'
                    }}>
                        <button
                            onClick={() => removeEdu(idx)}
                            style={{
                                position: 'absolute',
                                top: '16px',
                                right: '16px',
                                color: '#ef4444',
                                background: '#fef2f2',
                                padding: '10px',
                                borderRadius: '8px',
                                border: '1px solid #fee2e2',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 2px 4px rgba(239, 68, 68, 0.1)',
                                transition: 'all 0.2s'
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
                            <Trash2 style={{ width: '18px', height: '18px' }} />
                        </button>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                            gap: '14px'
                        }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Institute / College</label>
                                <input
                                    type="text"
                                    value={edu.institute}
                                    onChange={e => updateEdu(idx, 'institute', e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        background: '#ffffff',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        color: '#111827',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Degree / Course</label>
                                <input
                                    type="text"
                                    value={edu.degree}
                                    onChange={e => updateEdu(idx, 'degree', e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        background: '#ffffff',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        color: '#111827',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Specialization / Stream</label>
                                <input
                                    type="text"
                                    value={edu.specialization}
                                    onChange={e => updateEdu(idx, 'specialization', e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        background: '#ffffff',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        color: '#111827',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Start Date</label>
                                <input
                                    type="month"
                                    value={edu.startDate}
                                    onChange={e => updateEdu(idx, 'startDate', e.target.value)}
                                    max={edu.endDate || undefined}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        background: '#ffffff',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        color: '#111827',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>End Date</label>
                                <input
                                    type="month"
                                    value={edu.endDate}
                                    onChange={e => updateEdu(idx, 'endDate', e.target.value)}
                                    min={edu.startDate || undefined}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        background: '#ffffff',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        color: '#111827',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                                    Grade Value <span style={{ color: '#9ca3af', fontSize: '11px' }}>(Numbers only)</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder={edu.gradeType === 'Percentage' ? '0-100' : '0-10'}
                                    value={edu.gradeValue}
                                    onChange={e => {
                                        const value = e.target.value;
                                        // Only allow numbers and decimal
                                        if (isValidNumber(value)) {
                                            updateEdu(idx, 'gradeValue', value);
                                        }
                                    }}
                                    onBlur={() => {
                                        // Validate on blur
                                        const errorKey = `education_${idx}_grade`;
                                        if (edu.gradeValue && !validateGrade(edu.gradeValue, edu.gradeType)) {
                                            setErrors(prev => ({ 
                                                ...prev, 
                                                [errorKey]: `${edu.gradeType} must be 0-${edu.gradeType === 'Percentage' ? '100' : '10'}` 
                                            }));
                                        } else {
                                            setErrors(prev => {
                                                const newErrors = { ...prev };
                                                delete newErrors[errorKey];
                                                return newErrors;
                                            });
                                        }
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        background: '#ffffff',
                                        border: errors[`education_${idx}_grade`] ? '2px solid #ef4444' : '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        color: '#111827',
                                        outline: 'none'
                                    }}
                                />
                                {errors[`education_${idx}_grade`] && (
                                    <p style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px', fontWeight: '500' }}>
                                        ⚠️ {errors[`education_${idx}_grade`]}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Grade Type</label>
                                <select
                                    value={edu.gradeType}
                                    onChange={e => updateEdu(idx, 'gradeType', e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        background: '#ffffff',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        color: '#111827',
                                        outline: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option>Percentage</option>
                                    <option>CGPA</option>
                                </select>
                            </div>
                        </div>
                    </div>
                ))}
                <button
                    onClick={addEdu}
                    style={{
                        color: '#2563eb',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: '#eff6ff',
                        padding: '12px 20px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        border: '1px solid #bfdbfe',
                        cursor: 'pointer'
                    }}
                >
                    <Plus style={{ width: '18px', height: '18px' }} /> Add Education
                </button>
            </div>
        );
    };

    const renderExperience = () => {
        const addExp = () => {
            handleChange('experience', [...data.experience, {
                id: Date.now().toString(),
                company: '', role: '', location: '', startDate: '', endDate: '', isCurrent: false, description: ''
            }]);
        };

        const updateExp = (index: number, field: keyof Experience, val: any) => {
            const newExps = [...data.experience];
            newExps[index] = { ...newExps[index], [field]: val };
            handleChange('experience', newExps);
        };

        const removeExp = (index: number) => {
            handleChange('experience', data.experience.filter((_, i) => i !== index));
        };

        if (!isEditMode) {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {data.experience.map(exp => (
                        <div key={exp.id} style={{
                            display: 'flex',
                            gap: '16px',
                            padding: '20px',
                            background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                            borderRadius: '12px',
                            border: '1px solid #a7f3d0',
                            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)'
                        }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                            }}>
                                <Briefcase style={{ width: '24px', height: '24px', color: '#ffffff' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontWeight: '600', color: '#111827', fontSize: '16px', margin: 0 }}>{exp.role}</h3>
                                <p style={{ fontWeight: '500', color: '#4b5563', marginTop: '4px', fontSize: '14px' }}>{exp.company}</p>
                                <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '8px' }}>{exp.startDate} - {exp.isCurrent ? 'Present' : exp.endDate} • {exp.location}</p>
                                <p style={{ fontSize: '14px', color: '#4b5563', marginTop: '12px', lineHeight: '1.6' }}>{exp.description}</p>
                            </div>
                        </div>
                    ))}
                    {data.experience.length === 0 && <p style={{ color: '#6b7280', fontStyle: 'italic', fontSize: '14px' }}>No experience added yet.</p>}
                </div>
            );
        }

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {data.experience.map((exp, idx) => (
                    <div key={exp.id} style={{
                        padding: '24px',
                        paddingRight: '70px',
                        background: '#fafafa',
                        borderRadius: '12px',
                        position: 'relative',
                        border: '1px solid #e5e7eb'
                    }}>
                        <button
                            onClick={() => removeExp(idx)}
                            style={{
                                position: 'absolute',
                                top: '16px',
                                right: '16px',
                                color: '#ef4444',
                                background: '#fef2f2',
                                padding: '10px',
                                borderRadius: '8px',
                                border: '1px solid #fee2e2',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 2px 4px rgba(239, 68, 68, 0.1)',
                                transition: 'all 0.2s'
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
                            <Trash2 style={{ width: '18px', height: '18px' }} />
                        </button>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                            gap: '14px'
                        }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Company Name</label>
                                <input
                                    type="text"
                                    value={exp.company}
                                    onChange={e => updateExp(idx, 'company', e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        background: '#ffffff',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        color: '#111827',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Role / Position</label>
                                <input
                                    type="text"
                                    value={exp.role}
                                    onChange={e => updateExp(idx, 'role', e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        background: '#ffffff',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        color: '#111827',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Location</label>
                                <input
                                    type="text"
                                    value={exp.location}
                                    onChange={e => updateExp(idx, 'location', e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        background: '#ffffff',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        color: '#111827',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Start Date</label>
                                <input
                                    type="month"
                                    value={exp.startDate}
                                    onChange={e => updateExp(idx, 'startDate', e.target.value)}
                                    max={exp.endDate || undefined}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        background: '#ffffff',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        color: '#111827',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>End Date</label>
                                <input
                                    type="month"
                                    value={exp.endDate}
                                    disabled={exp.isCurrent}
                                    onChange={e => updateExp(idx, 'endDate', e.target.value)}
                                    min={exp.startDate || undefined}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        background: exp.isCurrent ? '#f3f4f6' : '#ffffff',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        color: exp.isCurrent ? '#9ca3af' : '#111827',
                                        outline: 'none',
                                        cursor: exp.isCurrent ? 'not-allowed' : 'auto'
                                    }}
                                />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', paddingTop: '24px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={exp.isCurrent}
                                        onChange={e => updateExp(idx, 'isCurrent', e.target.checked)}
                                        style={{
                                            width: '18px',
                                            height: '18px',
                                            cursor: 'pointer',
                                            accentColor: '#667eea'
                                        }}
                                    />
                                    <span style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>Currently Working Here</span>
                                </label>
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Description</label>
                                <textarea
                                    value={exp.description}
                                    onChange={e => updateExp(idx, 'description', e.target.value)}
                                    rows={3}
                                    placeholder="Describe your role and responsibilities..."
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        background: '#ffffff',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        color: '#111827',
                                        outline: 'none',
                                        resize: 'vertical',
                                        fontFamily: 'inherit',
                                        lineHeight: '1.5'
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                ))}
                <button
                    onClick={addExp}
                    style={{
                        color: '#2563eb',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: '#eff6ff',
                        padding: '12px 20px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        border: '1px solid #bfdbfe',
                        cursor: 'pointer'
                    }}
                >
                    <Plus style={{ width: '18px', height: '18px' }} /> Add Experience
                </button>
            </div>
        );
    };

    const renderCertifications = () => {
        const addCert = () => {
            handleChange('certifications', [...data.certifications, {
                id: Date.now().toString(), name: '', organization: '', url: '', expiryDate: '', doesNotExpire: false
            }]);
        };

        const updateCert = (index: number, field: keyof Certification, val: any) => {
            const newCerts = [...data.certifications];
            newCerts[index] = { ...newCerts[index], [field]: val };
            handleChange('certifications', newCerts);
        };

        const removeCert = (index: number) => {
            handleChange('certifications', data.certifications.filter((_, i) => i !== index));
        };

        if (!isEditMode) {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {data.certifications.map(cert => (
                        <div key={cert.id} style={{
                            display: 'flex',
                            gap: '16px',
                            alignItems: 'flex-start',
                            padding: '20px',
                            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                            borderRadius: '12px',
                            border: '1px solid #fde68a',
                            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)'
                        }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                            }}>
                                <Award style={{ width: '24px', height: '24px', color: '#ffffff' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontWeight: '600', color: '#111827', fontSize: '16px', margin: 0 }}>{cert.name}</p>
                                <p style={{ fontSize: '14px', color: '#4b5563', marginTop: '4px' }}>{cert.organization}</p>
                                {cert.expiryDate && !cert.doesNotExpire && (
                                    <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '8px' }}>Expires: {cert.expiryDate}</p>
                                )}
                            </div>
                        </div>
                    ))}
                    {data.certifications.length === 0 && <p style={{ color: '#6b7280', fontStyle: 'italic', fontSize: '14px' }}>No certifications added yet.</p>}
                </div>
            );
        }

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {data.certifications.map((cert, idx) => (
                    <div key={cert.id} style={{
                        padding: '24px',
                        paddingRight: '70px',
                        background: '#fafafa',
                        borderRadius: '12px',
                        position: 'relative',
                        border: '1px solid #e5e7eb'
                    }}>
                        <button
                            onClick={() => removeCert(idx)}
                            style={{
                                position: 'absolute',
                                top: '16px',
                                right: '16px',
                                color: '#ef4444',
                                background: '#fef2f2',
                                padding: '10px',
                                borderRadius: '8px',
                                border: '1px solid #fee2e2',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 2px 4px rgba(239, 68, 68, 0.1)',
                                transition: 'all 0.2s'
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
                            <Trash2 style={{ width: '18px', height: '18px' }} />
                        </button>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                            gap: '14px'
                        }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Certificate Name</label>
                                <input
                                    type="text"
                                    value={cert.name}
                                    onChange={e => updateCert(idx, 'name', e.target.value)}
                                    placeholder="e.g., AWS Certified Developer"
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        background: '#ffffff',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        color: '#111827',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Organization</label>
                                <input
                                    type="text"
                                    value={cert.organization}
                                    onChange={e => updateCert(idx, 'organization', e.target.value)}
                                    placeholder="e.g., Amazon Web Services"
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        background: '#ffffff',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        color: '#111827',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                ))}
                <button
                    onClick={addCert}
                    style={{
                        color: '#2563eb',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: '#eff6ff',
                        padding: '12px 20px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        border: '1px solid #bfdbfe',
                        cursor: 'pointer'
                    }}
                >
                    <Plus style={{ width: '18px', height: '18px' }} /> Add Certification
                </button>
            </div>
        );
    };

    const renderResume = () => {
        if (!isEditMode) {
            return (
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                        <FileText className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-base">{data.resumeName || "No Resume Uploaded"}</p>
                        {data.resumeUrl && (
                            <a
                                href={`${API_BASE_URL}${data.resumeUrl}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm text-blue-600 font-medium hover:underline mt-1 inline-block"
                            >
                                Download Resume
                            </a>
                        )}
                    </div>
                </div>
            );
        }

        return (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    id="resume-upload"
                    onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                            // Validate file type
                            if (!file.name.toLowerCase().endsWith('.pdf')) {
                                alert('Please upload only PDF files');
                                return;
                            }
                            handleChange('resume', file);
                            handleChange('resumeName', file.name);
                        }
                    }}
                />
                <label htmlFor="resume-upload" className="cursor-pointer block">
                    <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-700 font-medium mb-1 text-sm">Click to upload resume</p>
                    <p className="text-xs text-gray-500">PDF only (Max 5MB)</p>
                    {data.resumeName && (
                        <p className="mt-3 text-blue-600 font-medium flex items-center justify-center gap-2 text-sm">
                            <CheckCircle className="w-4 h-4" /> {data.resumeName}
                        </p>
                    )}
                </label>
            </div>
        );
    };

    const renderLinks = () => {
        if (!isEditMode) {
            return (
                <div className="space-y-3">
                    {data.githubUrl && (
                        <a
                            href={data.githubUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                        >
                            <Github className="w-5 h-5 text-gray-700" />
                            <span className="text-blue-600 group-hover:underline font-medium text-sm">{data.githubUrl}</span>
                        </a>
                    )}
                    {data.linkedinUrl && (
                        <a
                            href={data.linkedinUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                        >
                            <Linkedin className="w-5 h-5 text-blue-600" />
                            <span className="text-blue-600 group-hover:underline font-medium text-sm">{data.linkedinUrl}</span>
                        </a>
                    )}
                    {!data.githubUrl && !data.linkedinUrl && <p className="text-gray-500 italic text-sm">No links added yet.</p>}
                </div>
            );
        }

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                    <label style={{ display: 'flex', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px', alignItems: 'center', gap: '6px' }}>
                        <Github style={{ width: '16px', height: '16px' }} /> GitHub URL
                        <span style={{ color: '#9ca3af', fontSize: '12px', fontWeight: 'normal' }}>(Must start with https://)</span>
                    </label>
                    <input
                        type="url"
                        placeholder="https://github.com/username"
                        value={data.githubUrl}
                        onChange={e => handleChange('githubUrl', e.target.value)}
                        onBlur={() => {
                            if (data.githubUrl && !validateUrl(data.githubUrl)) {
                                setErrors(prev => ({ ...prev, githubUrl: "Please enter a valid URL starting with http:// or https://" }));
                            } else {
                                setErrors(prev => {
                                    const newErrors = { ...prev };
                                    delete newErrors.githubUrl;
                                    return newErrors;
                                });
                            }
                        }}
                        style={{
                            width: '100%',
                            padding: '10px 14px',
                            background: '#ffffff',
                            border: errors.githubUrl ? '2px solid #ef4444' : '1px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '14px',
                            color: '#111827',
                            outline: 'none'
                        }}
                    />
                    {errors.githubUrl && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', fontWeight: '500' }}>⚠️ {errors.githubUrl}</p>}
                </div>
                <div>
                    <label style={{ display: 'flex', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px', alignItems: 'center', gap: '6px' }}>
                        <Linkedin style={{ width: '16px', height: '16px' }} /> LinkedIn URL
                        <span style={{ color: '#9ca3af', fontSize: '12px', fontWeight: 'normal' }}>(Must start with https://)</span>
                    </label>
                    <input
                        type="url"
                        placeholder="https://linkedin.com/in/username"
                        value={data.linkedinUrl}
                        onChange={e => handleChange('linkedinUrl', e.target.value)}
                        onBlur={() => {
                            if (data.linkedinUrl && !validateUrl(data.linkedinUrl)) {
                                setErrors(prev => ({ ...prev, linkedinUrl: "Please enter a valid URL starting with http:// or https://" }));
                            } else {
                                setErrors(prev => {
                                    const newErrors = { ...prev };
                                    delete newErrors.linkedinUrl;
                                    return newErrors;
                                });
                            }
                        }}
                        style={{
                            width: '100%',
                            padding: '10px 14px',
                            background: '#ffffff',
                            border: errors.linkedinUrl ? '2px solid #ef4444' : '1px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '14px',
                            color: '#111827',
                            outline: 'none'
                        }}
                    />
                    {errors.linkedinUrl && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', fontWeight: '500' }}>⚠️ {errors.linkedinUrl}</p>}
                </div>
            </div>
        );
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
        }}>
            {/* Header */}
            <div style={{
                background: '#ffffff',
                borderBottom: '1px solid #e5e7eb',
                position: 'sticky',
                top: 0,
                zIndex: 1000,
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
            }}>
                <div style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    padding: '20px 28px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <h1 style={{
                            fontSize: '26px',
                            fontWeight: '700',
                            color: '#1f2937',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            margin: 0
                        }}>
                            <User style={{ width: '30px', height: '30px', color: '#667eea' }} />
                            Candidate Profile
                        </h1>
                        <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Manage your professional information</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {!isEditMode ? (
                            <button
                                onClick={() => setIsEditMode(true)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '12px 24px',
                                    borderRadius: '10px',
                                    fontWeight: '600',
                                    color: '#ffffff',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    fontSize: '14px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                                    transition: 'transform 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <Pencil style={{ width: '18px', height: '18px' }} />
                                Edit Profile
                            </button>
                        ) : (
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '12px 24px',
                                    borderRadius: '10px',
                                    fontWeight: '600',
                                    color: '#ffffff',
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    fontSize: '14px',
                                    border: 'none',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    opacity: loading ? 0.6 : 1,
                                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                                    transition: 'transform 0.2s'
                                }}
                                onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')}
                                onMouseLeave={(e) => !loading && (e.currentTarget.style.transform = 'translateY(0)')}
                            >
                                {loading ? (
                                    <>
                                        <div style={{
                                            width: '18px',
                                            height: '18px',
                                            border: '3px solid white',
                                            borderTop: '3px solid transparent',
                                            borderRadius: '50%',
                                            animation: 'spin 1s linear infinite'
                                        }}></div>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save style={{ width: '18px', height: '18px' }} />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        )}
                        <button
                            onClick={handleLogout}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '12px 24px',
                                borderRadius: '10px',
                                fontWeight: '600',
                                color: '#ffffff',
                                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                fontSize: '14px',
                                border: 'none',
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
                                transition: 'transform 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <LogOut style={{ width: '18px', height: '18px' }} />
                            Logout
                        </button>
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>

            {/* Message Toast */}
            {message && (
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 28px', marginTop: '20px' }}>
                    <div style={{
                        padding: '16px 20px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
                        background: message.type === 'success' ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' : 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                        color: message.type === 'success' ? '#065f46' : '#991b1b',
                        border: message.type === 'success' ? '1px solid #a7f3d0' : '1px solid #fecaca'
                    }}>
                        {message.type === 'success' ? (
                            <CheckCircle style={{ width: '22px', height: '22px', flexShrink: 0 }} />
                        ) : (
                            <X style={{ width: '22px', height: '22px', flexShrink: 0 }} />
                        )}
                        <span style={{ fontWeight: '500', fontSize: '14px', flex: 1 }}>{message.text}</span>
                        <button
                            onClick={() => setMessage(null)}
                            style={{
                                marginLeft: 'auto',
                                background: 'rgba(0,0,0,0.05)',
                                borderRadius: '6px',
                                padding: '6px',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            <X style={{ width: '16px', height: '16px' }} />
                        </button>
                    </div>
                </div>
            )}

            {/* Loading State */}
            {isLoading ? (
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 28px', paddingTop: '80px', paddingBottom: '80px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{
                            width: '60px',
                            height: '60px',
                            border: '5px solid #667eea',
                            borderTop: '5px solid transparent',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            marginBottom: '20px'
                        }}></div>
                        <p style={{ color: '#6b7280', fontSize: '15px', fontWeight: '500' }}>Loading your profile...</p>
                    </div>
                </div>
            ) : (
                /* Content */
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 28px' }}>
                    <SectionCard title="Basic Information">
                        {renderBasicInfo()}
                    </SectionCard>

                    <SectionCard title="Profile Summary" icon={FileText}>
                        {renderSummary()}
                    </SectionCard>

                    <SectionCard title="Key Skills" icon={Award}>
                        {renderSkills()}
                    </SectionCard>

                    <SectionCard title="Education" icon={GraduationCap}>
                        {renderEducation()}
                    </SectionCard>

                    <SectionCard title="Work Experience" icon={Briefcase}>
                        {renderExperience()}
                    </SectionCard>

                    <SectionCard title="Certifications" icon={Award}>
                        {renderCertifications()}
                    </SectionCard>

                    <SectionCard title="Resume" icon={FileText}>
                        {renderResume()}
                    </SectionCard>

                    <SectionCard title="Social Links" icon={Globe}>
                        {renderLinks()}
                    </SectionCard>
                </div>
            )}
        </div>
    );
}