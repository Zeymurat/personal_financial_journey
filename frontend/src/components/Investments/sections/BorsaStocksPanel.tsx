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
import type { StockData } from '../../../contexts/FinanceContext';
import SortableStockCard from '../cards/SortableStockCard';

interface BorsaStocksPanelProps {
  loadingBorsa: boolean;
  borsaDataLength: number;
  borsaFetchTime: string | null;
  sortedStocks: StockData[];
  onOpenSelect: () => void;
  onDragEnd: (event: DragEndEvent) => void;
  onRemoveStock: (stockCode: string) => void;
}

const BorsaStocksPanel: React.FC<BorsaStocksPanelProps> = ({
  loadingBorsa,
  borsaDataLength,
  borsaFetchTime,
  sortedStocks,
  onOpenSelect,
  onDragEnd,
  onRemoveStock
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
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('panels.borsaTitle')}</h2>
              {borsaFetchTime && (
                <span className="text-xs text-gray-500 dark:text-gray-400">({borsaFetchTime})</span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {loadingBorsa && <ShimmerBadge width={20} />}
            <button
              type="button"
              onClick={onOpenSelect}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-all duration-200 text-sm"
              title={t('panels.selectStocksTitle')}
            >
              <Plus className="w-4 h-4" />
              <span>{t('panels.add')}</span>
            </button>
          </div>
        </div>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-6">
          {loadingBorsa && borsaDataLength === 0 ? (
            <>
              {[...Array(5)].map((_, i) => (
                <ShimmerThumbnail key={i} height={120} />
              ))}
            </>
          ) : sortedStocks.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {t('panels.borsaEmpty')}
              </p>
              <button
                type="button"
                onClick={onOpenSelect}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                {t('panels.borsaCta')}
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

export default BorsaStocksPanel;
