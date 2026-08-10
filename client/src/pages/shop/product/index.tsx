import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/use-toast";
import { PrimaryButton } from "@/components/ThemedComponents";
import { getProduct, type Product } from "@/lib/api";
import { useCart } from "@/contexts/CartContext";
import { UniversalPageLayout } from "@/components/UniversalPageLayout";
import { BlurContainer, BlurActionButton } from "@/components/UniversalBlurComponents";
import { ShoppingCart } from "lucide-react";

const MAX_QUANTITY_PER_ORDER = 10;

export default function ProductPage() {
  const [, params] = useRoute("/shop/product/:id");
  const [, setLocation] = useLocation();
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToCart, cartItems, cartCount } = useCart();

  const handleCartClick = () => {
    sessionStorage.setItem('cart-referrer', `/shop/product/${params?.id}`);
    setLocation("/shop/cart");
  };

  useEffect(() => {
    const fetchProduct = async () => {
      if (!params?.id) return;

      setSelectedSize("");
      setQuantity(1);
      setActiveImageIndex(0);

      try {
        setLoading(true);
        const data = await getProduct(params.id);
        setProduct(data);
        const availableSizes = (data?.sizeStock ?? []).filter(item => item.stock > 0);
        if (data?.category === 'Apparel' && availableSizes.length === 1) {
          setSelectedSize(availableSizes[0].size);
        }
        setError(null);
      } catch (err) {
        console.error('Failed to load product:', err);
        setProduct(null);
        setError('Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [params?.id]);

  const isApparel = product?.category === 'Apparel';
  const sizeStock = product?.sizeStock ?? [];
  const totalApparelStock = sizeStock.reduce((total, item) => total + item.stock, 0);
  const productStock = product?.stock ?? 0;
  const inStock = isApparel ? totalApparelStock > 0 : productStock > 0;
  const availableStock = isApparel
    ? (selectedSize ? sizeStock.find(item => item.size === selectedSize)?.stock ?? 0 : totalApparelStock)
    : productStock;
  const quantityAlreadyInCart = cartItems
    .filter(item => item.id === product?._id && item.size === (selectedSize || undefined))
    .reduce((total, item) => total + item.quantity, 0);
  const maxQuantity = Math.max(
    0,
    Math.min(MAX_QUANTITY_PER_ORDER, availableStock - quantityAlreadyInCart)
  );

  useEffect(() => {
    setQuantity(current => (maxQuantity > 0 ? Math.min(current, maxQuantity) : 1));
  }, [maxQuantity]);

  const handleAddToCart = () => {
    if (!product) return;

    if (isApparel && sizeStock.length > 1 && !selectedSize) {
      toast({
        title: "Please select a size",
        description: "You need to select a size before adding to cart",
        variant: "destructive"
      });
      return;
    }

    if (availableStock <= 0) {
      toast({
        title: isApparel && selectedSize ? "Size out of stock" : "Out of stock",
        description: isApparel && selectedSize
          ? "The selected size is currently out of stock"
          : "This item is currently out of stock",
        variant: "destructive"
      });
      return;
    }

    if (maxQuantity < 1) {
      toast({
        title: "Stock limit reached",
        description: "You already have every available unit of this item in your cart",
        variant: "destructive"
      });
      return;
    }

    const quantityToAdd = Math.min(quantity, maxQuantity);

    addToCart({
      id: product._id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: quantityToAdd,
      size: selectedSize || undefined,
      type: 'product',
      maxQuantity: availableStock
    });

    const sizeText = selectedSize ? ` (${selectedSize})` : '';
    toast({
      title: "Added to cart",
      description: `${quantityToAdd} x ${product.name}${sizeText} added to your cart`,
    });

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
      rightElement={({ contentVisible }) => (
        <button
          onClick={handleCartClick}
          aria-label="View cart"
          className="relative flex items-center justify-center min-h-11 min-w-11 p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/15 transition-all duration-300"
          style={{
            backdropFilter: contentVisible ? 'blur(20px)' : 'blur(0px)',
            WebkitBackdropFilter: contentVisible ? 'blur(20px)' : 'blur(0px)',
          }}
        >
          <ShoppingCart className="w-5 h-5 text-white" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>
      )}
    >
      {({ contentVisible }) => (
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div
            className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden transform transition-all duration-500 ease-out"
            style={{
              opacity: contentVisible ? 1 : 0,
              transform: contentVisible ? 'translateY(0px)' : 'translateY(20px)',
              transitionDelay: '200ms'
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 p-4 sm:p-6">
              <div
                className="space-y-4 transform transition-all duration-500 ease-out"
                style={{
                  opacity: contentVisible ? 1 : 0,
                  transform: contentVisible ? 'translateY(0px)' : 'translateY(20px)',
                  transitionDelay: '300ms'
                }}
              >
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

                {((product.images && product.images.length > 0) || product.image) && (
                  <div className="flex space-x-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden">
                    <button
                      onClick={() => setActiveImageIndex(0)}
                      aria-label={`${product.name} main view`}
                      className={`relative shrink-0 rounded-md overflow-hidden h-20 w-20 border-2 ${
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

                    {product.images && product.images.map((img: string, idx: number) => (
                      <button
                        key={`${img}-${idx}`}
                        onClick={() => setActiveImageIndex(idx + 1)}
                        aria-label={`${product.name} view ${idx + 1}`}
                        className={`relative shrink-0 rounded-md overflow-hidden h-20 w-20 border-2 ${
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

              <div
                className="space-y-6 transform transition-all duration-500 ease-out"
                style={{
                  opacity: contentVisible ? 1 : 0,
                  transform: contentVisible ? 'translateY(0px)' : 'translateY(20px)',
                  transitionDelay: '400ms'
                }}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <Badge className="mb-2 bg-blue-600 text-white">{product.category}</Badge>
                    <Badge
                      variant={inStock ? "outline" : "secondary"}
                      className={inStock ? "border-green-400 text-green-400" : "bg-red-600 text-white"}
                    >
                      {inStock ? "In Stock" : "Out of Stock"}
                    </Badge>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-white break-words">{product.name}</h1>
                  <p className="text-sm text-gray-300 mb-2 break-words">By {product.organization}</p>
                  <div className="mb-4">
                    {isApparel ? (
                      sizeStock.length > 0 && (
                        <p className="text-sm text-gray-300">
                          {totalApparelStock} items available across all sizes
                        </p>
                      )
                    ) : (
                      productStock > 0 && (
                        <p className="text-sm text-gray-300">
                          {productStock} items available
                        </p>
                      )
                    )}
                  </div>
                  <div className="text-3xl font-bold text-blue-400">${product.price.toFixed(2)}</div>
                </div>

                <div className="space-y-4">
                  {isApparel && sizeStock.length > 0 && (
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
                        {sizeStock.map(sizeItem => (
                          <div key={sizeItem.size} className="flex items-center">
                            {sizeItem.stock > 0 ? (
                              <>
                                <RadioGroupItem id={`size-${sizeItem.size}`} value={sizeItem.size} className="hidden" />
                                <Label
                                  htmlFor={`size-${sizeItem.size}`}
                                  className={`flex items-center min-h-11 px-4 py-2 border rounded-md cursor-pointer text-sm transition-colors ${
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
                              <div className="flex items-center min-h-11 px-4 py-2 border border-white/10 rounded-md text-sm text-gray-500 cursor-not-allowed bg-gray-800/50">
                                {sizeItem.size}
                                <span className="ml-2 text-xs opacity-75">(0)</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="quantity" className="block text-sm font-medium mb-2 text-gray-200">
                      Quantity
                    </Label>
                    <div className="flex items-center">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        className="rounded-r-none bg-white/5 border border-white/20 text-gray-200 hover:bg-white/10 hover:text-white w-11 h-11 flex items-center justify-center transition-colors duration-300 disabled:opacity-50"
                        onClick={() => setQuantity(current => Math.max(1, current - 1))}
                        disabled={quantity <= 1}
                      >
                        -
                      </button>
                      <input
                        id="quantity"
                        type="number"
                        inputMode="numeric"
                        className="h-11 w-16 rounded-none text-center border-y border-x-0 border-white/20 bg-white/5 text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        min={1}
                        max={Math.max(1, maxQuantity)}
                        value={quantity}
                        onChange={(e) => {
                          const parsed = parseInt(e.target.value, 10);
                          if (!Number.isNaN(parsed)) {
                            setQuantity(Math.max(1, Math.min(parsed, Math.max(1, maxQuantity))));
                          }
                        }}
                      />
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        className="rounded-l-none bg-white/5 border border-white/20 text-gray-200 hover:bg-white/10 hover:text-white w-11 h-11 flex items-center justify-center transition-colors duration-300 disabled:opacity-50"
                        onClick={() => setQuantity(current => Math.min(current + 1, maxQuantity))}
                        disabled={quantity >= maxQuantity}
                      >
                        +
                      </button>
                    </div>
                    {inStock && maxQuantity > 0 && maxQuantity < MAX_QUANTITY_PER_ORDER && (
                      <p className="mt-2 text-xs text-gray-400">
                        {maxQuantity} left that you can add{quantityAlreadyInCart > 0 ? ` (${quantityAlreadyInCart} already in your cart)` : ''}
                      </p>
                    )}
                    {inStock && maxQuantity === 0 && (
                      <p className="mt-2 text-xs text-amber-300">
                        You already have every available unit in your cart.
                      </p>
                    )}
                  </div>

                  <PrimaryButton
                    onClick={handleAddToCart}
                    disabled={!inStock || maxQuantity < 1}
                    className="w-full min-h-11 py-3 px-6 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {inStock ? (maxQuantity < 1 ? "Stock Limit Reached" : "Add to Cart") : "Out of Stock"}
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
