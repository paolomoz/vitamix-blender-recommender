/**
 * Content Repository
 * Static content bundled with the worker
 */

import type { Product, UseCase, Feature } from './types';

// Product recommendation criteria
export interface ProductProfile {
  // Use case suitability (0-10 score)
  useCaseScores: Record<string, number>;
  // Price tier
  priceTier: 'budget' | 'mid' | 'premium';
  // Best for household types
  householdFit: ('solo' | 'couple' | 'family')[];
  // Key differentiators
  standoutFeatures: string[];
  // Who should NOT buy this
  notIdealFor: string[];
}

// Products data with rich recommendation profiles
export const products: Product[] = [
  {
    id: 'ascent-x5-smartprep-kitchen-system',
    name: 'Ascent X5 SmartPrep Kitchen System',
    series: 'ascent-x',
    url: 'https://www.vitamix.com/us/en_us/shop/blenders/ascent-x5-smartprep-kitchen-system',
    price: 899.95,
    originalPrice: 949.95,
    warranty: '10 years',
    description: 'Our most advanced blender system with SmartPrep technology for guided cooking.',
    tagline: 'The Ultimate Kitchen Companion',
    features: ['SmartPrep Technology', 'Touchscreen Display', '10 Programs', 'Self-Detect Containers', 'WiFi Connected'],
    bestFor: ['meal-prep', 'soups', 'nut-butters', 'frozen-desserts', 'smoothies', 'baby-food'],
    images: {
      primary: 'https://www.vitamix.com/us/en_us/products/media_388e2062bc515d20e36d6e60b635d68121a44cfb.png?width=750&format=png&optimize=medium',
      gallery: [],
    },
    specs: { watts: 1800, capacity: '64oz', programs: 10 },
  },
  {
    id: 'ascent-x5',
    name: 'Ascent X5',
    series: 'ascent-x',
    url: 'https://www.vitamix.com/us/en_us/shop/blenders/ascent-x5',
    price: 699.95,
    originalPrice: 749.95,
    warranty: '10 years',
    description: 'Top-of-the-line performance with touchscreen control and 10 program settings.',
    tagline: 'Peak Performance',
    features: ['Touchscreen', '10 Programs', 'Self-Detect', 'Digital Timer'],
    bestFor: ['soups', 'nut-butters', 'frozen-desserts', 'smoothies', 'meal-prep'],
    images: {
      primary: 'https://www.vitamix.com/us/en_us/products/media_cf7b1b7a0732b25592404b6342ae9bbac946514c.png?width=750&format=png&optimize=medium',
      gallery: [],
    },
    specs: { watts: 1800, capacity: '64oz', programs: 10 },
  },
  {
    id: 'ascent-x4',
    name: 'Ascent X4',
    series: 'ascent-x',
    url: 'https://www.vitamix.com/us/en_us/shop/blenders/ascent-x4',
    price: 649.95,
    originalPrice: 699.95,
    warranty: '10 years',
    description: 'Advanced blending with 5 program settings and touchscreen interface.',
    tagline: 'Smart Simplicity',
    features: ['Touchscreen', '5 Programs', 'Self-Detect', 'Digital Timer'],
    bestFor: ['smoothies', 'frozen-desserts', 'soups', 'baby-food'],
    images: {
      primary: 'https://www.vitamix.com/us/en_us/products/media_306c8b3cd1236fca5a912cb09c4e7fd125bb0de0.png?width=750&format=png&optimize=medium',
      gallery: [],
    },
    specs: { watts: 1800, capacity: '64oz', programs: 5 },
  },
  {
    id: 'ascent-x3',
    name: 'Ascent X3',
    series: 'ascent-x',
    url: 'https://www.vitamix.com/us/en_us/shop/blenders/ascent-x3',
    price: 599.95,
    originalPrice: 649.95,
    warranty: '10 years',
    description: 'Programmable timer and 3 program settings for consistent results.',
    tagline: 'Precision Blending',
    features: ['Digital Timer', '3 Programs', 'Self-Detect', 'Variable Speed'],
    bestFor: ['smoothies', 'soups', 'frozen-desserts'],
    images: {
      primary: 'https://www.vitamix.com/us/en_us/products/media_0f5617b390a6e0a065902e8b246ace7211dd3864.png?width=750&format=png&optimize=medium',
      gallery: [],
    },
    specs: { watts: 1800, capacity: '64oz', programs: 3 },
  },
  {
    id: 'ascent-x2',
    name: 'Ascent X2',
    series: 'ascent-x',
    url: 'https://www.vitamix.com/us/en_us/shop/blenders/ascent-x2',
    price: 499.95,
    originalPrice: 549.95,
    warranty: '10 years',
    description: 'Essential Ascent features with variable speed control and pulse.',
    tagline: 'Essential Excellence',
    features: ['Variable Speed', 'Pulse', 'Self-Detect', 'BPA-Free'],
    bestFor: ['smoothies', 'baby-food', 'frozen-desserts'],
    images: {
      primary: 'https://www.vitamix.com/us/en_us/products/media_7d3fea4eb6a6699fadd4ef63f9063aba0054b64f.png?width=750&format=png&optimize=medium',
      gallery: [],
    },
    specs: { watts: 1800, capacity: '64oz', programs: 0 },
  },
  {
    id: '5200-standard-getting-started',
    name: '5200 Standard',
    series: '5200',
    url: 'https://www.vitamix.com/us/en_us/shop/blenders/5200-standard-getting-started',
    price: 449.95,
    originalPrice: 499.95,
    warranty: '7 years',
    description: 'The iconic Vitamix that started it all. Simple, reliable, powerful.',
    tagline: 'Classic Performance',
    features: ['Variable Speed', 'Pulse', '64oz Container', 'Self-Cleaning'],
    bestFor: ['smoothies', 'soups', 'nut-butters'],
    images: {
      primary: 'https://www.vitamix.com/us/en_us/products/media_f259fd5b59115627531aad5602a187fe8376c845.jpg?width=750&format=jpg&optimize=medium',
      gallery: [],
    },
    specs: { watts: 1380, capacity: '64oz', programs: 0 },
  },
  {
    id: 'e310-personal-cup-adapter',
    name: 'E310 Explorian',
    series: 'explorian',
    url: 'https://www.vitamix.com/us/en_us/shop/blenders/e310-and-pca-bundle',
    price: 419.95,
    originalPrice: 499.95,
    warranty: '5 years',
    description: 'Great entry point to Vitamix with 10 variable speeds.',
    tagline: 'Start Your Journey',
    features: ['Variable Speed', 'Pulse', '48oz Container', 'Personal Cup Adapter'],
    bestFor: ['smoothies', 'baby-food'],
    images: {
      primary: 'https://www.vitamix.com/us/en_us/products/media_45d9a17a28a0007faa33f777c49370b72dae1d83.png?width=750&format=png&optimize=medium',
      gallery: [],
    },
    specs: { watts: 1200, capacity: '48oz', programs: 0 },
  },
];

// Product profiles for intelligent recommendations
export const productProfiles: Record<string, ProductProfile> = {
  'ascent-x5-smartprep-kitchen-system': {
    useCaseScores: { 'meal-prep': 10, 'soups': 10, 'nut-butters': 9, 'frozen-desserts': 9, 'smoothies': 9, 'baby-food': 8 },
    priceTier: 'premium',
    householdFit: ['family'],
    standoutFeatures: ['SmartPrep guided cooking', 'WiFi connected', 'Complete kitchen system'],
    notIdealFor: ['budget-conscious', 'simple-needs', 'small-spaces'],
  },
  'ascent-x5': {
    useCaseScores: { 'soups': 10, 'nut-butters': 10, 'frozen-desserts': 9, 'smoothies': 9, 'meal-prep': 8 },
    priceTier: 'premium',
    householdFit: ['couple', 'family'],
    standoutFeatures: ['10 programs', 'Touchscreen', 'Best for hot soups'],
    notIdealFor: ['budget-conscious', 'occasional-use'],
  },
  'ascent-x4': {
    useCaseScores: { 'smoothies': 10, 'frozen-desserts': 9, 'soups': 8, 'baby-food': 9 },
    priceTier: 'mid',
    householdFit: ['couple', 'family'],
    standoutFeatures: ['5 programs', 'Touchscreen', 'Great all-rounder'],
    notIdealFor: ['budget-conscious', 'needs-all-programs'],
  },
  'ascent-x3': {
    useCaseScores: { 'smoothies': 9, 'soups': 8, 'frozen-desserts': 8 },
    priceTier: 'mid',
    householdFit: ['couple', 'family'],
    standoutFeatures: ['3 programs', 'Digital timer', 'Self-detect containers'],
    notIdealFor: ['wants-touchscreen', 'needs-many-programs'],
  },
  'ascent-x2': {
    useCaseScores: { 'smoothies': 9, 'baby-food': 8, 'frozen-desserts': 7 },
    priceTier: 'mid',
    householdFit: ['solo', 'couple', 'family'],
    standoutFeatures: ['Self-detect containers', '10-year warranty', 'Best value Ascent'],
    notIdealFor: ['wants-programs', 'wants-touchscreen'],
  },
  '5200-standard-getting-started': {
    useCaseScores: { 'smoothies': 9, 'soups': 9, 'nut-butters': 8 },
    priceTier: 'budget',
    householdFit: ['couple', 'family'],
    standoutFeatures: ['Proven reliability', 'Classic design', 'Simple controls'],
    notIdealFor: ['wants-modern-features', 'wants-programs'],
  },
  'e310-personal-cup-adapter': {
    useCaseScores: { 'smoothies': 10, 'baby-food': 7 },
    priceTier: 'budget',
    householdFit: ['solo', 'couple'],
    standoutFeatures: ['Best budget option', 'Personal cups included', 'Compact size'],
    notIdealFor: ['large-batches', 'hot-soups', 'nut-butters'],
  },
};

export const useCases: UseCase[] = [
  {
    id: 'smoothies',
    name: 'Smoothies & Juices',
    description: 'Create silky-smooth blends from frozen fruits, leafy greens, and more.',
    icon: 'smoothie',
    relevantFeatures: ['Variable Speed', 'Pulse', 'Self-Cleaning'],
    recommendedSeries: ['ascent-x', '5200', 'explorian'],
  },
  {
    id: 'soups',
    name: 'Hot Soups',
    description: 'Blend ingredients so fast the friction creates steam-hot soup in minutes.',
    icon: 'soup',
    relevantFeatures: ['Variable Speed', 'Programs', 'Self-Cleaning'],
    recommendedSeries: ['ascent-x', '5200'],
  },
  {
    id: 'nut-butters',
    name: 'Nut Butters',
    description: 'Transform nuts into creamy, fresh nut butters without additives.',
    icon: 'nutbutter',
    relevantFeatures: ['Variable Speed', 'Tamper', 'High Power'],
    recommendedSeries: ['ascent-x', '5200'],
  },
  {
    id: 'frozen-desserts',
    name: 'Frozen Desserts',
    description: 'Make healthy ice cream alternatives from frozen fruit.',
    icon: 'icecream',
    relevantFeatures: ['Variable Speed', 'Programs', 'Tamper'],
    recommendedSeries: ['ascent-x', '5200'],
  },
  {
    id: 'meal-prep',
    name: 'Meal Prep',
    description: 'Chop, dice, and prep ingredients for the week ahead.',
    icon: 'mealprep',
    relevantFeatures: ['Programs', 'Self-Detect', 'Multiple Containers'],
    recommendedSeries: ['ascent-x'],
  },
  {
    id: 'baby-food',
    name: 'Baby Food',
    description: 'Create fresh, nutritious purees for your little one.',
    icon: 'baby',
    relevantFeatures: ['Variable Speed', 'BPA-Free', 'Self-Cleaning'],
    recommendedSeries: ['ascent-x', '5200', 'explorian'],
  },
];

export const features: Feature[] = [
  {
    id: 'touchscreen',
    name: 'Touchscreen Display',
    description: 'Intuitive touch interface for effortless control.',
    benefit: 'Easy to use and clean, with guided programs at your fingertips.',
    availableIn: ['ascent-x5', 'ascent-x4'],
  },
  {
    id: 'programs',
    name: 'Preset Programs',
    description: 'One-touch programs for smoothies, soups, frozen desserts, and more.',
    benefit: 'Perfect results every time without guesswork.',
    availableIn: ['ascent-x5', 'ascent-x4', 'ascent-x3'],
  },
  {
    id: 'self-detect',
    name: 'Self-Detect Containers',
    description: 'Automatically adjusts settings based on container size.',
    benefit: 'Optimized blending for any container, from personal cups to 64oz.',
    availableIn: ['ascent-x5', 'ascent-x4', 'ascent-x3', 'ascent-x2'],
  },
  {
    id: 'variable-speed',
    name: 'Variable Speed Control',
    description: '10 variable speeds for complete texture control.',
    benefit: 'From chunky salsas to silky purees, you control the consistency.',
    availableIn: ['ascent-x5', 'ascent-x4', 'ascent-x3', 'ascent-x2', '5200-standard-getting-started', 'e310-personal-cup-adapter'],
  },
  {
    id: 'self-cleaning',
    name: 'Self-Cleaning',
    description: 'Add soap and water, blend for 60 seconds, rinse and done.',
    benefit: 'No disassembly needed - clean in under 2 minutes.',
    availableIn: ['ascent-x5', 'ascent-x4', 'ascent-x3', 'ascent-x2', '5200-standard-getting-started', 'e310-personal-cup-adapter'],
  },
];

// Recipe data
export interface Recipe {
  id: string;
  name: string;
  description: string;
  category: string; // smoothies, soups, nut-butters, frozen-desserts, baby-food, meal-prep
  difficulty: 'easy' | 'medium' | 'advanced';
  time: string;
  ingredients: string[];
  tip: string;
}

export const recipes: Recipe[] = [
  // Smoothies
  {
    id: 'green-power-smoothie',
    name: 'Green Power Smoothie',
    description: 'Nutrient-packed blend of spinach, banana, and mango for an energizing start.',
    category: 'smoothies',
    difficulty: 'easy',
    time: '5 min',
    ingredients: ['2 cups spinach', '1 banana', '1 cup mango', '1 cup almond milk', '1 tbsp honey'],
    tip: 'Add the liquid first, then soft ingredients, then frozen items on top for best blending.',
  },
  {
    id: 'berry-blast',
    name: 'Berry Blast',
    description: 'Antioxidant-rich mixed berry smoothie with a creamy yogurt base.',
    category: 'smoothies',
    difficulty: 'easy',
    time: '3 min',
    ingredients: ['1 cup mixed berries', '1/2 cup Greek yogurt', '1/2 cup orange juice', '1 tbsp chia seeds'],
    tip: 'Use frozen berries for a thicker, colder smoothie without needing ice.',
  },
  {
    id: 'tropical-paradise',
    name: 'Tropical Paradise',
    description: 'Transport yourself to the tropics with pineapple, coconut, and passion fruit.',
    category: 'smoothies',
    difficulty: 'easy',
    time: '4 min',
    ingredients: ['1 cup pineapple', '1/2 cup coconut milk', '1 passion fruit', '1/2 banana', 'Ice'],
    tip: 'Freeze your pineapple chunks ahead of time for the creamiest texture.',
  },
  // Soups
  {
    id: 'tomato-basil-soup',
    name: 'Hot Tomato Basil Soup',
    description: 'Silky smooth tomato soup made hot by blade friction alone—no stove needed.',
    category: 'soups',
    difficulty: 'medium',
    time: '10 min',
    ingredients: ['4 tomatoes', '1/2 cup basil', '2 cloves garlic', '1 cup vegetable broth', 'Salt & pepper'],
    tip: 'Run on high for 5-6 minutes until steam rises from the lid—that means it\'s hot!',
  },
  {
    id: 'butternut-squash-soup',
    name: 'Butternut Squash Soup',
    description: 'Creamy, warming soup perfect for fall with hints of nutmeg and sage.',
    category: 'soups',
    difficulty: 'medium',
    time: '12 min',
    ingredients: ['2 cups roasted butternut squash', '1 cup broth', '1/4 cup cream', 'Nutmeg', 'Sage'],
    tip: 'Roast the squash first for deeper flavor, or use pre-cooked for speed.',
  },
  // Nut Butters
  {
    id: 'homemade-almond-butter',
    name: 'Homemade Almond Butter',
    description: 'Fresh, creamy almond butter with no additives—just pure roasted almonds.',
    category: 'nut-butters',
    difficulty: 'medium',
    time: '8 min',
    ingredients: ['3 cups roasted almonds', '1/2 tsp salt (optional)', '1 tbsp honey (optional)'],
    tip: 'Be patient—the nuts will go from crumbly to ball to creamy. Use the tamper!',
  },
  {
    id: 'chocolate-hazelnut-spread',
    name: 'Chocolate Hazelnut Spread',
    description: 'Homemade Nutella-style spread that\'s fresher and less sweet than store-bought.',
    category: 'nut-butters',
    difficulty: 'advanced',
    time: '12 min',
    ingredients: ['2 cups hazelnuts', '1/4 cup cocoa powder', '1/4 cup powdered sugar', '2 tbsp coconut oil'],
    tip: 'Toast and skin the hazelnuts first for the smoothest, most flavorful spread.',
  },
  // Frozen Desserts
  {
    id: 'banana-nice-cream',
    name: 'Banana Nice Cream',
    description: 'Healthy ice cream alternative made from just frozen bananas—creamy and delicious.',
    category: 'frozen-desserts',
    difficulty: 'easy',
    time: '5 min',
    ingredients: ['4 frozen bananas', '2 tbsp peanut butter (optional)', 'Chocolate chips (optional)'],
    tip: 'Slice bananas before freezing for easier blending. Use the tamper to push ingredients down.',
  },
  {
    id: 'mixed-berry-sorbet',
    name: 'Mixed Berry Sorbet',
    description: 'Refreshing dairy-free frozen treat bursting with berry flavor.',
    category: 'frozen-desserts',
    difficulty: 'easy',
    time: '4 min',
    ingredients: ['3 cups frozen mixed berries', '2 tbsp maple syrup', '1/4 cup orange juice'],
    tip: 'Add liquid slowly while blending—you want it thick, not runny.',
  },
  // Baby Food
  {
    id: 'sweet-potato-puree',
    name: 'Sweet Potato Puree',
    description: 'Smooth, nutritious first food that babies love—naturally sweet and vitamin-rich.',
    category: 'baby-food',
    difficulty: 'easy',
    time: '5 min',
    ingredients: ['2 cups cooked sweet potato', '1/2 cup water or breast milk'],
    tip: 'Make a big batch and freeze in ice cube trays for easy portion-sized servings.',
  },
  {
    id: 'apple-pear-blend',
    name: 'Apple Pear Blend',
    description: 'Gentle fruit combination perfect for introducing new flavors to little ones.',
    category: 'baby-food',
    difficulty: 'easy',
    time: '4 min',
    ingredients: ['1 apple (steamed)', '1 pear (steamed)', '2 tbsp water'],
    tip: 'Steam fruits until very soft before blending for the silkiest texture.',
  },
  // Meal Prep
  {
    id: 'veggie-pizza-sauce',
    name: 'Veggie Pizza Sauce',
    description: 'Fresh tomato sauce with hidden vegetables—perfect for picky eaters.',
    category: 'meal-prep',
    difficulty: 'easy',
    time: '5 min',
    ingredients: ['1 can tomatoes', '1 carrot', '1/2 zucchini', 'Italian herbs', 'Garlic'],
    tip: 'Blend smooth to hide the veggies, or pulse for a chunkier texture.',
  },
  {
    id: 'weekly-salad-dressing',
    name: 'Weekly Salad Dressing',
    description: 'Make a week\'s worth of fresh vinaigrette in seconds—no more bottled dressings.',
    category: 'meal-prep',
    difficulty: 'easy',
    time: '2 min',
    ingredients: ['1/2 cup olive oil', '1/4 cup balsamic vinegar', '1 tbsp Dijon', 'Garlic', 'Herbs'],
    tip: 'Emulsifies perfectly in seconds—will stay blended longer than hand-whisked.',
  },
];

// Customer reviews data
export interface Review {
  id: string;
  productId: string;
  author: string;
  rating: number; // 1-5
  title: string;
  content: string;
  verifiedPurchase: boolean;
  useCase: string;
  date: string;
}

export const reviews: Review[] = [
  // Ascent X5
  {
    id: 'review-1',
    productId: 'ascent-x5',
    author: 'Sarah M.',
    rating: 5,
    title: 'Worth every penny!',
    content: 'I was hesitant about the price, but after 6 months of daily use, I can\'t imagine my kitchen without it. The programs are foolproof and cleanup is a dream.',
    verifiedPurchase: true,
    useCase: 'smoothies',
    date: '2024-08-15',
  },
  {
    id: 'review-2',
    productId: 'ascent-x5',
    author: 'Michael R.',
    rating: 5,
    title: 'Hot soup in 6 minutes flat',
    content: 'The soup program is incredible. I throw in raw vegetables and broth, press one button, and have steaming hot soup. No stove, no pots to clean. Game changer for meal prep.',
    verifiedPurchase: true,
    useCase: 'soups',
    date: '2024-09-22',
  },
  {
    id: 'review-3',
    productId: 'ascent-x5',
    author: 'Jennifer L.',
    rating: 4,
    title: 'Great but loud',
    content: 'Love the touchscreen and programs. Makes incredible nut butters and frozen desserts. Only downside is the noise level—it\'s powerful, and you hear it. But results are perfect.',
    verifiedPurchase: true,
    useCase: 'nut-butters',
    date: '2024-10-05',
  },
  // Ascent X4
  {
    id: 'review-4',
    productId: 'ascent-x4',
    author: 'David K.',
    rating: 5,
    title: 'Perfect balance of features',
    content: 'Upgraded from the X2 for the programs. The smoothie and frozen dessert presets are fantastic. 5 programs is plenty—I don\'t need all 10 that the X5 has.',
    verifiedPurchase: true,
    useCase: 'frozen-desserts',
    date: '2024-07-18',
  },
  {
    id: 'review-5',
    productId: 'ascent-x4',
    author: 'Amanda P.',
    rating: 5,
    title: 'Family smoothie station',
    content: 'With 3 kids, we make smoothies every morning. The X4 handles frozen fruit like a champ. Self-cleaning means I actually want to use it daily. Best kitchen purchase ever.',
    verifiedPurchase: true,
    useCase: 'smoothies',
    date: '2024-11-02',
  },
  // Ascent X2
  {
    id: 'review-6',
    productId: 'ascent-x2',
    author: 'Chris T.',
    rating: 5,
    title: 'Great entry to Ascent line',
    content: 'Wanted the self-detect containers but didn\'t need programs. The X2 is perfect—variable speed gives me total control, and I got the 10-year warranty. Smart purchase.',
    verifiedPurchase: true,
    useCase: 'smoothies',
    date: '2024-06-30',
  },
  // 5200
  {
    id: 'review-7',
    productId: '5200-standard-getting-started',
    author: 'Robert H.',
    rating: 5,
    title: 'The classic for a reason',
    content: 'Had my first 5200 for 15 years before upgrading to... another 5200. Simple, reliable, powerful. No fancy screens to break. Just perfect blending every time.',
    verifiedPurchase: true,
    useCase: 'soups',
    date: '2024-08-28',
  },
  {
    id: 'review-8',
    productId: '5200-standard-getting-started',
    author: 'Lisa W.',
    rating: 4,
    title: 'Powerful but wish it had programs',
    content: 'Makes amazing smoothies and soups. Powerful motor handles anything. I just wish it had at least one program—I have to watch it the whole time. But quality is unmatched.',
    verifiedPurchase: true,
    useCase: 'smoothies',
    date: '2024-09-15',
  },
  // E310
  {
    id: 'review-9',
    productId: 'e310-personal-cup-adapter',
    author: 'Emily S.',
    rating: 5,
    title: 'Perfect starter Vitamix',
    content: 'First Vitamix and I love it! The personal cup adapter is great for single servings. Makes silky smoothies every time. Only wish it had a larger container option.',
    verifiedPurchase: true,
    useCase: 'smoothies',
    date: '2024-10-20',
  },
  {
    id: 'review-10',
    productId: 'e310-personal-cup-adapter',
    author: 'Tom B.',
    rating: 4,
    title: 'Great value but limited',
    content: 'Excellent for smoothies and baby food. The 48oz container is fine for 2 people. Wouldn\'t recommend for hot soups though—the smaller container and lower power aren\'t ideal.',
    verifiedPurchase: true,
    useCase: 'baby-food',
    date: '2024-11-08',
  },
];

export function getRecipesByCategory(category: string): Recipe[] {
  return recipes.filter((r) => r.category === category);
}

export function getReviewsByProduct(productId: string): Review[] {
  return reviews.filter((r) => r.productId === productId);
}

export function getReviewsByUseCase(useCase: string): Review[] {
  return reviews.filter((r) => r.useCase === useCase);
}

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function getProductsByPriceRange(min: number, max: number): Product[] {
  return products.filter((p) => p.price >= min && p.price <= max);
}

export function getProductsBySeries(series: string): Product[] {
  return products.filter((p) => p.series === series);
}

export function getProductsByBestFor(useCase: string): Product[] {
  return products.filter((p) => p.bestFor.includes(useCase));
}

export function searchProducts(query: string): Product[] {
  const lowerQuery = query.toLowerCase();
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.description.toLowerCase().includes(lowerQuery) ||
      p.features.some((f) => f.toLowerCase().includes(lowerQuery)) ||
      p.bestFor.some((b) => b.toLowerCase().includes(lowerQuery))
  );
}

// ============================================================================
// EMPATHETIC REASONING SYSTEM
// ============================================================================

/**
 * Benefit Mapping Schema
 * Links product features to user problems via reasoning chains:
 * [User Problem] -> [Product Feature] -> [Functional Benefit] -> [Emotional Outcome]
 */
export interface BenefitMapping {
  featureId: string;
  featureName: string;
  technicalSpec: string;
  problemsSolved: {
    problemId: string;
    problemStatement: string;
    userSegments: string[];
    emotionalContext: string;
  }[];
  functionalBenefits: {
    benefit: string;
    proofPoint: string;
    comparison?: string;
  }[];
  emotionalBenefits: {
    benefit: string;
    visualization: string;
    triggerPhrases: string[];
  }[];
  objectionsAddressed: {
    objection: string;
    response: string;
    calculation?: string;
  }[];
}

export const benefitMappings: BenefitMapping[] = [
  {
    featureId: 'motor_power_high',
    featureName: '1800W Motor',
    technicalSpec: '2.2 peak horsepower, 1800 watts',
    problemsSolved: [
      {
        problemId: 'chunky_texture',
        problemStatement: 'Blender leaves chunks and visible pieces',
        userSegments: ['picky_eater_parent', 'texture_sensitive', 'baby_food_maker'],
        emotionalContext: 'Frustration when food is rejected, wasted effort',
      },
      {
        problemId: 'frozen_struggles',
        problemStatement: "Blender can't handle frozen fruit or ice",
        userSegments: ['smoothie_enthusiast', 'frozen_dessert_maker'],
        emotionalContext: 'Disappointment, having to pre-thaw ingredients',
      },
      {
        problemId: 'nut_butter_failure',
        problemStatement: "Can't make smooth nut butters",
        userSegments: ['health_conscious', 'allergy_family', 'cost_saver'],
        emotionalContext: 'Wanting to avoid store-bought additives',
      },
    ],
    functionalBenefits: [
      {
        benefit: 'Completely smooth textures',
        proofPoint: 'Liquefies spinach stems in under 30 seconds',
        comparison: '10x more powerful than standard blenders',
      },
      {
        benefit: 'Handles any ingredient without pre-prep',
        proofPoint: 'Blends frozen fruit directly from freezer',
        comparison: 'No need to thaw or chop first',
      },
    ],
    emotionalBenefits: [
      {
        benefit: 'Peace of mind about nutrition',
        visualization: 'Kids happily drinking smoothies packed with hidden vegetables',
        triggerPhrases: ['picky eaters', "won't eat vegetables", 'sneaky nutrition', 'hate vegetables'],
      },
      {
        benefit: 'Confidence in your purchase',
        visualization: 'A kitchen tool that actually delivers on its promise',
        triggerPhrases: ['tired of cheap blenders', 'want something that works', 'frustrated'],
      },
    ],
    objectionsAddressed: [
      {
        objection: 'Is it really worth the extra money?',
        response: 'The motor is built to last 15-20 years. Cheaper blenders burn out in 2-3 years and can\'t achieve this texture.',
        calculation: 'At 20 years of daily use, that\'s less than 10 cents per smoothie',
      },
    ],
  },
  {
    featureId: 'programs_preset',
    featureName: 'Preset Programs',
    technicalSpec: '3-10 one-touch programs depending on model',
    problemsSolved: [
      {
        problemId: 'busy_parent',
        problemStatement: 'No time to monitor blending or learn settings',
        userSegments: ['busy_parent', 'time_constrained'],
        emotionalContext: 'Exhaustion, wanting convenience without compromising quality',
      },
      {
        problemId: 'inconsistent_results',
        problemStatement: 'Different results every time',
        userSegments: ['perfectionist', 'cooking_novice'],
        emotionalContext: 'Frustration with trial and error',
      },
    ],
    functionalBenefits: [
      {
        benefit: 'One-button perfect results',
        proofPoint: 'Press Smoothie, walk away, come back to perfect blend',
        comparison: 'No guessing or babysitting required',
      },
      {
        benefit: 'Automatic speed and timing',
        proofPoint: 'Programs ramp up and down at optimal times',
      },
    ],
    emotionalBenefits: [
      {
        benefit: 'Reclaim your time',
        visualization: 'Making breakfast while getting the kids ready, not watching a blender',
        triggerPhrases: ['busy', 'no time', 'quick', 'easy', 'simple'],
      },
      {
        benefit: 'Confidence even as a beginner',
        visualization: 'Perfect results from day one, no learning curve',
        triggerPhrases: ['never used', 'first blender', 'beginner'],
      },
    ],
    objectionsAddressed: [
      {
        objection: 'Do I really need programs?',
        response: 'If you\'ll use it daily, programs save 3-5 minutes per use. That\'s 20+ hours a year of time back.',
      },
    ],
  },
  {
    featureId: 'container_64oz',
    featureName: '64oz Container',
    technicalSpec: '64 fluid ounce low-profile container',
    problemsSolved: [
      {
        problemId: 'family_batches',
        problemStatement: 'Need to make multiple batches for whole family',
        userSegments: ['large_family', 'meal_prepper', 'entertainer'],
        emotionalContext: 'Tired of running the blender multiple times',
      },
    ],
    functionalBenefits: [
      {
        benefit: 'One batch serves everyone',
        proofPoint: 'Makes 4-6 smoothies at once',
      },
      {
        benefit: 'Meal prep efficiency',
        proofPoint: 'Blend soup for the week in one go',
      },
    ],
    emotionalBenefits: [
      {
        benefit: 'More time with family, less time in kitchen',
        visualization: 'Everyone getting their smoothie from one batch, together at the table',
        triggerPhrases: ['family', 'kids', 'large', 'big batch', 'meal prep'],
      },
    ],
    objectionsAddressed: [
      {
        objection: 'Is 64oz too big for just me?',
        response: 'You can make small batches too, and the Ascent models work with personal cups for single servings.',
      },
    ],
  },
  {
    featureId: 'warranty_10year',
    featureName: '10-Year Warranty',
    technicalSpec: 'Full 10-year warranty on parts and performance',
    problemsSolved: [
      {
        problemId: 'appliance_anxiety',
        problemStatement: 'Worried about expensive appliance breaking',
        userSegments: ['cautious_buyer', 'burned_before'],
        emotionalContext: 'Past disappointment with appliances that died early',
      },
    ],
    functionalBenefits: [
      {
        benefit: 'Covered for a decade',
        proofPoint: 'Full parts and performance warranty',
        comparison: '3-5 years longer than most competitors',
      },
    ],
    emotionalBenefits: [
      {
        benefit: 'Buy it once, never think about it again',
        visualization: 'Still using the same blender when your kids graduate high school',
        triggerPhrases: ['last', 'reliable', 'quality', 'trust', 'worth it'],
      },
    ],
    objectionsAddressed: [
      {
        objection: 'What if it breaks?',
        response: 'Vitamix honors their warranty no questions asked. And most users report 15-20 years of daily use.',
      },
    ],
  },
  {
    featureId: 'hot_soup',
    featureName: 'Friction Heat Cooking',
    technicalSpec: 'Heats soup to serving temperature in 5-6 minutes through blade friction',
    problemsSolved: [
      {
        problemId: 'no_time_to_cook',
        problemStatement: 'Want homemade soup but no time to stand over stove',
        userSegments: ['busy_professional', 'health_conscious', 'convenience_seeker'],
        emotionalContext: 'Wanting healthy homemade food without the time investment',
      },
    ],
    functionalBenefits: [
      {
        benefit: 'Hot soup from raw ingredients in 6 minutes',
        proofPoint: 'Blade friction creates heat - no stove needed',
      },
      {
        benefit: 'One container, one cleanup',
        proofPoint: 'No pots, no stovetop splatter',
      },
    ],
    emotionalBenefits: [
      {
        benefit: 'Homemade comfort in minutes',
        visualization: 'Coming home to hot soup on a cold day, ready in less time than delivery',
        triggerPhrases: ['soup', 'hot', 'warm', 'comfort food', 'homemade'],
      },
    ],
    objectionsAddressed: [
      {
        objection: 'Can it really get hot enough?',
        response: 'Steam will rise from the container - it reaches serving temperature. The high-powered motor generates real heat.',
      },
    ],
  },
  {
    featureId: 'self_cleaning',
    featureName: 'Self-Cleaning',
    technicalSpec: '60-second self-clean cycle with soap and water',
    problemsSolved: [
      {
        problemId: 'cleanup_dread',
        problemStatement: 'Hate cleaning blenders, especially around blades',
        userSegments: ['convenience_seeker', 'busy_parent', 'daily_user'],
        emotionalContext: 'Dreading cleanup so much that you don\'t use the blender',
      },
    ],
    functionalBenefits: [
      {
        benefit: 'Clean in 60 seconds',
        proofPoint: 'Add soap, water, blend, rinse, done',
      },
      {
        benefit: 'No disassembly required',
        proofPoint: 'Never touch the blades',
      },
    ],
    emotionalBenefits: [
      {
        benefit: 'Actually want to use it daily',
        visualization: 'Cleanup so easy you\'ll use it every single day without thinking twice',
        triggerPhrases: ['clean', 'easy', 'daily', 'every day', 'hate cleaning'],
      },
    ],
    objectionsAddressed: [
      {
        objection: 'Is it really self-cleaning?',
        response: 'Add a drop of dish soap and warm water, run on high for 60 seconds, rinse. That\'s it. No scrubbing, no taking it apart.',
      },
    ],
  },
];

/**
 * User Persona Templates
 * Pre-defined user archetypes for quick recognition and tailored messaging
 */
export interface UserPersona {
  personaId: string;
  name: string;
  demographics: {
    householdType: string;
    typicalAge?: string;
    timeAvailability: string;
    cookingSkill: string;
  };
  primaryGoals: string[];
  keyBarriers: string[];
  emotionalState: {
    frustrations: string[];
    hopes: string[];
    fears: string[];
  };
  productPriorities: { attribute: string; importance: 'critical' | 'high' | 'medium' | 'low' }[];
  effectiveMessaging: {
    validationPhrases: string[];
    benefitEmphasis: string[];
    proofPoints: string[];
    visualizations: string[];
  };
  commonObjections: { objection: string; response: string }[];
  triggerPhrases: string[];
  recommendedProducts: string[];
}

export const userPersonas: UserPersona[] = [
  {
    personaId: 'picky_eater_parent',
    name: 'The Stealth Nutrition Parent',
    demographics: {
      householdType: 'family_with_children',
      typicalAge: '30-45',
      timeAvailability: 'limited',
      cookingSkill: 'intermediate',
    },
    primaryGoals: [
      'Improve children\'s nutrition without battles',
      'Find ways to incorporate more produce',
      'Make healthy food that kids will actually eat',
    ],
    keyBarriers: [
      'Children reject visible vegetables',
      'Texture sensitivity in kids',
      'Limited time for elaborate preparation',
      'Previous failed attempts',
    ],
    emotionalState: {
      frustrations: ['Wasted food', 'Dinner battles', 'Worry about health'],
      hopes: ['Finding something that works', 'Peace at mealtimes', 'Healthy kids'],
      fears: ['Wasting money on another gadget', 'Kids still rejecting food'],
    },
    productPriorities: [
      { attribute: 'texture_quality', importance: 'critical' },
      { attribute: 'container_size', importance: 'high' },
      { attribute: 'ease_of_use', importance: 'high' },
      { attribute: 'easy_cleanup', importance: 'medium' },
      { attribute: 'price', importance: 'medium' },
    ],
    effectiveMessaging: {
      validationPhrases: [
        'Getting kids to eat vegetables is one of the hardest parts of parenting',
        "You're not alone - this is the #1 reason parents buy high-powered blenders",
      ],
      benefitEmphasis: [
        'Completely undetectable texture',
        'Spinach disappears into berry smoothies',
        "Veggie-loaded pasta sauce they'll never suspect",
      ],
      proofPoints: [
        "The same blenders used in Jamba Juice - that's why their smoothies are so smooth",
        'Can liquify kale stems with zero grittiness',
      ],
      visualizations: [
        'Imagine your kids asking for seconds on a smoothie that\'s 50% spinach',
        'Mac and cheese night, but the sauce is secretly loaded with butternut squash',
      ],
    },
    commonObjections: [
      {
        objection: 'Will my kids really not notice?',
        response: 'The motor pulverizes so completely that there are no texture clues. Start with mild veggies like spinach in berry smoothies - the color is the only giveaway, and you can mask that with blueberries.',
      },
      {
        objection: "Isn't this expensive?",
        response: "Think about how much produce you've thrown away when they wouldn't eat it. This actually saves money by making sure vegetables get consumed, not composted.",
      },
    ],
    triggerPhrases: ['picky', 'kids', 'children', 'vegetables', 'won\'t eat', 'hate', 'refuse', 'toddler', 'nutrition'],
    recommendedProducts: ['ascent-x5', 'ascent-x4', 'ascent-x3'],
  },
  {
    personaId: 'busy_professional',
    name: 'The Time-Starved Health Seeker',
    demographics: {
      householdType: 'solo_or_couple',
      typicalAge: '25-40',
      timeAvailability: 'very_limited',
      cookingSkill: 'basic_to_intermediate',
    },
    primaryGoals: [
      'Eat healthy despite busy schedule',
      'Quick meals without sacrificing nutrition',
      'Reduce reliance on takeout',
    ],
    keyBarriers: [
      'No time to cook elaborate meals',
      'Morning rush leaves no time for breakfast',
      'Too tired to cook after work',
    ],
    emotionalState: {
      frustrations: ['Spending money on unhealthy takeout', 'Feeling sluggish from poor diet'],
      hopes: ['Looking and feeling better', 'More energy', 'Saving money'],
      fears: ['Another appliance collecting dust', 'Too complicated to use'],
    },
    productPriorities: [
      { attribute: 'speed', importance: 'critical' },
      { attribute: 'ease_of_use', importance: 'critical' },
      { attribute: 'easy_cleanup', importance: 'high' },
      { attribute: 'programs', importance: 'high' },
      { attribute: 'price', importance: 'medium' },
    ],
    effectiveMessaging: {
      validationPhrases: [
        'When you\'re working 60 hours a week, cooking feels impossible',
        'You want to be healthy, you just don\'t have the time for it',
      ],
      benefitEmphasis: [
        'From fridge to drinking in under 2 minutes',
        'One-button operation, no thinking required',
        'Self-cleans in 60 seconds',
      ],
      proofPoints: [
        'Program runs itself - you can get dressed while it blends',
        'Faster than waiting for coffee to brew',
      ],
      visualizations: [
        'Sipping a nutrient-packed smoothie during your commute',
        'Hot homemade soup ready in 6 minutes when you get home',
      ],
    },
    commonObjections: [
      {
        objection: 'Will I actually use it?',
        response: 'The self-cleaning and programs make it frictionless. Most Vitamix owners use it daily because it\'s faster than the alternatives.',
      },
      {
        objection: 'I\'m not a cook',
        response: 'You don\'t need to be. Press Smoothie, it does the rest. No knife skills, no recipes, no timing. Just ingredients and a button.',
      },
    ],
    triggerPhrases: ['busy', 'quick', 'fast', 'no time', 'easy', 'simple', 'morning', 'work', 'convenient'],
    recommendedProducts: ['ascent-x4', 'ascent-x3', 'ascent-x2'],
  },
  {
    personaId: 'health_enthusiast',
    name: 'The Wellness Optimizer',
    demographics: {
      householdType: 'any',
      typicalAge: '25-55',
      timeAvailability: 'moderate',
      cookingSkill: 'intermediate_to_advanced',
    },
    primaryGoals: [
      'Maximize nutritional intake',
      'Control ingredients and avoid additives',
      'Explore advanced recipes',
    ],
    keyBarriers: [
      'Current blender can\'t handle leafy greens well',
      'Store-bought alternatives have unwanted ingredients',
      'Want professional-quality results at home',
    ],
    emotionalState: {
      frustrations: ['Gritty smoothies', 'Reading labels and finding junk'],
      hopes: ['Peak physical performance', 'Full control over nutrition'],
      fears: ['Investing in something subpar'],
    },
    productPriorities: [
      { attribute: 'power', importance: 'critical' },
      { attribute: 'texture_quality', importance: 'critical' },
      { attribute: 'versatility', importance: 'high' },
      { attribute: 'durability', importance: 'high' },
      { attribute: 'price', importance: 'low' },
    ],
    effectiveMessaging: {
      validationPhrases: [
        'You\'ve outgrown basic blenders',
        'When nutrition is this important, you need the right tools',
      ],
      benefitEmphasis: [
        'Breaks down cell walls to unlock maximum nutrients',
        'Make your own nut milks, butters, and flours',
        'Zero additives, full control',
      ],
      proofPoints: [
        'Used by professional nutritionists and wellness centers',
        'Can turn whole flax seeds into absorbable form',
      ],
      visualizations: [
        'Silky green smoothies that taste like dessert',
        'Fresh almond butter with exactly the ingredients you choose',
      ],
    },
    commonObjections: [
      {
        objection: 'Can\'t I get similar results cheaper?',
        response: 'Not at this level. The motor power isn\'t marketing - it\'s physics. Breaking down tough fibers and seeds requires real torque.',
      },
    ],
    triggerPhrases: ['healthy', 'nutrition', 'organic', 'whole foods', 'fitness', 'protein', 'green', 'superfood', 'nut butter', 'nut milk'],
    recommendedProducts: ['ascent-x5', 'ascent-x5-smartprep-kitchen-system'],
  },
  {
    personaId: 'budget_conscious',
    name: 'The Smart Value Seeker',
    demographics: {
      householdType: 'any',
      typicalAge: 'any',
      timeAvailability: 'moderate',
      cookingSkill: 'any',
    },
    primaryGoals: [
      'Get the best value for money',
      'Avoid buying twice',
      'Long-term cost savings',
    ],
    keyBarriers: [
      'High upfront cost feels risky',
      'Unsure if premium is worth it',
      'Past experience with cheap appliances breaking',
    ],
    emotionalState: {
      frustrations: ['Throwing money away on things that break', 'Feeling like you have to choose between quality and budget'],
      hopes: ['Making a smart investment', 'Buy once, buy right'],
      fears: ['Overpaying', 'Still not getting what you need'],
    },
    productPriorities: [
      { attribute: 'value', importance: 'critical' },
      { attribute: 'durability', importance: 'critical' },
      { attribute: 'warranty', importance: 'high' },
      { attribute: 'features', importance: 'medium' },
    ],
    effectiveMessaging: {
      validationPhrases: [
        'You\'re right to think carefully about this investment',
        'It makes sense to want the best value, not just the lowest price',
      ],
      benefitEmphasis: [
        'Built to last 15-20 years of daily use',
        '10-year warranty - 3x longer than competitors',
        'Cost per use drops to pennies over its lifetime',
      ],
      proofPoints: [
        'People pass these down to their kids',
        'Replacing a $100 blender every 3 years costs more over time',
      ],
      visualizations: [
        'Still using the same blender a decade from now',
        'The last blender you\'ll ever need to buy',
      ],
    },
    commonObjections: [
      {
        objection: 'Why not just get a cheaper blender?',
        response: 'A $100 blender lasts 2-3 years. A Vitamix lasts 15-20. Do the math: $100 x 7 replacements = $700+ over the same period, and none of them will perform like this.',
      },
      {
        objection: 'Can I get a refurbished one?',
        response: 'Absolutely. Certified refurbished Vitamix blenders come with the same warranty and are an excellent value. The E310 refurbished is around $290.',
      },
    ],
    triggerPhrases: ['budget', 'afford', 'expensive', 'worth it', 'value', 'cheaper', 'cost', 'price', 'money', 'investment'],
    recommendedProducts: ['5200-standard-getting-started', 'e310-personal-cup-adapter', 'ascent-x2'],
  },
  {
    personaId: 'soup_lover',
    name: 'The Hot Soup Enthusiast',
    demographics: {
      householdType: 'any',
      typicalAge: '30-60',
      timeAvailability: 'moderate',
      cookingSkill: 'intermediate',
    },
    primaryGoals: [
      'Make fresh homemade soups easily',
      'Avoid canned soup sodium and additives',
      'Hot meals without extensive cooking',
    ],
    keyBarriers: [
      'Regular blenders can\'t heat',
      'Stovetop soups take too long',
      'Cleanup from multiple pots',
    ],
    emotionalState: {
      frustrations: ['Settling for canned soup', 'Too many dishes'],
      hopes: ['Restaurant-quality soup at home', 'Comfort food made easy'],
      fears: ['Complicated process'],
    },
    productPriorities: [
      { attribute: 'heat_capability', importance: 'critical' },
      { attribute: 'container_size', importance: 'high' },
      { attribute: 'programs', importance: 'high' },
      { attribute: 'easy_cleanup', importance: 'high' },
    ],
    effectiveMessaging: {
      validationPhrases: [
        'There\'s nothing like fresh homemade soup',
        'You shouldn\'t have to choose between homemade and convenient',
      ],
      benefitEmphasis: [
        'Steam-hot soup from raw ingredients in 6 minutes',
        'One container - no pots, no stovetop',
        'Soup program does all the work',
      ],
      proofPoints: [
        'Blade friction creates real heat - steam rises from the container',
        'Vitamix created the hot soup category in blenders',
      ],
      visualizations: [
        'Throwing in vegetables and broth, pressing a button, and having hot soup',
        'Coming home on a cold day to fresh tomato soup in minutes',
      ],
    },
    commonObjections: [
      {
        objection: 'Can it really get hot enough?',
        response: 'Yes - the high-speed motor generates friction heat. Run on high for 5-6 minutes and steam will rise. It reaches serving temperature.',
      },
    ],
    triggerPhrases: ['soup', 'hot', 'warm', 'puree', 'creamy', 'comfort food', 'winter'],
    recommendedProducts: ['ascent-x5', 'ascent-x4', '5200-standard-getting-started'],
  },
];

/**
 * Objection Library
 * Comprehensive responses to common concerns with multiple variants
 */
export interface Objection {
  objectionId: string;
  triggerPhrases: string[];
  variations: {
    variant: string;
    example: string;
    responseStrategy: string;
    response: string;
  }[];
}

export const objectionLibrary: Objection[] = [
  {
    objectionId: 'price_concern',
    triggerPhrases: ['expensive', 'cost', 'worth it', 'afford', 'cheaper', 'price', 'money', 'budget'],
    variations: [
      {
        variant: 'direct_price_shock',
        example: 'That\'s way more than I wanted to spend',
        responseStrategy: 'value_reframe',
        response: 'I hear you - it\'s an investment. Here\'s how to think about it: at 15-20 years of daily use, that\'s under 10 cents per smoothie. Compare that to buying smoothies out ($7-10 each) or replacing cheap blenders every few years.',
      },
      {
        variant: 'comparison_shopping',
        example: 'Why not just get a Ninja for half the price?',
        responseStrategy: 'differentiation',
        response: 'For basic smoothies, a Ninja works fine. The difference shows up in texture - lower-powered blenders leave tiny flecks of spinach and bits of berry seed that picky eaters notice. If smooth texture matters, you need the motor power. Plus, Vitamix lasts 15-20 years vs 3-5 for most competitors.',
      },
      {
        variant: 'budget_constraint',
        example: 'I just can\'t spend $500+ right now',
        responseStrategy: 'alternative_path',
        response: 'Completely understand. Two options: The certified refurbished E310 is around $290 with the same warranty. Or the 5200 at $450 gives you the full Vitamix experience at a lower price point. Both are excellent daily drivers.',
      },
    ],
  },
  {
    objectionId: 'will_i_use_it',
    triggerPhrases: ['use it', 'collect dust', 'actually use', 'gather dust', 'really use'],
    variations: [
      {
        variant: 'past_appliance_regret',
        example: 'I have a graveyard of appliances I never use',
        responseStrategy: 'differentiation',
        response: 'The difference is friction - not motor friction, usage friction. Most appliances require effort: setup, learning, cleanup. Vitamix self-cleans in 60 seconds, programs run themselves, and it does things you actually want daily (smoothies, soups). 70% of owners report using it 4+ times per week.',
      },
    ],
  },
  {
    objectionId: 'noise_concern',
    triggerPhrases: ['loud', 'noise', 'noisy', 'quiet', 'sound', 'apartment', 'neighbors'],
    variations: [
      {
        variant: 'direct_noise_concern',
        example: 'I heard these are really loud',
        responseStrategy: 'acknowledge_and_context',
        response: 'They\'re not quiet - powerful motors make noise. But here\'s context: a smoothie blend takes 45-60 seconds. That\'s less time than a coffee grinder. The Ascent models are also slightly quieter than older models. Most users find it\'s a fair trade for the results.',
      },
    ],
  },
  {
    objectionId: 'space_concern',
    triggerPhrases: ['space', 'counter', 'small kitchen', 'storage', 'big', 'large', 'size'],
    variations: [
      {
        variant: 'counter_space',
        example: 'I don\'t have much counter space',
        responseStrategy: 'solutions',
        response: 'The low-profile containers fit under most cabinets, so it can live on your counter. If that\'s not an option, many users store it in a cabinet - it\'s about the size of a large coffee maker. The E310 with 48oz container is the most compact option.',
      },
    ],
  },
  {
    objectionId: 'complexity_concern',
    triggerPhrases: ['complicated', 'complex', 'hard to use', 'difficult', 'learning curve', 'tech'],
    variations: [
      {
        variant: 'tech_overwhelm',
        example: 'All those settings look complicated',
        responseStrategy: 'simplify',
        response: 'The beauty is you can ignore most of it. For 90% of uses: add ingredients, press Smoothie (or Soup, or Frozen Dessert). Done. The variable speed is there when you want control, but the programs handle everyday use perfectly.',
      },
    ],
  },
];

/**
 * Find matching persona based on query analysis
 */
export function detectPersona(query: string, concerns: string[], useCases: string[]): UserPersona | null {
  const lowerQuery = query.toLowerCase();

  for (const persona of userPersonas) {
    // Check trigger phrases
    for (const trigger of persona.triggerPhrases) {
      if (lowerQuery.includes(trigger.toLowerCase())) {
        return persona;
      }
    }

    // Check concerns overlap
    for (const concern of concerns) {
      if (persona.triggerPhrases.some(t => t.toLowerCase().includes(concern.toLowerCase()))) {
        return persona;
      }
    }
  }

  return null;
}

/**
 * Find relevant benefit mappings for a query
 */
export function findRelevantBenefits(query: string, useCases: string[]): BenefitMapping[] {
  const lowerQuery = query.toLowerCase();
  const matches: BenefitMapping[] = [];

  for (const mapping of benefitMappings) {
    // Check emotional benefit triggers
    for (const emotionalBenefit of mapping.emotionalBenefits) {
      for (const trigger of emotionalBenefit.triggerPhrases) {
        if (lowerQuery.includes(trigger.toLowerCase())) {
          matches.push(mapping);
          break;
        }
      }
      if (matches.includes(mapping)) break;
    }

    // Check problems solved
    if (!matches.includes(mapping)) {
      for (const problem of mapping.problemsSolved) {
        if (useCases.some(uc => problem.userSegments.some(seg => seg.includes(uc)))) {
          matches.push(mapping);
          break;
        }
      }
    }
  }

  return matches;
}

/**
 * Find relevant objection responses
 */
export function findObjectionResponse(query: string): Objection | null {
  const lowerQuery = query.toLowerCase();

  for (const objection of objectionLibrary) {
    for (const trigger of objection.triggerPhrases) {
      if (lowerQuery.includes(trigger.toLowerCase())) {
        return objection;
      }
    }
  }

  return null;
}

/**
 * Build empathetic reasoning chain for a recommendation
 */
export interface ReasoningChain {
  userProblem: { statement: string; emotionalContext: string };
  productFeature: { name: string; spec: string };
  functionalBenefit: { statement: string; proofPoint: string };
  emotionalOutcome: { statement: string; visualization: string };
}

export function buildReasoningChain(
  persona: UserPersona | null,
  product: Product,
  useCases: string[]
): ReasoningChain | null {
  if (!persona) return null;

  const profile = productProfiles[product.id];
  if (!profile) return null;

  // Find the most relevant benefit mapping
  const relevantBenefits = benefitMappings.filter(bm =>
    bm.problemsSolved.some(p =>
      p.userSegments.some(seg => persona.personaId.includes(seg) || seg.includes(persona.personaId.split('_')[0]))
    )
  );

  if (relevantBenefits.length === 0) return null;

  const benefit = relevantBenefits[0];
  const problem = benefit.problemsSolved[0];
  const functional = benefit.functionalBenefits[0];
  const emotional = benefit.emotionalBenefits[0];

  return {
    userProblem: {
      statement: problem.problemStatement,
      emotionalContext: problem.emotionalContext,
    },
    productFeature: {
      name: benefit.featureName,
      spec: benefit.technicalSpec,
    },
    functionalBenefit: {
      statement: functional.benefit,
      proofPoint: functional.proofPoint,
    },
    emotionalOutcome: {
      statement: emotional.benefit,
      visualization: emotional.visualization,
    },
  };
}
