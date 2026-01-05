// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  DEMO_REQUEST: `${API_BASE_URL}/api/demo-request`,
  HEALTH: `${API_BASE_URL}/health`,
  AUTH: {
    BASE: `${API_BASE_URL}/api/auth`,
    SIGNUP: `${API_BASE_URL}/api/auth/signup`,
    VERIFY_OTP: `${API_BASE_URL}/api/auth/verify-otp`,
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    LOGOUT: `${API_BASE_URL}/api/auth/logout`,
    FORGOT_PASSWORD: `${API_BASE_URL}/api/auth/forgot-password`,
    RESET_PASSWORD: `${API_BASE_URL}/api/auth/reset-password`,
    REFRESH_TOKEN: `${API_BASE_URL}/api/auth/refresh-token`,
  },
  USER_PROFILE: `${API_BASE_URL}/api/user-profile`,
  ORGANIZATION_PROFILE: `${API_BASE_URL}/api/organization-profile`,
  ORGANIZATION_TEAMS: `${API_BASE_URL}/api/organization-teams`,
  ORGANIZATION_JOBPOST: `${API_BASE_URL}/api/organization-jobpost`,
  ORGANIZATION_JOBPOST_ONGOING: `${API_BASE_URL}/api/organization-jobpost/ongoing`,
  ORGANIZATION_JOBPOST_CLOSED: `${API_BASE_URL}/api/organization-jobpost/closed`,
  GET_JOB_APPLICANTS: (jobId: string) => `${API_BASE_URL}/api/organization-jobpost/${jobId}/applicants`,
  UPDATE_APPLICANT_STATUS: (jobId: string, email: string) => `${API_BASE_URL}/api/organization-jobpost/${jobId}/applicant/${email}/status`,
  SEND_OFFER_LETTER: `${API_BASE_URL}/api/send-offer-letter`,
  SUBMIT_OFFER_RESPONSE: `${API_BASE_URL}/api/submit-offer-response`,
  JOBS: `${API_BASE_URL}/api/jobs`,
  JOBS_APPLIED: `${API_BASE_URL}/api/jobs/applied`,
  ADMIN_MANAGE_JOB_STATUS: `${API_BASE_URL}/api/admin/manage-job-status`,
  UPLOAD: `${API_BASE_URL}/api/upload`,
  PARSE_RESUME: `${API_BASE_URL}/api/parse-resume`,
} as const;

// Export the base URL for use in other files
export { API_BASE_URL };
export default API_ENDPOINTS;

