import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storagedProducts = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );

      if (storagedProducts) {
        setProducts([...JSON.parse(storagedProducts)]);
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const productExist = products.find(
        productStoraged => productStoraged.id === product.id,
      );

      let newProducts: Product[];
      if (productExist) {
        newProducts = products.map(productStoraged =>
          productStoraged.id === product.id
            ? { ...productStoraged, quantity: productStoraged.quantity + 1 }
            : productStoraged,
        );
      } else {
        newProducts = [...products, { ...product, quantity: 1 }];
      }

      setProducts(newProducts);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(newProducts),
      );
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const newProduct = products.map(product =>
        product.id === id
          ? { ...product, quantity: product.quantity + 1 }
          : product,
      );

      setProducts(newProduct);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(newProduct),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const newProduct = products.map(product =>
        product.id === id
          ? { ...product, quantity: product.quantity - 1 }
          : product,
      );

      const newProductsFiltered = newProduct.filter(
        product => product.quantity > 0,
      );

      setProducts(newProductsFiltered);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(newProductsFiltered),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
