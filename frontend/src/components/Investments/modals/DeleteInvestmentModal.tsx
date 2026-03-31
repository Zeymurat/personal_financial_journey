import React from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, TrendingUp } from 'lucide-react';
import { ModalPortal } from '../../common/ModalPortal';
import { Investment } from '../../../types';

interface DeleteInvestmentModalProps {
  investment: Investment | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteInvestmentModal: React.FC<DeleteInvestmentModalProps> = ({
  investment,
  isOpen,
  onClose,
  onConfirm
}) => {
  const { t } = useTranslation('investments');

  if (!isOpen || !investment) return null;

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
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{t('deleteInvestmentModal.title')}</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1">{t('deleteInvestmentModal.subtitle')}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl px-6 py-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-lg font-black text-slate-900 dark:text-white">
                  {investment.symbol}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {investment.name}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {t('deleteInvestmentModal.summary', {
                    qty: investment.quantity,
                    avg: investment.averagePrice.toLocaleString()
                  })}
                </p>
                <p className="text-xl font-black mt-2 text-blue-600 dark:text-blue-400">
                  ₺{investment.totalValue.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-700/30 rounded-xl p-4">
            <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">
              {t('deleteInvestmentModal.warning')}
            </p>
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 font-semibold"
            >
              {t('form.cancel')}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-rose-600 to-red-600 text-white rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-200 font-semibold flex items-center justify-center space-x-2"
            >
              <Trash2 className="w-5 h-5" />
              <span>{t('deleteInvestmentModal.delete')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
};

export default DeleteInvestmentModal;
