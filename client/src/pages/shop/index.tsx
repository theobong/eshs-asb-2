import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemedCard, PrimaryButton, OutlineButton } from "@/components/ThemedComponents";
import { getProducts, type Product } from "@/lib/api";
import { useCart } from "@/contexts/CartContext";
import { UniversalPageLayout } from "@/components/UniversalPageLayout";
import { BlurContainer, BlurCard, BlurActionButton } from "@/components/UniversalBlurComponents";

export default function Shop() {
  const [, setLocation] = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load products from API
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const data = await getProducts();
        setProducts(data);
        setError(null);
      } catch (err) {
        console.error('Failed to load products:', err);
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);
  
  const handleProductClick = (productId: string) => {
    // Set referrer for proper back navigation
    sessionStorage.setItem('shop-referrer', '/shop');
    setLocation(`/shop/product/${productId}`);
  };
  
  // Use cart count from CartContext
  const { cartCount } = useCart();

  const handleCartClick = () => {
    sessionStorage.setItem('cart-referrer', '/shop');
    setLocation("/shop/cart");
  };
  return (
    <UniversalPageLayout
      pageType="shop"
      title="School Shop"
      rightElement={({ contentVisible }) => (
        <button
          onClick={handleCartClick}
          className="relative p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/15 transition-all duration-300"
          style={{
            backdropFilter: contentVisible ? 'blur(20px)' : 'blur(0px)',
            WebkitBackdropFilter: contentVisible ? 'blur(20px)' : 'blur(0px)',
          }}
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>
      )}
    >
      {({ contentVisible }) => (
        <>
          {/* Important Shopping Information */}
          <BlurContainer contentVisible={contentVisible} delay="200ms" className="p-6">
            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-blue-400/50 bg-blue-500/20">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-white">Student In-Class Delivery Available</h3>
                  <span className="text-sm text-gray-300">Delivery</span>
                </div>
                <p className="text-sm mt-2 text-gray-200">We will deliver items to students during their fourth period!</p>
              </div>
              <div className="p-4 rounded-lg border border-amber-400/50 bg-green-500/20">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-white">Pickup Available at Activities Office</h3>
                  <span className="text-sm text-gray-300">Pickup</span>
                </div>
                <p className="text-sm mt-2 text-gray-200">Order online and pick up your items during school hours at the Activities Office.</p>
              </div>
            </div>
          </BlurContainer>

          <div className="mb-8" />

          {/* Loading State */}
          {loading && (
            <BlurContainer contentVisible={contentVisible} delay="300ms" className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
              <p className="text-white">Loading products...</p>
            </BlurContainer>
          )}

          {/* Error State */}
          {error && (
            <BlurContainer contentVisible={contentVisible} delay="300ms" className="p-6 text-center">
              <div className="text-red-400 mb-4">
                <svg className="w-12 h-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Failed to Load Products</h3>
              <p className="text-gray-300 mb-4">{error}</p>
              <PrimaryButton onClick={() => window.location.reload()}>
                Try Again
              </PrimaryButton>
            </BlurContainer>
          )}

          {/* Product Grid */}
          {!loading && !error && (
            products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {products.map((item, index) => (
                  <BlurCard 
                    key={item._id} 
                    contentVisible={contentVisible}
                    index={index}
                    delay={`${300 + (index * 75)}ms`}
                    className="cursor-pointer"
                    onClick={() => handleProductClick(item._id)}
                  >
                    {/* Product Image */}
                    <div className="h-48 bg-gray-900 overflow-hidden">
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.src = "https://via.placeholder.com/300?text=Product+Image";
                        }}
                      />
                    </div>
                    
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-white">{item.name}</CardTitle>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xl font-bold text-blue-400">${item.price.toFixed(2)}</span>
                        <Badge variant="outline">{item.category}</Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <p className="text-gray-300 text-sm mb-3">{item.description}</p>
                    </CardContent>
                    
                    <CardFooter className="border-t pt-4">
                      <PrimaryButton className="w-full">
                        View Details
                      </PrimaryButton>
                    </CardFooter>
                  </BlurCard>
                ))}
              </div>
            ) : (
              <BlurContainer contentVisible={contentVisible} delay="300ms" className="p-12 text-center">
                <div className="flex flex-col items-center">
                  <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <h3 className="text-xl font-semibold text-white mb-2">No products available</h3>
                  <p className="text-gray-300">Check back later for new items</p>
                </div>
              </BlurContainer>
            )
          )}
        </>
      )}
    </UniversalPageLayout>
  );
}
