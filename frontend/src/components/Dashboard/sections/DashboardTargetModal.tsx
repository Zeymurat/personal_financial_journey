import React from 'react';
import { useTranslation } from 'react-i18next';
import { ModalPortal } from '../../common/ModalPortal';

interface DashboardTargetModalProps {
  isOpen: boolean;
  targetModalType: 'monthly' | 'savings';
  targetInputValue: string;
  onChangeTargetInput: (value: string) => void;
  onClose: () => void;
  onSave: () => void | Promise<void>;
}

const DashboardTargetModal: React.FC<DashboardTargetModalProps> = ({
  isOpen,
  targetModalType,
  targetInputValue,
  onChangeTargetInput,
  onClose,
  onSave
}) => {
  const { t } = useTranslation('dashboard');
  const { t: tc } = useTranslation('common');

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] !mt-0 !mb-0"
        onClick={onClose}
      >
        <div
          className="bg-white dark:bg-slate-800 rounded-3xl p-8 w-full max-w-md mx-4 shadow-2xl border border-slate-200/50 dark:border-slate-700/50"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                {targetModalType === 'monthly' ? t('targetModal.titleMonthly') : t('targetModal.titleSavings')}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                {targetModalType === 'monthly' ? t('targetModal.descMonthly') : t('targetModal.descSavings')}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-2xl font-bold transition-colors"
            >
              ×
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                {t('targetModal.amountLabel')}
              </label>
              <input
                type="number"
                value={targetInputValue}
                onChange={(e) => onChangeTargetInput(e.target.value)}
                placeholder={t('targetModal.placeholder')}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 transition-all"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void onSave();
                }}
              />
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-xl font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
              >
                {tc('actions.cancel')}
              </button>
              <button
                type="button"
                onClick={() => void onSave()}
                className={`px-6 py-3 rounded-xl font-semibold text-white transition-all ${
                  targetModalType === 'monthly'
                    ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700'
                    : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700'
                } shadow-lg hover:shadow-xl`}
              >
                {tc('actions.save')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default DashboardTargetModal;
