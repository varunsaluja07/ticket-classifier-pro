import { Loader2, Sparkles } from "lucide-react";

interface LoadingModalProps {
  isOpen: boolean;
  message?: string;
}

export const LoadingModal = ({ isOpen, message = "Processing with AI..." }: LoadingModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="relative bg-card border rounded-lg p-8 shadow-lg max-w-md w-full mx-4 animate-scale-in">
        <div className="flex flex-col items-center space-y-6">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            <div className="relative bg-gradient-to-br from-primary to-primary/60 rounded-full p-6">
              <Sparkles className="w-12 h-12 text-primary-foreground animate-pulse" />
            </div>
          </div>
          
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              {message}
            </h3>
            <p className="text-sm text-muted-foreground">
              AI is analyzing your ticket and generating a response
            </p>
          </div>
          
          <div className="w-full max-w-xs">
            <div className="h-1 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full animate-[slide-in-right_1.5s_ease-in-out_infinite]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
