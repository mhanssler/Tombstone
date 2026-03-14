import type { FoodDefinition } from '@/types';

// Curated food database inspired by Solid Starts.
// Each entry has a stable ID so logs reference a consistent key.
// Custom foods typed by the user get an ID prefixed with "custom_".

export const FOOD_DATABASE: FoodDefinition[] = [
  // ── Fruits ──
  { id: 'avocado',      name: 'Avocado',      category: 'fruit',     isAllergen: false },
  { id: 'banana',       name: 'Banana',       category: 'fruit',     isAllergen: false },
  { id: 'blueberry',    name: 'Blueberry',    category: 'fruit',     isAllergen: false },
  { id: 'strawberry',   name: 'Strawberry',   category: 'fruit',     isAllergen: false },
  { id: 'raspberry',    name: 'Raspberry',    category: 'fruit',     isAllergen: false },
  { id: 'mango',        name: 'Mango',        category: 'fruit',     isAllergen: false },
  { id: 'peach',        name: 'Peach',        category: 'fruit',     isAllergen: false },
  { id: 'pear',         name: 'Pear',         category: 'fruit',     isAllergen: false },
  { id: 'apple',        name: 'Apple',        category: 'fruit',     isAllergen: false },
  { id: 'watermelon',   name: 'Watermelon',   category: 'fruit',     isAllergen: false },
  { id: 'cantaloupe',   name: 'Cantaloupe',   category: 'fruit',     isAllergen: false },
  { id: 'plum',         name: 'Plum',         category: 'fruit',     isAllergen: false },
  { id: 'kiwi',         name: 'Kiwi',         category: 'fruit',     isAllergen: false },
  { id: 'orange',       name: 'Orange',       category: 'fruit',     isAllergen: false },
  { id: 'grape',        name: 'Grape',        category: 'fruit',     isAllergen: false },
  { id: 'pineapple',    name: 'Pineapple',    category: 'fruit',     isAllergen: false },
  { id: 'papaya',       name: 'Papaya',       category: 'fruit',     isAllergen: false },
  { id: 'fig',          name: 'Fig',          category: 'fruit',     isAllergen: false },
  { id: 'date',         name: 'Date',         category: 'fruit',     isAllergen: false },
  { id: 'cherry',       name: 'Cherry',       category: 'fruit',     isAllergen: false },

  // ── Vegetables ──
  { id: 'sweet_potato',   name: 'Sweet Potato',   category: 'vegetable', isAllergen: false },
  { id: 'butternut_squash', name: 'Butternut Squash', category: 'vegetable', isAllergen: false },
  { id: 'carrot',         name: 'Carrot',         category: 'vegetable', isAllergen: false },
  { id: 'broccoli',       name: 'Broccoli',       category: 'vegetable', isAllergen: false },
  { id: 'cauliflower',    name: 'Cauliflower',    category: 'vegetable', isAllergen: false },
  { id: 'zucchini',       name: 'Zucchini',       category: 'vegetable', isAllergen: false },
  { id: 'green_bean',     name: 'Green Bean',     category: 'vegetable', isAllergen: false },
  { id: 'pea',            name: 'Pea',            category: 'vegetable', isAllergen: false },
  { id: 'corn',           name: 'Corn',           category: 'vegetable', isAllergen: false },
  { id: 'spinach',        name: 'Spinach',        category: 'vegetable', isAllergen: false },
  { id: 'kale',           name: 'Kale',           category: 'vegetable', isAllergen: false },
  { id: 'bell_pepper',    name: 'Bell Pepper',    category: 'vegetable', isAllergen: false },
  { id: 'tomato',         name: 'Tomato',         category: 'vegetable', isAllergen: false },
  { id: 'cucumber',       name: 'Cucumber',       category: 'vegetable', isAllergen: false },
  { id: 'asparagus',      name: 'Asparagus',      category: 'vegetable', isAllergen: false },
  { id: 'beet',           name: 'Beet',           category: 'vegetable', isAllergen: false },
  { id: 'mushroom',       name: 'Mushroom',       category: 'vegetable', isAllergen: false },
  { id: 'potato',         name: 'Potato',         category: 'vegetable', isAllergen: false },
  { id: 'parsnip',        name: 'Parsnip',        category: 'vegetable', isAllergen: false },
  { id: 'turnip',         name: 'Turnip',         category: 'vegetable', isAllergen: false },
  { id: 'eggplant',       name: 'Eggplant',       category: 'vegetable', isAllergen: false },

  // ── Grains ──
  { id: 'oatmeal',        name: 'Oatmeal',        category: 'grain',   isAllergen: false },
  { id: 'rice',           name: 'Rice',           category: 'grain',   isAllergen: false },
  { id: 'quinoa',         name: 'Quinoa',         category: 'grain',   isAllergen: false },
  { id: 'pasta',          name: 'Pasta',          category: 'grain',   isAllergen: true, allergenGroup: 'wheat' },
  { id: 'bread',          name: 'Bread',          category: 'grain',   isAllergen: true, allergenGroup: 'wheat' },
  { id: 'toast',          name: 'Toast',          category: 'grain',   isAllergen: true, allergenGroup: 'wheat' },
  { id: 'pancake',        name: 'Pancake',        category: 'grain',   isAllergen: true, allergenGroup: 'wheat' },
  { id: 'waffle',         name: 'Waffle',         category: 'grain',   isAllergen: true, allergenGroup: 'wheat' },
  { id: 'cereal',         name: 'Cereal',         category: 'grain',   isAllergen: false },
  { id: 'barley',         name: 'Barley',         category: 'grain',   isAllergen: false },
  { id: 'millet',         name: 'Millet',         category: 'grain',   isAllergen: false },
  { id: 'tortilla',       name: 'Tortilla',       category: 'grain',   isAllergen: false },

  // ── Proteins ──
  { id: 'chicken',         name: 'Chicken',         category: 'protein', isAllergen: false },
  { id: 'turkey',          name: 'Turkey',          category: 'protein', isAllergen: false },
  { id: 'beef',            name: 'Beef',            category: 'protein', isAllergen: false },
  { id: 'pork',            name: 'Pork',            category: 'protein', isAllergen: false },
  { id: 'lamb',            name: 'Lamb',            category: 'protein', isAllergen: false },
  { id: 'salmon',          name: 'Salmon',          category: 'protein', isAllergen: true, allergenGroup: 'fish' },
  { id: 'cod',             name: 'Cod',             category: 'protein', isAllergen: true, allergenGroup: 'fish' },
  { id: 'tilapia',         name: 'Tilapia',         category: 'protein', isAllergen: true, allergenGroup: 'fish' },
  { id: 'tuna',            name: 'Tuna',            category: 'protein', isAllergen: true, allergenGroup: 'fish' },
  { id: 'shrimp',          name: 'Shrimp',          category: 'protein', isAllergen: true, allergenGroup: 'shellfish' },
  { id: 'egg',             name: 'Egg',             category: 'protein', isAllergen: true, allergenGroup: 'egg' },
  { id: 'egg_yolk',        name: 'Egg Yolk',        category: 'protein', isAllergen: true, allergenGroup: 'egg' },
  { id: 'egg_white',       name: 'Egg White',       category: 'protein', isAllergen: true, allergenGroup: 'egg' },
  { id: 'tofu',            name: 'Tofu',            category: 'protein', isAllergen: true, allergenGroup: 'soy' },
  { id: 'edamame',         name: 'Edamame',         category: 'protein', isAllergen: true, allergenGroup: 'soy' },
  { id: 'lentil',          name: 'Lentil',          category: 'protein', isAllergen: false },
  { id: 'black_bean',      name: 'Black Bean',      category: 'protein', isAllergen: false },
  { id: 'chickpea',        name: 'Chickpea',        category: 'protein', isAllergen: false },
  { id: 'hummus',          name: 'Hummus',          category: 'protein', isAllergen: true, allergenGroup: 'sesame' },

  // ── Dairy ──
  { id: 'yogurt',          name: 'Yogurt',          category: 'dairy',   isAllergen: true, allergenGroup: 'milk' },
  { id: 'cheese',          name: 'Cheese',          category: 'dairy',   isAllergen: true, allergenGroup: 'milk' },
  { id: 'cottage_cheese',  name: 'Cottage Cheese',  category: 'dairy',   isAllergen: true, allergenGroup: 'milk' },
  { id: 'cream_cheese',    name: 'Cream Cheese',    category: 'dairy',   isAllergen: true, allergenGroup: 'milk' },
  { id: 'butter',          name: 'Butter',          category: 'dairy',   isAllergen: true, allergenGroup: 'milk' },
  { id: 'whole_milk',      name: 'Whole Milk',      category: 'dairy',   isAllergen: true, allergenGroup: 'milk' },
  { id: 'ricotta',         name: 'Ricotta',         category: 'dairy',   isAllergen: true, allergenGroup: 'milk' },

  // ── Other / Allergens ──
  { id: 'peanut_butter',   name: 'Peanut Butter',   category: 'other',   isAllergen: true, allergenGroup: 'peanut' },
  { id: 'peanut',          name: 'Peanut',          category: 'other',   isAllergen: true, allergenGroup: 'peanut' },
  { id: 'almond_butter',   name: 'Almond Butter',   category: 'other',   isAllergen: true, allergenGroup: 'tree_nut' },
  { id: 'cashew_butter',   name: 'Cashew Butter',   category: 'other',   isAllergen: true, allergenGroup: 'tree_nut' },
  { id: 'walnut',          name: 'Walnut',          category: 'other',   isAllergen: true, allergenGroup: 'tree_nut' },
  { id: 'almond',          name: 'Almond',          category: 'other',   isAllergen: true, allergenGroup: 'tree_nut' },
  { id: 'cashew',          name: 'Cashew',          category: 'other',   isAllergen: true, allergenGroup: 'tree_nut' },
  { id: 'pistachio',       name: 'Pistachio',       category: 'other',   isAllergen: true, allergenGroup: 'tree_nut' },
  { id: 'tahini',          name: 'Tahini',          category: 'other',   isAllergen: true, allergenGroup: 'sesame' },
  { id: 'sesame_seeds',    name: 'Sesame Seeds',    category: 'other',   isAllergen: true, allergenGroup: 'sesame' },
  { id: 'soy_sauce',       name: 'Soy Sauce',       category: 'other',   isAllergen: true, allergenGroup: 'soy' },
  { id: 'coconut',         name: 'Coconut',         category: 'other',   isAllergen: false },
  { id: 'olive_oil',       name: 'Olive Oil',       category: 'other',   isAllergen: false },
  { id: 'hemp_seed',       name: 'Hemp Seed',       category: 'other',   isAllergen: false },
  { id: 'chia_seed',       name: 'Chia Seed',       category: 'other',   isAllergen: false },
  { id: 'flax_seed',       name: 'Flax Seed',       category: 'other',   isAllergen: false },
];

// Build a lookup map for O(1) food resolution
export const FOOD_MAP = new Map(FOOD_DATABASE.map(f => [f.id, f]));

// Category labels for display
export const CATEGORY_LABELS: Record<string, string> = {
  fruit: '🍎 Fruits',
  vegetable: '🥦 Vegetables',
  grain: '🌾 Grains',
  protein: '🍗 Proteins',
  dairy: '🧀 Dairy',
  other: '🥜 Other',
};

// Allergen group labels
export const ALLERGEN_LABELS: Record<string, string> = {
  milk: '🥛 Milk',
  egg: '🥚 Egg',
  peanut: '🥜 Peanut',
  tree_nut: '🌰 Tree Nut',
  wheat: '🌾 Wheat',
  soy: '🫘 Soy',
  fish: '🐟 Fish',
  shellfish: '🦐 Shellfish',
  sesame: '🫓 Sesame',
};
