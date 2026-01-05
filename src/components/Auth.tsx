import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Mail, Lock, User, Key, Loader2, Check, X } from "lucide-react";
import { API_ENDPOINTS } from "../config/api";

type AuthState = "signin" | "signup" | "otp";

interface PasswordValidation {
    minLength: boolean;
    hasUpperCase: boolean;
    hasLowerCase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
}

export function Auth() {
    const navigate = useNavigate();
    const [authState, setAuthState] = useState<AuthState>("signin");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const [userType, setUserType] = useState<"user" | "organization">("user");

    const [formData, setFormData] = useState({
        email: "",
        password: "",
        name: "",
        otp: ""
    });

    const [passwordValidation, setPasswordValidation] = useState<PasswordValidation>({
        minLength: false,
        hasUpperCase: false,
        hasLowerCase: false,
        hasNumber: false,
        hasSpecialChar: false
    });

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        const user = localStorage.getItem("user");
        if (token && user) {
            const userData = JSON.parse(user);
            console.log("User logged in:", userData);
            // Redirect logged-in users to appropriate profile
            if (userData.user_type === "organization") {
                navigate("/organization-profile");
            } else {
                navigate("/user-profile");
            }
        }
    }, [navigate]);

    const validatePassword = (password: string): PasswordValidation => {
        return {
            minLength: password.length >= 8,
            hasUpperCase: /[A-Z]/.test(password),
            hasLowerCase: /[a-z]/.test(password),
            hasNumber: /\d/.test(password),
            hasSpecialChar: /[@$!%*?&]/.test(password)
        };
    };

    const isPasswordValid = (validation: PasswordValidation): boolean => {
        return Object.values(validation).every(v => v === true);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        setError("");

        // Validate password in real-time (only for signup)
        if (name === "password" && authState === "signup") {
            const validation = validatePassword(value);
            setPasswordValidation(validation);
        }
    };

    const parseError = (data: any) => {
        if (typeof data.detail === "string") return data.detail;
        if (Array.isArray(data.detail)) {
            return data.detail.map((err: any) => err.msg).join(", ");
        }
        return "Something went wrong";
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        // Validate password before submitting
        const validation = validatePassword(formData.password);
        if (!isPasswordValid(validation)) {
            setError("Please ensure your password meets all requirements");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch(API_ENDPOINTS.AUTH.SIGNUP, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    name: formData.name,
                    user_type: userType
                })
            });

            // Check if response has content before parsing
            const text = await res.text();
            let data;
            
            if (text) {
                try {
                    data = JSON.parse(text);
                } catch (parseError) {
                    // If parsing fails, use the text as error message
                    throw new Error(text || "Invalid response from server");
                }
            } else {
                // Empty response
                if (!res.ok) {
                    throw new Error(`Server error: ${res.status} ${res.statusText}`);
                }
                data = {};
            }

            if (!res.ok) {
                throw new Error(parseError(data));
            }

            setAuthState("otp");
            setSuccessMsg(`OTP sent to ${formData.email}. Please verify.`);
            // Reset password validation when moving to OTP
            setPasswordValidation({
                minLength: false,
                hasUpperCase: false,
                hasLowerCase: false,
                hasNumber: false,
                hasSpecialChar: false
            });
        } catch (err: any) {
            setError(err.message || "An error occurred during signup");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch(API_ENDPOINTS.AUTH.VERIFY_OTP, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    name: formData.name,
                    user_type: userType,
                    otp: formData.otp
                })
            });

            // Check if response has content before parsing
            const text = await res.text();
            let data;
            
            if (text) {
                try {
                    data = JSON.parse(text);
                } catch (parseError) {
                    throw new Error(text || "Invalid response from server");
                }
            } else {
                if (!res.ok) {
                    throw new Error(`Server error: ${res.status} ${res.statusText}`);
                }
                data = {};
            }

            if (!res.ok) throw new Error(parseError(data));

            // Store tokens and user data
            localStorage.setItem("access_token", data.access_token);
            localStorage.setItem("refresh_token", data.refresh_token);
            localStorage.setItem("user", JSON.stringify(data.user));

            console.log("OTP verified, user:", data.user);

            // Show success message
            setSuccessMsg("Account created successfully! Redirecting...");
            setError("");

            // Redirect based on user type after a short delay
            setTimeout(() => {
                if (data.user.user_type === "organization") {
                    navigate("/organization-profile");
                } else {
                    navigate("/user-profile");
                }
            }, 1500);
        } catch (err: any) {
            setError(err.message || "An error occurred during OTP verification");
            setSuccessMsg("");
        } finally {
            setLoading(false);
        }
    };

    const handleSignin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    user_type: userType
                })
            });

            // Check if response has content before parsing
            const text = await res.text();
            let data;
            
            if (text) {
                try {
                    data = JSON.parse(text);
                } catch (parseError) {
                    throw new Error(text || "Invalid response from server");
                }
            } else {
                if (!res.ok) {
                    throw new Error(`Server error: ${res.status} ${res.statusText}`);
                }
                data = {};
            }

            if (!res.ok) throw new Error(parseError(data));

            // Store tokens and user data
            localStorage.setItem("access_token", data.access_token);
            localStorage.setItem("refresh_token", data.refresh_token);
            localStorage.setItem("user", JSON.stringify(data.user));

            console.log("Signed in, user:", data.user);

            // Redirect based on user type
            if (data.user.user_type === "organization") {
                navigate("/organization-profile");
            } else {
                navigate("/user-profile");
            }
        } catch (err: any) {
            setError(err.message || "An error occurred during sign in");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: "100vh",
            background: "#f9fafb",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "48px 16px"
        }}>
            <div style={{
                margin: "0 auto",
                width: "100%",
                maxWidth: "440px"
            }}>
                <div style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "32px"
                }}>
                    <div style={{
                        width: "40px",
                        height: "40px",
                        background: "linear-gradient(135deg, #0052FF 0%, #00A3FF 100%)",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                    }}>
                        <span style={{
                            color: "white",
                            fontWeight: "700",
                            fontSize: "20px"
                        }}>A</span>
                    </div>
                    <div>
                        <h2 style={{
                            fontSize: "24px",
                            fontWeight: "700",
                            color: "#111827",
                            margin: "0",
                            lineHeight: "1"
                        }}>PRISM</h2>
                        <p style={{
                            fontSize: "11px",
                            color: "#0052FF",
                            fontWeight: "600",
                            margin: "2px 0 0 0",
                            letterSpacing: "0.5px"
                        }}>Authentication</p>
                    </div>
                </div>

                <h2 style={{
                    marginTop: "0",
                    marginBottom: "24px",
                    textAlign: "center",
                    fontSize: "28px",
                    fontWeight: "800",
                    color: "#111827",
                    lineHeight: "1.2"
                }}>
                    {authState === "signin" && "Sign in to your account"}
                    {authState === "signup" && "Create your account"}
                    {authState === "otp" && "Verify your email"}
                </h2>

                {authState !== "otp" && (
                    <div style={{
                        marginBottom: "20px",
                        display: "flex",
                        justifyContent: "center"
                    }}>
                        <div style={{
                            background: "#e5e7eb",
                            padding: "4px",
                            borderRadius: "8px",
                            display: "inline-flex"
                        }}>
                            <button
                                onClick={() => setUserType("user")}
                                style={{
                                    padding: "8px 24px",
                                    borderRadius: "6px",
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    transition: "all 0.2s",
                                    border: "none",
                                    cursor: "pointer",
                                    background: userType === "user" ? "white" : "transparent",
                                    color: userType === "user" ? "#111827" : "#6b7280",
                                    boxShadow: userType === "user" ? "0 1px 2px 0 rgba(0, 0, 0, 0.05)" : "none"
                                }}
                            >
                                Candidate
                            </button>
                            <button
                                onClick={() => setUserType("organization")}
                                style={{
                                    padding: "8px 24px",
                                    borderRadius: "6px",
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    transition: "all 0.2s",
                                    border: "none",
                                    cursor: "pointer",
                                    background: userType === "organization" ? "white" : "transparent",
                                    color: userType === "organization" ? "#111827" : "#6b7280",
                                    boxShadow: userType === "organization" ? "0 1px 2px 0 rgba(0, 0, 0, 0.05)" : "none"
                                }}
                            >
                                Organization
                            </button>
                        </div>
                    </div>
                )}

                <p style={{
                    marginTop: "12px",
                    marginBottom: "32px",
                    textAlign: "center",
                    fontSize: "14px",
                    color: "#6b7280"
                }}>
                    {authState === "signin" && (
                        <>
                            New here?{' '}
                            <button onClick={() => {
                                setAuthState("signup");
                                setPasswordValidation({
                                    minLength: false,
                                    hasUpperCase: false,
                                    hasLowerCase: false,
                                    hasNumber: false,
                                    hasSpecialChar: false
                                });
                            }} style={{
                                fontWeight: "500",
                                color: "#0052FF",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                textDecoration: "none"
                            }}>
                                Create an account
                            </button>
                        </>
                    )}
                    {authState === "signup" && (
                        <>
                            Already have an account?{' '}
                            <button onClick={() => {
                                setAuthState("signin");
                                setPasswordValidation({
                                    minLength: false,
                                    hasUpperCase: false,
                                    hasLowerCase: false,
                                    hasNumber: false,
                                    hasSpecialChar: false
                                });
                            }} style={{
                                fontWeight: "500",
                                color: "#0052FF",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                textDecoration: "none"
                            }}>
                                Sign in
                            </button>
                        </>
                    )}
                    {authState === "otp" && (
                        <span style={{ color: "#6b7280" }}>We sent a code to {formData.email}</span>
                    )}
                </p>
            </div>

            <div style={{
                margin: "0 auto",
                width: "100%",
                maxWidth: "440px"
            }}>
                <div style={{
                    background: "white",
                    padding: "40px",
                    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
                    borderRadius: "12px",
                    border: "1px solid #f3f4f6"
                }}>

                    {error && (
                        <div style={{
                            marginBottom: "20px",
                            background: "#fef2f2",
                            borderLeft: "4px solid #f87171",
                            padding: "16px",
                            borderRadius: "4px"
                        }}>
                            <div style={{ display: "flex", alignItems: "flex-start" }}>
                                <div style={{ flexShrink: 0 }}>
                                    <svg style={{ height: "20px", width: "20px", color: "#f87171" }} viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div style={{ marginLeft: "12px" }}>
                                    <p style={{ fontSize: "14px", color: "#991b1b", margin: 0 }}>{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {successMsg && (
                        <div style={{
                            marginBottom: "20px",
                            background: "#f0fdf4",
                            borderLeft: "4px solid #4ade80",
                            padding: "16px",
                            borderRadius: "4px"
                        }}>
                            <div style={{ display: "flex" }}>
                                <div style={{ marginLeft: "0" }}>
                                    <p style={{ fontSize: "14px", color: "#166534", margin: 0 }}>{successMsg}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

                        {authState === "signup" && (
                            <div>
                                <label htmlFor="name" style={{
                                    display: "block",
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    color: "#374151",
                                    marginBottom: "6px"
                                }}>
                                    Full Name
                                </label>
                                <div style={{ position: "relative" }}>
                                    <div style={{
                                        position: "absolute",
                                        top: "50%",
                                        left: "12px",
                                        transform: "translateY(-50%)",
                                        pointerEvents: "none"
                                    }}>
                                        <User style={{ height: "20px", width: "20px", color: "#9ca3af" }} />
                                    </div>
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        required
                                        style={{
                                            width: "100%",
                                            paddingLeft: "44px",
                                            paddingRight: "12px",
                                            height: "44px",
                                            fontSize: "14px",
                                            border: "1px solid #d1d5db",
                                            borderRadius: "8px",
                                            outline: "none",
                                            transition: "all 0.2s",
                                            boxSizing: "border-box"
                                        }}
                                        placeholder="John Doe"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = "#0052FF";
                                            e.target.style.boxShadow = "0 0 0 3px rgba(0, 82, 255, 0.1)";
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = "#d1d5db";
                                            e.target.style.boxShadow = "none";
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {(authState === "signin" || authState === "signup") && (
                            <>
                                <div>
                                    <label htmlFor="email" style={{
                                        display: "block",
                                        fontSize: "14px",
                                        fontWeight: "500",
                                        color: "#374151",
                                        marginBottom: "6px"
                                    }}>
                                        Email address
                                    </label>
                                    <div style={{ position: "relative" }}>
                                        <div style={{
                                            position: "absolute",
                                            top: "50%",
                                            left: "12px",
                                            transform: "translateY(-50%)",
                                            pointerEvents: "none"
                                        }}>
                                            <Mail style={{ height: "20px", width: "20px", color: "#9ca3af" }} />
                                        </div>
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            required
                                            style={{
                                                width: "100%",
                                                paddingLeft: "44px",
                                                paddingRight: "12px",
                                                height: "44px",
                                                fontSize: "14px",
                                                border: "1px solid #d1d5db",
                                                borderRadius: "8px",
                                                outline: "none",
                                                transition: "all 0.2s",
                                                boxSizing: "border-box"
                                            }}
                                            placeholder="you@example.com"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            onFocus={(e) => {
                                                e.target.style.borderColor = "#0052FF";
                                                e.target.style.boxShadow = "0 0 0 3px rgba(0, 82, 255, 0.1)";
                                            }}
                                            onBlur={(e) => {
                                                e.target.style.borderColor = "#d1d5db";
                                                e.target.style.boxShadow = "none";
                                            }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="password" style={{
                                        display: "block",
                                        fontSize: "14px",
                                        fontWeight: "500",
                                        color: "#374151",
                                        marginBottom: "6px"
                                    }}>
                                        Password
                                    </label>
                                    <div style={{ position: "relative" }}>
                                        <div style={{
                                            position: "absolute",
                                            top: "50%",
                                            left: "12px",
                                            transform: "translateY(-50%)",
                                            pointerEvents: "none"
                                        }}>
                                            <Lock style={{ height: "20px", width: "20px", color: "#9ca3af" }} />
                                        </div>
                                        <input
                                            id="password"
                                            name="password"
                                            type="password"
                                            required
                                            style={{
                                                width: "100%",
                                                paddingLeft: "44px",
                                                paddingRight: "12px",
                                                height: "44px",
                                                fontSize: "14px",
                                                border: formData.password && authState === "signup" && !isPasswordValid(passwordValidation)
                                                    ? "1px solid #f87171"
                                                    : "1px solid #d1d5db",
                                                borderRadius: "8px",
                                                outline: "none",
                                                transition: "all 0.2s",
                                                boxSizing: "border-box"
                                            }}
                                            placeholder="••••••••"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            onFocus={(e) => {
                                                e.target.style.borderColor = "#0052FF";
                                                e.target.style.boxShadow = "0 0 0 3px rgba(0, 82, 255, 0.1)";
                                            }}
                                            onBlur={(e) => {
                                                if (authState === "signup" && !isPasswordValid(passwordValidation)) {
                                                    e.target.style.borderColor = "#f87171";
                                                } else {
                                                    e.target.style.borderColor = "#d1d5db";
                                                }
                                                e.target.style.boxShadow = "none";
                                            }}
                                        />
                                    </div>
                                    {authState === "signup" && formData.password && (
                                        <div style={{
                                            marginTop: "12px",
                                            padding: "12px",
                                            background: "#f9fafb",
                                            borderRadius: "8px",
                                            border: "1px solid #e5e7eb"
                                        }}>
                                            <p style={{
                                                fontSize: "12px",
                                                fontWeight: "500",
                                                color: "#374151",
                                                margin: "0 0 8px 0"
                                            }}>
                                                Password requirements:
                                            </p>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                    {passwordValidation.minLength ? (
                                                        <Check style={{ height: "14px", width: "14px", color: "#10b981", flexShrink: 0 }} />
                                                    ) : (
                                                        <X style={{ height: "14px", width: "14px", color: "#ef4444", flexShrink: 0 }} />
                                                    )}
                                                    <span style={{
                                                        fontSize: "12px",
                                                        color: passwordValidation.minLength ? "#10b981" : "#6b7280"
                                                    }}>
                                                        At least 8 characters
                                                    </span>
                                                </div>
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                    {passwordValidation.hasUpperCase ? (
                                                        <Check style={{ height: "14px", width: "14px", color: "#10b981", flexShrink: 0 }} />
                                                    ) : (
                                                        <X style={{ height: "14px", width: "14px", color: "#ef4444", flexShrink: 0 }} />
                                                    )}
                                                    <span style={{
                                                        fontSize: "12px",
                                                        color: passwordValidation.hasUpperCase ? "#10b981" : "#6b7280"
                                                    }}>
                                                        At least one uppercase letter (A-Z)
                                                    </span>
                                                </div>
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                    {passwordValidation.hasLowerCase ? (
                                                        <Check style={{ height: "14px", width: "14px", color: "#10b981", flexShrink: 0 }} />
                                                    ) : (
                                                        <X style={{ height: "14px", width: "14px", color: "#ef4444", flexShrink: 0 }} />
                                                    )}
                                                    <span style={{
                                                        fontSize: "12px",
                                                        color: passwordValidation.hasLowerCase ? "#10b981" : "#6b7280"
                                                    }}>
                                                        At least one lowercase letter (a-z)
                                                    </span>
                                                </div>
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                    {passwordValidation.hasNumber ? (
                                                        <Check style={{ height: "14px", width: "14px", color: "#10b981", flexShrink: 0 }} />
                                                    ) : (
                                                        <X style={{ height: "14px", width: "14px", color: "#ef4444", flexShrink: 0 }} />
                                                    )}
                                                    <span style={{
                                                        fontSize: "12px",
                                                        color: passwordValidation.hasNumber ? "#10b981" : "#6b7280"
                                                    }}>
                                                        At least one number (0-9)
                                                    </span>
                                                </div>
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                    {passwordValidation.hasSpecialChar ? (
                                                        <Check style={{ height: "14px", width: "14px", color: "#10b981", flexShrink: 0 }} />
                                                    ) : (
                                                        <X style={{ height: "14px", width: "14px", color: "#ef4444", flexShrink: 0 }} />
                                                    )}
                                                    <span style={{
                                                        fontSize: "12px",
                                                        color: passwordValidation.hasSpecialChar ? "#10b981" : "#6b7280"
                                                    }}>
                                                        At least one special character (@$!%*?&)
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {authState === "otp" && (
                            <div>
                                <label htmlFor="otp" style={{
                                    display: "block",
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    color: "#374151",
                                    marginBottom: "6px"
                                }}>
                                    Enter 6-digit OTP
                                </label>
                                <div style={{ position: "relative" }}>
                                    <div style={{
                                        position: "absolute",
                                        top: "50%",
                                        left: "12px",
                                        transform: "translateY(-50%)",
                                        pointerEvents: "none"
                                    }}>
                                        <Key style={{ height: "20px", width: "20px", color: "#9ca3af" }} />
                                    </div>
                                    <input
                                        id="otp"
                                        name="otp"
                                        type="text"
                                        required
                                        maxLength={6}
                                        style={{
                                            width: "100%",
                                            paddingLeft: "44px",
                                            paddingRight: "12px",
                                            height: "44px",
                                            fontSize: "18px",
                                            border: "1px solid #d1d5db",
                                            borderRadius: "8px",
                                            outline: "none",
                                            transition: "all 0.2s",
                                            letterSpacing: "0.25em",
                                            boxSizing: "border-box"
                                        }}
                                        placeholder="123456"
                                        value={formData.otp}
                                        onChange={handleInputChange}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = "#0052FF";
                                            e.target.style.boxShadow = "0 0 0 3px rgba(0, 82, 255, 0.1)";
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = "#d1d5db";
                                            e.target.style.boxShadow = "none";
                                        }}
                                    />
                                </div>
                                <p style={{
                                    marginTop: "8px",
                                    fontSize: "13px",
                                    color: "#6b7280",
                                    margin: "8px 0 0 0"
                                }}>
                                    Please check your email {formData.email} for the code.
                                </p>
                            </div>
                        )}

                        <div>
                            <button
                                onClick={
                                    authState === "signin" ? handleSignin :
                                        authState === "signup" ? handleSignup :
                                            handleVerifyOTP
                                }
                                style={{
                                    width: "100%",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    padding: "12px 16px",
                                    border: "none",
                                    borderRadius: "8px",
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    color: "white",
                                    background: (authState === "signup" && formData.password && !isPasswordValid(passwordValidation)) || loading
                                        ? "#9ca3af"
                                        : "#0052FF",
                                    cursor: (authState === "signup" && formData.password && !isPasswordValid(passwordValidation)) || loading
                                        ? "not-allowed"
                                        : "pointer",
                                    opacity: loading ? 0.7 : 1,
                                    transition: "all 0.2s"
                                }}
                                disabled={loading || (authState === "signup" ? (formData.password ? !isPasswordValid(passwordValidation) : false) : false)}
                                onMouseEnter={(e) => {
                                    if (!loading) e.currentTarget.style.background = "#0046DD";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = "#0052FF";
                                }}
                            >
                                {loading ? (
                                    <Loader2 style={{ height: "20px", width: "20px" }} className="animate-spin" />
                                ) : (
                                    <>
                                        {authState === "signin" && "Sign in"}
                                        {authState === "signup" && "Create account"}
                                        {authState === "otp" && "Verify & Continue"}
                                        <ArrowRight style={{ marginLeft: "8px", height: "16px", width: "16px" }} />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {authState === "otp" && (
                        <div style={{ marginTop: "24px" }}>
                            <button
                                onClick={() => {
                                    setAuthState("signup");
                                    setPasswordValidation({
                                        minLength: false,
                                        hasUpperCase: false,
                                        hasLowerCase: false,
                                        hasNumber: false,
                                        hasSpecialChar: false
                                    });
                                }}
                                style={{
                                    width: "100%",
                                    textAlign: "center",
                                    fontSize: "14px",
                                    color: "#6b7280",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: "8px"
                                }}
                            >
                                Change email or try again
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}