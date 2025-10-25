export interface IndustryWorkflowTemplate {
  id: string;
  name: string;
  description: string;
  industry: string;
  complexity: 'Beginner' | 'Intermediate' | 'Advanced';
  useCase: string;
  estimatedDuration: string;
  tags: string[];
  workflow: {
    id?: string;
    name: string;
    description?: string;
    steps: any[]; // Using any for now to match existing workflow structure
    connections?: any[];
    metadata?: {
      version?: string;
      createdAt?: string;
      updatedAt?: string;
      author?: string;
    };
  };
  prerequisites?: string[];
  benefits?: string[];
  sampleData?: any;
}


