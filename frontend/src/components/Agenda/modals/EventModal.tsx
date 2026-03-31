import React from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';
import { Event } from '../../../types';

export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface EventDraft {
  title: string;
  description: string;
  date: string;
  time: string;
  isRecurring: boolean;
  recurrenceType: RecurrenceType;
  recurrenceDay: number;
  recurrenceWeekday: number;
}

interface EventModalProps {
  isOpen: boolean;
  editingEvent: Event | null;
  newEvent: EventDraft;
  setNewEvent: React.Dispatch<React.SetStateAction<EventDraft>>;
  parseDateOnly: (value: string) => Date;
  isSavingSeries: boolean;
  seriesProgress: { total: number; created: number } | null;
  onClose: () => void;
  onSave: () => void;
  onDeleteFromEdit: () => void;
}

const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  editingEvent,
  newEvent,
  setNewEvent,
  parseDateOnly,
  isSavingSeries,
  seriesProgress,
  onClose,
  onSave,
  onDeleteFromEdit
}) => {
  const { t } = useTranslation('agenda');
  const { t: tc } = useTranslation('common');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          {editingEvent ? t('modal.editTitle') : t('modal.newTitle')}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('modal.titleLabel')}
            </label>
            <input
              type="text"
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              placeholder={t('modal.titlePlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('modal.descriptionLabel')}
            </label>
            <textarea
              value={newEvent.description}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              rows={3}
              placeholder={t('modal.descriptionPlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('modal.dateLabel')}
            </label>
            <input
              type="date"
              value={newEvent.date}
              onChange={(e) => {
                const date = parseDateOnly(e.target.value);
                setNewEvent({
                  ...newEvent,
                  date: e.target.value,
                  recurrenceDay: date.getDate(),
                  recurrenceWeekday: date.getDay()
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Saat (isteğe bağlı)
            </label>
            <input
              type="time"
              value={newEvent.time}
              onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isRecurring"
              checked={newEvent.isRecurring}
              onChange={(e) => setNewEvent({ ...newEvent, isRecurring: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <label htmlFor="isRecurring" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('modal.recurringCheckbox')}
            </label>
          </div>

          {newEvent.isRecurring && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('modal.recurrenceTypeLabel')}
              </label>
              <select
                value={newEvent.recurrenceType}
                onChange={(e) => setNewEvent({ ...newEvent, recurrenceType: e.target.value as RecurrenceType })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              >
                <option value="daily">{t('modal.optDaily')}</option>
                <option value="weekly">{t('modal.optWeekly')}</option>
                <option value="monthly">{t('modal.optMonthly', { day: newEvent.recurrenceDay })}</option>
                <option value="yearly">{t('modal.optYearly')}</option>
              </select>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          {isSavingSeries && seriesProgress && (
            <div className="flex-1 text-sm text-gray-600 dark:text-gray-300 mr-3">
              {t('modal.creatingProgress', {
                created: seriesProgress.created,
                total: seriesProgress.total
              })}
            </div>
          )}

          {editingEvent && (
            <button
              onClick={onDeleteFromEdit}
              disabled={isSavingSeries}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              title={t('modal.deleteFromEditTitle')}
            >
              <Trash2 className="w-4 h-4" />
              {tc('actions.delete')}
            </button>
          )}

          <button
            onClick={onClose}
            disabled={isSavingSeries}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {tc('actions.cancel')}
          </button>

          <button
            onClick={onSave}
            disabled={isSavingSeries}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSavingSeries ? t('modal.saving') : editingEvent ? t('modal.update') : t('modal.save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventModal;
