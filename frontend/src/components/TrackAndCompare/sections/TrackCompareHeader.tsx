import React from 'react';
import { useTranslation } from 'react-i18next';
import PageHeader from '../../common/PageHeader';

const TrackCompareHeader: React.FC = () => {
  const { t } = useTranslation('trackCompare');

  return (
    <PageHeader
      title={t('header.title')}
      subtitle={t('header.subtitle')}
      disclaimer={t('header.disclaimer')}
    />
  );
};

export default TrackCompareHeader;
