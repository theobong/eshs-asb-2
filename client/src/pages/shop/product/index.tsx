import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { ThemedPageWrapper, ThemedCard, PrimaryButton, OutlineButton, ThemedInput } from "@/components/ThemedComponents";
import { getProduct } from "@/lib/api";
import { useCart } from "@/contexts/CartContext";
import { UniversalPageLayout } from "@/components/UniversalPageLayout";
import { BlurContainer, BlurCard, BlurActionButton } from "@/components/UniversalBlurComponents";
import { ShoppingCart } from "lucide-react";

export default function ProductPage() {
  const [match, params] = useRoute("/shop/product/:id");
  const [, setLocation] = useLocation();
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToCart, cartItems } = useCart();
  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const handleCartClick = () => {
    sessionStorage.setItem('cart-referrer', `/shop/product/${params?.id}`);
    setLocation("/shop/cart");
  };

  const CartButton = ({ contentVisible }: { contentVisible: boolean }) => (
    <button
      onClick={handleCartClick}
      className="relative p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/15 transition-all duration-300"
      style={{
        backdropFilter: contentVisible ? 'blur(20px)' : 'blur(0px)',
        WebkitBackdropFilter: contentVisible ? 'blur(20px)' : 'blur(0px)',
      }}
    >
      <ShoppingCart className="w-5 h-5 text-white" />
      {cartItemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {cartItemCount}
        </span>
      )}
    </button>
  );

  // Fetch product data from API
  useEffect(() => {
    const fetchProduct = async () => {
      if (!params?.id) return;
      
      try {
        setLoading(true);
        const data = await getProduct(params.id);
        setProduct(data);
        setError(null);
      } catch (err) {
        console.error('Failed to load product:', err);
        setError('Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [params?.id]);

  const handleAddToCart = () => {
    // Check if size is required for Apparel products
    if (product.category === 'Apparel' && product.sizeStock && product.sizeStock.length > 1 && !selectedSize) {
      toast({
        title: "Please select a size",
        description: "You need to select a size before adding to cart",
        variant: "destructive"
      });
      return;
    }

    // Check stock availability for selected size
    if (product.category === 'Apparel' && selectedSize) {
      const sizeStockItem = product.sizeStock.find((item: any) => item.size === selectedSize);
      if (!sizeStockItem || sizeStockItem.stock <= 0) {
        toast({
          title: "Size out of stock",
          description: "The selected size is currently out of stock",
          variant: "destructive"
        });
        return;
      }
    }

    // Add the product to the cart using CartContext
    addToCart({
      id: product._id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: quantity,
      size: selectedSize || undefined,
      type: 'product'
    });

    // Show toast notification
    const sizeText = selectedSize ? ` (${selectedSize})` : '';
    toast({
      title: "Added to cart!",
      description: `${quantity} x ${product.name}${sizeText} added to your cart`,
    });
    
    // Navigate to cart page after short delay
    setTimeout(() => {
      sessionStorage.setItem('cart-referrer', `/shop/product/${params?.id}`);
      setLocation("/shop/cart");
    }, 1500);
  };

  const handleBackClick = () => {
    setLocation("/shop");
  };

  if (loading) {
    return (
      <UniversalPageLayout pageType="shop" title="Product Details" backButtonText="Back" onBackClick={handleBackClick}>
        {({ contentVisible }) => (
          <BlurContainer contentVisible={contentVisible} className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2 text-white">Loading Product...</h2>
              <p className="mb-4 text-gray-300">Please wait while we fetch the product details</p>
            </div>
          </BlurContainer>
        )}
      </UniversalPageLayout>
    );
  }
  
  if (error || !product) {
    return (
      <UniversalPageLayout pageType="shop" title="Product Details" backButtonText="Back" onBackClick={handleBackClick}>
        {({ contentVisible }) => (
          <BlurContainer contentVisible={contentVisible} className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2 text-white">Product Not Found</h2>
              <p className="mb-4 text-gray-300">The product you're looking for doesn't exist or has been removed.</p>
              <BlurActionButton 
                contentVisible={contentVisible}
                onClick={() => setLocation("/shop")}
              >
                Return to Shop
              </BlurActionButton>
            </div>
          </BlurContainer>
        )}
      </UniversalPageLayout>
    );
  }

  return (
    <UniversalPageLayout
      pageType="shop"
      title="Product Details"
      backButtonText="Back"
      onBackClick={handleBackClick}
      rightElement={({ contentVisible }) => <CartButton contentVisible={contentVisible} />}
    >
      {({ contentVisible }) => (
        <div className="max-w-6xl mx-auto px-6">
          {/* Product Details */}
          <div 
            className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden transform transition-all duration-500 ease-out"
            style={{
              opacity: contentVisible ? 1 : 0,
              transform: contentVisible ? 'translateY(0px)' : 'translateY(20px)',
              transitionDelay: '200ms'
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
              {/* Product Images */}
              <div 
                className="space-y-4 transform transition-all duration-500 ease-out"
                style={{
                  opacity: contentVisible ? 1 : 0,
                  transform: contentVisible ? 'translateY(0px)' : 'translateY(20px)',
                  transitionDelay: '300ms'
                }}
              >
                {/* Main Image */}
                <div className="aspect-square w-full rounded-lg overflow-hidden bg-gray-900">
                  <img
                    src={activeImageIndex === 0 ? 
                      product.image : 
                      (product.images && product.images.length > 0 ? 
                        product.images[activeImageIndex - 1] : 
                        product.image)}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "https://via.placeholder.com/500?text=Product+Image";
                    }}
                  />
                </div>

                {/* Thumbnail Images - Include main image as first thumbnail and any additional images */}
                {((product.images && product.images.length > 0) || product.image) && (
                  <div className="flex space-x-2 overflow-x-auto pb-2">
                    {/* Main image thumbnail */}
                    <button
                      onClick={() => setActiveImageIndex(0)}
                      className={`relative rounded-md overflow-hidden h-20 w-20 border-2 ${
                        activeImageIndex === 0 ? "border-blue-400" : "border-white/20"
                      }`}
                    >
                      <img
                        src={product.image}
                        alt={`${product.name} - main view`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "https://via.placeholder.com/100?text=Thumbnail";
                        }}
                      />
                    </button>
                    
                    {/* Additional image thumbnails */}
                    {product.images && product.images.map((img: string, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIndex(idx + 1)}
                        className={`relative rounded-md overflow-hidden h-20 w-20 border-2 ${
                          idx + 1 === activeImageIndex ? "border-blue-400" : "border-white/20"
                        }`}
                      >
                        <img
                          src={img}
                          alt={`${product.name} - view ${idx + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "https://via.placeholder.com/100?text=Thumbnail";
                          }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Information */}
              <div 
                className="space-y-6 transform transition-all duration-500 ease-out"
                style={{
                  opacity: contentVisible ? 1 : 0,
                  transform: contentVisible ? 'translateY(0px)' : 'translateY(20px)',
                  transitionDelay: '400ms'
                }}
              >
                {/* Header information */}
                <div>
                  <div className="flex items-center justify-between">
                    <Badge className="mb-2 bg-blue-600 text-white">{product.category}</Badge>
                    {product.category === 'Apparel' ? (
                      <Badge variant={product.sizeStock && product.sizeStock.some((item: any) => item.stock > 0) ? "outline" : "secondary"} 
                             className={product.sizeStock && product.sizeStock.some((item: any) => item.stock > 0) ? "border-green-400 text-green-400" : "bg-red-600 text-white"}>
                        {product.sizeStock && product.sizeStock.some((item: any) => item.stock > 0) ? "In Stock" : "Out of Stock"}
                      </Badge>
                    ) : (
                      <Badge variant={product.stock > 0 ? "outline" : "secondary"} 
                             className={product.stock > 0 ? "border-green-400 text-green-400" : "bg-red-600 text-white"}>
                        {product.stock > 0 ? "In Stock" : "Out of Stock"}
                      </Badge>
                    )}
                  </div>
                  <h1 className="text-3xl font-bold mb-2 text-white">{product.name}</h1>
                  <p className="text-sm text-gray-300 mb-2">By {product.organization}</p>
                  <div className="mb-4">
                    {product.category === 'Apparel' ? (
                      product.sizeStock && product.sizeStock.length > 0 && (
                        <p className="text-sm text-gray-300">
                          {product.sizeStock.reduce((total: number, item: any) => total + item.stock, 0)} items available across all sizes
                        </p>
                      )
                    ) : (
                      product.stock > 0 && (
                        <p className="text-sm text-gray-300">
                          {product.stock} items available
                        </p>
                      )
                    )}
                  </div>
                  <div className="text-3xl font-bold text-blue-400">${product.price.toFixed(2)}</div>
                </div>

                <div className="space-y-4">
                  {/* Size Selection - Only for Apparel */}
                  {product.category === 'Apparel' && product.sizeStock && product.sizeStock.length > 0 && (
                    <div>
                      <Label htmlFor="size-select" className="block text-sm font-medium mb-2 text-gray-200">
                        Select Size
                      </Label>
                      <RadioGroup
                        id="size-select"
                        value={selectedSize}
                        onValueChange={setSelectedSize}
                        className="flex flex-wrap gap-2"
                      >
                        {product.sizeStock.map((sizeItem: any) => (
                          <div key={sizeItem.size} className="flex items-center">
                            {sizeItem.stock > 0 ? (
                              <>
                                <RadioGroupItem id={`size-${sizeItem.size}`} value={sizeItem.size} className="hidden" />
                                <Label
                                  htmlFor={`size-${sizeItem.size}`}
                                  className={`px-4 py-2 border rounded-md cursor-pointer text-sm transition-colors ${
                                    selectedSize === sizeItem.size
                                      ? "border-white/40 bg-white/10 text-white"
                                      : "border-white/20 text-gray-200 hover:border-white/40 hover:text-white"
                                  }`}
                                >
                                  {sizeItem.size}
                                  <span className="ml-2 text-xs opacity-75">({sizeItem.stock})</span>
                                </Label>
                              </>
                            ) : (
                              <div className="px-4 py-2 border border-white/10 rounded-md text-sm text-gray-500 cursor-not-allowed bg-gray-800/50">
                                {sizeItem.size}
                                <span className="ml-2 text-xs opacity-75">(0)</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  )}

                  {/* Quantity */}
                  <div>
                    <Label htmlFor="quantity" className="block text-sm font-medium mb-2 text-gray-200">
                      Quantity
                    </Label>
                    <div className="flex items-center">
                      <button
                        type="button"
                        className="rounded-r-none bg-white/5 border border-white/20 text-gray-200 hover:bg-white/10 hover:text-white w-8 h-9 flex items-center justify-center transition-colors duration-300 disabled:opacity-50"
                        onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                        disabled={quantity <= 1}
                      >
                        -
                      </button>
                      <input
                        id="quantity"
                        type="number"
                        className="h-9 w-16 rounded-none text-center border-y border-x-0 border-white/20 bg-white/5 text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        min={1}
                        max={10}
                        value={quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val) && val >= 1 && val <= 10) {
                            setQuantity(val);
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="rounded-l-none bg-white/5 border border-white/20 text-gray-200 hover:bg-white/10 hover:text-white w-8 h-9 flex items-center justify-center transition-colors duration-300 disabled:opacity-50"
                        onClick={() => quantity < 10 && setQuantity(quantity + 1)}
                        disabled={quantity >= 10}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Add to Cart Button */}
                  <PrimaryButton
                    onClick={handleAddToCart}
                    className={`w-full py-3 px-6 font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${
                      product.category === 'Apparel' 
                        ? (product.sizeStock && product.sizeStock.some((item: any) => item.stock > 0) ? "" : "opacity-50 cursor-not-allowed")
                        : (product.stock > 0 ? "" : "opacity-50 cursor-not-allowed")
                    }`}
                  >
                    {product.category === 'Apparel' 
                      ? (product.sizeStock && product.sizeStock.some((item: any) => item.stock > 0) ? "Add to Cart" : "Out of Stock")
                      : (product.stock > 0 ? "Add to Cart" : "Out of Stock")
                    }
                  </PrimaryButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </UniversalPageLayout>
  );
}