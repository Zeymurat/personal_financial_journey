import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Zap, Trash2, GripVertical } from 'lucide-react';
import { transactionAPI, quickTransactionAPI } from '../../services/apiService';
import { Transaction, QuickTransaction } from '../../types';
import { getExchangeRates } from '../../services/currencyService';
import { altinkaynakAPI } from '../../services/apiService';
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

const CURRENCIES = [
  { code: 'TRY', name: 'TRY (₺)' },
  { code: 'USD', name: 'USD ($)' },
  { code: 'EUR', name: 'EUR (€)' },
  { code: 'GBP', name: 'GBP (£)' },
  { code: 'JPY', name: 'JPY (¥)' },
  { code: 'CHF', name: 'CHF' },
  { code: 'AUD', name: 'AUD' },
  { code: 'CAD', name: 'CAD' },
  { code: 'CNY', name: 'CNY' }
];

const getCurrencySymbol = (currency: string): string => {
  const symbols: Record<string, string> = {
    'TRY': '₺',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'CHF': 'CHF ',
    'AUD': 'A$',
    'CAD': 'C$',
    'CNY': '¥'
  };
  return symbols[currency] || currency;
};

interface QuickActionsProps {
  onTransactionAdded: (transaction: Transaction) => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onTransactionAdded }) => {
  const [quickActions, setQuickActions] = useState<QuickTransaction[]>([]);
  const [editingAction, setEditingAction] = useState<QuickTransaction | null>(null);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // API'den hızlı işlemleri yükle
  useEffect(() => {
    loadQuickActions();
  }, []);

  // Mouse wheel event listener - native event ile daha iyi kontrol
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Smooth scrolling için: Hızlı scroll'u yumuşatmak için multiplier
    const SCROLL_MULTIPLIER = 1.2; // Scroll hızını biraz artır

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
      // (Başta yukarı scroll veya sonda aşağı scroll)
      if ((isAtStart && deltaY < 0) || (isAtEnd && deltaY > 0)) {
        // Horizontal scroll yapma, sayfa scroll'una izin ver
        return;
      }
      
      // Aksi halde SADECE horizontal scroll yap, sayfa scroll'unu engelle
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      
      // Smooth scrolling için scrollBy kullan - sayfa scroll'u gibi akıcı
      // Multiplier ile daha akıcı hale getir
      element.scrollBy({
        left: deltaY * SCROLL_MULTIPLIER,
        behavior: 'auto' // 'auto' = instant ama smooth scrolling için ideal
      });
    };

    // Event listener ekle (passive: false ile preventDefault çalışabilir)
    // Capture phase'de ekleyerek diğer listener'lardan önce yakalayalım
    container.addEventListener('wheel', handleWheel, { 
      passive: false,
      capture: true
    });

    return () => {
      container.removeEventListener('wheel', handleWheel, true);
    };
  }, []);

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

  // Döviz kurlarını yükle ve TL karşılığını hesapla - Altınkaynak API kullan
  const calculateAmountInTRY = async (amount: number, currency: string): Promise<number> => {
    if (currency === 'TRY') {
      return amount;
    }
    
    try {
      // Önce Altınkaynak API'sinden dene
      try {
        const altinkaynakData = await altinkaynakAPI.getMain();
        if (altinkaynakData?.success && altinkaynakData?.data?.exchange_rates) {
          const rateData = altinkaynakData.data.exchange_rates[currency];
          const rate = rateData?.rate || rateData?.buy || 0;
          if (rate && rate > 0) {
            return amount * rate;
          }
        }
      } catch (altinkaynakError) {
        console.warn('Altınkaynak API hatası, Firestore\'a fallback:', altinkaynakError);
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
    } catch (error) {
      console.error('Hızlı işlem eklenirken hata:', error);
      alert('İşlem eklenirken bir hata oluştu. Lütfen tekrar deneyin.');
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
    } catch (error) {
      console.error('Hızlı işlem kaydedilirken hata:', error);
      alert('Hızlı işlem kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const handleDeleteQuickAction = async (actionId: string) => {
    try {
      await quickTransactionAPI.delete(actionId);
      // Listeyi yeniden yükle
      await loadQuickActions();
    } catch (error) {
      console.error('Hızlı işlem silinirken hata:', error);
      alert('Hızlı işlem silinirken bir hata oluştu. Lütfen tekrar deneyin.');
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

  const categories = {
    income: ['Maaş', 'Freelance', 'Yatırım', 'Bonus', 'Kira Geliri', 'Diğer Gelir'],
    expense: ['Kira', 'Market', 'Ulaşım', 'Eğlence', 'Sağlık', 'Eğitim', 'Teknoloji', 'Giyim', 'Diğer Gider']
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

        <div 
          ref={scrollContainerRef}
          className="quick-actions-scroll"
          style={{ 
            overflowX: 'auto',
            overflowY: 'hidden',
            scrollBehavior: 'smooth',
            marginLeft: '-0.5rem',
            marginRight: '-0.5rem',
            paddingLeft: '0.5rem',
            paddingRight: '0.5rem'
          }}
        >
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <span className="text-slate-500 dark:text-slate-400">Yükleniyor...</span>
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
                        if (window.confirm('Bu hızlı işlemi silmek istediğinize emin misiniz?')) {
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
                      <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Yeni Ekle</span>
                    </button>
                  </div>
                </div>
              </SortableContext>
            </DndContext>
          )}
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
              {getCurrencySymbol(action.currency || 'TRY')}{action.amount.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
              {action.category}
              {action.description && (
                <span className="ml-1">({action.description})</span>
              )}
            </p>
          </div>
        </button>
        
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 bg-white dark:bg-slate-700 rounded-lg shadow-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 cursor-grab active:cursor-grabbing"
          title="Sürükleyerek sırala"
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
              title="Düzenle"
            >
              <Edit2 className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-lg border-2 border-slate-300 dark:border-slate-600 hover:bg-red-100 dark:hover:bg-red-900/40 hover:border-red-500 dark:hover:border-red-500 hover:shadow-xl transition-all duration-200"
              title="Sil"
            >
              <Trash2 className="w-3 h-3 text-red-600 dark:text-red-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface QuickActionSetupModalProps {
  isOpen: boolean;
  action: QuickTransaction | null;
  onClose: () => void;
  onSave: (data: Omit<QuickTransaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  categories: {
    income: string[];
    expense: string[];
  };
}

const QuickActionSetupModal: React.FC<QuickActionSetupModalProps> = ({
  isOpen,
  action,
  onClose,
  onSave,
  categories
}) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense' as 'income' | 'expense',
    amount: '',
    category: '',
    description: '',
    currency: 'TRY'
  });

  useEffect(() => {
    if (action) {
      setFormData({
        name: action.name,
        type: action.type,
        amount: action.amount.toString(),
        category: action.category,
        description: action.description,
        currency: action.currency || 'TRY'
      });
    } else {
      setFormData({
        name: '',
        type: 'expense',
        amount: '',
        category: '',
        description: '',
        currency: 'TRY'
      });
    }
  }, [action]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.amount || !formData.category || !formData.description) {
      alert('Lütfen tüm alanları doldurun.');
      return;
    }
    onSave({
      name: formData.name,
      type: formData.type,
      amount: parseFloat(formData.amount),
      category: formData.category,
      description: formData.description,
      currency: formData.currency
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 !mt-0 !mb-0"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-3xl p-8 w-full max-w-md mx-4 shadow-2xl border border-slate-200/50 dark:border-slate-700/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              {action ? 'Hızlı İşlem Düzenle' : 'Hızlı İşlem Oluştur'}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Sık kullandığınız işlemi kaydedin
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Hızlı İşlem Adı
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
              placeholder="Örn: Kira Ödemesi"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Açıklama (Tabloda işlem sütununda görünecektir.)
            </label>
            <input
              type="text"
              value={formData.description ?? ''}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
              placeholder="İşlem açıklaması"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              İşlem Türü
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value as 'income' | 'expense', category: ''})}
              className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
              required
            >
              <option value="income">Gelir</option>
              <option value="expense">Gider</option>
            </select>
          </div>

          <div className="grid grid-cols-[2fr_1.3fr] gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Miktar
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Döviz
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({...formData, currency: e.target.value})}
                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                required
              >
                {CURRENCIES.map(currency => (
                  <option key={currency.code} value={currency.code}>{currency.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Kategori
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
              required
            >
              <option value="">Kategori Seçin</option>
              {categories[formData.type].map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 font-semibold"
            >
              İptal
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-200 font-semibold"
            >
              {action ? 'Güncelle' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickActions;

