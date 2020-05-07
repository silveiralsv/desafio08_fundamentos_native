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
  addToCart(item: Product): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storageProducts = await AsyncStorage.getItem(
        '@Marketplace:product',
      );
      console.log('CartProvider:React.FC -> storageProducts', storageProducts);

      if (storageProducts) {
        setProducts([...JSON.parse(storageProducts)]);
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const filteredProducts = products.filter(p => p.id !== id);

      const product = products.find(p => p.id === id);

      if (product) {
        setProducts([
          ...filteredProducts,
          { ...product, quantity: product.quantity += 1 },
        ]);
      }
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const filteredProducts = products.filter(p => p.id !== id);

      const product = products.find(p => p.id === id);
      console.log('CartProvider:React.FC -> product.FIND', product);

      if (product) {
        product.quantity === 1
          ? setProducts([...filteredProducts])
          : setProducts([
              ...filteredProducts,
              { ...product, quantity: product.quantity -= 1 },
            ]);
      }
    },
    [products],
  );

  useEffect(() => {
    async function setAsyncStorage(): Promise<void> {
      await AsyncStorage.setItem(
        '@Marketplace:product',
        JSON.stringify(products),
      );
    }

    setAsyncStorage();
  }, [products]);

  const addToCart = useCallback(
    async product => {
      const existingId = products.findIndex(p => p.id === product.id);

      if (existingId < 0) {
        setProducts([...products, { ...product, quantity: 1 }]);
      } else {
        increment(product.id);
      }
    },
    [products, increment],
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
