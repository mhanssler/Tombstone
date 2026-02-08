import { ReactNode } from 'react';

interface QuickLogButtonProps {
  icon: ReactNode;
  label: string;
  sublabel?: string;
  color: 'sleep' | 'feeding' | 'diaper';
  onClick: () => void;
  disabled?: boolean;
}

const colorMap = {
  sleep: {
    bg: 'bg-indigo-900/40',
    border: 'border-indigo-600/50',
    icon: 'bg-indigo-700',
    text: 'text-indigo-400',
  },
  feeding: {
    bg: 'bg-red-900/40',
    border: 'border-red-600/50',
    icon: 'bg-red-700',
    text: 'text-red-400',
  },
  diaper: {
    bg: 'bg-lime-900/40',
    border: 'border-lime-600/50',
    icon: 'bg-lime-700',
    text: 'text-lime-400',
  },
};

export function QuickLogButton({
  icon,
  label,
  sublabel,
  color,
  onClick,
  disabled = false,
}: QuickLogButtonProps) {
  const colors = colorMap[color];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${colors.bg} ${colors.border} border rounded-2xl p-4
        flex flex-col items-center gap-2
        active:scale-[0.97] transition-all
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      <div className={`w-12 h-12 ${colors.icon} rounded-full flex items-center justify-center`}>
        {icon}
      </div>
      <span className="text-sand-100 font-medium text-sm">{label}</span>
      {sublabel && (
        <span className={`${colors.text} text-xs`}>{sublabel}</span>
      )}
    </button>
  );
}
