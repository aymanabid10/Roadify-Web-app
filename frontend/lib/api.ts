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

// Expert/Expertise Types
export interface CreateExpertiseRequest {
  listingId: string;
  technicalReport: string;
  isApproved: boolean;
  conditionScore: number;
  estimatedValue?: number;
  inspectionDate?: string;
}

export interface ExpertiseResponse {
  id: string;
  listingId: string;
  expertId: string;
  expertUsername: string | null;
  technicalReport: string;
  documentUrl: string | null;
  isApproved: boolean;
  conditionScore: number;
  estimatedValue: number | null;
  inspectionDate: string;
  rejectionReason: string | null;
  rejectionFeedback: string | null;
  createdAt: string;
}

export interface RejectExpertiseRequest {
  reason: string;
  feedback?: string;
}

export interface UpdateExpertiseRequest {
  technicalReport?: string;
  conditionScore?: number;
  estimatedValue?: number;
  inspectionDate?: string;
}

// Listing Types
export interface ListingResponse {
  id: string;
  title: string;
  description: string | null;
  price: number;
  currency: number;
  isPriceNegotiable: boolean;
  contactPhone: string | null;
  listingType: string | number; // Backend returns enum number: 0=SALE, 1=RENT
  location: string;
  features: string[];
  status: number; // 0=DRAFT, 1=PENDING_REVIEW, 2=PUBLISHED, 3=REJECTED, 4=ARCHIVED
  ownerId: string;
  ownerUsername: string | null;
  vehicleId: string;
  vehicle?: VehicleResponseDto; // Include vehicle details with photos
  viewCount: number;
  createdAt: string;
  updatedAt: string | null;
  expertise: ExpertiseResponse | null;
  // Sale-specific
  hasClearTitle?: boolean;
  financingAvailable?: boolean;
  tradeInAccepted?: boolean;
  warrantyInfo?: string;
  // Rent-specific
  weeklyRate?: number;
  monthlyRate?: number;
  securityDeposit?: number;
  minimumRentalPeriod?: string;
  maximumRentalPeriod?: string;
  mileageLimitPerDay?: number;
  insuranceIncluded?: boolean;
  fuelPolicy?: string;
  deliveryAvailable?: boolean;
  deliveryFee?: number;
}

export interface ListingFilterRequest {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: number;
  listingTypeString?: string;
  sortBy?: string;
  sortOrder?: string;
  minPrice?: number;
  maxPrice?: number;
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

// Vehicle Types
export interface VehicleOptions {
  brands: string[];
  models: string[];
  types: string[];
  colors: string[];
}

export interface VehicleResponseDto {
  id: string;
  brand: string;
  model: string;
  year: number;
  registrationNumber: string;
  vehicleType: string;
  description: string | null;
  status: string;
  mileage: number | null;
  color: string | null;
  photoUrls: string[];
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateVehicleDto {
  brand: string;
  model: string;
  year: number;
  registrationNumber: string;
  vehicleType: string;
  description?: string;
  status: string;
  mileage?: number;
  color?: string;
}

export interface UpdateVehicleDto {
  brand?: string;
  model?: string;
  year?: number;
  registrationNumber?: string;
  vehicleType?: string;
  description?: string;
  status?: string;
  mileage?: number;
  color?: string;
}

export interface VehicleFilterRequest {
  brand?: string;
  model?: string;
  year?: number;
  vehicleType?: string;
  status?: string;
  color?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  pageSize?: number;
}

// Sale Listing Types
export interface CreateSaleListingRequest {
  vehicleId: string;
  title: string;
  description?: string;
  price: number;
  location: string;
  isPriceNegotiable?: boolean;
  isAvailable?: boolean;
  currency?: number;
  contactPhone?: string;
  features?: string[];
  hasClearTitle?: boolean;
  financingAvailable?: boolean;
  tradeInAccepted?: boolean;
  warrantyInfo?: string;
}

export interface UpdateSaleListingRequest {
  title?: string;
  description?: string;
  price?: number;
  currency?: number;
  isPriceNegotiable?: boolean;
  contactPhone?: string;
  location?: string;
  features?: string[];
  hasClearTitle?: boolean;
  financingAvailable?: boolean;
  tradeInAccepted?: boolean;
  warrantyInfo?: string;
}

// Rent Listing Types
export interface CreateRentListingRequest {
  vehicleId: string;
  title: string;
  description?: string;
  location: string;
  price: number; // Daily rate
  weeklyRate?: number;
  monthlyRate?: number;
  securityDeposit: number;
  minimumRentalPeriod: string; // e.g., "1 day"
  maximumRentalPeriod?: string; // e.g., "30 days"
  isPriceNegotiable?: boolean;
  contactPhone?: string;
  features?: string[];
  currency?: number;
  mileageLimitPerDay?: number;
  insuranceIncluded?: boolean;
  fuelPolicy?: string;
  deliveryAvailable?: boolean;
  deliveryFee?: number;
}

export interface UpdateRentListingRequest {
  title?: string;
  description?: string;
  price?: number;
  currency?: number;
  isPriceNegotiable?: boolean;
  contactPhone?: string;
  location?: string;
  features?: string[];
  weeklyRate?: number;
  monthlyRate?: number;
  securityDeposit?: number;
  minimumRentalPeriod?: string;
  maximumRentalPeriod?: string;
  mileageLimitPerDay?: number;
  insuranceIncluded?: boolean;
  fuelPolicy?: string;
  deliveryAvailable?: boolean;
  deliveryFee?: number;
}

// Review Types
export interface CreateReviewDto {
  targetUserId: string;
  rating: number;
  comment?: string;
}

export interface UpdateReviewDto {
  rating?: number;
  comment?: string;
}

export interface ReviewDto {
  id: string;
  reviewerId: string;
  reviewerUsername: string;
  targetUserId: string;
  targetUsername: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string | null;
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
  
  const headers: Record<string, string> = {};

  // Only set Content-Type for non-FormData requests
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

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

    // Handle 204 No Content responses (no body to parse)
    if (response.status === 204) {
      return {} as T;
    }

    // Check if response has content before parsing JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }

    // If no JSON content, return empty object
    return {} as T;
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

  // Get all vehicles in the system (admin only)
  getAllVehicles: (filters?: VehicleFilterRequest) => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.pageSize) params.append('pageSize', String(filters.pageSize));
    if (filters?.search) params.append('search', filters.search);
    if (filters?.brand) params.append('brand', filters.brand);
    if (filters?.model) params.append('model', filters.model);
    if (filters?.year) params.append('year', String(filters.year));
    if (filters?.vehicleType) params.append('vehicleType', filters.vehicleType);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.color) params.append('color', filters.color);
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);
    
    const queryString = params.toString();
    return fetchApi<PaginatedResponse<VehicleResponseDto>>(
      `/vehicle${queryString ? `?${queryString}` : ''}`
    );
  },
};

export const expertApi = {
  // Get all listings for expert review (PENDING_REVIEW status)
  getPendingListings: (filters?: ListingFilterRequest) => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.pageSize) params.append('pageSize', String(filters.pageSize));
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status !== undefined) params.append('status', String(filters.status));
    if (filters?.listingTypeString) params.append('listingTypeString', filters.listingTypeString);
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);
    
    const queryString = params.toString();
    return fetchApi<PaginatedResponse<ListingResponse>>(
      `/listing/admin${queryString ? `?${queryString}` : ''}`
    );
  },

  // Create an expertise review
  createExpertise: (data: CreateExpertiseRequest) =>
    fetchApi<ExpertiseResponse>('/expertise', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Get expertise by listing ID
  getExpertiseByListing: (listingId: string) =>
    fetchApi<ExpertiseResponse>(`/expertise/listing/${listingId}`),

  // Approve a listing
  approveListing: (expertiseId: string) =>
    fetchApi<ExpertiseResponse>(`/expertise/${expertiseId}/approve`, {
      method: 'POST',
    }),

  // Reject a listing with reason and feedback
  rejectListing: (expertiseId: string, data: RejectExpertiseRequest) =>
    fetchApi<ExpertiseResponse>(`/expertise/${expertiseId}/reject`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Upload document to expertise
  uploadDocument: (expertiseId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return fetchApi<ExpertiseResponse>(`/expertise/${expertiseId}/upload-document`, {
      method: 'POST',
      body: formData,
    });
  },

  // Update/replace document for expertise
  updateDocument: (expertiseId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return fetchApi<ExpertiseResponse>(`/expertise/${expertiseId}/document`, {
      method: 'PUT',
      body: formData,
    });
  },

  // Delete document from expertise
  deleteDocument: (expertiseId: string) =>
    fetchApi<ExpertiseResponse>(`/expertise/${expertiseId}/document`, {
      method: 'DELETE',
    }),

  // Update expertise report details
  updateExpertise: (expertiseId: string, data: UpdateExpertiseRequest) =>
    fetchApi<ExpertiseResponse>(`/expertise/${expertiseId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// Vehicle API
export const vehicleApi = {
  getVehicleOptions: () =>
    fetchApi<VehicleOptions>('/vehicle/options'),

  getMyVehicles: (filters?: VehicleFilterRequest) => {
    const params = new URLSearchParams();
    if (filters?.brand) params.append('brand', filters.brand);
    if (filters?.model) params.append('model', filters.model);
    if (filters?.year) params.append('year', String(filters.year));
    if (filters?.vehicleType) params.append('vehicleType', filters.vehicleType);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.color) params.append('color', filters.color);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.pageSize) params.append('pageSize', String(filters.pageSize));
    
    const queryString = params.toString();
    return fetchApi<PaginatedResponse<VehicleResponseDto>>(
      `/vehicle${queryString ? `?${queryString}` : ''}`
    );
  },

  getVehicleById: (vehicleId: string) =>
    fetchApi<VehicleResponseDto>(`/vehicle/${vehicleId}`),

  createVehicle: (data: CreateVehicleDto) =>
    fetchApi<VehicleResponseDto>('/vehicle', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateVehicle: (vehicleId: string, data: UpdateVehicleDto) =>
    fetchApi<MessageResponse>(`/vehicle/${vehicleId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteVehicle: (vehicleId: string) =>
    fetchApi<MessageResponse>(`/vehicle/${vehicleId}`, {
      method: 'DELETE',
    }),

  uploadVehiclePhotos: (vehicleId: string, photos: File[]) => {
    const formData = new FormData();
    photos.forEach(photo => formData.append('photos', photo));
    
    return fetchApi<{ message: string; photoUrls: string[] }>(`/vehicle/${vehicleId}/photos`, {
      method: 'POST',
      body: formData,
    });
  },

  deleteVehiclePhoto: (vehicleId: string, photoUrl: string) =>
    fetchApi<MessageResponse>(`/vehicle/${vehicleId}/photos?photoUrl=${encodeURIComponent(photoUrl)}`, {
      method: 'DELETE',
    }),

  updateVehiclePhoto: (vehicleId: string, oldPhotoUrl: string, newPhoto: File) => {
    const formData = new FormData();
    formData.append('oldPhotoUrl', oldPhotoUrl);
    formData.append('newPhoto', newPhoto);
    
    return fetchApi<{ message: string; oldPhotoUrl: string; newPhotoUrl: string }>(`/vehicle/${vehicleId}/photos`, {
      method: 'PUT',
      body: formData,
    });
  },
};

// Listing API
export const listingApi = {
  // Public listings (no auth required)
  getPublicListings: (filters?: ListingFilterRequest) => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.pageSize) params.append('pageSize', String(filters.pageSize));
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status !== undefined) params.append('status', String(filters.status));
    if (filters?.listingTypeString) params.append('listingTypeString', filters.listingTypeString);
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);
    if (filters?.minPrice) params.append('minPrice', String(filters.minPrice));
    if (filters?.maxPrice) params.append('maxPrice', String(filters.maxPrice));
    
    const queryString = params.toString();
    return fetchApi<PaginatedResponse<ListingResponse>>(
      `/listing${queryString ? `?${queryString}` : ''}`
    );
  },

  // Get my listings (authenticated)
  getMyListings: (filters?: ListingFilterRequest) => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.pageSize) params.append('pageSize', String(filters.pageSize));
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status !== undefined) params.append('status', String(filters.status));
    if (filters?.listingTypeString) params.append('listingTypeString', filters.listingTypeString);
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);
    
    const queryString = params.toString();
    return fetchApi<PaginatedResponse<ListingResponse>>(
      `/listing/my-listings${queryString ? `?${queryString}` : ''}`
    );
  },

  // Get listing by ID
  getListingById: (listingId: string) =>
    fetchApi<ListingResponse>(`/listing/${listingId}`),

  // Create sale listing
  createSaleListing: (data: CreateSaleListingRequest) =>
    fetchApi<ListingResponse>('/listing/sale', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Create rent listing
  createRentListing: (data: CreateRentListingRequest) =>
    fetchApi<ListingResponse>('/listing/rent', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Update sale listing
  updateSaleListing: (listingId: string, data: UpdateSaleListingRequest) =>
    fetchApi<ListingResponse>(`/listing/sale/${listingId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Update rent listing
  updateRentListing: (listingId: string, data: UpdateRentListingRequest) =>
    fetchApi<ListingResponse>(`/listing/rent/${listingId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Delete listing
  deleteListing: (listingId: string) =>
    fetchApi<MessageResponse>(`/listing/${listingId}`, {
      method: 'DELETE',
    }),

  // Submit listing for review
  submitForReview: (listingId: string) =>
    fetchApi<ListingResponse>(`/listing/${listingId}/submit`, {
      method: 'POST',
    }),

  // Archive listing
  archiveListing: (listingId: string) =>
    fetchApi<ListingResponse>(`/listing/${listingId}/archive`, {
      method: 'POST',
    }),
};

// Reviews API
export const reviewsApi = {
  // Get my reviews
  getMyReviews: () =>
    fetchApi<ReviewDto[]>('/reviews/me'),

  // Get reviews for a specific user
  getUserReviews: (userId: string) =>
    fetchApi<ReviewDto[]>(`/reviews/user/${userId}`),

  // Get average rating for a user
  getAverageRating: (userId: string) =>
    fetchApi<number>(`/reviews/user/${userId}/average`),

  // Create review
  createReview: (data: CreateReviewDto) =>
    fetchApi<MessageResponse>('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Update review
  updateReview: (reviewId: string, data: UpdateReviewDto) =>
    fetchApi<MessageResponse>(`/reviews/${reviewId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Delete review
  deleteReview: (reviewId: string) =>
    fetchApi<MessageResponse>(`/reviews/${reviewId}`, {
      method: 'DELETE',
    }),
};

export { ApiError };

export interface MessageDto {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  sentAt: string;
}

export interface SendMessageDto {
  receiverId: string;
  content: string;
}

export const messagesApi = {
  getConversation: (otherUserId: string, page = 1, pageSize = 20) =>
    fetchApi<PaginatedResponse<MessageDto>>(
      `/messages/conversation/${otherUserId}?page=${page}&pageSize=${pageSize}`
    ),
};