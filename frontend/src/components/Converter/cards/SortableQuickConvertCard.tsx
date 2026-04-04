import React from 'react';
import { useTranslation } from 'react-i18next';
import { GripVertical, X, ArrowRight } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { QuickConvert } from '../../../services/userSettingsService';
import type { CurrencyRate } from '../types';

interface SortableQuickConvertCardProps {
  convert: QuickConvert;
  allCurrencies: CurrencyRate[];
  onRemove?: (convert: QuickConvert) => void;
}

const SortableQuickConvertCard: React.FC<SortableQuickConvertCardProps> = ({
  convert,
  allCurrencies,
  onRemove
}) => {
  const { t } = useTranslation('converter');

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: `${convert.from}_${convert.to}_${convert.amount}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab'
  };

  const fromCurrencyData = allCurrencies.find((c) => c.code === convert.from);
  const toCurrencyData = allCurrencies.find((c) => c.code === convert.to);

  let result = 0;
  if (fromCurrencyData && toCurrencyData) {
    const fromRate = fromCurrencyData.rate || 1;
    const toRate = toCurrencyData.rate || 1;

    if (convert.from === 'TRY') {
      result = convert.amount / toRate;
    } else if (convert.to === 'TRY') {
      result = convert.amount * fromRate;
    } else {
      const inTRY = convert.amount * fromRate;
      result = inTRY / toRate;
    }
  }

  const getDecimalPlaces = (code: string): number => {
    const currencyData = allCurrencies.find((c) => c.code === code);
    if (currencyData?.type === 'crypto') return 6;
    if (currencyData?.type === 'gold') return 2;
    return 3;
  };

  const fromDecimals = getDecimalPlaces(convert.from);
  const toDecimals = getDecimalPlaces(convert.to);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative p-5 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 group overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 transition-all duration-300 rounded-xl" />

      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(convert);
          }}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 bg-red-500/10 hover:bg-red-500/20 dark:bg-red-500/20 dark:hover:bg-red-500/30 rounded-full text-red-600 dark:text-red-400 z-10 backdrop-blur-sm"
          title={t('cards.removeQuickConvert')}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-grab active:cursor-grabbing p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 z-10"
        title={t('cards.dragToReorder')}
      >
        <GripVertical className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
      </div>

      <div className="text-center space-y-3 relative z-0">
        <div className="space-y-1">
          <div className="flex flex-row justify-center">
            {fromCurrencyData?.name && (
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide">
                {fromCurrencyData.name}
              </p>
            )}
            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-500 tracking-wide px-2">
              ({convert.from})
            </p>
          </div>
          <p className="text-base font-semibold text-gray-700 dark:text-gray-300">
            {convert.amount.toLocaleString('tr-TR', {
              minimumFractionDigits: fromDecimals,
              maximumFractionDigits: fromDecimals
            })}
          </p>
        </div>

        <div className="flex items-center justify-center py-1">
          <div className="flex items-center space-x-1 text-gray-400 dark:text-gray-500">
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex flex-row justify-center">
            {toCurrencyData?.name && (
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide">
                {toCurrencyData.name}
              </p>
            )}
            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-500 tracking-wide px-2">
              ({convert.to})
            </p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
            {result.toLocaleString('tr-TR', {
              minimumFractionDigits: toDecimals,
              maximumFractionDigits: toDecimals
            })}
          </p>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
};

export default SortableQuickConvertCard;
