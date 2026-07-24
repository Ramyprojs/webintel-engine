import axios from 'axios';

// Use relative path so Vite's dev proxy handles routing to the backend.
// In production, configure your reverse proxy (nginx, etc.) to forward /api.
const API_URL = '/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const apiKey = localStorage.getItem('gemini_api_key');
  if (apiKey && config.headers) {
    config.headers['x-gemini-api-key'] = apiKey;
  }
  return config;
});

// --- Types ---

export type JobStatus = 'queued' | 'scraping' | 'cleaning' | 'done' | 'partial' | 'failed';
export type InputType = 'domain' | 'keyword' | 'search_term';

export interface Job {
  id: string;
  input_type: InputType;
  input_value: string;
  status: JobStatus;
  progress_percent: number;
  stage_detail: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export type ResultStatus = 'cleaned' | 'needs_review' | 'failed';

export interface StructuredResult {
  id: string;
  job_id: string;
  company_name: string | null;
  industry: string | null;
  website: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  summary: string | null;
  key_data_points: Record<string, any> | null;
  confidence_score: number | null;
  status: ResultStatus;
  review_notes: string | null;
  created_at: string;
}

// --- Paginated Response Wrappers ---

interface JobListResponse {
  jobs: Job[];
  total: number;
  page: number;
  page_size: number;
}

interface ResultListResponse {
  results: StructuredResult[];
  total: number;
  page: number;
  page_size: number;
}

// --- API Methods ---

export const jobsApi = {
  create: async (inputType: InputType, inputValue: string): Promise<Job> => {
    const response = await apiClient.post<Job>('/jobs/', {
      input_type: inputType,
      input_value: inputValue,
    });
    return response.data;
  },

  get: async (id: string): Promise<Job> => {
    const response = await apiClient.get<Job>(`/jobs/${id}`);
    return response.data;
  },

  getAll: async (): Promise<Job[]> => {
    const response = await apiClient.get<JobListResponse>('/jobs/');
    return response.data.jobs;
  }
};

export const resultsApi = {
  getAll: async (): Promise<StructuredResult[]> => {
    const response = await apiClient.get<ResultListResponse>('/results/');
    return response.data.results;
  },

  getExportUrl: (format: string = 'csv'): string => {
    return `${API_URL}/results/export?format=${format}`;
  }
};
