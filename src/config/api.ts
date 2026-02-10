
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://prism.backend.apexneural.cloud';

/** S3 bucket region - must match prism-bucket-10 (ap-south-2) */
const S3_REGION = 'ap-south-2';

/**
 * Parse S3 URL to get bucket and key.
 */
function parseS3Url(url: string): { bucket: string; key: string } | null {
  if (!url || !url.includes('amazonaws.com')) return null;
  try {
    const afterProto = url.split('://')[1] || '';
    const host = afterProto.split('/')[0] || '';
    const path = afterProto.includes('/') ? afterProto.split('/').slice(1).join('/') : '';
    if (path && (host.includes('.s3-website.') || host.includes('.s3.'))) {
      const bucket = host.includes('.s3-website.') ? host.split('.s3-website.')[0] : host.split('.s3.')[0];
      return { bucket, key: path };
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Convert any S3 URL to Object URL format: https://bucket.s3.ap-south-2.amazonaws.com/key
 * Uses ap-south-2 explicitly everywhere.
 */
export function ensureHttpsForStorageUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') return url || '';
  const u = url.trim();
  if (!u.startsWith('http') || !u.includes('amazonaws.com')) return u;
  const parsed = parseS3Url(u);
  if (parsed) {
    return `https://${parsed.bucket}.s3.${S3_REGION}.amazonaws.com/${parsed.key}`;
  }
  return u.startsWith('http://') ? u.replace('http://', 'https://') : u;
}

/**
 * Returns the storage URL. S3 URLs are normalized to Object URL format (HTTPS, ap-south-2).
 * Relative paths use API_BASE_URL.
 */
export function getStorageUrl(pathOrUrl: string | null | undefined): string {
  if (!pathOrUrl || typeof pathOrUrl !== 'string') return pathOrUrl || '';
  const u = pathOrUrl.trim();
  if (u.startsWith('http')) return ensureHttpsForStorageUrl(u);
  const base = u.startsWith('/') ? '' : '/';
  return `${API_BASE_URL}${base}${u}`;
}
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
  ORGANIZATION_MEMBERS: `${API_BASE_URL}/api/organization/members`,
  INVITE_MEMBER: `${API_BASE_URL}/api/organization/invite-member`,
  INVITE_MEMBERS_BULK: `${API_BASE_URL}/api/organization/invite-members-bulk`,
  RESEND_INVITE: `${API_BASE_URL}/api/organization/resend-invite`,
  RESPOND_INVITE: `${API_BASE_URL}/api/organization/respond-invite`,
  ORGANIZATION_JOBPOST: `${API_BASE_URL}/api/organization-jobpost`,
  ORGANIZATION_JOBPOST_ONGOING: `${API_BASE_URL}/api/organization-jobpost/ongoing`,
  ORGANIZATION_JOBPOST_CLOSED: `${API_BASE_URL}/api/organization-jobpost/closed`,
  GET_JOB_APPLICANTS: (jobId: string) => `${API_BASE_URL}/api/organization-jobpost/${jobId}/applicants`,
  UPDATE_APPLICANT_STATUS: (jobId: string, email: string) => `${API_BASE_URL}/api/organization-jobpost/${jobId}/applicant/${email}/status`,
  CREATE_REVIEW_REQUEST: `${API_BASE_URL}/api/review-request`,
  SEND_OFFER_LETTER: `${API_BASE_URL}/api/send-offer-letter`,
  SUBMIT_OFFER_RESPONSE: `${API_BASE_URL}/api/submit-offer-response`,
  JOBS: `${API_BASE_URL}/api/jobs`,
  GET_JOB: (jobId: string) => `${API_BASE_URL}/api/jobs/${jobId}`,
  PUBLIC_GET_JOB: (jobId: string) => `${API_BASE_URL}/api/public/jobs/${jobId}`,
  JOBS_APPLIED: `${API_BASE_URL}/api/jobs/applied`,
  ADMIN_MANAGE_JOB_STATUS: `${API_BASE_URL}/api/admin/manage-job-status`,
  UPLOAD: `${API_BASE_URL}/api/upload`,
  PARSE_RESUME: `${API_BASE_URL}/api/parse-resume`,
  BUY_CREDITS: `${API_BASE_URL}/api/payments/buy-credits`,
  CAPTURE_ORDER: `${API_BASE_URL}/api/payments/capture-order`,
  ORGANIZATION_CREDITS: `${API_BASE_URL}/api/organization/credits`,
  PAYMENT_HISTORY: `${API_BASE_URL}/api/organization/payment-history`,
  // LinkedIn (org-only)
  LINKEDIN_CONNECT: `${API_BASE_URL}/api/oauth/linkedin/connect`,
  LINKEDIN_STATUS: `${API_BASE_URL}/api/oauth/linkedin/status`,
  LINKEDIN_POST_JOB: (jobId: string) => `${API_BASE_URL}/api/organization-jobpost/${jobId}/post-linkedin`,
} as const;

// Export the base URL for use in other files
export { API_BASE_URL };
export default API_ENDPOINTS;

