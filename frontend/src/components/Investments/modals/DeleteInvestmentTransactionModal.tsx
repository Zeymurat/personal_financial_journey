import React from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ModalPortal } from '../../common/ModalPortal';
import { X, Trash2, AlertTriangle } from 'lucide-react';
import { InvestmentTransaction } from '../../../types';

interface DeleteInvestmentTransactionModalProps {
  transaction: InvestmentTransaction | null;
  investmentId: string;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (investmentId: string, transactionId: string) => Promise<void>;
}

const DeleteInvestmentTransactionModal: React.FC<DeleteInvestmentTransactionModalProps> = ({
  transaction,
  investmentId,
  isOpen,
  onClose,
  onDelete
}) => {
  const { t, i18n } = useTranslation('investments');
  const [isDeleting, setIsDeleting] = React.useState(false);

  if (!isOpen || !transaction) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(investmentId, transaction.id);
      toast.success(t('deleteTransactionModal.success'));
      onClose();
    } catch (error: any) {
      console.error('İşlem silme hatası:', error);
      const errorMessage = error?.message || error?.error || t('toast.unknownError');
      toast.error(t('deleteTransactionModal.error', { message: errorMessage }));
    } finally {
      setIsDeleting(false);
    }
  };

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
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{t('deleteTransactionModal.title')}</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1">{t('deleteTransactionModal.subtitle')}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-2xl font-bold"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-red-800 dark:text-red-200 mb-2">
                {t('deleteTransactionModal.warn1')}
              </p>
              <p className="text-xs text-red-700 dark:text-red-300">
                {t('deleteTransactionModal.warn2')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 mb-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">{t('deleteTransactionModal.typeLabel')}</span>
              <span className={`text-sm font-bold ${
                transaction.type === 'buy'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}>
                {transaction.type === 'buy' ? t('types.buyUpper') : t('types.sellUpper')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">{t('deleteTransactionModal.qtyLabel')}</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">{transaction.quantity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">{t('deleteTransactionModal.unitPriceLabel')}</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">₺{transaction.price.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">{t('deleteTransactionModal.totalLabel')}</span>
              <span className="text-sm font-black text-slate-900 dark:text-white">₺{transaction.totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">{t('deleteTransactionModal.dateLabel')}</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {new Date(transaction.date).toLocaleDateString(i18n.language)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-4 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 font-semibold"
            disabled={isDeleting}
          >
            {t('form.cancel')}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="flex-1 px-6 py-4 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-200 font-semibold flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isDeleting}
          >
            <Trash2 className="w-5 h-5" />
            <span>{isDeleting ? t('form.deleting') : t('deleteTransactionModal.delete')}</span>
          </button>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
};

export default DeleteInvestmentTransactionModal;
