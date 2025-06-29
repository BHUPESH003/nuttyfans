import { AxiosResponse } from 'axios';
import { api } from './api';
import { Report, ReportCreateInput, ReportUpdateInput } from 'src/types/report';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export class ReportService {
  static async createReport(input: ReportCreateInput): Promise<Report> {
    const response: AxiosResponse<ApiResponse<Report>> = await api.post(
      '/reports',
      input
    );
    return response.data.data;
  }

  static async getReports(page = 1, limit = 20): Promise<{
    reports: Report[];
    total: number;
  }> {
    const response: AxiosResponse<ApiResponse<{
      reports: Report[];
      total: number;
    }>> = await api.get('/reports', {
      params: { page, limit },
    });
    return response.data.data;
  }

  static async getReport(reportId: string): Promise<Report> {
    const response: AxiosResponse<ApiResponse<Report>> = await api.get(
      `/reports/${reportId}`
    );
    return response.data.data;
  }

  static async updateReport(
    reportId: string,
    input: ReportUpdateInput
  ): Promise<Report> {
    const response: AxiosResponse<ApiResponse<Report>> = await api.put(
      `/reports/${reportId}`,
      input
    );
    return response.data.data;
  }

  static async deleteReport(reportId: string): Promise<void> {
    await api.delete(`/reports/${reportId}`);
  }

  static async getReportsByPost(postId: string): Promise<Report[]> {
    const response: AxiosResponse<ApiResponse<Report[]>> = await api.get(
      `/reports/post/${postId}`
    );
    return response.data.data;
  }

  static async getReportsByUser(userId: string): Promise<Report[]> {
    const response: AxiosResponse<ApiResponse<Report[]>> = await api.get(
      `/reports/user/${userId}`
    );
    return response.data.data;
  }

  static async getReportStats(): Promise<{
    total: number;
    pending: number;
    resolved: number;
    rejected: number;
  }> {
    const response: AxiosResponse<ApiResponse<{
      total: number;
      pending: number;
      resolved: number;
      rejected: number;
    }>> = await api.get('/reports/stats');
    return response.data.data;
  }
} 