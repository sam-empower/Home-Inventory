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
                      placeholder="secret_xxxxx..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Find this in your Notion integrations page
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
                    Found in your database URL
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
