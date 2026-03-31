import React from 'react';
import { GripVertical, X, Eye } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface SortableFundCardProps {
  fund: { key: string; value: string };
  onRemove?: (fundKey: string) => void;
  onViewDetail?: (fundCode: string, fundName: string) => void;
}

const SortableFundCard: React.FC<SortableFundCardProps> = ({ fund, onRemove, onViewDetail }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: fund.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab'
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow bg-white dark:bg-gray-800 group"
    >
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(fund.key);
          }}
          className="absolute top-1 right-28 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-full text-red-600 dark:text-red-400 z-10"
          title="Fonu listeden çıkar"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      <div
        {...attributes}
        {...listeners}
        className="flex items-center justify-between mb-3 cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center space-x-2">
          <GripVertical className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{fund.key}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{fund.value}</p>
          </div>
        </div>
      </div>

      {onViewDetail && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewDetail(fund.key, fund.value);
          }}
          className="w-full mt-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center space-x-2"
          title="Fon detay bilgilerini görüntüle"
        >
          <Eye className="w-4 h-4" />
          <span>Detay</span>
        </button>
      )}
    </div>
  );
};

export default SortableFundCard;
