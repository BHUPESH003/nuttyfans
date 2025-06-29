export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: ApiError;
}

export interface ApiError {
  message: string;
  code: string;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

export interface ApiQueryParams {
  page?: number;
  limit?: number;
  [key: string]: string | number | boolean | undefined;
} 