import axios from 'axios';

// Backend runs on 8000
const API_URL = 'http://localhost:8000/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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
  
  // Note: We'll implement a getAll in the backend if it doesn't exist, 
  // or just fetch recent jobs for the dashboard.
  getAll: async (): Promise<Job[]> => {
    const response = await apiClient.get<Job[]>('/jobs/');
    return response.data;
  }
};

export const resultsApi = {
  getAll: async (): Promise<StructuredResult[]> => {
    const response = await apiClient.get<StructuredResult[]>('/results/');
    return response.data;
  }
};
