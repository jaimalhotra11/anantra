"use client";

import { SessionProvider as NextAuthSessionProvider, useSession } from "next-auth/react";
import { ReactNode, useEffect } from "react";
import { Session } from "next-auth";
import { getPendingCartItem, addPendingItemToCart, clearPendingCartItem } from "@/lib/storefront";
import { toast } from "sonner";

interface SessionProviderProps {
  children: ReactNode;
  session?: Session | null;
}

function PostLoginHandler() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const pendingItem = getPendingCartItem();
      
      if (pendingItem) {
        // Add the pending item to cart
        addPendingItemToCart().then((success) => {
          if (success) {
            toast.success(`${pendingItem.productName} added to your cart!`);
            
            // Redirect back to the original page or cart
            const redirectPath = pendingItem.redirectPath || "/cart";
            setTimeout(() => {
              window.location.href = redirectPath;
            }, 1500);
          } else {
            toast.error("Failed to add item to cart. Please try again.");
            clearPendingCartItem();
          }
        });
      }
    }
  }, [session, status]);

  return null;
}

export default function SessionProvider({ children, session }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider session={session}>
      <PostLoginHandler />
      {children}
    </NextAuthSessionProvider>
  );
}
