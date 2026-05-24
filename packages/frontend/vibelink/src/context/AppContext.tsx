import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { toast } from "@/hooks/use-toast";

interface UnlockedContent {
  profileId: string;
  contentType: string;
}

interface AppContextType {
  credits: number;
  spendCredits: (amount: number, description: string) => boolean;
  ageVerified: boolean;
  setAgeVerified: (verified: boolean) => void;
  unlockedContent: UnlockedContent[];
  unlockContent: (profileId: string, contentType: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = "linkme_credits";

export function AppProvider({ children }: { children: ReactNode }) {
  const [credits, setCredits] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? parseInt(saved, 10) : 100;
  });

  const [ageVerified, setAgeVerified] = useState(false);
  const [unlockedContent, setUnlockedContent] = useState<UnlockedContent[]>([]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, credits.toString());
  }, [credits]);

  const spendCredits = useCallback((amount: number, description: string): boolean => {
    if (credits < amount) {
      toast({ 
        title: "Insufficient credits", 
        description: "You need more credits to do that.", 
        variant: "destructive" 
      });
      return false;
    }
    
    setCredits((prev) => prev - amount);
    
    toast({ 
      title: "Credits spent", 
      description: `${description} - $${amount}` 
    });
    
    return true;
  }, [credits]);

  const unlockContent = useCallback((profileId: string, contentType: string) => {
    setUnlockedContent((prev) => [...prev, { profileId, contentType }]);
  }, []);

  return (
    <AppContext.Provider 
      value={{ 
        credits, 
        spendCredits, 
        ageVerified, 
        setAgeVerified, 
        unlockedContent, 
        unlockContent 
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
