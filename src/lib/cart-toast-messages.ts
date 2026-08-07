import type { Category } from "@/lib/types";

const MESSAGES: Record<Category, string[]> = {
  shawarma: [
    "Your cart is looking good! 🌯🍟",
    "Big flavor just hit your cart! 🌯🍟",
  ],
  drinks: [
    "Drink's added to your cart! 🥤",
    "Something refreshing's in your cart! 🥤",
  ],
  packages: [
    "Premium feast in your cart! 🍟🥤",
    "Your cart just got upgraded! 🍟🥤",
  ],
};

export function pickCartToastMessage(category: Category): string {
  const options = MESSAGES[category] ?? MESSAGES.shawarma;
  return options[Math.floor(Math.random() * options.length)];
}
