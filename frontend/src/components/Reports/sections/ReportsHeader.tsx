import React from 'react';
import { useTranslation } from 'react-i18next';
import PageHeader from '../../common/PageHeader';

const ReportsHeader: React.FC = () => {
  const { t } = useTranslation('reports');
  return (
    <div className="mb-6">
      <PageHeader
        title={t('header.title')}
        subtitle={t('header.subtitle')}
        disclaimer={t('header.disclaimer')}
      />
    </div>
  );
};

export default ReportsHeader;
