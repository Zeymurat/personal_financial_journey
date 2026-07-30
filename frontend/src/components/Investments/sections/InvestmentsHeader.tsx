import React from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PageHeader from '../../common/PageHeader';

interface InvestmentsHeaderProps {
  onAddInvestment: () => void;
}

const InvestmentsHeader: React.FC<InvestmentsHeaderProps> = ({ onAddInvestment }) => {
  const { t } = useTranslation('investments');

  return (
    <PageHeader
      title={t('header.title')}
      subtitle={t('header.subtitle')}
      disclaimer={t('header.disclaimer')}
      actions={
        <button
          type="button"
          onClick={onAddInvestment}
          className="flex items-center space-x-2 bg-brand-gradient text-brand-champagne px-6 py-3 rounded-xl hover:shadow-gold ring-1 ring-gold/30 transition-all duration-200 font-semibold"
        >
          <Plus className="w-5 h-5" />
          <span>{t('header.addNew')}</span>
        </button>
      }
    />
  );
};

export default InvestmentsHeader;
