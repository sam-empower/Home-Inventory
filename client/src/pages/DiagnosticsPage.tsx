import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNotionApi } from '@/hooks/useNotionApi';

export function DiagnosticsPage() {
  const [envCheck, setEnvCheck] = useState<{loading: boolean, error: string | null, data: any | null}>({
    loading: true,
    error: null,
    data: null
  });
  const [connectionCheck, setConnectionCheck] = useState<{loading: boolean, error: string | null, data: any | null}>({
    loading: false,
    error: null,
    data: null
  });
  const { notionRequest } = useNotionApi();

  // Check environment variables status
  useEffect(() => {
    async function checkEnv() {
      try {
        const response = await fetch('/api/diagnostics/env');
        const data = await response.json();
        setEnvCheck({
          loading: false,
          error: data.success ? null : (data.message || 'Unknown error'),
          data: data.success ? data : null
        });
      } catch (error) {
        setEnvCheck({
          loading: false,
          error: error instanceof Error ? error.message : 'Network error',
          data: null
        });
      }
    }
    
    checkEnv();
  }, []);

  // Test Notion connection
  const testConnection = async () => {
    setConnectionCheck({ loading: true, error: null, data: null });
    
    try {
      const data = await notionRequest('GET', '/api/notion/database-info');
      setConnectionCheck({
        loading: false,
        error: data.success ? null : (data.message || 'Unknown error'),
        data: data.success ? data : null
      });
    } catch (error) {
      setConnectionCheck({
        loading: false,
        error: error instanceof Error ? error.message : 'Network error',
        data: null
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
        System Diagnostics
      </h1>
      
      <div className="space-y-6">
        {/* Environment Check */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Environment Variables</span>
              {envCheck.loading ? (
                <Badge variant="outline">Checking...</Badge>
              ) : envCheck.error ? (
                <Badge variant="destructive">Failed</Badge>
              ) : (
                <Badge variant="secondary" className="bg-green-600 text-white hover:bg-green-700">OK</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {envCheck.loading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-slate-200 rounded"></div>
                <div className="h-4 bg-slate-200 rounded w-5/6"></div>
              </div>
            ) : envCheck.error ? (
              <div className="text-red-500">
                <p><strong>Error:</strong> {envCheck.error}</p>
                <p className="mt-2 text-sm">Environment variables are missing or not being loaded correctly in the production environment.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p>✅ All required environment variables are present.</p>
                {envCheck.data?.variables && (
                  <ul className="list-disc pl-5 text-sm">
                    {Object.entries(envCheck.data.variables).map(([key, value]) => (
                      <li key={key}>{key}: {typeof value === 'string' ? '✓ Set' : '✗ Not set'}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Notion Connection Check */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Notion API Connection</span>
              {connectionCheck.loading ? (
                <Badge variant="outline">Testing...</Badge>
              ) : !connectionCheck.data && !connectionCheck.error ? (
                <Badge variant="outline">Not Tested</Badge>
              ) : connectionCheck.error ? (
                <Badge variant="destructive">Failed</Badge>
              ) : (
                <Badge variant="secondary" className="bg-green-600 text-white hover:bg-green-700">Connected</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {connectionCheck.loading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-slate-200 rounded"></div>
                <div className="h-4 bg-slate-200 rounded w-5/6"></div>
              </div>
            ) : !connectionCheck.data && !connectionCheck.error ? (
              <p>Click the button below to test the connection to Notion API.</p>
            ) : connectionCheck.error ? (
              <div className="text-red-500">
                <p><strong>Connection Error:</strong> {connectionCheck.error}</p>
                <p className="mt-2 text-sm">
                  This could indicate an invalid API token, incorrect database ID, or 
                  that the environment variables aren't being properly set in production.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p>✅ Successfully connected to Notion API!</p>
                {connectionCheck.data?.database && (
                  <div className="bg-slate-50 p-3 rounded-md text-sm">
                    <p><strong>Database:</strong> {connectionCheck.data.database.title}</p>
                    <p><strong>ID:</strong> {connectionCheck.data.database.id}</p>
                    <p><strong>Last Synced:</strong> {new Date(connectionCheck.data.database.lastSynced).toLocaleString()}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              onClick={testConnection} 
              disabled={connectionCheck.loading}
            >
              {connectionCheck.loading ? 'Testing...' : 'Test Notion Connection'}
            </Button>
          </CardFooter>
        </Card>
        
        {/* Troubleshooting Tips */}
        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li><strong>For deployment:</strong> Make sure you've added the environment variables (NOTION_TOKEN and NOTION_DATABASE_ID) to your deployment settings.</li>
              <li><strong>For Replit:</strong> Environment variables should be added in the "Secrets" tab in your Repl settings.</li>
              <li><strong>For local testing:</strong> Verify your .env file contains the correct values.</li>
              <li><strong>Check Notion integration:</strong> Make sure your Notion integration has access to the database you're trying to use.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8 text-center">
        <Button variant="outline" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </div>
    </div>
  );
}

export default DiagnosticsPage;