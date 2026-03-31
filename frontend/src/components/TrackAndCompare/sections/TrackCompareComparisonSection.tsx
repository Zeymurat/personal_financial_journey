import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Filter,
  ChevronUp,
  ChevronDown,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  X
} from 'lucide-react';
import type { ComparisonItem } from '../types';
import type { FollowedBorsa, FollowedCurrency, FollowedFund } from '../../../services/userSettingsService';

type SortField = 'name' | 'code' | 'price' | 'change' | null;
type SortDir = 'asc' | 'desc';

type Props = {
  allComparisonItems: ComparisonItem[];
  filteredAndSortedItems: ComparisonItem[];
  comparisonSearchTerm: string;
  setComparisonSearchTerm: (v: string) => void;
  comparisonTypeFilter: string;
  setComparisonTypeFilter: (v: string) => void;
  comparisonSortField: SortField;
  comparisonSortDirection: SortDir;
  handleComparisonSort: (field: 'name' | 'code' | 'price' | 'change') => void;
  setShowAddToTableModal: (v: boolean) => void;
  getTypeBadgeColor: (type: string) => string;
  getTypeLabel: (type: string) => string;
  followedCurrencies: FollowedCurrency[];
  followedBorsa: FollowedBorsa[];
  followedFunds: FollowedFund[];
  toggleFollowedCurrency: (code: string) => Promise<void>;
  toggleFollowedBorsa: (code: string) => Promise<void>;
  toggleFollowedFund: (key: string) => Promise<void>;
  setTemporaryItems: React.Dispatch<React.SetStateAction<ComparisonItem[]>>;
};

const TrackCompareComparisonSection: React.FC<Props> = (props) => {
  const { t } = useTranslation('trackCompare');
  const {
    allComparisonItems,
    filteredAndSortedItems,
    comparisonSearchTerm,
    setComparisonSearchTerm,
    comparisonTypeFilter,
    setComparisonTypeFilter,
    comparisonSortField,
    comparisonSortDirection,
    handleComparisonSort,
    setShowAddToTableModal,
    getTypeBadgeColor,
    getTypeLabel,
    followedCurrencies,
    followedBorsa,
    followedFunds,
    toggleFollowedCurrency,
    toggleFollowedBorsa,
    toggleFollowedFund,
    setTemporaryItems
  } = props;

  if (allComparisonItems.length === 0) {
    return null;
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('comparison.tableTitle')}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('comparison.tableSubtitle')}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={t('comparison.searchPlaceholder')}
                value={comparisonSearchTerm}
                onChange={(e) => setComparisonSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white w-full"
              />
            </div>
            <button
              onClick={() => setShowAddToTableModal(true)}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-200 text-sm font-semibold"
              type="button"
            >
              <Plus className="w-4 h-4" />
              <span>{t('comparison.addAsset')}</span>
            </button>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={comparisonTypeFilter}
                onChange={(e) => setComparisonTypeFilter(e.target.value)}
                className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="all">{t('comparison.filterAll')}</option>
                <option value="currency">{t('comparison.currency')}</option>
                <option value="gold">{t('comparison.gold')}</option>
                <option value="crypto">{t('comparison.crypto')}</option>
                <option value="metal">{t('comparison.metal')}</option>
                <option value="fund">{t('comparison.fund')}</option>
                <option value="stock">{t('comparison.stock')}</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wider">
                  <button
                    type="button"
                    onClick={() => handleComparisonSort('name')}
                    className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    <span>{t('comparison.colName')}</span>
                    {comparisonSortField === 'name' ? (
                      comparisonSortDirection === 'asc' ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )
                    ) : (
                      <div className="w-4 h-4 opacity-30">
                        <ChevronUp className="w-4 h-4" />
                      </div>
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wider">
                  <button
                    type="button"
                    onClick={() => handleComparisonSort('code')}
                    className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    <span>{t('comparison.colCode')}</span>
                    {comparisonSortField === 'code' ? (
                      comparisonSortDirection === 'asc' ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )
                    ) : (
                      <div className="w-4 h-4 opacity-30">
                        <ChevronUp className="w-4 h-4" />
                      </div>
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wider">
                  {t('comparison.colType')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wider">
                  <button
                    type="button"
                    onClick={() => handleComparisonSort('price')}
                    className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    <span>{t('comparison.colPrice')}</span>
                    {comparisonSortField === 'price' ? (
                      comparisonSortDirection === 'asc' ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )
                    ) : (
                      <div className="w-4 h-4 opacity-30">
                        <ChevronUp className="w-4 h-4" />
                      </div>
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wider">
                  <button
                    type="button"
                    onClick={() => handleComparisonSort('change')}
                    className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    <span>{t('comparison.colChange')}</span>
                    {comparisonSortField === 'change' ? (
                      comparisonSortDirection === 'asc' ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )
                    ) : (
                      <div className="w-4 h-4 opacity-30">
                        <ChevronUp className="w-4 h-4" />
                      </div>
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wider">
                  {t('comparison.colBuy')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wider">
                  {t('comparison.colSell')}
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wider w-fit">
                  {t('comparison.colTrend')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wider">
                  {t('comparison.colActions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAndSortedItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center">
                    <p className="text-gray-500 dark:text-gray-400">
                      {comparisonSearchTerm || comparisonTypeFilter !== 'all'
                        ? t('comparison.emptySearch')
                        : t('comparison.emptyTracked')}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredAndSortedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div
                        className="text-sm font-semibold text-gray-900 dark:text-white max-w-[200px] truncate"
                        title={item.name}
                      >
                        {item.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{item.code}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeBadgeColor(item.type)}`}>
                        {getTypeLabel(item.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {item.price > 0 ? (
                          `₺${item.price.toLocaleString(undefined, {
                            minimumFractionDigits:
                              item.type === 'crypto' ? 6 : item.type === 'gold' ? 2 : item.type === 'fund' ? 2 : 3,
                            maximumFractionDigits:
                              item.type === 'crypto' ? 6 : item.type === 'gold' ? 2 : item.type === 'fund' ? 2 : 3
                          })}`
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={`text-sm font-semibold flex items-center space-x-1 ${
                          item.change > 0
                            ? 'text-green-600 dark:text-green-400'
                            : item.change < 0
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {item.change > 0 ? (
                          <TrendingUpIcon className="w-4 h-4" />
                        ) : item.change < 0 ? (
                          <TrendingDownIcon className="w-4 h-4" />
                        ) : null}
                        <span>
                          {item.change > 0 ? '+' : ''}
                          {item.change.toFixed(2)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {item.buy !== undefined ? (
                          `₺${item.buy.toLocaleString(undefined, {
                            minimumFractionDigits: item.type === 'crypto' ? 6 : item.type === 'gold' ? 2 : 3,
                            maximumFractionDigits: item.type === 'crypto' ? 6 : item.type === 'gold' ? 2 : 3
                          })}`
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {item.sell !== undefined ? (
                          `₺${item.sell.toLocaleString(undefined, {
                            minimumFractionDigits: item.type === 'crypto' ? 6 : item.type === 'gold' ? 2 : 3,
                            maximumFractionDigits: item.type === 'crypto' ? 6 : item.type === 'gold' ? 2 : 3
                          })}`
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex justify-center">
                        <div
                          className={`p-2 rounded-full ${
                            item.change > 0
                              ? 'bg-green-100 dark:bg-green-900'
                              : item.change < 0
                                ? 'bg-red-100 dark:bg-red-900'
                                : 'bg-gray-100 dark:bg-gray-700'
                          }`}
                        >
                          {item.change > 0 ? (
                            <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                          ) : item.change < 0 ? (
                            <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-gray-400 dark:bg-gray-500" />
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {item.id.startsWith('temp-') && (
                          <button
                            type="button"
                            onClick={async () => {
                              setTemporaryItems((prev) => prev.filter((t) => t.id !== item.id));

                              if (item.type === 'currency' || item.type === 'gold' || item.type === 'crypto' || item.type === 'metal') {
                                const isFollowed = followedCurrencies.some((fc) => fc.code === item.code);
                                if (!isFollowed) {
                                  await toggleFollowedCurrency(item.code);
                                }
                              } else if (item.type === 'stock') {
                                const isFollowed = followedBorsa.some((fb) => fb.code === item.code);
                                if (!isFollowed) {
                                  await toggleFollowedBorsa(item.code);
                                }
                              } else if (item.type === 'fund') {
                                const isFollowed = followedFunds.some((ff) => ff.key === item.code);
                                if (!isFollowed) {
                                  await toggleFollowedFund(item.code);
                                }
                              }
                            }}
                            className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors font-semibold"
                            title={t('comparison.addToWatchlistTitle')}
                          >
                            {t('comparison.follow')}
                          </button>
                        )}
                        {item.id.startsWith('temp-') && (
                          <button
                            type="button"
                            onClick={() => {
                              setTemporaryItems((prev) => prev.filter((t) => t.id !== item.id));
                            }}
                            className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            title={t('comparison.removeFromTableTitle')}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {filteredAndSortedItems.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('comparison.priceCompareTitle')}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('comparison.priceCompareSubtitle')}</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {filteredAndSortedItems
                  .filter((i) => i.price > 0)
                  .sort((a, b) => b.price - a.price)
                  .map((item) => {
                    const itemsWithPrice = filteredAndSortedItems.filter((i) => i.price > 0);
                    const maxPrice = Math.max(...itemsWithPrice.map((i) => i.price), 1);
                    const barWidth = maxPrice > 0 ? (item.price / maxPrice) * 100 : 0;

                    return (
                      <div key={item.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeBadgeColor(item.type)}`}>
                              {getTypeLabel(item.type)}
                            </span>
                            <span
                              className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[120px]"
                              title={`${item.name} (${item.code})`}
                            >
                              {item.code}
                            </span>
                          </div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            ₺
                            {item.price.toLocaleString(undefined, {
                              minimumFractionDigits: item.type === 'crypto' ? 6 : item.type === 'gold' ? 2 : 3,
                              maximumFractionDigits: item.type === 'crypto' ? 6 : item.type === 'gold' ? 2 : 3
                            })}
                          </div>
                        </div>
                        <div className="relative h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="absolute top-0 h-full rounded-full bg-gradient-to-r from-blue-400 to-indigo-600 transition-all duration-500"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                {filteredAndSortedItems.filter((i) => i.price > 0).length === 0 && (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">{t('comparison.noPriceData')}</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('comparison.changeCompareTitle')}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('comparison.changeCompareSubtitle')}</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {filteredAndSortedItems
                  .sort((a, b) => b.change - a.change)
                  .map((item) => {
                    const allChanges = filteredAndSortedItems.map((i) => Math.abs(i.change));
                    const maxChange = Math.max(...allChanges, 1);
                    const barWidth = maxChange > 0 ? (Math.abs(item.change) / maxChange) * 50 : 0;

                    return (
                      <div key={item.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeBadgeColor(item.type)}`}>
                              {getTypeLabel(item.type)}
                            </span>
                            <span
                              className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[120px]"
                              title={`${item.name} (${item.code})`}
                            >
                              {item.code}
                            </span>
                          </div>
                          <div
                            className={`text-sm font-semibold flex items-center space-x-1 ${
                              item.change > 0
                                ? 'text-green-600 dark:text-green-400'
                                : item.change < 0
                                  ? 'text-red-600 dark:text-red-400'
                                  : 'text-gray-500 dark:text-gray-400'
                            }`}
                          >
                            {item.change > 0 ? (
                              <TrendingUpIcon className="w-4 h-4" />
                            ) : item.change < 0 ? (
                              <TrendingDownIcon className="w-4 h-4" />
                            ) : null}
                            <span>
                              {item.change > 0 ? '+' : ''}
                              {item.change.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                        <div className="relative h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-visible">
                          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-400 dark:bg-gray-500 z-10" />

                          {item.change === 0 ? (
                            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full z-20" />
                          ) : (
                            <div
                              className={`absolute top-0 h-full rounded-full transition-all duration-500 ${
                                item.change > 0
                                  ? 'bg-gradient-to-r from-green-400 to-green-600'
                                  : 'bg-gradient-to-r from-red-400 to-red-600'
                              }`}
                              style={
                                item.change > 0
                                  ? { left: '50%', width: `${barWidth}%` }
                                  : { right: '50%', width: `${barWidth}%` }
                              }
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TrackCompareComparisonSection;
