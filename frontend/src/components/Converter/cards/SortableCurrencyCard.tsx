import React from 'react';
import { useTranslation } from 'react-i18next';
import { GripVertical, X, TrendingUp, TrendingDown } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CurrencyRate } from '../types';

interface SortableCurrencyCardProps {
  currency: CurrencyRate;
  onRemove?: (currencyCode: string) => void;
}

const SortableCurrencyCard: React.FC<SortableCurrencyCardProps> = ({ currency, onRemove }) => {
  const { t } = useTranslation('converter');

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: currency.code });

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
            onRemove(currency.code);
          }}
          className="absolute top-1 right-28 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-full text-red-600 dark:text-red-400 z-10"
          title={t('cards.removeCurrencyCard')}
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
            <h3 className="font-semibold text-gray-900 dark:text-white">{currency.code}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{currency.name}</p>
          </div>
        </div>
        <div
          className={`p-2 rounded-full ${
            currency.change >= 0 ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'
          }`}
        >
          {currency.change >= 0 ? (
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
          ) : (
            <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          <span className="text-xs text-gray-600 dark:text-gray-400">{t('cards.buy')}</span>
          <span className="text-sm font-semibold text-green-600 dark:text-green-400 ml-2">
            ₺
            {currency.type === 'crypto'
              ? currency.buy.toFixed(6)
              : currency.type === 'gold'
                ? currency.buy.toFixed(2)
                : currency.buy.toFixed(3)}
          </span>
        </div>
        <div className="flex-1 text-right">
          <span className="text-xs text-gray-600 dark:text-gray-400">{t('cards.sell')}</span>
          <span className="text-sm font-semibold text-red-600 dark:text-red-400 ml-2">
            ₺
            {currency.type === 'crypto'
              ? currency.sell.toFixed(6)
              : currency.type === 'gold'
                ? currency.sell.toFixed(2)
                : currency.sell.toFixed(3)}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
        <span className="text-xs text-gray-500 dark:text-gray-400">{t('cards.change')}</span>
        <span className={`text-sm font-medium ${currency.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {currency.change >= 0 ? '+' : ''}
          {currency.change.toFixed(2)}%
        </span>
      </div>
    </div>
  );
};

export default SortableCurrencyCard;
