import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Trash2, RotateCcw, Edit2 } from 'lucide-react';
import { useTokenValidation } from '../../hooks/useTokenValidation';
import { Event } from '../../types';
import { eventsAPI } from '../../services/apiService';
import toast from 'react-hot-toast';
import EventModal, { EventDraft } from './modals/EventModal';
import DeleteEventDialog, { DeleteDialogData } from './modals/DeleteEventDialog';

const Agenda: React.FC = () => {
  useTokenValidation();
  const { t, i18n } = useTranslation('agenda');

  const monthNames = useMemo(
    () => t('calendar.months', { returnObjects: true }) as string[],
    [i18n.language, t]
  );
  const weekdayShort = useMemo(
    () => t('calendar.weekdaysShort', { returnObjects: true }) as string[],
    [i18n.language, t]
  );
  const weekdayLong = useMemo(
    () => t('calendar.weekdaysLong', { returnObjects: true }) as string[],
    [i18n.language, t]
  );

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isSavingSeries, setIsSavingSeries] = useState(false);
  const [seriesProgress, setSeriesProgress] = useState<{ total: number; created: number } | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogData | null>(null);
  const [isDeletingSeries, setIsDeletingSeries] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState<{ total: number; deleted: number } | null>(null);
  const [newEvent, setNewEvent] = useState<EventDraft>({
    title: '',
    description: '',
    date: '',
    time: '',
    isRecurring: false,
    recurrenceType: 'monthly',
    recurrenceDay: 1,
    recurrenceWeekday: 0
  });

  // Local time'a göre YYYY-MM-DD üretir.
  // toISOString() UTC'ye çevirdiği için TR saatinde 1 gün kaymaya sebep olabiliyor.
  const toLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 'YYYY-MM-DD' string'ini local midnight'e parse eder (UTC kaynaklı 1 gün kaymayı önler).
  const parseDateOnly = (value: string) => {
    const [y, m, d] = value.split('-').map((x) => Number(x));
    return new Date(y, (m || 1) - 1, d || 1);
  };

  const getDateString = (date: string | Date | { toDate: () => Date } | undefined): string | null => {
    if (!date) return null;
    if (typeof date === 'string') return date.split('T')[0];
    if (date instanceof Date) return toLocalDateString(date);
    if (typeof date === 'object' && 'toDate' in date) {
      return toLocalDateString(date.toDate());
    }
    return null;
  };

  const getRecurringSeriesEvents = (rootEvent: Event) => {
    if (!rootEvent.originalDate || !rootEvent.isRecurring || !rootEvent.recurrenceType) return [];
    const rootOriginalDate = getDateString(rootEvent.originalDate);
    if (!rootOriginalDate) return [];

    return events.filter((e) => {
      if (!e.isRecurring || !e.originalDate) return false;
      const eOriginal = getDateString(e.originalDate);
      return eOriginal === rootOriginalDate && e.recurrenceType === rootEvent.recurrenceType;
    });
  };

  // Bugün mü kontrolü
  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Seçili tarih mi kontrolü
  const isSelected = (date: Date | null) => {
    if (!date) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  // Farklı ay mı kontrolü
  const isDifferentMonth = (date: Date | null) => {
    if (!date) return false;
    return date.getMonth() !== currentDate.getMonth();
  };

  // Bugüne dön butonu gösterilmeli mi?
  const shouldShowBackToToday = () => {
    const today = new Date();
    const isSelectedToday = isToday(selectedDate);
    const isCurrentMonthToday =
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear();
    return !isSelectedToday || !isCurrentMonthToday;
  };

  // Takvim için günleri hesapla
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // Pazartesi = 0

    const days: (Date | null)[] = [];

    // Önceki ayın son günleri
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevDate = new Date(year, month, -i);
      days.unshift(prevDate);
    }

    // Bu ayın günleri
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    // Sonraki ayın ilk günleri (takvimi doldurmak için)
    const remainingDays = 42 - days.length; // 6 hafta x 7 gün = 42
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }

    return days;
  };

  const days = getDaysInMonth(currentDate);

  // Seçili tarihin etkinliklerini getir (tekrarlı etkinlikleri de dahil)
  const selectedDateEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    const isSameDate = (
      eventDate.getDate() === selectedDate.getDate() &&
      eventDate.getMonth() === selectedDate.getMonth() &&
      eventDate.getFullYear() === selectedDate.getFullYear()
    );
    // Not: recurrence expansion'ı burada yapmıyoruz.
    // Çünkü backend/frontend tarafında her tekrar için ayrı event dokümanı oluşturuluyor.
    // Bu yüzden "event.date" eşleşmesi tek kaynaktır; aksi halde aynı gün birden fazla event üst üste gelir.
    return isSameDate;
  });

  // Önceki aya geç
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  // Sonraki aya geç
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Bugüne git
  const goToToday = () => {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today);
  };

  // Tarih seç
  const handleDateSelect = (date: Date | null) => {
    if (date) {
      setSelectedDate(date);
      // Eğer farklı bir aydaysa, o aya geç
      if (date.getMonth() !== currentDate.getMonth() || date.getFullYear() !== currentDate.getFullYear()) {
        setCurrentDate(new Date(date.getFullYear(), date.getMonth(), 1));
      }
    }
  };

  // Etkinlikleri yükle
  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await eventsAPI.getAll();
      if (response?.success && response?.data) {
        setEvents(response.data);
      }
    } catch (error) {
      console.error('Etkinlikler yüklenirken hata:', error);
      toast.error(t('toast.loadError'));
    } finally {
      setLoading(false);
    }
  };

  // Etkinlik ekle
  const handleAddEvent = () => {
    const dateStr = toLocalDateString(selectedDate);
    setNewEvent({
      title: '',
      description: '',
      date: dateStr,
      time: '',
      isRecurring: false,
      recurrenceType: 'monthly',
      recurrenceDay: selectedDate.getDate(),
      recurrenceWeekday: selectedDate.getDay()
    });
    setEditingEvent(null);
    setShowEventModal(true);
  };

  const openEditEvent = (event: Event) => {
    const parsed = parseDateOnly(event.date);
    setEditingEvent(event);
    setNewEvent({
      title: event.title || '',
      description: event.description || '',
      date: event.date,
      time: event.time || '',
      isRecurring: !!event.isRecurring,
      recurrenceType: (event.recurrenceType || 'monthly') as any,
      recurrenceDay: event.recurrenceDay ?? parsed.getDate(),
      recurrenceWeekday: event.recurrenceWeekday ?? parsed.getDay()
    });
    setShowEventModal(true);
  };

  // Etkinlik kaydet
  const handleSaveEvent = async () => {
    if (!newEvent.title.trim()) {
      toast.error(t('toast.titleRequired'));
      return;
    }

    try {
      const parsed = parseDateOnly(newEvent.date);

      // (1) Düzenleme modunda: sadece bu event dokümanını güncelliyoruz.
      if (editingEvent) {
        const updated: any = {
          title: newEvent.title,
          description: newEvent.description || undefined,
          date: newEvent.date,
          time: newEvent.time || undefined,
          isRecurring: newEvent.isRecurring || false,
        };

        // Tekrarlıysa recurrence bilgilerini de güncelle
        if (newEvent.isRecurring) {
          updated.originalDate = editingEvent.originalDate || newEvent.date;
          updated.recurrenceType = newEvent.recurrenceType;
          if (newEvent.recurrenceType === 'monthly') {
            updated.recurrenceDay = parsed.getDate();
          } else if (newEvent.recurrenceType === 'weekly') {
            updated.recurrenceWeekday = parsed.getDay();
          }
        }

        await eventsAPI.update(editingEvent.id, updated);
        toast.success(t('toast.updateSuccess'));
        setShowEventModal(false);
        setEditingEvent(null);
        setSeriesProgress(null);
        setIsSavingSeries(false);
        setNewEvent({
          title: '',
          description: '',
          date: '',
          time: '',
          isRecurring: false,
          recurrenceType: 'monthly',
          recurrenceDay: 1,
          recurrenceWeekday: 0
        });
        await loadEvents();
        return;
      }

      // (2) Oluşturma modunda: event dokümanını oluşturuyoruz.
      const eventData: any = {
        title: newEvent.title,
        description: newEvent.description || undefined,
        date: newEvent.date,
        time: newEvent.time || undefined,
        isRecurring: newEvent.isRecurring || false,
        originalDate: newEvent.date
      };

      if (newEvent.isRecurring) {
        eventData.recurrenceType = newEvent.recurrenceType;
        if (newEvent.recurrenceType === 'monthly') {
          eventData.recurrenceDay = parsed.getDate();
        } else if (newEvent.recurrenceType === 'weekly') {
          eventData.recurrenceWeekday = parsed.getDay();
        }
      }

      await eventsAPI.create(eventData);

      // Tekrarlı etkinlik için gelecek etkinlikleri oluştur
      let createdRecurringCount = 0;
      let capped = false;
      if (newEvent.isRecurring) {
        const result = await createRecurringEvents(eventData);
        createdRecurringCount = result?.created ?? 0;
        capped = !!result?.capped;
      }

      const totalCreated = 1 + createdRecurringCount;
      toast.success(
        newEvent.isRecurring
          ? `${capped ? t('toast.seriesCapped') : ''}${t('toast.seriesCreated', { total: totalCreated })}`
          : t('toast.createSuccess')
      );

      setShowEventModal(false);
      setEditingEvent(null);
      setSeriesProgress(null);
      setIsSavingSeries(false);
      setNewEvent({
        title: '',
        description: '',
        date: '',
        time: '',
        isRecurring: false,
        recurrenceType: 'monthly',
        recurrenceDay: 1,
        recurrenceWeekday: 0
      });
      await loadEvents();
    } catch (error: any) {
      console.error('Etkinlik kaydedilirken hata:', error);
      toast.error(error.message || t('toast.saveError'));
      setIsSavingSeries(false);
      setSeriesProgress(null);
    }
  };

  // Tekrarlı etkinlikleri oluştur
  const createRecurringEvents = async (originalEvent: any) => {
    setIsSavingSeries(true);
    setSeriesProgress({ total: 0, created: 0 });

    const startDate = parseDateOnly(originalEvent.date);
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 2); // 2 yıl ileriye kadar oluştur

    const eventsToCreate: any[] = [];
    let currentDate = new Date(startDate);
    const startDateStr = toLocalDateString(startDate);

    while (currentDate <= endDate) {
      const currentDateStr = toLocalDateString(currentDate);
      if (currentDateStr !== startDateStr) {
        let shouldCreate = false;

        switch (originalEvent.recurrenceType) {
          case 'daily':
            shouldCreate = true;
            break;
          case 'weekly':
            shouldCreate = currentDate.getDay() === originalEvent.recurrenceWeekday;
            break;
          case 'monthly':
            shouldCreate = currentDate.getDate() === originalEvent.recurrenceDay;
            break;
          case 'yearly':
            shouldCreate =
              currentDate.getDate() === startDate.getDate() &&
              currentDate.getMonth() === startDate.getMonth();
            break;
        }

        if (shouldCreate) {
          eventsToCreate.push({
            ...originalEvent,
            // Local date üretimi ile 1 gün kaymayı engelliyoruz.
            date: toLocalDateString(currentDate),
            originalDate: originalEvent.date
          });
        }
      }

      // Sonraki güne geç
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Performans için üst sınır koyuyoruz:
    // - weekly/monthly/yearly için yeterli (seriyi erken kesmesin)
    // - daily'de çok fazla doküman oluşmasın
    const maxOccurrences = originalEvent.recurrenceType === 'daily' ? 180 : 400;
    const toCreate = eventsToCreate.slice(0, maxOccurrences);

    setSeriesProgress({ total: toCreate.length, created: 0 });

    let created = 0;
    for (const event of toCreate) {
      try {
        await eventsAPI.create(event);
        created += 1;
        setSeriesProgress((prev) => (prev ? { ...prev, created: created } : prev));
      } catch (error) {
        console.error('Tekrarlı etkinlik oluşturulurken hata:', error);
      }
    }

    setIsSavingSeries(false);
    return {
      attempted: toCreate.length,
      created,
      capped: eventsToCreate.length > toCreate.length
    };
  };

  // Etkinlik sil
  const handleDeleteEvent = (eventId: string) => {
    const event = events.find((e) => e.id === eventId);
    if (!event) return;
    const isRecurring = !!(event.isRecurring && event.originalDate);
    if (isRecurring) {
      const seriesEvents = getRecurringSeriesEvents(event);
      setDeleteDialog({ event, kind: 'recurring', total: seriesEvents.length });
    } else {
      setDeleteDialog({ event, kind: 'single' });
    }
  };

  // Tekrarlı etkinlik serisini sil
  const handleDeleteRecurringSeries = async (event: Event) => {
    if (!event.originalDate || !event.isRecurring) return;

    try {
      setIsDeletingSeries(true);
      const seriesEvents = getRecurringSeriesEvents(event);
      setDeleteProgress({ total: seriesEvents.length, deleted: 0 });

      let deleted = 0;
      // Promise.all yerine sırayla sil: UI donma hissini azaltır.
      for (let i = 0; i < seriesEvents.length; i++) {
        const e = seriesEvents[i];
        await eventsAPI.delete(e.id);
        deleted += 1;

        // Her iterasyonda state set etmeyelim (performans).
        if (i === seriesEvents.length - 1 || (i + 1) % 5 === 0) {
          setDeleteProgress({ total: seriesEvents.length, deleted });
        }
      }

      toast.success(t('toast.deletedMany', { count: seriesEvents.length }));
      await loadEvents();
    } catch (error: any) {
      console.error('Tekrarlı etkinlik serisi silinirken hata:', error);
      toast.error(error.message || t('toast.deleteManyError'));
    } finally {
      setIsDeletingSeries(false);
      setDeleteProgress(null);
    }
  };

  const confirmDeleteSingle = async (event: Event) => {
    try {
      setIsDeletingSeries(true);
      setDeleteProgress({ total: 1, deleted: 0 });
      await eventsAPI.delete(event.id);
      setDeleteProgress({ total: 1, deleted: 1 });
      toast.success(t('toast.deleteOneSuccess'));
      await loadEvents();
    } catch (error: any) {
      console.error('Etkinlik silinirken hata:', error);
      toast.error(error.message || t('toast.deleteOneError'));
    } finally {
      setIsDeletingSeries(false);
      setDeleteProgress(null);
      setDeleteDialog(null);
    }
  };

  const confirmDeleteRecurringSeries = async (event: Event) => {
    await handleDeleteRecurringSeries(event);
    setDeleteDialog(null);
  };

  // Tarih formatı (gün, ay yıl)
  const formatDate = (date: Date) => {
    return `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  };

  const formatDateTitle = (date: Date) => {
    return `${weekdayLong[date.getDay()]}`;
  };

  const recurrenceLabel = (type: string | undefined) => {
    switch (type) {
      case 'daily':
        return t('recurrence.daily');
      case 'weekly':
        return t('recurrence.weekly');
      case 'monthly':
        return t('recurrence.monthly');
      case 'yearly':
        return t('recurrence.yearly');
      default:
        return '';
    }
  };

  // Günlerde etkinlik var mı kontrolü
  const hasEventsOnDate = (date: Date | null) => {
    if (!date) return false;
    return events.some(event => {
      const eventDate = new Date(event.date);
      const isSameDate = (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
      // recurrence expansion burada da yok; noktayı/işareti sadece event.date ile belirliyoruz.
      return isSameDate;
    });
  };

  return (
    <div className="flex h-full bg-gray-50 dark:bg-gray-900">
      {/* Sol Panel - Takvim */}
      <div className="flex-1 bg-white dark:bg-gray-800 p-8 overflow-auto">
        <div className="flex flex-row justify-between">
        {/* Takvim Başlığı */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Bugüne Dön Butonu */}
        {shouldShowBackToToday() && (
          <div className="mb-4 flex justify-center">
            <button
              onClick={goToToday}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors font-medium"
            >
              <RotateCcw className="w-4 h-4" />
              {t('ui.backToToday')}
            </button>
          </div>
        )}
        </div>

        {/* Haftanın Günleri */}
        <div className="grid grid-cols-7 gap-1 justify-center mb-2">
          {weekdayShort.map((day, index) => (
            <div
              key={index}
              className="text-center text-sm font-medium text-gray-600 dark:text-gray-400 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Takvim Grid - Modern ve Büyük */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((date, index) => {
            if (!date) return <div key={index} className="aspect-square" />;

            const isTodayDate = isToday(date);
            const isSelectedDate = isSelected(date);
            const isDifferentMonthDate = isDifferentMonth(date);
            const hasEvents = hasEventsOnDate(date);

            return (
              <button
                key={index}
                onClick={() => handleDateSelect(date)}
                className={`
                  aspect-square flex flex-col items-center justify-center rounded-xl transition-all max-h-[115px]
                  ${isSelectedDate
                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-xl font-bold scale-105'
                    : isTodayDate
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold border-2 border-blue-400 dark:border-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/50 shadow-sm'
                    : isDifferentMonthDate
                    ? 'text-gray-300 dark:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-md'
                  }
                `}
              >
                <span className="text-base font-semibold">{date.getDate()}</span>
                {hasEvents && !isDifferentMonthDate && (
                  <span className={`w-1.5 h-1.5 rounded-full mt-1 ${isSelectedDate ? 'bg-white' : 'bg-blue-600 dark:bg-blue-400'}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sağ Panel - Etkinlikler */}
      <div className="w-96 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 p-6 flex flex-col relative overflow-hidden">
        {/* İçerik */}
        <div className="relative z-10 flex flex-col h-full">
          {/* Tarih Başlığı */}
          <div className="mb-4">
            <div className="text-3xl font-bold text-gray-800 dark:text-white mb-1">
              {formatDateTitle(selectedDate)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {formatDate(selectedDate)}
            </div>
          </div>

          {/* Etkinlikler Listesi */}
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                <p className="text-sm">{t('ui.loading')}</p>
              </div>
            ) : selectedDateEvents.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">{t('ui.noEvents')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedDateEvents.map((event) => (
                  <div
                    key={event.id}
                    className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700 relative group"
                  >
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      title={t('ui.deleteEventTitle')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openEditEvent(event)}
                      className="absolute top-2 right-9 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      title={t('ui.editEventTitle')}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-1 pr-6">
                      {event.title}
                    </h3>
                    {event.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        {event.description}
                      </p>
                    )}
                    {event.time && (
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        🕐 {event.time}
                      </p>
                    )}
                    {event.isRecurring && (
                      <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                        🔁 {recurrenceLabel(event.recurrenceType)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Etkinlik Ekle Butonu */}
          <button
            onClick={handleAddEvent}
            className="mt-4 w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      <EventModal
        isOpen={showEventModal}
        editingEvent={editingEvent}
        newEvent={newEvent}
        setNewEvent={setNewEvent}
        parseDateOnly={parseDateOnly}
        isSavingSeries={isSavingSeries}
        seriesProgress={seriesProgress}
        onClose={() => {
          if (isSavingSeries) return;
          setShowEventModal(false);
          setEditingEvent(null);
          setSeriesProgress(null);
          setIsSavingSeries(false);
          setNewEvent({
            title: '',
            description: '',
            date: '',
            time: '',
            isRecurring: false,
            recurrenceType: 'monthly',
            recurrenceDay: 1,
            recurrenceWeekday: 0
          });
        }}
        onSave={handleSaveEvent}
        onDeleteFromEdit={() => {
          if (!editingEvent) return;
          const targetId = editingEvent.id;
          setShowEventModal(false);
          setEditingEvent(null);
          setSeriesProgress(null);
          setIsSavingSeries(false);
          setNewEvent({
            title: '',
            description: '',
            date: '',
            time: '',
            isRecurring: false,
            recurrenceType: 'monthly',
            recurrenceDay: 1,
            recurrenceWeekday: 0
          });
          handleDeleteEvent(targetId);
        }}
      />

      <DeleteEventDialog
        dialog={deleteDialog}
        isDeletingSeries={isDeletingSeries}
        deleteProgress={deleteProgress}
        onCancel={() => setDeleteDialog(null)}
        onConfirmSingle={() => deleteDialog && confirmDeleteSingle(deleteDialog.event)}
        onConfirmRecurring={() =>
          deleteDialog && confirmDeleteRecurringSeries(deleteDialog.event)
        }
      />
    </div>
  );
};

export default Agenda;

