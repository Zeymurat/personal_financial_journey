import React from 'react';
import { TrendingUp, TrendingDown, GripVertical, X } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { StockData } from '../../../contexts/FinanceContext';

interface SortableStockCardProps {
  stock: StockData;
}

interface SortableStockCardPropsWithRemove extends SortableStockCardProps {
  onRemove?: (stockCode: string) => void;
}

const SortableStockCard: React.FC<SortableStockCardPropsWithRemove> = ({ stock, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: stock.code });

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
            onRemove(stock.code);
          }}
          className="absolute top-1 right-28 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-full text-red-600 dark:text-red-400 z-10"
          title="Kartı listeden çıkar"
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
            <h3 className="font-semibold text-gray-900 dark:text-white">{stock.code}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{stock.name}</p>
          </div>
        </div>
        <div
          className={`p-2 rounded-full ${
            stock.rate >= 0 ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'
          }`}
        >
          {stock.rate >= 0 ? (
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
          ) : (
            <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
          )}
        </div>
      </div>

      <div className="mb-3">
        <span className="text-xs text-gray-600 dark:text-gray-400">Son Fiyat:</span>
        <span className="text-lg font-semibold text-gray-900 dark:text-white ml-2">₺{stock.last_price.toFixed(2)}</span>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          <span className="text-xs text-gray-600 dark:text-gray-400">Yüksek:</span>
          <span className="text-sm font-semibold text-green-600 dark:text-green-400 ml-2">₺{stock.high.toFixed(2)}</span>
        </div>
        <div className="flex-1 text-right">
          <span className="text-xs text-gray-600 dark:text-gray-400">Düşük:</span>
          <span className="text-sm font-semibold text-red-600 dark:text-red-400 ml-2">₺{stock.low.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
        <span className="text-xs text-gray-500 dark:text-gray-400">Değişim:</span>
        <span className={`text-sm font-medium ${stock.rate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {stock.rate >= 0 ? '+' : ''}
          {stock.rate.toFixed(2)}%
        </span>
      </div>
      {stock.volume > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <span className="text-xs text-gray-500 dark:text-gray-400">Hacim: </span>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">₺{(stock.volume / 1000000).toFixed(2)}M</span>
        </div>
      )}
    </div>
  );
};

export default SortableStockCard;
