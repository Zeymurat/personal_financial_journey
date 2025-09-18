// src/components/Transactions/AddTransactionForm.tsx
import React, { useState } from 'react';
import { transactionService } from '../../services/firestoreService';

const CATEGORIES = [
  'Market',
  'Fatura',
  'Kira',
  'Ulaşım',
  'Eğlence',
  'Giyim',
  'Sağlık',
  'Diğer'
];

const AddTransactionForm: React.FC = () => {
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    category: '',
    description: '',
    currency: 'TRY'
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await transactionService.add({
        ...formData,
        amount: parseFloat(formData.amount),
        date: new Date().toISOString()
      });
      
      // Formu temizle
      setFormData({
        type: 'expense',
        amount: '',
        category: '',
        description: '',
        currency: 'TRY'
      });
    } catch (err) {
      setError('İşlem eklenirken bir hata oluştu');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-white">
      <h3 className="text-lg font-semibold">Yeni İşlem Ekle</h3>
      
      {error && (
        <div className="p-2 bg-red-100 text-red-700 text-sm rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tür</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="income">Gelir</option>
            <option value="expense">Gider</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tutar ({formData.currency})
          </label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            step="0.01"
            min="0"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        >
          <option value="">Kategori seçin</option>
          {CATEGORIES.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
        <input
          type="text"
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="İşlem açıklaması"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
      >
        {submitting ? 'Ekleniyor...' : 'İşlem Ekle'}
      </button>
    </form>
  );
};

export default AddTransactionForm;