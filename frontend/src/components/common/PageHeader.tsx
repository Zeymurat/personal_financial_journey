import React from 'react';

/** Navy → gold → navy-light — mid gold stop daha belirgin */
const TITLE_GRADIENT =
  'bg-gradient-to-r from-[#0F2744] from-0% via-[#C4A574] via-45% to-[#163A5F] to-100% bg-clip-text text-transparent';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  disclaimer?: string;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Sayfa başlığı — İşlemler formatı + gold gradient.
 */
const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  disclaimer,
  actions,
  className = '',
}) => {
  return (
    <div className={`flex justify-between items-start gap-6 ${className}`}>
      <div className="space-y-2 min-w-0 flex-1">
        <h1
          className={`text-5xl font-black tracking-tight inline-block ${TITLE_GRADIENT}`}
          style={{ WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
        >
          {title}
        </h1>
        {subtitle ? (
          <p className="text-xl text-slate-600 dark:text-slate-400 font-medium">
            {subtitle}
          </p>
        ) : null}
        {disclaimer ? (
          <p className="text-sm text-slate-600 dark:text-slate-400 font-normal">
            {disclaimer}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex items-center space-x-4 shrink-0">{actions}</div>
      ) : null}
    </div>
  );
};

export default PageHeader;
export { TITLE_GRADIENT };
