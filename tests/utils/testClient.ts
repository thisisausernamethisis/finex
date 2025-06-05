import { NextRequest, NextResponse } from 'next/server';
import { createJWTForTest } from './auth';

interface TestClientResponse {
  status: number;
  data: any;
  headers?: Record<string, string>;
}

interface RequestConfig {
  headers?: Record<string, string>;
}

class TestClient {
  private baseURL: string;

  constructor(baseURL: string = 'http://localhost:3000') {
    this.baseURL = baseURL;
  }

  async get(url: string, config?: RequestConfig): Promise<TestClientResponse> {
    return this.request('GET', url, undefined, config);
  }

  async post(url: string, data?: any, config?: RequestConfig): Promise<TestClientResponse> {
    return this.request('POST', url, data, config);
  }

  async put(url: string, data?: any, config?: RequestConfig): Promise<TestClientResponse> {
    return this.request('PUT', url, data, config);
  }

  async delete(url: string, config?: RequestConfig): Promise<TestClientResponse> {
    return this.request('DELETE', url, undefined, config);
  }

  private async request(
    method: string,
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<TestClientResponse> {
    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...config?.headers
    };

    // If no auth provided, create a test auth token
    if (!headers.Authorization && url !== '/api/auth/test-login') {
      headers.Authorization = `Bearer ${createJWTForTest({ sub: 'user_test123' })}`;
    }

    try {
      const response = await fetch(fullUrl, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined
      });

      let responseData;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      return {
        status: response.status,
        data: responseData,
        headers: Object.fromEntries(response.headers.entries())
      };
    } catch (error) {
      throw new Error(`Test client request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const testClient = new TestClient(); 