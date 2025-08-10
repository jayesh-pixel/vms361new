// Job Management Types

export type JobType = 'Permanent Job' | 'Contract Job' | 'Part-time' | 'Internship';

export interface JobLocation {
  city: string;
  state: string;
  country?: string;
}

export interface SalaryRange {
  min: number;
  max: number;
  currency: string;
}

export interface Job {
  id: string;
  jobId: string; // Unique job identifier
  title: string;
  subtitle?: string;
  position: string;
  category: string;
  jobType: JobType;
  
  // Company info
  company: string;
  companyId: string; // Reference to company collection
  imageUrl?: string; // Company logo
  rating?: string;
  
  // Job details
  jobDescription: string;
  location: string; // Combined location string
  salaryMin: number;
  salaryMax: number;
  currency: string;
  
  // Multi-select fields
  education: string[];
  function: string[];
  industry: string[];
  role: string[];
  skills: string[];
  
  // Ship reference
  shipId?: string; // Which ship this job is for
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // User ID who posted the job
  status: 'active' | 'closed' | 'draft';
}

export interface CreateJobRequest extends Omit<Job, 'id' | 'createdAt' | 'updatedAt' | 'jobId'> {}

export interface UpdateJobRequest extends Partial<CreateJobRequest> {}

// Dynamic field types for customizable dropdowns
export interface DynamicField {
  id: string;
  fieldName: string; // e.g., 'education', 'skills', 'industry'
  fieldValue: string; // The new option value
  createdBy: string; // User ID who created this field
  createdAt: Date;
  approved: boolean; // Admin approval status
}

export interface CreateDynamicFieldRequest extends Omit<DynamicField, 'id' | 'createdAt' | 'approved'> {}
