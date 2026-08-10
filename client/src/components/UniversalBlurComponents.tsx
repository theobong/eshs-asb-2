import React from "react";
import { Button } from "@/components/ui/button";
import { ThemedCard, PrimaryButton } from "@/components/ThemedComponents";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

export const BlurBackButton: React.FC<{
  contentVisible: boolean;
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
}> = ({ contentVisible, className, children, onClick }) => {
  const [, setLocation] = useLocation();

  const handleBackClick = () => {
    if (onClick) {
      onClick();
    } else {
      sessionStorage.setItem("came-from-internal", "true");
      setLocation("/");
    }
  };

  return (
    <Button
      variant="ghost"
      onClick={handleBackClick}
      className={cn(
        "text-white/90 hover:text-white p-2 min-h-11 mr-2 md:mr-4 shrink-0 bg-white/5 border border-white/10 shadow-2xl rounded-lg hover:bg-white/15 transition-all duration-300 flex items-center space-x-2",
        className
      )}
      style={{
        backdropFilter: contentVisible ? 'blur(20px)' : 'blur(0px)',
        WebkitBackdropFilter: contentVisible ? 'blur(20px)' : 'blur(0px)',
        transition: 'backdrop-filter 0.8s ease-out, -webkit-backdrop-filter 0.8s ease-out'
      }}
    >
      <svg
        className="w-5 h-5 shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 19l-7-7 7-7"
        />
      </svg>
      <span>{children || "Back"}</span>
    </Button>
  );
};

export const BlurContainer: React.FC<{
  contentVisible: boolean;
  delay?: string;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}> = ({ contentVisible, delay = '200ms', className, children, onClick }) => {
  return (
    <div
      className={cn(
        "bg-white/5 border border-white/10 shadow-2xl rounded-xl transition-all duration-700 ease-out",
        className
      )}
      style={{
        opacity: contentVisible ? 1 : 0,
        transform: contentVisible ? 'translateY(0)' : 'translateY(20px)',
        transitionDelay: delay,
        backdropFilter: contentVisible ? 'blur(20px)' : 'blur(0px)',
        WebkitBackdropFilter: contentVisible ? 'blur(20px)' : 'blur(0px)'
      }}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export const BlurCard: React.FC<{
  contentVisible: boolean;
  delay?: string;
  index?: number;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}> = ({ contentVisible, delay = '400ms', index = 0, className, children, onClick }) => {
  const calculatedDelay = index > 0 ? `${400 + (index * 50)}ms` : delay;

  return (
    <ThemedCard
      className={cn(
        "bg-white/5 border border-white/10 shadow-2xl hover:shadow-2xl transition-all hover:scale-[1.01] cursor-pointer",
        className
      )}
      style={{
        transitionDelay: contentVisible ? calculatedDelay : '0ms',
        opacity: contentVisible ? 1 : 0,
        transform: contentVisible ? 'translateY(0)' : 'translateY(20px)',
        transitionDuration: '600ms',
        transitionTimingFunction: 'ease-out',
        backdropFilter: contentVisible ? 'blur(20px)' : 'blur(0px)',
        WebkitBackdropFilter: contentVisible ? 'blur(20px)' : 'blur(0px)'
      }}
      onClick={onClick}
    >
      {children}
    </ThemedCard>
  );
};

export const BlurPageHeader: React.FC<{
  contentVisible: boolean;
  title: string;
  showBackButton?: boolean;
  backButtonText?: string;
  onBackClick?: () => void;
  rightElement?: React.ReactNode;
  className?: string;
}> = ({ contentVisible, title, showBackButton = true, backButtonText, onBackClick, rightElement, className }) => {
  return (
    <div
      className={cn("flex items-center justify-between gap-2 mb-6 md:mb-8 transition-all duration-700 ease-out", className)}
      style={{
        opacity: contentVisible ? 1 : 0,
        transform: contentVisible ? 'translateY(0)' : 'translateY(-20px)',
        transitionDelay: '100ms'
      }}
    >
      <div className="flex items-center min-w-0">
        {showBackButton && (
          <BlurBackButton contentVisible={contentVisible} onClick={onBackClick}>
            {backButtonText}
          </BlurBackButton>
        )}
        <h1 className="font-bold text-xl sm:text-2xl md:text-3xl text-white tracking-tight break-words min-w-0">
          {title}
        </h1>
      </div>
      {rightElement && (
        <div className="flex items-center shrink-0">
          {rightElement}
        </div>
      )}
    </div>
  );
};

export const BlurActionButton: React.FC<{
  contentVisible: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}> = ({ contentVisible, onClick, disabled, className, children }) => {
  return (
    <PrimaryButton
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "bg-white/5 border border-white/10 shadow-2xl hover:bg-white/20 text-white px-4 h-11 text-sm font-medium rounded-lg flex items-center space-x-2",
        className
      )}
      style={{
        backdropFilter: contentVisible ? 'blur(20px)' : 'blur(0px)',
        WebkitBackdropFilter: contentVisible ? 'blur(20px)' : 'blur(0px)',
        transition: 'backdrop-filter 0.8s ease-out, -webkit-backdrop-filter 0.8s ease-out, background-color 0.3s ease'
      }}
    >
      {children}
    </PrimaryButton>
  );
};
