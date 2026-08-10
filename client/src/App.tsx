import { Switch, Route, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import Shop from "@/pages/shop";
import NotFound from "@/pages/not-found";
import { CartProvider } from "@/contexts/CartContext";
import schoolVideo from "../../attached_assets/school2.mp4";

// Shop related pages
import ProductPage from "@/pages/shop/product/index";
import CartPage from "@/pages/shop/cart/index";
import CheckoutPage from "@/pages/shop/checkout/index";
import CheckoutSuccessPage from "@/pages/shop/checkout/success";
import CheckoutCancelPage from "@/pages/shop/checkout/cancel";
import CheckoutFailurePage from "@/pages/shop/checkout/failure";

// Ticket checkout pages
import TicketCheckoutPage from "@/pages/checkout/ticket";
import TicketCheckoutSuccessPage from "@/pages/checkout/success";


// Information related pages
import Information from "@/pages/information/index";
import Elections from "@/pages/information/elections/index";
import Clubs from "@/pages/information/clubs/index";

// Activities page
import Activities from "@/pages/activities/index";
import EventDetails from "@/pages/activities/details";

// Birds Eye View page
import BirdsEyeView from "./pages/birds-eye-view";

// Admin page
import Admin from "@/pages/admin/index";
import CommaTest from "@/pages/admin/comma-test";


// Page wrapper component for fade transitions - WITHOUT creating stacking context
const PageWrapper = ({ children, skipFade = false }: { children: React.ReactNode, skipFade?: boolean }) => {
  // Instead of using Framer Motion which adds transforms, use CSS transitions
  const [isVisible, setIsVisible] = useState(skipFade); // Start visible if skipFade is true
  
  useEffect(() => {
    if (!skipFade) {
      // Trigger fade-in after mount only if not skipping
      setIsVisible(true);
    }
  }, [skipFade]);

  return (
    <div
      className="w-full h-full"
      style={{
        opacity: isVisible ? 1 : 0,
        transition: skipFade ? 'none' : 'opacity 0.2s ease-in-out',
        backgroundColor: 'transparent',
        // CRITICAL: No transform, no will-change: transform
        // These would create a new stacking context
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
      }}
    >
      {children}
    </div>
  );
};

function Router() {
  const [location] = useLocation();
  
  return (
    <Switch>
        {/* Main pages */}
        <Route path="/" component={() => <PageWrapper skipFade={true}><Home /></PageWrapper>} />
        
        {/* Shop pages - more specific routes first */}
        <Route path="/shop/checkout/success" component={() => <PageWrapper><CheckoutSuccessPage /></PageWrapper>} />
        <Route path="/shop/checkout/cancel" component={() => <PageWrapper><CheckoutCancelPage /></PageWrapper>} />
        <Route path="/shop/checkout/failure" component={() => <PageWrapper><CheckoutFailurePage /></PageWrapper>} />
        <Route path="/shop/checkout" component={() => <PageWrapper><CheckoutPage /></PageWrapper>} />
        <Route path="/shop/product/:id" component={() => <PageWrapper><ProductPage /></PageWrapper>} />
        <Route path="/shop/cart" component={() => <PageWrapper><CartPage /></PageWrapper>} />
        <Route path="/shop" component={() => <PageWrapper><Shop /></PageWrapper>} />
        
        {/* Ticket checkout pages for approved activity tickets */}
        <Route path="/checkout/success" component={() => <PageWrapper><TicketCheckoutSuccessPage /></PageWrapper>} />
        <Route path="/checkout/:submissionId" component={() => <PageWrapper><TicketCheckoutPage /></PageWrapper>} />
        
        {/* Information pages */}
        <Route path="/information" component={() => <PageWrapper><Information /></PageWrapper>} />
        <Route path="/information/student-government" component={() => <PageWrapper><Elections /></PageWrapper>} />
        <Route path="/information/elections" component={() => <PageWrapper><Elections /></PageWrapper>} />
        <Route path="/information/clubs" component={() => <PageWrapper><Clubs /></PageWrapper>} />
        
        {/* Activities page */}        <Route path="/activities" component={() => <PageWrapper><Activities /></PageWrapper>} />
        <Route path="/activities/details/:id" component={() => <PageWrapper><EventDetails /></PageWrapper>} />
        
        {/* Birds Eye View */}
        <Route path="/birds-eye-view" component={() => <PageWrapper><BirdsEyeView /></PageWrapper>} />
          {/* Admin page */}
        <Route path="/admin" component={() => <PageWrapper><Admin /></PageWrapper>} />
        {/* Testing and debugging routes */}
        <Route path="/comma-test" component={() => <PageWrapper><CommaTest /></PageWrapper>} />
        
        {/* 404 page */}
        <Route component={() => <PageWrapper><NotFound /></PageWrapper>} />
      </Switch>
  );
}

function App() {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [contentReady, setContentReady] = useState(false);

  useEffect(() => {
    // Delay content appearance slightly after video loads for smoother transition
    if (videoLoaded) {
      const timer = setTimeout(() => {
        setContentReady(true);
      }, 100); // Small delay to ensure smooth transition
      return () => clearTimeout(timer);
    }
  }, [videoLoaded]);

  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <TooltipProvider>
          {/* Create a wrapper that doesn't have any transforms */}
          <div className="relative w-full h-full">
            {/* Persistent Video Background - stays mounted across all routes */}
            <div className="fixed inset-0 -z-10 overflow-hidden bg-black">
              <video
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                webkit-playsinline="true"
                x5-playsinline="true"
                className="absolute w-full h-full object-cover"
                style={{
                  objectFit: 'cover',
                  width: '100vw',
                  height: '100vh',
                  filter: 'brightness(0.8) contrast(1.15) saturate(1.05)',
                  minWidth: '100%',
                  minHeight: '100%',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  opacity: videoLoaded ? 1 : 0,
                  transition: 'opacity 0.8s ease-out',
                }}
                onError={(e) => {
                  console.error('Video failed to load:', e);
                  console.log('Video src:', schoolVideo);
                  // Still set loaded to true to show content even if video fails
                  setVideoLoaded(true);
                }}
                onLoadStart={() => console.log('Video loading started')}
                onCanPlay={() => {
                  console.log('Video can play');
                  setVideoLoaded(true);
                }}
              >
                <source src={schoolVideo} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              
              {/* Vignette overlay applied directly over video */}
              <div className="absolute inset-0 bg-black bg-opacity-35"
                style={{
                  opacity: videoLoaded ? 1 : 0,
                  transition: 'opacity 0.8s ease-out',
                }}
              ></div>
            </div>

            {/* Loading screen with fade out */}
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black pointer-events-none"
              style={{
                opacity: videoLoaded ? 0 : 1,
                transition: 'opacity 0.6s ease-out',
              }}
            >
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
                <p className="text-white/70 text-sm">Loading...</p>
              </div>
            </div>

            {/* Content wrapper with smooth fade-in */}
            <div style={{
              opacity: contentReady ? 1 : 0,
              transform: contentReady ? 'translateY(0)' : 'translateY(10px)',
              transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
            }}>
              <Toaster />
              <Router />
            </div>
          </div>
        </TooltipProvider>
      </CartProvider>
    </QueryClientProvider>
  );
}

export default App;
