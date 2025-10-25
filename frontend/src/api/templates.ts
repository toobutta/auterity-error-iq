import client from "./client";
import {
  Template,
  TemplateListResponse,
  TemplateSearchParams,
  TemplateInstantiateRequest,
} from "../types/template";
import { WorkflowDefinition } from "../types/workflow";

// Template browsing and search
export const getTemplates = async (
  params: TemplateSearchParams = {},
): Promise<TemplateListResponse> => {
  const queryParams = new URLSearchParams();

  if (params.category) queryParams.append("category", params.category);
  if (params.page) queryParams.append("page", params.page.toString());
  if (params.pageSize)
    queryParams.append("page_size", params.pageSize.toString());
  if (params.search) queryParams.append("search", params.search);
  if (params.sortBy) queryParams.append("sort_by", params.sortBy);
  if (params.sortOrder) queryParams.append("sort_order", params.sortOrder);

  const response = await client.get(`/api/templates?${queryParams.toString()}`);
  return response.data;
};

export const getTemplate = async (id: string): Promise<Template> => {
  const response = await client.get(`/api/templates/${id}`);
  return response.data;
};

export const getTemplateCategories = async (): Promise<{
  categories: string[];
}> => {
  const response = await client.get("/api/templates/categories/list");
  return response.data;
};

export const instantiateTemplate = async (
  templateId: string,
  data: TemplateInstantiateRequest,
): Promise<WorkflowDefinition> => {
  const response = await client.post(
    `/api/templates/${templateId}/instantiate`,
    data,
  );
  return response.data;
};


