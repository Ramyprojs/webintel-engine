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

// Interceptor removed since API key is managed securely on the backend

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
    const job = response.data;
    const myJobs = JSON.parse(localStorage.getItem('my_job_ids') || '[]');
    myJobs.push(job.id);
    localStorage.setItem('my_job_ids', JSON.stringify(myJobs));
    return job;
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
  getAll: async (jobId?: string): Promise<StructuredResult[]> => {
    const url = jobId ? `/results/?job_id=${jobId}` : '/results/';
    const response = await apiClient.get<ResultListResponse>(url);
    return response.data.results;
  },

  getExportUrl: (format: string = 'csv'): string => {
    return `${API_URL}/results/export?format=${format}`;
  }
};

export const configApi = {
  getStatus: async (): Promise<{ has_valid_key: boolean }> => {
    const response = await apiClient.get<{ has_valid_key: boolean }>('/config/status');
    return response.data;
  },
  
  setKey: async (apiKey: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/config/key', { api_key: apiKey });
    return response.data;
  }
};
