/**
 * Authentication utility functions
 * Handles token refresh and authenticated API calls
 */

import { API_ENDPOINTS } from '../config/api';

/**
 * Refresh the access token using the refresh token
 * @returns New access token or null if refresh fails
 */
export async function refreshAccessToken(): Promise<string | null> {
    try {
        const refreshToken = localStorage.getItem('refresh_token');
        
        if (!refreshToken) {
            return null;
        }

        const response = await fetch(API_ENDPOINTS.AUTH.REFRESH_TOKEN, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                refresh_token: refreshToken
            })
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        
        if (data.access_token) {
            localStorage.setItem('access_token', data.access_token);
            return data.access_token;
        }

        return null;
    } catch (error) {
        console.error('Token refresh error:', error);
        return null;
    }
}

/**
 * Clear all auth data and redirect to auth page
 */
export function clearAuthAndRedirect(navigate: (path: string) => void) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    navigate('/auth');
}

/**
 * Authenticated fetch wrapper that automatically handles token refresh
 * @param url - API endpoint URL
 * @param options - Fetch options
 * @param navigate - Navigation function for redirecting on auth failure
 * @returns Fetch response or null if unauthorized
 */
export async function authenticatedFetch(
    url: string,
    options: RequestInit = {},
    navigate: (path: string) => void
): Promise<Response | null> {
    let accessToken = localStorage.getItem('access_token');

    // Add authorization header
    const headers = new Headers(options.headers);
    if (accessToken) {
        headers.set('Authorization', `Bearer ${accessToken}`);
    }

    // Make the request
    let response = await fetch(url, {
        ...options,
        headers
    });

    // If 401, try to refresh token
    if (response.status === 401) {
        const newToken = await refreshAccessToken();

        if (newToken) {
            // Retry the request with new token
            headers.set('Authorization', `Bearer ${newToken}`);
            response = await fetch(url, {
                ...options,
                headers
            });

            // If still 401 after refresh, clear auth and redirect
            if (response.status === 401) {
                clearAuthAndRedirect(navigate);
                return null;
            }
        } else {
            // Refresh failed, clear auth and redirect
            clearAuthAndRedirect(navigate);
            return null;
        }
    }

    return response;
}



