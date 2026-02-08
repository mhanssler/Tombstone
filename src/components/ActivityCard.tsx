import { useState } from 'react';
import { Moon, Sun, Baby, Droplets, Trash2, X, Check, Edit2 } from 'lucide-react';
import { formatTime, formatDuration } from '@/utils/time';
import type { SleepSession, FeedingSession, PumpSession, DiaperChange } from '@/types';

interface ActivityCardProps {
  activity: SleepSession | FeedingSession | PumpSession | DiaperChange;
  type: 'sleep' | 'feeding' | 'diaper' | 'pump';
  timeFormat?: '12h' | '24h';
  onDelete?: () => void;
  onEdit?: () => void;
}

export function ActivityCard({ activity, type, timeFormat = '12h', onDelete, onEdit }: ActivityCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    onDelete?.();
    setShowDeleteConfirm(false);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const handleCardClick = () => {
    if (onEdit && !showDeleteConfirm) {
      onEdit();
    }
  };

  const renderContent = () => {
    switch (type) {
      case 'sleep': {
        const sleep = activity as SleepSession;
        const isNight = sleep.type === 'night';
        const duration = sleep.endTime ? sleep.endTime - sleep.startTime : null;
        
        return (
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isNight ? 'bg-indigo-700' : 'bg-amber-600'
            }`}>
              {isNight ? (
                <Moon className="w-5 h-5 text-white" />
              ) : (
                <Sun className="w-5 h-5 text-white" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sand-100">
                  {isNight ? 'Night Sleep' : 'Nap'}
                </span>
                {duration && (
                  <span className="text-indigo-400 font-medium">
                    {formatDuration(duration)}
                  </span>
                )}
              </div>
              <div className="text-sm text-sand-500">
                {formatTime(sleep.startTime, timeFormat)}
                {sleep.endTime && ` - ${formatTime(sleep.endTime, timeFormat)}`}
              </div>
            </div>
          </div>
        );
      }

      case 'feeding': {
        const feeding = activity as FeedingSession;
        const duration = feeding.endTime ? feeding.endTime - feeding.startTime : null;
        
        const feedingLabel = {
          breast_left: 'Breast (Left)',
          breast_right: 'Breast (Right)',
          bottle: 'Bottle',
          solids: 'Solids',
        }[feeding.type];
        
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-700 flex items-center justify-center">
              <Baby className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sand-100">{feedingLabel}</span>
                  {feeding.vitaminD && (
                    <span className="text-xs bg-yellow-500/20 text-yellow-300 px-1.5 py-0.5 rounded-md">
                      💊 Vit D
                    </span>
                  )}
                </div>
                {duration && (
                  <span className="text-red-400 font-medium">
                    {formatDuration(duration)}
                  </span>
                )}
                {feeding.amount && (
                  <span className="text-red-400 font-medium">
                    {feeding.amount}ml
                  </span>
                )}
              </div>
              <div className="text-sm text-sand-500">
                {formatTime(feeding.startTime, timeFormat)}
                {feeding.endTime && ` - ${formatTime(feeding.endTime, timeFormat)}`}
              </div>
            </div>
          </div>
        );
      }

      case 'pump': {
        const pump = activity as PumpSession;
        const duration = pump.endTime ? pump.endTime - pump.startTime : null;

        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-700 flex items-center justify-center">
              <span className="text-white text-lg">🍼</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sand-100">Pump</span>
                <div className="flex items-center gap-2">
                  {pump.amount && (
                    <span className="text-purple-400 font-medium">
                      {pump.amount}ml
                    </span>
                  )}
                  {duration && (
                    <span className="text-purple-400 font-medium">
                      {formatDuration(duration)}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-sm text-sand-500">
                {formatTime(pump.startTime, timeFormat)}
                {pump.endTime && ` - ${formatTime(pump.endTime, timeFormat)}`}
              </div>
            </div>
          </div>
        );
      }

      case 'diaper': {
        const diaper = activity as DiaperChange;
        const diaperLabel = {
          wet: 'Wet',
          dirty: 'Dirty',
          both: 'Wet + Dirty',
          dry: 'Dry',
        }[diaper.type];
        
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-lime-700 flex items-center justify-center">
              <Droplets className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sand-100">Diaper - {diaperLabel}</span>
              </div>
              <div className="text-sm text-sand-500">
                {formatTime(diaper.time, timeFormat)}
              </div>
            </div>
          </div>
        );
      }
    }
  };

  // Delete confirmation overlay
  if (showDeleteConfirm) {
    return (
      <div className="bg-red-900/30 rounded-xl p-4 border border-red-500/50">
        <div className="flex items-center justify-between">
          <p className="text-sand-100 text-sm">Delete this entry?</p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancelDelete}
              className="p-2 rounded-lg bg-leather-800 hover:bg-leather-700 transition-colors"
            >
              <X className="w-4 h-4 text-sand-300" />
            </button>
            <button
              onClick={handleConfirmDelete}
              className="p-2 rounded-lg bg-red-700 hover:bg-red-600 transition-colors"
            >
              <Check className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={handleCardClick}
      className={`bg-sand-900/60 rounded-xl p-4 border border-leather-800/50 group relative 
        ${onEdit ? 'cursor-pointer hover:bg-sand-800/70 active:scale-[0.99]' : ''} transition-all`}
    >
      {renderContent()}
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
        {onEdit && (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="p-2 rounded-lg bg-leather-800/80 hover:bg-primary-600/80 transition-colors"
            title="Edit"
          >
            <Edit2 className="w-4 h-4 text-sand-300" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={handleDeleteClick}
            className="p-2 rounded-lg bg-leather-800/80 hover:bg-red-600/80 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4 text-sand-300" />
          </button>
        )}
      </div>
    </div>
  );
}
