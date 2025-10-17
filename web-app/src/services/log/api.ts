import { request } from '@umijs/max';

// const API_BASE_URL = 'http://localhost:3000';
const API_BASE_URL = 'https://didactic-dollop-6646j6xjxrg354gq-3000.app.github.dev';

export async function getLogs(params: LOG.LogListParams) {
  return request<LOG.LogListResponse>(`${API_BASE_URL}/v1/logs`, {
    method: 'GET',
    params,
  });
}

export async function getProjects(params?: { expand?: string }) {
  return request<LOG.ProjectListResponse>(`${API_BASE_URL}/v1/projects`, {
    method: 'GET',
    params,
  });
}

export async function getProjectFunctions(projectId: string) {
  return request<LOG.FunctionListResponse>(`${API_BASE_URL}/v1/projects/${projectId}/functions`, {
    method: 'GET',
  });
}

export async function getFunctions() {
  return request<LOG.FunctionListResponse>(`${API_BASE_URL}/v1/functions`, {
    method: 'GET',
  });
}
