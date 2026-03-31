import React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { ShimmerThumbnail, ShimmerBadge } from 'react-shimmer-effects';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable';
import type { CurrencyRate } from '../types';
import SortableCurrencyCard from '../cards/SortableCurrencyCard';

interface CurrencyRatesPanelProps {
  loadingRates: boolean;
  currenciesFetchTime: string | null;
  sortedCurrencies: CurrencyRate[];
  onOpenSelect: () => void;
  onDragEnd: (event: DragEndEvent) => void;
  onToggleCurrency: (currencyCode: string) => void;
}

const CurrencyRatesPanel: React.FC<CurrencyRatesPanelProps> = ({
  loadingRates,
  currenciesFetchTime,
  sortedCurrencies,
  onOpenSelect,
  onDragEnd,
  onToggleCurrency
}) => {
  const { t } = useTranslation('investments');
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('panels.currencyTitle')}</h2>
              {currenciesFetchTime && (
                <span className="text-xs text-gray-500 dark:text-gray-400">({currenciesFetchTime})</span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {loadingRates && <ShimmerBadge width={20} />}
            <button
              type="button"
              onClick={onOpenSelect}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-all duration-200 text-sm"
              title={t('panels.selectCurrencyTitle')}
            >
              <Plus className="w-4 h-4" />
              <span>{t('panels.add')}</span>
            </button>
          </div>
        </div>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-6">
          {loadingRates ? (
            <>
              {[...Array(5)].map((_, i) => (
                <ShimmerThumbnail key={i} height={120} />
              ))}
            </>
          ) : sortedCurrencies.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {t('panels.currencyEmpty')}
              </p>
              <button
                type="button"
                onClick={onOpenSelect}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                {t('panels.currencyCta')}
              </button>
            </div>
          ) : (
            <SortableContext items={sortedCurrencies.map((c) => c.code)} strategy={rectSortingStrategy}>
              {sortedCurrencies.map((currency) => (
                <SortableCurrencyCard key={currency.code} currency={currency} onRemove={onToggleCurrency} />
              ))}
            </SortableContext>
          )}
        </div>
      </DndContext>
    </div>
  );
};

export default CurrencyRatesPanel;
