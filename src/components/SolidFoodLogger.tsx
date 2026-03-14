import { useState, useMemo } from 'react';
import { X, Search, Plus, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { FOOD_DATABASE, FOOD_MAP, CATEGORY_LABELS, ALLERGEN_LABELS } from '@/data/foods';
import { logSolidFood } from '@/database/queries';
import { useRecentFoodIds, useFoodHistory } from '@/hooks';
import type { SolidFoodItem, FoodDefinition, FoodCategory, MealType, ReactionSeverity } from '@/types';

interface SolidFoodLoggerProps {
  childId: string;
  onClose: () => void;
}

function daysSince(timestamp: number): number {
  return Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24));
}

function daysSinceLabel(timestamp: number | undefined): string {
  if (!timestamp) return 'New!';
  const d = daysSince(timestamp);
  if (d === 0) return 'Today';
  if (d === 1) return '1d ago';
  return `${d}d ago`;
}

export function SolidFoodLogger({ childId, onClose }: SolidFoodLoggerProps) {
  const [selectedFoods, setSelectedFoods] = useState<SolidFoodItem[]>([]);
  const [mealType, setMealType] = useState<MealType>('snack');
  const [notes, setNotes] = useState('');
  const [reaction, setReaction] = useState<ReactionSeverity>('none');
  const [reactionNotes, setReactionNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<FoodCategory | 'recent' | 'allergen'>('recent');
  const [showBrowse, setShowBrowse] = useState(false);
  const [customFoodName, setCustomFoodName] = useState('');

  const recentFoodIds = useRecentFoodIds(childId);
  const foodHistory = useFoodHistory(childId);

  // Filtered food list based on search
  const filteredFoods = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return FOOD_DATABASE.filter(f => f.name.toLowerCase().includes(q));
  }, [searchQuery]);

  // Foods by category
  const categoryFoods = useMemo(() => {
    if (activeCategory === 'recent') {
      return recentFoodIds
        .map(id => FOOD_MAP.get(id))
        .filter((f): f is FoodDefinition => f !== undefined);
    }
    if (activeCategory === 'allergen') {
      return FOOD_DATABASE.filter(f => f.isAllergen);
    }
    return FOOD_DATABASE.filter(f => f.category === activeCategory);
  }, [activeCategory, recentFoodIds]);

  const selectedFoodIds = new Set(selectedFoods.map(f => f.foodId));

  const toggleFood = (food: FoodDefinition) => {
    if (selectedFoodIds.has(food.id)) {
      setSelectedFoods(prev => prev.filter(f => f.foodId !== food.id));
    } else {
      setSelectedFoods(prev => [
        ...prev,
        {
          foodId: food.id,
          name: food.name,
          category: food.category,
          isAllergen: food.isAllergen,
          allergenGroup: food.allergenGroup,
        },
      ]);
    }
  };

  const addCustomFood = () => {
    const name = customFoodName.trim();
    if (!name) return;
    const id = `custom_${name.toLowerCase().replace(/\s+/g, '_')}`;
    if (selectedFoodIds.has(id)) return;
    setSelectedFoods(prev => [
      ...prev,
      { foodId: id, name, category: 'other', isAllergen: false },
    ]);
    setCustomFoodName('');
  };

  const handleSave = async () => {
    if (selectedFoods.length === 0) return;
    await logSolidFood(childId, mealType, selectedFoods, undefined, notes || undefined, reaction, reactionNotes || undefined);
    onClose();
  };

  const hasAllergens = selectedFoods.some(f => f.isAllergen);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-sand-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border border-leather-800 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-2 shrink-0">
          <h2 className="text-xl font-bold text-sand-100">🥄 Log Solid Food</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-leather-800 transition-colors">
            <X className="w-5 h-5 text-sand-400" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-4 pb-4 space-y-4">
          {/* Meal Type */}
          <div>
            <label className="block text-sm text-sand-400 mb-2">Meal</label>
            <div className="grid grid-cols-4 gap-2">
              {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map(mt => (
                <button
                  key={mt}
                  onClick={() => setMealType(mt)}
                  className={`py-2 px-2 rounded-xl text-sm font-medium transition-colors ${
                    mealType === mt
                      ? 'bg-orange-600 text-white'
                      : 'bg-leather-800 text-sand-300 hover:bg-leather-700'
                  }`}
                >
                  {mt.charAt(0).toUpperCase() + mt.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sand-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search foods..."
              className="w-full bg-leather-800 text-sand-100 rounded-xl pl-10 pr-4 py-3 border border-leather-700 placeholder:text-sand-500"
            />
          </div>

          {/* Search Results */}
          {searchQuery.trim() && (
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {filteredFoods.length === 0 ? (
                <p className="text-sm text-sand-500 text-center py-2">No matches — add as custom below</p>
              ) : (
                filteredFoods.map(food => (
                  <FoodButton
                    key={food.id}
                    food={food}
                    selected={selectedFoodIds.has(food.id)}
                    lastServed={foodHistory.get(food.id)}
                    onToggle={() => toggleFood(food)}
                  />
                ))
              )}
            </div>
          )}

          {/* Browse by Category */}
          <div>
            <button
              onClick={() => setShowBrowse(!showBrowse)}
              className="flex items-center gap-2 text-sm text-sand-400 hover:text-sand-200 transition-colors"
            >
              {showBrowse ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Browse by category
            </button>

            {showBrowse && (
              <div className="mt-2 space-y-2">
                {/* Category Tabs */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                  <CategoryTab
                    label="⏱ Recent"
                    active={activeCategory === 'recent'}
                    onClick={() => setActiveCategory('recent')}
                  />
                  <CategoryTab
                    label="⚠️ Allergens"
                    active={activeCategory === 'allergen'}
                    onClick={() => setActiveCategory('allergen')}
                  />
                  {(Object.entries(CATEGORY_LABELS) as [FoodCategory, string][]).map(([cat, label]) => (
                    <CategoryTab
                      key={cat}
                      label={label}
                      active={activeCategory === cat}
                      onClick={() => setActiveCategory(cat)}
                    />
                  ))}
                </div>

                {/* Category Food List */}
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {categoryFoods.length === 0 ? (
                    <p className="text-sm text-sand-500 text-center py-3">
                      {activeCategory === 'recent' ? 'No foods logged yet' : 'No foods in this category'}
                    </p>
                  ) : (
                    categoryFoods.map(food => (
                      <FoodButton
                        key={food.id}
                        food={food}
                        selected={selectedFoodIds.has(food.id)}
                        lastServed={foodHistory.get(food.id)}
                        onToggle={() => toggleFood(food)}
                      />
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Custom Food */}
          <div className="flex gap-2">
            <input
              type="text"
              value={customFoodName}
              onChange={e => setCustomFoodName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCustomFood()}
              placeholder="Add custom food..."
              className="flex-1 bg-leather-800 text-sand-100 rounded-xl px-4 py-2.5 border border-leather-700 placeholder:text-sand-500 text-sm"
            />
            <button
              onClick={addCustomFood}
              disabled={!customFoodName.trim()}
              className="px-3 rounded-xl bg-orange-600 text-white disabled:opacity-30 transition-opacity"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Selected Foods */}
          {selectedFoods.length > 0 && (
            <div>
              <label className="block text-sm text-sand-400 mb-2">
                Selected ({selectedFoods.length})
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedFoods.map(food => (
                  <span
                    key={food.foodId}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                      food.isAllergen
                        ? 'bg-amber-900/40 text-amber-300 border border-amber-600/30'
                        : 'bg-orange-900/40 text-orange-300 border border-orange-600/30'
                    }`}
                  >
                    {food.isAllergen && '⚠️ '}
                    {food.name}
                    <button
                      onClick={() => setSelectedFoods(prev => prev.filter(f => f.foodId !== food.foodId))}
                      className="ml-0.5 hover:text-red-400"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Allergen Warning */}
          {hasAllergens && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-900/20 border border-amber-600/30">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-amber-300 font-medium">Allergen(s) selected</p>
                <p className="text-sand-400 mt-0.5">
                  {[...new Set(selectedFoods.filter(f => f.allergenGroup).map(f => ALLERGEN_LABELS[f.allergenGroup!]))].join(', ')}
                </p>
              </div>
            </div>
          )}

          {/* Reaction */}
          <div>
            <label className="block text-sm text-sand-400 mb-2">Reaction</label>
            <div className="grid grid-cols-4 gap-2">
              {([
                { value: 'none', label: 'None', color: 'bg-green-700' },
                { value: 'mild', label: 'Mild', color: 'bg-yellow-600' },
                { value: 'moderate', label: 'Moderate', color: 'bg-orange-600' },
                { value: 'severe', label: 'Severe', color: 'bg-red-700' },
              ] as { value: ReactionSeverity; label: string; color: string }[]).map(r => (
                <button
                  key={r.value}
                  onClick={() => setReaction(r.value)}
                  className={`py-2 px-2 rounded-xl text-sm font-medium transition-colors ${
                    reaction === r.value
                      ? `${r.color} text-white`
                      : 'bg-leather-800 text-sand-300 hover:bg-leather-700'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {reaction !== 'none' && (
            <textarea
              value={reactionNotes}
              onChange={e => setReactionNotes(e.target.value)}
              placeholder="Describe the reaction..."
              className="w-full bg-leather-800 text-sand-100 rounded-xl px-4 py-3 border border-leather-700 resize-none h-20 placeholder:text-sand-500"
            />
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm text-sand-400 mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="How they liked it, texture, etc..."
              className="w-full bg-leather-800 text-sand-100 rounded-xl px-4 py-3 border border-leather-700 resize-none h-16 placeholder:text-sand-500"
            />
          </div>
        </div>

        {/* Save Button - sticky bottom */}
        <div className="p-4 pt-2 border-t border-leather-800/50 shrink-0">
          <button
            onClick={handleSave}
            disabled={selectedFoods.length === 0}
            className="w-full py-3.5 rounded-xl bg-orange-600 text-white font-semibold text-lg 
              disabled:opacity-30 disabled:cursor-not-allowed hover:bg-orange-500 active:scale-[0.98] transition-all"
          >
            Log {selectedFoods.length > 0 ? `${selectedFoods.length} food${selectedFoods.length > 1 ? 's' : ''}` : 'Food'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Subcomponents ──

function FoodButton({ food, selected, lastServed, onToggle }: {
  food: FoodDefinition;
  selected: boolean;
  lastServed?: number;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors ${
        selected
          ? 'bg-orange-600/30 border border-orange-500/50 text-orange-200'
          : 'bg-leather-800/60 border border-leather-700/50 text-sand-200 hover:bg-leather-700/60'
      }`}
    >
      <div className="flex items-center gap-2">
        {food.isAllergen && <span className="text-amber-400 text-xs">⚠️</span>}
        <span>{food.name}</span>
      </div>
      <span className={`text-xs ${lastServed ? 'text-sand-500' : 'text-green-400'}`}>
        {daysSinceLabel(lastServed)}
      </span>
    </button>
  );
}

function CategoryTab({ label, active, onClick }: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
        active
          ? 'bg-orange-600 text-white'
          : 'bg-leather-800 text-sand-400 hover:bg-leather-700'
      }`}
    >
      {label}
    </button>
  );
}
