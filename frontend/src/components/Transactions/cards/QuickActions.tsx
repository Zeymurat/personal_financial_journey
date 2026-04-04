import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Plus, Edit2, Zap, Trash2, GripVertical, ChevronLeft, ChevronRight } from 'lucide-react';
import { transactionAPI, quickTransactionAPI } from '../../../services/apiService';
import { Transaction, QuickTransaction } from '../../../types';
import { getExchangeRates } from '../../../services/currencyService';
import { tcmbAPI } from '../../../services/apiService';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import QuickActionSetupModal from '../modals/QuickActionSetupModal';
import { getCurrencySymbol } from '../utils';

interface QuickActionsProps {
  onTransactionAdded: (transaction: Transaction) => void;
  categories?: {
    income: string[];
    expense: string[];
  };
}

const QuickActions: React.FC<QuickActionsProps> = ({ onTransactionAdded, categories: propCategories }) => {
  const { t } = useTranslation('transactions');
  const [quickActions, setQuickActions] = useState<QuickTransaction[]>([]);
  const [editingAction, setEditingAction] = useState<QuickTransaction | null>(null);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // API'den hızlı işlemleri yükle
  useEffect(() => {
    loadQuickActions();
  }, []);

  // Scroll pozisyonunu kontrol et ve indicator butonlarını güncelle
  const checkScrollPosition = () => {
    const container = scrollContainerRef.current;
    if (!container) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    const { scrollLeft, scrollWidth, clientWidth } = container;
    const maxScroll = scrollWidth - clientWidth;
    
    setCanScrollLeft(scrollLeft > 1);
    setCanScrollRight(scrollLeft < maxScroll - 1);
  };

  // Scroll pozisyonunu kontrol et (ilk yükleme ve scroll sırasında)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // İlk kontrol
    checkScrollPosition();

    // Scroll event listener
    container.addEventListener('scroll', checkScrollPosition);
    
    // Resize event listener (içerik değiştiğinde)
    const resizeObserver = new ResizeObserver(() => {
      checkScrollPosition();
    });
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', checkScrollPosition);
      resizeObserver.disconnect();
    };
  }, [quickActions, loading]);

  // Mouse wheel event listener - smooth scroll iyileştirmesi
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Smooth scrolling için: Daha akıcı scroll için multiplier
    const SCROLL_MULTIPLIER = 1.5; // Scroll hızını artır

    const handleWheel = (e: WheelEvent) => {
      const element = container;
      const scrollLeft = element.scrollLeft;
      const scrollWidth = element.scrollWidth;
      const clientWidth = element.clientWidth;
      
      // Eğer scroll gereksizse (içerik sığdırıyorsa), sayfa scroll'una izin ver
      if (scrollWidth <= clientWidth) {
        return;
      }
      
      const maxScroll = scrollWidth - clientWidth;
      const isAtStart = scrollLeft <= 1;
      const isAtEnd = scrollLeft >= maxScroll - 1;
      const deltaY = e.deltaY;
      
      // Eğer başta veya sondayız ve aynı yöne scroll yapıyorsak, sayfa scroll'una izin ver
      if ((isAtStart && deltaY < 0) || (isAtEnd && deltaY > 0)) {
        return;
      }
      
      // Aksi halde SADECE horizontal scroll yap, sayfa scroll'unu engelle
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      
      // Smooth scrolling için scrollBy kullan - daha akıcı
      element.scrollBy({
        left: deltaY * SCROLL_MULTIPLIER,
        behavior: 'smooth' // Smooth scroll için
      });
    };

    // Event listener ekle
    container.addEventListener('wheel', handleWheel, { 
      passive: false,
      capture: true
    });

    return () => {
      container.removeEventListener('wheel', handleWheel, true);
    };
  }, []);

  // Scroll butonları için fonksiyonlar
  const scrollLeft = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    container.scrollBy({
      left: -400, // Bir kart genişliği + gap kadar
      behavior: 'smooth'
    });
  };

  const scrollRight = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    container.scrollBy({
      left: 400, // Bir kart genişliği + gap kadar
      behavior: 'smooth'
    });
  };

  const loadQuickActions = async () => {
    try {
      setLoading(true);
      const data = await quickTransactionAPI.getAll();
      // Order'a göre sırala (order yoksa createdAt'e göre)
      const sorted = data.sort((a: QuickTransaction, b: QuickTransaction) => {
        const orderA = a.order !== undefined ? a.order : 999999;
        const orderB = b.order !== undefined ? b.order : 999999;
        return orderA - orderB;
      });
      setQuickActions(sorted);
    } catch (error) {
      console.error('Hızlı işlemler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  // Döviz kurlarını yükle ve TL karşılığını hesapla - TCMB API kullan
  const calculateAmountInTRY = async (amount: number, currency: string): Promise<number> => {
    if (currency === 'TRY') {
      return amount;
    }
    
    try {
      // Önce TCMB API'sinden dene
      try {
        const tcmbData = await tcmbAPI.getMain();
        if (tcmbData?.success && tcmbData?.data?.exchange_rates) {
          const rateData = tcmbData.data.exchange_rates[currency];
          const rate = rateData?.rate || rateData?.buy || 0;
          if (rate && rate > 0) {
            return amount * rate;
          }
        }
      } catch (tcmbError) {
        console.warn('TCMB API hatası, Firestore\'a fallback:', tcmbError);
      }
      
      // Fallback: Firestore
      const rates = await getExchangeRates('TRY');
      const rate = rates[currency]?.rate;
      if (!rate || rate === 0) {
        console.warn(`Döviz kuru bulunamadı: ${currency}, varsayılan değer kullanılıyor`);
        return amount;
      }
      // rate değeri "1 [currency] = rate TRY" formatında (örn: 1 USD = 30 TRY ise rate = 30)
      return amount * rate;
    } catch (error) {
      console.error('Döviz kuru hesaplanırken hata:', error);
      // Hata durumunda varsayılan kurlar
      const defaultRates: Record<string, number> = {
        'USD': 30,
        'EUR': 29,
        'GBP': 37,
        'JPY': 0.20,
        'CHF': 32,
        'AUD': 20,
        'CAD': 22,
        'CNY': 4.2
      };
      const defaultRate = defaultRates[currency] || 1;
      return amount * defaultRate;
    }
  };

  const handleQuickActionClick = async (action: QuickTransaction) => {
    try {
      const currency = action.currency || 'TRY';
      // O günkü kur ile TL karşılığını hesapla
      const amountInTRY = await calculateAmountInTRY(action.amount, currency);
      
      const transactionData = {
        type: action.type,
        amount: action.amount,
        category: action.category,
        description: action.description,
        date: new Date().toISOString().split('T')[0],
        currency: currency,
        amountInTRY: amountInTRY // O günkü kur ile hesaplanmış TL karşılığı
      };

      const result = await transactionAPI.create(transactionData);
      
      const newTransaction: Transaction = {
        id: result.id || Date.now().toString(),
        ...transactionData
      };

      onTransactionAdded(newTransaction);
      toast.success(t('toast.addSuccess'));
    } catch (error) {
      console.error('Hızlı işlem eklenirken hata:', error);
      toast.error(t('toast.addError'));
    }
  };


  const handleSaveQuickAction = async (formData: Omit<QuickTransaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingAction) {
        // Mevcut işlemi güncelle
        await quickTransactionAPI.update(editingAction.id, formData);
      } else {
        // Yeni işlem ekle
        await quickTransactionAPI.create(formData);
      }
      
      // Listeyi yeniden yükle
      await loadQuickActions();
      setShowSetupModal(false);
      setEditingAction(null);
      toast.success(t('toast.quickSaveSuccess'));
    } catch (error) {
      console.error('Hızlı işlem kaydedilirken hata:', error);
      toast.error(t('toast.quickSaveError'));
    }
  };

  const handleDeleteQuickAction = async (actionId: string) => {
    try {
      await quickTransactionAPI.delete(actionId);
      // Listeyi yeniden yükle
      await loadQuickActions();
      toast.success(t('toast.quickDeleteSuccess'));
    } catch (error) {
      console.error('Hızlı işlem silinirken hata:', error);
      toast.error(t('toast.quickDeleteError'));
    }
  };

  const handleAddNew = () => {
    setEditingAction(null);
    setShowSetupModal(true);
  };

  // Drag & Drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Drag end handler
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = quickActions.findIndex((action) => action.id === active.id);
      const newIndex = quickActions.findIndex((action) => action.id === over.id);

      const newOrder = arrayMove(quickActions, oldIndex, newIndex);
      setQuickActions(newOrder);

      // Backend'e yeni sırayı kaydet
      try {
        const updatePromises = newOrder.map((action, index) => 
          quickTransactionAPI.update(action.id, { order: index })
        );
        await Promise.all(updatePromises);
      } catch (error) {
        console.error('Sıralama kaydedilirken hata:', error);
        // Hata olursa listeyi yeniden yükle
        await loadQuickActions();
      }
    }
  };

  // Prop'tan gelen kategorileri kullan, yoksa varsayılan kategorileri kullan
  const categories = propCategories || {
    income: ['Maaş', 'Freelance', 'Yatırım', 'Bonus', 'Kira', 'Diğer'],
    expense: ['Kira', 'Market', 'Ulaşım', 'Eğlence', 'Sağlık', 'Eğitim', 'Teknoloji', 'Giyim', 'Yatırım', 'Diğer']
  };

  return (
    <>
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Hızlı İşlemler</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Sık kullandığınız işlemleri tek tıkla ekleyin</p>
            </div>
          </div>
        </div>

        <div className="relative -mx-6 px-6">
          {/* Gradient fade overlay - Sol (tıklanabilir, scroll yapar) */}
          {canScrollLeft && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                scrollLeft();
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onMouseUp={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white/95 dark:from-slate-800/95 via-white/80 dark:via-slate-800/80 to-transparent z-10 backdrop-blur-sm cursor-pointer hover:from-white dark:hover:from-slate-800 transition-all duration-200"
              aria-label={t('quickActions.scrollLeft')}
            />
          )}

          {/* Gradient fade overlay - Sağ (tıklanabilir, scroll yapar) */}
          {canScrollRight && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                scrollRight();
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onMouseUp={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white/95 dark:from-slate-800/95 via-white/80 dark:via-slate-800/80 to-transparent z-10 backdrop-blur-sm cursor-pointer hover:from-white dark:hover:from-slate-800 transition-all duration-200"
              aria-label={t('quickActions.scrollRight')}
            />
          )}

          {/* Sol scroll indicator (en üstte, tıklanabilir) */}
          {canScrollLeft && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                scrollLeft();
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onMouseUp={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-full shadow-xl border border-slate-200/50 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800 hover:shadow-2xl transition-all duration-200 hover:scale-110 active:scale-95"
              aria-label={t('quickActions.scrollLeft')}
            >
              <ChevronLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            </button>
          )}

          {/* Sağ scroll indicator (en üstte, tıklanabilir) */}
          {canScrollRight && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                scrollRight();
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onMouseUp={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-full shadow-xl border border-slate-200/50 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800 hover:shadow-2xl transition-all duration-200 hover:scale-110 active:scale-95"
              aria-label={t('quickActions.scrollRight')}
            >
              <ChevronRight className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            </button>
          )}

          <div 
            ref={scrollContainerRef}
            className="quick-actions-scroll relative z-0"
            style={{ 
              overflowX: 'auto',
              overflowY: 'hidden',
              scrollBehavior: 'smooth',
              marginLeft: '-0.5rem',
              marginRight: '-0.5rem',
              paddingLeft: '3rem',
              paddingRight: '3rem'
            }}
          >
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <span className="text-slate-500 dark:text-slate-400">{t('quickActions.loading')}</span>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={quickActions.map(action => action.id)}
                strategy={horizontalListSortingStrategy}
              >
                <div className="flex space-x-4 min-w-max pb-4">
                  {quickActions.map((action) => (
                    <SortableQuickActionItem
                      key={action.id}
                      action={action}
                      onClick={() => handleQuickActionClick(action)}
                      onEdit={() => {
                        setEditingAction(action);
                        setShowSetupModal(true);
                      }}
                      onDelete={() => {
                        if (window.confirm(t('quickActions.confirmDelete'))) {
                          handleDeleteQuickAction(action.id);
                        }
                      }}
                    />
                  ))}
                  
                  {/* Yeni Ekle Butonu */}
                  <div className="flex-shrink-0 w-[200px]">
                    <button
                      onClick={handleAddNew}
                      className="w-full h-full p-5 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 flex flex-col items-center justify-center space-y-2"
                    >
                      <Plus className="w-7 h-7 text-slate-400" />
                      <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{t('quickActions.newAdd')}</span>
                    </button>
                  </div>
                </div>
              </SortableContext>
            </DndContext>
          )}
          </div>
        </div>
      </div>

      {showSetupModal && (
        <QuickActionSetupModal
          isOpen={showSetupModal}
          action={editingAction}
          onClose={() => {
            setShowSetupModal(false);
            setEditingAction(null);
          }}
          onSave={handleSaveQuickAction}
          categories={categories}
        />
      )}
    </>
  );
};

// Sortable Item Component
interface SortableQuickActionItemProps {
  action: QuickTransaction;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const SortableQuickActionItem: React.FC<SortableQuickActionItemProps> = ({
  action,
  onClick,
  onEdit,
  onDelete
}) => {
  const { t } = useTranslation('transactions');
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: action.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative flex-shrink-0 w-[200px]"
    >
      <div className="group">
        <button
          onClick={onClick}
          className={`w-full p-5 rounded-xl border-2 transition-all duration-200 ${
            action.type === 'income'
              ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
              : 'border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/30'
          }`}
        >
          <div className="text-center">
            <p className={`text-sm font-bold mb-2 ${
              action.type === 'income' ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
            }`}>
              {action.name}
            </p>
            <p className={`text-xl font-black mb-2 ${
              action.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {getCurrencySymbol(action.currency || 'TRY')}
              {action.amount.toLocaleString('tr-TR', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
              })}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
              {action.category}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
              {action.description ? (
                <span className="ml-1">{action.description}</span>
              ) : (
                <span className="ml-1">-</span>
              )}
            </p>
          </div>
        </button>
        
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 bg-white dark:bg-slate-700 rounded-lg shadow-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 cursor-grab active:cursor-grabbing"
          title={t('quickActions.dragTitle')}
        >
          <GripVertical className="w-4 h-4 text-slate-500 dark:text-slate-400" />
        </button>

        {/* Edit & Delete Buttons */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
          <div className="flex flex-col space-y-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-lg border-2 border-slate-300 dark:border-slate-600 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-xl transition-all duration-200"
              title={t('quickActions.editTitle')}
            >
              <Edit2 className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-lg border-2 border-slate-300 dark:border-slate-600 hover:bg-red-100 dark:hover:bg-red-900/40 hover:border-red-500 dark:hover:border-red-500 hover:shadow-xl transition-all duration-200"
              title={t('quickActions.deleteTitle')}
            >
              <Trash2 className="w-3 h-3 text-red-600 dark:text-red-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;

