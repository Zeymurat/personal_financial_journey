import React from 'react';
import { useTranslation } from 'react-i18next';
import { Event } from '../../../types';

export type DeleteDialogKind = 'single' | 'recurring';

export interface DeleteDialogData {
  event: Event;
  kind: DeleteDialogKind;
  total?: number;
}

interface DeleteEventDialogProps {
  dialog: DeleteDialogData | null;
  isDeletingSeries: boolean;
  deleteProgress: { total: number; deleted: number } | null;
  onCancel: () => void;
  onConfirmSingle: () => void;
  onConfirmRecurring: () => void;
}

const DeleteEventDialog: React.FC<DeleteEventDialogProps> = ({
  dialog,
  isDeletingSeries,
  deleteProgress,
  onCancel,
  onConfirmSingle,
  onConfirmRecurring
}) => {
  const { t } = useTranslation('agenda');
  const { t: tc } = useTranslation('common');

  if (!dialog) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
          {t('deleteDialog.title')}
        </h3>

        <p className="text-sm text-gray-600 dark:text-gray-300 mb-5">
          {dialog.kind === 'recurring'
            ? t('deleteDialog.bodyRecurring', { count: dialog.total ?? 0 })
            : t('deleteDialog.bodySingle')}
        </p>

        {deleteProgress && (
          <div className="mb-4 text-sm text-gray-700 dark:text-gray-200">
            {t('deleteDialog.deletingProgress', {
              deleted: deleteProgress.deleted,
              total: deleteProgress.total
            })}
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            disabled={isDeletingSeries}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {tc('actions.cancel')}
          </button>

          {dialog.kind === 'recurring' ? (
            <>
              <button
                onClick={onConfirmRecurring}
                disabled={isDeletingSeries}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {t('deleteDialog.deleteSeries')}
              </button>
              <button
                onClick={onConfirmSingle}
                disabled={isDeletingSeries}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {t('deleteDialog.deleteThisOnly')}
              </button>
            </>
          ) : (
            <button
              onClick={onConfirmSingle}
              disabled={isDeletingSeries}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {tc('actions.delete')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeleteEventDialog;
