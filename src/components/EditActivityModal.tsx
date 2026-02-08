import { useState, useEffect } from 'react';
import { X, Check, Trash2 } from 'lucide-react';
import type { SleepSession, FeedingSession, PumpSession, DiaperChange, SleepType, FeedingType, DiaperType } from '@/types';

type ActivityData = SleepSession | FeedingSession | PumpSession | DiaperChange;

interface EditActivityModalProps {
  activity: ActivityData;
  type: 'sleep' | 'feeding' | 'diaper' | 'pump';
  onSave: (updates: Partial<ActivityData>) => void;
  onDelete: () => void;
  onClose: () => void;
}

export function EditActivityModal({
  activity,
  type,
  onSave,
  onDelete,
  onClose,
}: EditActivityModalProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Sleep state
  const [sleepType, setSleepType] = useState<SleepType>('nap');
  const [sleepStartTime, setSleepStartTime] = useState('');
  const [sleepEndTime, setSleepEndTime] = useState('');
  const [sleepNotes, setSleepNotes] = useState('');

  // Feeding state
  const [feedingType, setFeedingType] = useState<FeedingType>('bottle');
  const [feedingStartTime, setFeedingStartTime] = useState('');
  const [feedingEndTime, setFeedingEndTime] = useState('');
  const [feedingAmount, setFeedingAmount] = useState('');
  const [feedingVitaminD, setFeedingVitaminD] = useState(false);
  const [feedingNotes, setFeedingNotes] = useState('');

  // Pump state
  const [pumpStartTime, setPumpStartTime] = useState('');
  const [pumpEndTime, setPumpEndTime] = useState('');
  const [pumpAmount, setPumpAmount] = useState('');
  const [pumpNotes, setPumpNotes] = useState('');

  // Diaper state
  const [diaperType, setDiaperType] = useState<DiaperType>('wet');
  const [diaperTime, setDiaperTime] = useState('');
  const [diaperNotes, setDiaperNotes] = useState('');

  // Initialize state based on activity type
  useEffect(() => {
    const toDateTimeLocal = (timestamp: number) => {
      const date = new Date(timestamp);
      // Use local timezone (not UTC) for the datetime-local input
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    if (type === 'sleep') {
      const sleep = activity as SleepSession;
      setSleepType(sleep.type);
      setSleepStartTime(toDateTimeLocal(sleep.startTime));
      if (sleep.endTime) setSleepEndTime(toDateTimeLocal(sleep.endTime));
      setSleepNotes(sleep.notes || '');
    } else if (type === 'feeding') {
      const feeding = activity as FeedingSession;
      setFeedingType(feeding.type);
      setFeedingStartTime(toDateTimeLocal(feeding.startTime));
      if (feeding.endTime) setFeedingEndTime(toDateTimeLocal(feeding.endTime));
      setFeedingAmount(feeding.amount?.toString() || '');
      setFeedingVitaminD(feeding.vitaminD || false);
      setFeedingNotes(feeding.notes || '');
    } else if (type === 'pump') {
      const pump = activity as PumpSession;
      setPumpStartTime(toDateTimeLocal(pump.startTime));
      if (pump.endTime) setPumpEndTime(toDateTimeLocal(pump.endTime));
      setPumpAmount(pump.amount?.toString() || '');
      setPumpNotes(pump.notes || '');
    } else if (type === 'diaper') {
      const diaper = activity as DiaperChange;
      setDiaperType(diaper.type);
      setDiaperTime(toDateTimeLocal(diaper.time));
      setDiaperNotes(diaper.notes || '');
    }
  }, [activity, type]);

  const handleSave = () => {
    const toTimestamp = (dateTimeLocal: string) => new Date(dateTimeLocal).getTime();

    if (type === 'sleep') {
      onSave({
        type: sleepType,
        startTime: toTimestamp(sleepStartTime),
        endTime: sleepEndTime ? toTimestamp(sleepEndTime) : undefined,
        notes: sleepNotes || undefined,
      });
    } else if (type === 'feeding') {
      onSave({
        type: feedingType,
        startTime: toTimestamp(feedingStartTime),
        endTime: feedingEndTime ? toTimestamp(feedingEndTime) : undefined,
        amount: feedingAmount ? parseFloat(feedingAmount) : undefined,
        vitaminD: feedingVitaminD,
        notes: feedingNotes || undefined,
      });
    } else if (type === 'pump') {
      onSave({
        startTime: toTimestamp(pumpStartTime),
        endTime: pumpEndTime ? toTimestamp(pumpEndTime) : undefined,
        amount: pumpAmount ? parseFloat(pumpAmount) : undefined,
        notes: pumpNotes || undefined,
      });
    } else if (type === 'diaper') {
      onSave({
        type: diaperType,
        time: toTimestamp(diaperTime),
        notes: diaperNotes || undefined,
      });
    }
    onClose();
  };

  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete();
      onClose();
    } else {
      setShowDeleteConfirm(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-sand-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 
        border border-leather-800 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-sand-100">
            Edit {type === 'sleep' ? 'Sleep' : type === 'feeding' ? 'Feeding' : type === 'pump' ? 'Pump' : 'Diaper'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-leather-800 transition-colors"
          >
            <X className="w-5 h-5 text-sand-400" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {type === 'sleep' && (
            <>
              <div>
                <label className="block text-sm text-sand-400 mb-2">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSleepType('nap')}
                    className={`py-2 px-4 rounded-xl font-medium transition-colors ${
                      sleepType === 'nap'
                        ? 'bg-amber-600 text-white'
                        : 'bg-leather-800 text-sand-300 hover:bg-leather-700'
                    }`}
                  >
                    Nap
                  </button>
                  <button
                    onClick={() => setSleepType('night')}
                    className={`py-2 px-4 rounded-xl font-medium transition-colors ${
                      sleepType === 'night'
                        ? 'bg-indigo-700 text-white'
                        : 'bg-leather-800 text-sand-300 hover:bg-leather-700'
                    }`}
                  >
                    Night
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-sand-400 mb-2">Start Time</label>
                <input
                  type="datetime-local"
                  value={sleepStartTime}
                  onChange={(e) => setSleepStartTime(e.target.value)}
                  className="w-full bg-leather-800 text-sand-100 rounded-xl px-4 py-3 border border-leather-700"
                />
              </div>

              <div>
                <label className="block text-sm text-sand-400 mb-2">End Time</label>
                <input
                  type="datetime-local"
                  value={sleepEndTime}
                  onChange={(e) => setSleepEndTime(e.target.value)}
                  className="w-full bg-leather-800 text-sand-100 rounded-xl px-4 py-3 border border-leather-700"
                />
              </div>

              <div>
                <label className="block text-sm text-sand-400 mb-2">Notes</label>
                <textarea
                  value={sleepNotes}
                  onChange={(e) => setSleepNotes(e.target.value)}
                  placeholder="Add notes..."
                  className="w-full bg-leather-800 text-sand-100 rounded-xl px-4 py-3 border border-leather-700 resize-none h-20 placeholder:text-sand-500"
                />
              </div>
            </>
          )}

          {type === 'feeding' && (
            <>
              <div>
                <label className="block text-sm text-sand-400 mb-2">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setFeedingType('breast_left')}
                    className={`py-2 px-4 rounded-xl font-medium transition-colors ${
                      feedingType === 'breast_left'
                        ? 'bg-red-700 text-white'
                        : 'bg-leather-800 text-sand-300 hover:bg-leather-700'
                    }`}
                  >
                    Left Breast
                  </button>
                  <button
                    onClick={() => setFeedingType('breast_right')}
                    className={`py-2 px-4 rounded-xl font-medium transition-colors ${
                      feedingType === 'breast_right'
                        ? 'bg-red-700 text-white'
                        : 'bg-leather-800 text-sand-300 hover:bg-leather-700'
                    }`}
                  >
                    Right Breast
                  </button>
                  <button
                    onClick={() => setFeedingType('bottle')}
                    className={`py-2 px-4 rounded-xl font-medium transition-colors ${
                      feedingType === 'bottle'
                        ? 'bg-red-700 text-white'
                        : 'bg-leather-800 text-sand-300 hover:bg-leather-700'
                    }`}
                  >
                    Bottle
                  </button>
                  <button
                    onClick={() => setFeedingType('solids')}
                    className={`py-2 px-4 rounded-xl font-medium transition-colors ${
                      feedingType === 'solids'
                        ? 'bg-red-700 text-white'
                        : 'bg-leather-800 text-sand-300 hover:bg-leather-700'
                    }`}
                  >
                    Solids
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-sand-400 mb-2">Start Time</label>
                <input
                  type="datetime-local"
                  value={feedingStartTime}
                  onChange={(e) => setFeedingStartTime(e.target.value)}
                  className="w-full bg-leather-800 text-sand-100 rounded-xl px-4 py-3 border border-leather-700"
                />
              </div>

              <div>
                <label className="block text-sm text-sand-400 mb-2">End Time</label>
                <input
                  type="datetime-local"
                  value={feedingEndTime}
                  onChange={(e) => setFeedingEndTime(e.target.value)}
                  className="w-full bg-leather-800 text-sand-100 rounded-xl px-4 py-3 border border-leather-700"
                />
              </div>

              {(feedingType === 'bottle' || feedingType === 'solids') && (
                <div>
                  <label className="block text-sm text-sand-400 mb-2">
                    Amount ({feedingType === 'bottle' ? 'ml' : 'g'})
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={feedingAmount}
                    onChange={(e) => setFeedingAmount(e.target.value)}
                    placeholder="Enter amount..."
                    className="w-full bg-leather-800 text-sand-100 rounded-xl px-4 py-3 border border-leather-700 placeholder:text-sand-500"
                  />
                </div>
              )}

              {feedingType === 'bottle' && (
                <div>
                  <label className="block text-sm text-sand-400 mb-2">Vitamin D</label>
                  <button
                    onClick={() => setFeedingVitaminD(!feedingVitaminD)}
                    className={`w-full py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
                      feedingVitaminD
                        ? 'bg-yellow-500/20 border border-yellow-400 text-yellow-200'
                        : 'bg-leather-800 border border-leather-700 text-sand-300 hover:bg-leather-700'
                    }`}
                  >
                    <span>💊</span>
                    <span>Vitamin D {feedingVitaminD ? '\u2713' : ''}</span>
                  </button>
                </div>
              )}

              <div>
                <label className="block text-sm text-sand-400 mb-2">Notes</label>
                <textarea
                  value={feedingNotes}
                  onChange={(e) => setFeedingNotes(e.target.value)}
                  placeholder="Add notes..."
                  className="w-full bg-leather-800 text-sand-100 rounded-xl px-4 py-3 border border-leather-700 resize-none h-20 placeholder:text-sand-500"
                />
              </div>
            </>
          )}

          {type === 'pump' && (
            <>
              <div>
                <label className="block text-sm text-sand-400 mb-2">Start Time</label>
                <input
                  type="datetime-local"
                  value={pumpStartTime}
                  onChange={(e) => setPumpStartTime(e.target.value)}
                  className="w-full bg-leather-800 text-sand-100 rounded-xl px-4 py-3 border border-leather-700"
                />
              </div>

              <div>
                <label className="block text-sm text-sand-400 mb-2">End Time</label>
                <input
                  type="datetime-local"
                  value={pumpEndTime}
                  onChange={(e) => setPumpEndTime(e.target.value)}
                  className="w-full bg-leather-800 text-sand-100 rounded-xl px-4 py-3 border border-leather-700"
                />
              </div>

              <div>
                <label className="block text-sm text-sand-400 mb-2">Amount (ml)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={pumpAmount}
                  onChange={(e) => setPumpAmount(e.target.value)}
                  placeholder="Enter amount..."
                  className="w-full bg-leather-800 text-sand-100 rounded-xl px-4 py-3 border border-leather-700 placeholder:text-sand-500"
                />
              </div>

              <div>
                <label className="block text-sm text-sand-400 mb-2">Notes</label>
                <textarea
                  value={pumpNotes}
                  onChange={(e) => setPumpNotes(e.target.value)}
                  placeholder="Add notes..."
                  className="w-full bg-leather-800 text-sand-100 rounded-xl px-4 py-3 border border-leather-700 resize-none h-20 placeholder:text-sand-500"
                />
              </div>
            </>
          )}

          {type === 'diaper' && (
            <>
              <div>
                <label className="block text-sm text-sand-400 mb-2">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setDiaperType('wet')}
                    className={`py-2 px-4 rounded-xl font-medium transition-colors ${
                      diaperType === 'wet'
                        ? 'bg-lime-700 text-white'
                        : 'bg-leather-800 text-sand-300 hover:bg-leather-700'
                    }`}
                  >
                    Wet
                  </button>
                  <button
                    onClick={() => setDiaperType('dirty')}
                    className={`py-2 px-4 rounded-xl font-medium transition-colors ${
                      diaperType === 'dirty'
                        ? 'bg-lime-700 text-white'
                        : 'bg-leather-800 text-sand-300 hover:bg-leather-700'
                    }`}
                  >
                    Dirty
                  </button>
                  <button
                    onClick={() => setDiaperType('both')}
                    className={`py-2 px-4 rounded-xl font-medium transition-colors ${
                      diaperType === 'both'
                        ? 'bg-lime-700 text-white'
                        : 'bg-leather-800 text-sand-300 hover:bg-leather-700'
                    }`}
                  >
                    Both
                  </button>
                  <button
                    onClick={() => setDiaperType('dry')}
                    className={`py-2 px-4 rounded-xl font-medium transition-colors ${
                      diaperType === 'dry'
                        ? 'bg-lime-700 text-white'
                        : 'bg-leather-800 text-sand-300 hover:bg-leather-700'
                    }`}
                  >
                    Dry
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-sand-400 mb-2">Time</label>
                <input
                  type="datetime-local"
                  value={diaperTime}
                  onChange={(e) => setDiaperTime(e.target.value)}
                  className="w-full bg-leather-800 text-sand-100 rounded-xl px-4 py-3 border border-leather-700"
                />
              </div>

              <div>
                <label className="block text-sm text-sand-400 mb-2">Notes</label>
                <textarea
                  value={diaperNotes}
                  onChange={(e) => setDiaperNotes(e.target.value)}
                  placeholder="Add notes..."
                  className="w-full bg-leather-800 text-sand-100 rounded-xl px-4 py-3 border border-leather-700 resize-none h-20 placeholder:text-sand-500"
                />
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={handleDelete}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-colors ${
              showDeleteConfirm
                ? 'bg-red-700 text-white flex-1'
                : 'bg-leather-800 text-red-400 hover:bg-red-700/20'
            }`}
          >
            <Trash2 className="w-5 h-5" />
            {showDeleteConfirm ? 'Confirm Delete' : 'Delete'}
          </button>
          
          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-500 
              text-white py-3 px-4 rounded-xl font-medium transition-colors"
          >
            <Check className="w-5 h-5" />
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
