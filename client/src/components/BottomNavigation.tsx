import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/lib/icons.ts";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useRoute } from "wouter";

type Section = "home" | "inventory" | "tasks" | "expenses";

interface BottomNavigationProps {
  currentSection?: Section;
}

export function BottomNavigation({ 
  currentSection = "home"
}: BottomNavigationProps) {
  const [location, setLocation] = useLocation();
  const [isHomeActive] = useRoute("/");
  const [isInventoryActive] = useRoute("/inventory*");
  const [isTasksActive] = useRoute("/tasks*");
  const [isExpensesActive] = useRoute("/expenses*");
  
  const activeSection = isHomeActive ? "home" :
                       isInventoryActive ? "inventory" :
                       isTasksActive ? "tasks" :
                       isExpensesActive ? "expenses" : 
                       "home";
  
  const { toast } = useToast();

  const navigateTo = (path: string, section: Section) => {
    if (section !== "home" && section !== "inventory") {
      // Only show toast for unimplemented sections
      toast({
        title: "Coming soon",
        description: `The ${section} section is under development`,
        variant: "default",
      });
      return;
    }
    setLocation(path);
  };

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white/80 dark:bg-black/80 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 z-30">
      <div className="max-w-md mx-auto px-4">
        <div className="flex justify-around">
          <NavButton 
            icon={<Icons.home className="h-5 w-5" />}
            label="Home"
            isActive={activeSection === "home"}
            onClick={() => navigateTo("/", "home")}
          />
          
          <NavButton 
            icon={<Icons.packageOpen className="h-5 w-5" />}
            label="Inventory"
            isActive={activeSection === "inventory"}
            onClick={() => navigateTo("/inventory", "inventory")}
          />
          
          <NavButton 
            icon={<Icons.clipboardList className="h-5 w-5" />}
            label="Tasks"
            isActive={activeSection === "tasks"}
            onClick={() => navigateTo("/tasks", "tasks")}
          />
          
          <NavButton 
            icon={<Icons.wallet className="h-5 w-5" />}
            label="Expenses"
            isActive={activeSection === "expenses"}
            onClick={() => navigateTo("/expenses", "expenses")}
          />
        </div>
        {/* iOS Home indicator space */}
        <div className="h-5"></div>
      </div>
    </nav>
  );
}

interface NavButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function NavButton({ icon, label, isActive, onClick }: NavButtonProps) {
  return (
    <Button
      variant="ghost"
      className={`py-3 px-4 flex flex-col items-center ${
        isActive 
          ? "text-primary dark:text-primary" 
          : "text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
      }`}
      onClick={onClick}
    >
      <div className={`${isActive ? 'scale-110 mb-0.5' : ''} transition-transform duration-150`}>
        {icon}
      </div>
      <span className={`text-[10px] mt-1 font-medium ${isActive ? 'opacity-100' : 'opacity-80'}`}>
        {label}
      </span>
    </Button>
  );
}
