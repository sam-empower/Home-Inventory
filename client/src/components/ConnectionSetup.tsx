import { useState } from "react";
import { useNotion } from "@/context/NotionContext";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Icons } from "@/lib/icons";

const connectionSchema = z.object({
  integrationToken: z.string().min(1, "Integration token is required"),
  databaseId: z.string().min(1, "Database ID is required"),
  saveCredentials: z.boolean().default(true),
});

type ConnectionFormValues = z.infer<typeof connectionSchema>;

interface ConnectionSetupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConnectionSetup({ isOpen, onClose }: ConnectionSetupProps) {
  const { connect } = useNotion();
  const [isConnecting, setIsConnecting] = useState(false);
  
  const form = useForm<ConnectionFormValues>({
    resolver: zodResolver(connectionSchema),
    defaultValues: {
      integrationToken: "",
      databaseId: "",
      saveCredentials: true,
    },
  });

  const onSubmit = async (data: ConnectionFormValues) => {
    setIsConnecting(true);
    
    try {
      const connected = await connect(
        {
          integrationToken: data.integrationToken,
          databaseId: data.databaseId,
        },
        data.saveCredentials
      );
      
      if (connected) {
        onClose();
        form.reset();
      }
    } finally {
      setIsConnecting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900 mb-4">
            <Icons.link className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Connect to Notion</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Connect to your Notion workspace to access your databases</p>
          
          <div className="mt-4 text-left bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-sm">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Quick Setup Guide:</h3>
            <ol className="list-decimal list-inside space-y-1 text-gray-600 dark:text-gray-400">
              <li>Create an integration at <a href="https://www.notion.so/my-integrations" target="_blank" rel="noopener noreferrer" className="text-primary underline">notion.so/my-integrations</a></li>
              <li>Copy the integration token (starts with <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">ntn_</code> or <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">secret_</code>)</li>
              <li>Get your database ID from its URL, the part after the last slash and before the question mark</li>
              <li>Share your database with your integration via the Share menu and add your integration name</li>
            </ol>
            
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <details className="group">
                <summary className="flex items-center text-primary-600 dark:text-primary-400 cursor-pointer font-medium">
                  <svg className="h-4 w-4 mr-1 group-open:rotate-90 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                  Troubleshooting
                </summary>
                <div className="mt-2 pl-5 text-gray-600 dark:text-gray-400">
                  <p className="mb-1 text-xs">If you get "API token is invalid" error:</p>
                  <ul className="list-disc list-inside text-xs space-y-1 pl-1">
                    <li>Check if your token starts with <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">ntn_</code> or <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">secret_</code></li>
                    <li>Make sure you copied the entire token without extra spaces</li>
                  </ul>
                  
                  <p className="mb-1 mt-2 text-xs">If you get "Database not found" error:</p>
                  <ul className="list-disc list-inside text-xs space-y-1 pl-1">
                    <li>Ensure the database ID is correct (from URL)</li>
                    <li>Verify you've shared the database with your integration</li>
                    <li>Remember to click "Save" after adding your integration in the share menu</li>
                  </ul>
                </div>
              </details>
            </div>
          </div>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="integrationToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Integration Token</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="ntn_xxxxxx... or secret_xxxxx..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Find this in your <a href="https://www.notion.so/my-integrations" target="_blank" rel="noopener noreferrer" className="text-primary underline">Notion integrations page</a>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="databaseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Database ID</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Found in your database URL. After connecting, make sure to add your integration to the database's share menu.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="saveCredentials"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Save credentials for offline use</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full" disabled={isConnecting}>
              {isConnecting ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Connect"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
