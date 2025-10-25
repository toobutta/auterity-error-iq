export interface TemplateParameter {
  id: string;
  templateId: string;
  name: string;
  description?: string;
  parameterType: "string" | "number" | "boolean" | "array" | "object";
  isRequired: boolean;
  defaultValue?:
    | string
    | number
    | boolean
    | unknown[]
    | Record<string, unknown>;
  validationRules?: Record<string, string | number | boolean>;
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  category: "sales" | "service" | "parts" | "general";
  definition: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  parameters: TemplateParameter[];
}

export interface TemplateListResponse {
  templates: Template[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TemplateInstantiateRequest {
  name: string;
  description?: string;
  parameterValues: Record<string, unknown>;
}

export interface FormData {
  [key: string]:
    | string
    | number
    | boolean
    | Record<string, unknown>
    | unknown[];
}

export interface TemplateSearchParams {
  category?: string;
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: "name" | "created_at" | "updated_at";
  sortOrder?: "asc" | "desc";
}


