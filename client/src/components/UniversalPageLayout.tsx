import React from "react";
import { ThemedPageWrapper } from "@/components/ThemedComponents";
import { useBlurReadiness } from "@/hooks/useBlurReadiness";
import { BlurPageHeader } from "@/components/UniversalBlurComponents";

// Universal page layout that handles blur loading and consistent structure
export const UniversalPageLayout: React.FC<{
  pageType?: 'default' | 'theater' | 'shop' | 'activities' | 'information';
  title: string;
  showHeader?: boolean;
  showBackButton?: boolean;
  backButtonText?: string;
  onBackClick?: () => void;
  loadingText?: string;
  rightElement?: (props: { contentVisible: boolean }) => React.ReactNode;
  children: (props: { contentVisible: boolean, blurReady: boolean }) => React.ReactNode;
  className?: string;
}> = ({
  pageType = 'information',
  title,
  showHeader = true,
  showBackButton = true,
  backButtonText,
  onBackClick,
  loadingText = "Loading glassmorphism effects...",
  rightElement,
  children,
  className
}) => {
  const { blurReady, contentVisible } = useBlurReadiness(200);

  return (
    <ThemedPageWrapper pageType={pageType}>
      {/* Universal Blur Loading Overlay */}
      {!blurReady && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p className="text-white/70 text-sm">{loadingText}</p>
          </div>
        </div>
      )}
      
      {/* Main content */}
      <div className="relative z-10 min-h-screen">
        <div className={`container mx-auto px-4 py-8 ${className || ''}`}>
          {/* Universal Page Header */}
          {showHeader && (
            <BlurPageHeader
              contentVisible={contentVisible}
              title={title}
              showBackButton={showBackButton}
              backButtonText={backButtonText}
              onBackClick={onBackClick}
              rightElement={rightElement ? rightElement({ contentVisible }) : undefined}
            />
          )}

          {/* Page-specific content */}
          {children({ contentVisible, blurReady })}
        </div>
      </div>
    </ThemedPageWrapper>
  );
};