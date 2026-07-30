import React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Loader2 } from 'lucide-react';
import { DndContext, closestCenter, type DragEndEvent, type SensorDescriptor } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import type { StockData } from '../../../contexts/FinanceContext';
import SortableStockCard from '../cards/SortableStockCard';

type Props = {
  loadingBorsa: boolean;
  borsaDataLength: number;
  sortedStocks: StockData[];
  sensors: SensorDescriptor<any>[] | undefined;
  onDragEnd: (e: DragEndEvent) => void;
  onOpenSelection: () => void;
  onRemoveStock: (code: string) => void;
};

const TrackCompareBorsaSection: React.FC<Props> = ({
  loadingBorsa,
  borsaDataLength,
  sortedStocks,
  sensors,
  onDragEnd,
  onOpenSelection,
  onRemoveStock
}) => {
  const { t } = useTranslation('trackCompare');

  return (
    <div className="bg-brand-surface dark:bg-brand-surface-dark rounded-xl border border-brand-ink/10 dark:border-brand-champagne/15 overflow-hidden mb-8">
      <div className="px-6 py-4 border-b border-brand-ink/10 dark:border-brand-champagne/15">
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('borsa.sectionTitle')}</h2>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {loadingBorsa && <Loader2 className="w-5 h-5 animate-spin text-brand-ink" />}
            <button
              onClick={onOpenSelection}
              className="flex items-center space-x-2 bg-brand-ink hover:bg-brand-ink-light text-white px-3 py-1.5 rounded-lg transition-all duration-200 text-sm"
              title={t('borsa.selectTitle')}
              type="button"
            >
              <Plus className="w-4 h-4" />
              <span>{t('borsa.add')}</span>
            </button>
          </div>
        </div>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-6">
          {loadingBorsa && borsaDataLength === 0 ? (
            <div className="col-span-full flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-brand-ink" />
              <span className="ml-3 text-gray-600 dark:text-gray-400">{t('borsa.loading')}</span>
            </div>
          ) : sortedStocks.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 mb-4">{t('borsa.empty')}</p>
              <button
                onClick={onOpenSelection}
                className="bg-brand-ink hover:bg-brand-ink-light text-white px-6 py-2 rounded-lg transition-colors"
                type="button"
              >
                {t('borsa.emptyCta')}
              </button>
            </div>
          ) : (
            <SortableContext items={sortedStocks.map((s) => s.code)} strategy={rectSortingStrategy}>
              {sortedStocks.map((stock) => (
                <SortableStockCard key={stock.code} stock={stock} onRemove={onRemoveStock} />
              ))}
            </SortableContext>
          )}
        </div>
      </DndContext>
    </div>
  );
};

export default TrackCompareBorsaSection;
