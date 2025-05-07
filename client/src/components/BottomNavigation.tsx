import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/lib/icons";
import { useToast } from "@/hooks/use-toast";

type Section = "main" | "favorites" | "recent" | "profile";

interface BottomNavigationProps {
  currentSection?: Section;
  onChangeSection?: (section: Section) => void;
}

export function BottomNavigation({ 
  currentSection = "main", 
  onChangeSection 
}: BottomNavigationProps) {
  const [activeSection, setActiveSection] = useState<Section>(currentSection);
  const { toast } = useToast();

  const handleSectionChange = (section: Section) => {
    setActiveSection(section);
    
    if (section !== "main") {
      // Only the main section is implemented in this demo
      toast({
        title: "Not implemented",
        description: `The ${section} view is not implemented in this demo`,
        variant: "default",
      });
    } else if (onChangeSection) {
      onChangeSection(section);
    }
  };

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white/80 dark:bg-black/80 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 z-30">
      <div className="max-w-md mx-auto px-4">
        <div className="flex justify-around">
          <NavButton 
            icon={<Icons.database className="h-5 w-5" />}
            label="All Items"
            isActive={activeSection === "main"}
            onClick={() => handleSectionChange("main")}
          />
          
          <NavButton 
            icon={<Icons.star className="h-5 w-5" />}
            label="Favorites"
            isActive={activeSection === "favorites"}
            onClick={() => handleSectionChange("favorites")}
          />
          
          <NavButton 
            icon={<Icons.history className="h-5 w-5" />}
            label="Recent"
            isActive={activeSection === "recent"}
            onClick={() => handleSectionChange("recent")}
          />
          
          <NavButton 
            icon={<Icons.user className="h-5 w-5" />}
            label="Profile"
            isActive={activeSection === "profile"}
            onClick={() => handleSectionChange("profile")}
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
