import React from 'react';
import { useTokenValidation } from '../../hooks/useTokenValidation';
import { HisseSelectionModal, FundsSelectionModal, CurrencySelectionModal } from '../shared/modals';
import FundDetailModal from '../Investments/modals/FundDetailModal';
import AddToTableModal from './AddToTableModal';
import type { CurrencyRate } from './types';
import { useTrackAndCompare } from './hooks/useTrackAndCompare';
import TrackCompareHeader from './sections/TrackCompareHeader';
import TrackCompareCurrencySection from './sections/TrackCompareCurrencySection';
import TrackCompareFundsSection from './sections/TrackCompareFundsSection';
import TrackCompareBorsaSection from './sections/TrackCompareBorsaSection';
import TrackCompareComparisonSection from './sections/TrackCompareComparisonSection';

const TrackAndCompare: React.FC = () => {
  useTokenValidation();

  const tc = useTrackAndCompare();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
      <div className="p-8 space-y-8">
        <TrackCompareHeader />

        <TrackCompareCurrencySection
          loadingRates={tc.loadingRates}
          sortedCurrencies={tc.sortedCurrencies}
          sensors={tc.sensors}
          onDragEnd={tc.handleCurrencyDragEnd}
          onOpenSelection={() => tc.setIsSelectingCurrencies(true)}
          onRemoveCurrency={tc.toggleFollowedCurrency}
        />

        <TrackCompareFundsSection
          loadingFunds={tc.loadingFunds}
          sortedFunds={tc.sortedFunds}
          sensors={tc.sensors}
          onDragEnd={tc.handleFundDragEnd}
          onOpenSelection={() => tc.setIsSelectingFunds(true)}
          onRemoveFund={tc.toggleFollowedFund}
          onViewFundDetail={(code, name) => tc.setFundDetailModal({ isOpen: true, fundCode: code, fundName: name })}
        />

        <TrackCompareBorsaSection
          loadingBorsa={tc.loadingBorsa}
          borsaDataLength={tc.borsaData.length}
          sortedStocks={tc.sortedStocks}
          sensors={tc.sensors}
          onDragEnd={tc.handleBorsaDragEnd}
          onOpenSelection={() => tc.setIsSelectingBorsa(true)}
          onRemoveStock={tc.toggleFollowedBorsa}
        />

        <TrackCompareComparisonSection
          allComparisonItems={tc.allComparisonItems}
          filteredAndSortedItems={tc.filteredAndSortedItems}
          comparisonSearchTerm={tc.comparisonSearchTerm}
          setComparisonSearchTerm={tc.setComparisonSearchTerm}
          comparisonTypeFilter={tc.comparisonTypeFilter}
          setComparisonTypeFilter={tc.setComparisonTypeFilter}
          comparisonSortField={tc.comparisonSortField}
          comparisonSortDirection={tc.comparisonSortDirection}
          handleComparisonSort={tc.handleComparisonSort}
          setShowAddToTableModal={tc.setShowAddToTableModal}
          getTypeBadgeColor={tc.getTypeBadgeColor}
          getTypeLabel={tc.getTypeLabel}
          followedCurrencies={tc.followedCurrencies}
          followedBorsa={tc.followedBorsa}
          followedFunds={tc.followedFunds}
          toggleFollowedCurrency={tc.toggleFollowedCurrency}
          toggleFollowedBorsa={tc.toggleFollowedBorsa}
          toggleFollowedFund={tc.toggleFollowedFund}
          setTemporaryItems={tc.setTemporaryItems}
        />

        <HisseSelectionModal
          isOpen={tc.isSelectingBorsa}
          onClose={() => {
            tc.setIsSelectingBorsa(false);
            tc.setSearchBorsaQuery('');
          }}
          borsaData={tc.borsaData}
          selectedHisse={tc.followedBorsa.map((fb) => ({ code: fb.code, order: fb.order }))}
          onSelectionChange={(hisse) => {
            tc.handleBorsaSelectionChange(hisse.map((h) => ({ code: h.code, order: h.order })));
          }}
          searchQuery={tc.searchBorsaQuery}
          onSearchChange={tc.setSearchBorsaQuery}
          toggleHisseSelection={tc.toggleFollowedBorsa}
        />

        <CurrencySelectionModal
          isOpen={tc.isSelectingCurrencies}
          onClose={() => tc.setIsSelectingCurrencies(false)}
          allCurrencies={tc.allCurrencies}
          selectedCurrencies={tc.followedCurrencies.map((fc) => ({ code: fc.code, order: fc.order }))}
          onSelectionChange={(currencies) => {
            tc.handleCurrencySelectionChange(currencies.map((c) => ({ code: c.code, order: c.order })));
          }}
          exchangeRates={tc.exchangeRates as Record<string, CurrencyRate>}
          goldPrices={tc.goldPrices as Record<string, CurrencyRate>}
          cryptoCurrencies={tc.cryptoCurrencies as Record<string, CurrencyRate>}
          preciousMetals={tc.preciousMetals as Record<string, CurrencyRate>}
          currentUserId={tc.currentUser?.id}
          onToggle={tc.toggleFollowedCurrency}
        />

        <FundsSelectionModal
          isOpen={tc.isSelectingFunds}
          onClose={() => {
            tc.setIsSelectingFunds(false);
            tc.setSearchFundQuery('');
          }}
          allFunds={tc.allFunds}
          selectedFunds={tc.followedFunds.map((ff) => ({ key: ff.key, order: ff.order }))}
          onSelectionChange={(funds) => {
            tc.handleFundSelectionChange(funds.map((f) => ({ key: f.key, order: f.order })));
          }}
          searchQuery={tc.searchFundQuery}
          onSearchChange={tc.setSearchFundQuery}
          toggleFundSelection={tc.toggleFollowedFund}
        />

        <FundDetailModal
          isOpen={tc.fundDetailModal.isOpen}
          onClose={() => tc.setFundDetailModal({ isOpen: false, fundCode: '', fundName: '' })}
          fundCode={tc.fundDetailModal.fundCode}
          fundName={tc.fundDetailModal.fundName}
        />

        <AddToTableModal
          isOpen={tc.showAddToTableModal}
          onClose={() => tc.setShowAddToTableModal(false)}
          allCurrencies={tc.allCurrencies}
          borsaData={tc.borsaData}
          allFunds={tc.allFunds}
          allComparisonItems={tc.allComparisonItems}
          temporaryItems={tc.temporaryItems}
          onAddItem={(item) => tc.setTemporaryItems((prev) => [...prev, item])}
          onRemoveItem={(itemId) => tc.setTemporaryItems((prev) => prev.filter((t) => t.id !== itemId))}
        />
      </div>
    </div>
  );
};

export default TrackAndCompare;
