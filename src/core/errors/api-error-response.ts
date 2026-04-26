export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export interface ApiErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  details?: ApiErrorDetail[];
  requestId: string;
  correlationId: string;
  timestamp: string;
  path: string;
  method: string;
}
