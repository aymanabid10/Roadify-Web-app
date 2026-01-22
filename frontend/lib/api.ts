const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Types matching the backend DTOs
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  userId: string;
  token: string;
  newPassword: string;
}

export interface ConfirmEmailRequest {
  userId: string;
  token: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  username: string;
}

export interface ErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}

export interface MessageResponse {
  message: string;
}

class ApiError extends Error {
  constructor(
    public status: number,
    public data: ErrorResponse
  ) {
    super(data.message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Merge existing headers
  if (options.headers) {
    const existingHeaders = options.headers as Record<string, string>;
    Object.assign(headers, existingHeaders);
  }

  // Add auth token if available
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData: ErrorResponse = await response.json().catch(() => ({
      message: 'An unexpected error occurred',
    }));
    throw new ApiError(response.status, errorData);
  }

  return response.json();
}

export const authApi = {
  register: (data: RegisterRequest) =>
    fetchApi<MessageResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: LoginRequest) =>
    fetchApi<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  logout: (refreshToken: string) =>
    fetchApi<MessageResponse>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),

  refresh: (refreshToken: string) =>
    fetchApi<AuthResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),

  validate: () =>
    fetchApi<{ valid: boolean; username: string }>('/auth/validate'),

  confirmEmail: (data: ConfirmEmailRequest) =>
    fetchApi<AuthResponse>('/auth/confirm-email', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  resendConfirmation: (email: string) =>
    fetchApi<MessageResponse>('/auth/resend-confirmation', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  forgotPassword: (email: string) =>
    fetchApi<MessageResponse>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (data: ResetPasswordRequest) =>
    fetchApi<MessageResponse>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export { ApiError };
