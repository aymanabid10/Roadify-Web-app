const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5170/api';

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
}

// JWT payload structure (decoded from accessToken)
export interface JwtPayload {
  nameid: string; // ClaimTypes.NameIdentifier
  unique_name: string; // ClaimTypes.Name (username)
  role?: string | string[]; // Short form
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"?: string | string[]; // Full URI form
  exp: number;
  iss: string;
  aud: string;
}

// Helper to extract roles from JWT payload
export function extractRoles(payload: JwtPayload): string[] {
  // Try short form first, then full URI form
  const roleValue = payload.role || payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
  
  if (!roleValue) return [];
  return Array.isArray(roleValue) ? roleValue : [roleValue];
}

// Decode JWT token without verification (verification is done server-side)
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export interface ErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}

export interface MessageResponse {
  message: string;
}

// Admin User Management Types
export interface UserResponseDto {
  id: string;
  userName: string | null;
  email: string | null;
  emailConfirmed: boolean;
  phoneNumber: string | null;
  phoneNumberConfirmed: boolean;
  twoFactorEnabled: boolean;
  lockoutEnd: string | null;
  lockoutEnabled: boolean;
  accessFailedCount: number;
  roles: string[];
  isDeleted: boolean;
  deletedAt: string | null;
}

export interface UserDetailsDto extends UserResponseDto {
  vehiclesCount: number;
  listingsCount: number;
  expertisesCount: number;
  reviewsCount: number;
  mediaCount: number;
}

export interface UpdateUserDto {
  userName?: string;
  email?: string;
  emailConfirmed?: boolean;
  phoneNumber?: string;
  phoneNumberConfirmed?: boolean;
  twoFactorEnabled?: boolean;
  lockoutEnabled?: boolean;
  lockoutEnd?: string;
  roles?: string[];
}

export interface UserFilterRequest {
  searchTerm?: string;
  role?: string;
  emailConfirmed?: boolean;
  isDeleted?: boolean;
  page?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

class ApiError extends Error {
  public status: number;
  public data: ErrorResponse;
  
  constructor(
    status: number,
    data?: ErrorResponse | null
  ) {
    const errorMessage = data?.message || 'An unexpected error occurred';
    super(errorMessage);
    this.name = 'ApiError';
    this.status = status;
    this.data = data || { message: errorMessage };
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

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorData: ErrorResponse;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        try {
          errorData = await response.json();
        } catch {
          errorData = {
            message: `HTTP ${response.status}: ${response.statusText}`,
          };
        }
      } else {
        // Non-JSON response
        const text = await response.text().catch(() => '');
        errorData = {
          message: text || `HTTP ${response.status}: ${response.statusText}`,
        };
      }
      
      throw new ApiError(response.status, errorData);
    }

    return response.json();
  } catch (error) {
    // Handle network errors and other exceptions
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network error or other fetch failure
    throw new ApiError(0, {
      message: error instanceof Error ? error.message : 'Network error occurred',
    });
  }
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

export const adminApi = {
  getUsers: (filters?: UserFilterRequest) => {
    const params = new URLSearchParams();
    if (filters?.searchTerm) params.append('searchTerm', filters.searchTerm);
    if (filters?.role) params.append('role', filters.role);
    if (filters?.emailConfirmed !== undefined) params.append('emailConfirmed', String(filters.emailConfirmed));
    if (filters?.isDeleted !== undefined) params.append('isDeleted', String(filters.isDeleted));
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.pageSize) params.append('pageSize', String(filters.pageSize));
    
    const queryString = params.toString();
    return fetchApi<PaginatedResponse<UserResponseDto>>(
      `/users${queryString ? `?${queryString}` : ''}`
    );
  },

  getUserById: (userId: string) =>
    fetchApi<UserDetailsDto>(`/users/${userId}`),

  updateUser: (userId: string, data: UpdateUserDto) =>
    fetchApi<MessageResponse>(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteUser: (userId: string) =>
    fetchApi<MessageResponse>(`/users/${userId}`, {
      method: 'DELETE',
    }),

  restoreUser: (userId: string) =>
    fetchApi<MessageResponse>(`/users/${userId}/restore`, {
      method: 'POST',
    }),
};

export { ApiError };
