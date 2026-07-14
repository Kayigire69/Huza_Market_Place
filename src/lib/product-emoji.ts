/** Optional emoji hint before product names on category cards. */
export function productListEmoji(nameEn: string): string {
  const n = nameEn.toLowerCase();
  if (n.includes("apple") || n.includes("orange")) return "🍊";
  if (n.includes("mango")) return "🥭";
  if (n.includes("banana")) return "🍌";
  if (n.includes("pineapple")) return "🍍";
  if (n.includes("avocado")) return "🥑";
  if (n.includes("passion")) return "🟣";
  if (n.includes("watermelon")) return "🍉";
  if (n.includes("papaya") || n.includes("pawpaw")) return "🧡";
  if (n.includes("lemon")) return "🍋";
  if (n.includes("guava")) return "🟢";
  if (n.includes("tomato")) return "🍅";
  if (n.includes("onion")) return "🧅";
  if (n.includes("potato")) return "🥔";
  if (n.includes("carrot")) return "🥕";
  if (n.includes("cabbage")) return "🥬";
  if (n.includes("pepper") || n.includes("chili")) return "🌶️";
  if (n.includes("cucumber")) return "🥒";
  if (n.includes("spinach") || n.includes("amaranth") || n.includes("dodo")) return "🥬";
  if (n.includes("broccoli")) return "🥦";
  if (n.includes("garlic")) return "🧄";
  if (n.includes("juice")) return "🥤";
  if (n.includes("salad") || n.includes("tray")) return "🥗";
  if (n.includes("seedling") || n.includes("sucker")) return "🌱";
  if (
    n.includes("hibiscus") ||
    n.includes("bougainvillea") ||
    n.includes("aloe") ||
    n.includes("plant") ||
    n.includes("rose") ||
    n.includes("snake") ||
    n.includes("money")
  )
    return "🪴";
  return "•";
}
