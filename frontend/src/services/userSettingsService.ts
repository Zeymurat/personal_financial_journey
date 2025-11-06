import { 
  doc, 
  setDoc, 
  collection, 
  getDocs, 
  deleteDoc, 
  writeBatch,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Kullanıcı seçili döviz kurlarını yöneten servis
 * users/{userId}/selectedCurrency collection'ında saklar
 */

export interface SelectedCurrency {
  code: string;
  order: number;
}

/**
 * Kullanıcının seçili döviz kurlarını getir (sıralı)
 */
export const getSelectedCurrencies = async (userId: string): Promise<SelectedCurrency[]> => {
  try {
    const selectedCurrencyRef = collection(db, 'users', userId, 'selectedCurrency');
    const q = query(selectedCurrencyRef, orderBy('order', 'asc'));
    const querySnapshot = await getDocs(q);

    const selectedCurrencies: SelectedCurrency[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      selectedCurrencies.push({
        code: data.code || doc.id,
        order: data.order || 0
      });
    });

    console.log('✅ Seçili döviz kurları yüklendi:', selectedCurrencies);
    return selectedCurrencies;
  } catch (error) {
    console.error('❌ Seçili döviz kurları yüklenirken hata:', error);
    return [];
  }
};

/**
 * Kullanıcının seçili döviz kurlarını kaydet (sıralama ile birlikte)
 * Tüm collection'ı siler ve yeniden oluşturur
 */
export const saveSelectedCurrencies = async (
  userId: string, 
  currencies: SelectedCurrency[]
): Promise<void> => {
  try {
    const selectedCurrencyRef = collection(db, 'users', userId, 'selectedCurrency');
    
    // Önce mevcut tüm document'leri sil
    const existingDocs = await getDocs(selectedCurrencyRef);
    const batch = writeBatch(db);
    
    existingDocs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Yeni document'leri ekle
    currencies.forEach((currency) => {
      const currencyDocRef = doc(selectedCurrencyRef, currency.code);
      batch.set(currencyDocRef, {
        code: currency.code,
        order: currency.order
      });
    });

    await batch.commit();
    console.log('✅ Seçili döviz kurları kaydedildi:', currencies);
  } catch (error) {
    console.error('❌ Seçili döviz kurları kaydedilirken hata:', error);
    throw error;
  }
};

/**
 * Bir döviz kurunu seçili listeye ekle
 */
export const addSelectedCurrency = async (
  userId: string,
  currencyCode: string,
  order?: number
): Promise<void> => {
  try {
    const selectedCurrencyRef = collection(db, 'users', userId, 'selectedCurrency');
    
    // Eğer order verilmemişse, en yüksek order + 1
    if (order === undefined) {
      const existingDocs = await getDocs(selectedCurrencyRef);
      let maxOrder = -1;
      existingDocs.forEach((doc) => {
        const data = doc.data();
        maxOrder = Math.max(maxOrder, data.order || 0);
      });
      order = maxOrder + 1;
    }

    const currencyDocRef = doc(selectedCurrencyRef, currencyCode);
    await setDoc(currencyDocRef, {
      code: currencyCode,
      order: order
    });

    console.log('✅ Döviz kuru seçili listeye eklendi:', currencyCode);
  } catch (error) {
    console.error('❌ Döviz kuru eklenirken hata:', error);
    throw error;
  }
};

/**
 * Bir döviz kurunu seçili listeden çıkar
 */
export const removeSelectedCurrency = async (
  userId: string,
  currencyCode: string
): Promise<void> => {
  try {
    const currencyDocRef = doc(db, 'users', userId, 'selectedCurrency', currencyCode);
    await deleteDoc(currencyDocRef);
    console.log('✅ Döviz kuru seçili listeden çıkarıldı:', currencyCode);
  } catch (error) {
    console.error('❌ Döviz kuru çıkarılırken hata:', error);
    throw error;
  }
};

/**
 * Döviz kurlarının sıralamasını güncelle
 */
export const updateCurrencyOrder = async (
  userId: string,
  currencyOrders: Array<{ code: string; order: number }>
): Promise<void> => {
  try {
    const batch = writeBatch(db);

    currencyOrders.forEach(({ code, order }) => {
      const currencyDocRef = doc(db, 'users', userId, 'selectedCurrency', code);
      batch.update(currencyDocRef, { order });
    });

    await batch.commit();
    console.log('✅ Döviz kurları sıralaması güncellendi');
  } catch (error) {
    console.error('❌ Döviz kurları sıralaması güncellenirken hata:', error);
    throw error;
  }
};

/**
 * Kullanıcı seçili hisse senetlerini yöneten servis
 * users/{userId}/selectedHisse collection'ında saklar
 */

export interface SelectedHisse {
  code: string;
  order: number;
}

/**
 * Kullanıcının seçili hisse senetlerini getir (sıralı)
 */
export const getSelectedHisse = async (userId: string): Promise<SelectedHisse[]> => {
  try {
    const selectedHisseRef = collection(db, 'users', userId, 'selectedHisse');
    const q = query(selectedHisseRef, orderBy('order', 'asc'));
    const querySnapshot = await getDocs(q);

    const selectedHisse: SelectedHisse[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      selectedHisse.push({
        code: data.code || doc.id,
        order: data.order || 0
      });
    });

    console.log('✅ Seçili hisse senetleri yüklendi:', selectedHisse);
    return selectedHisse;
  } catch (error) {
    console.error('❌ Seçili hisse senetleri yüklenirken hata:', error);
    return [];
  }
};

/**
 * Kullanıcının seçili hisse senetlerini kaydet (sıralama ile birlikte)
 * Tüm collection'ı siler ve yeniden oluşturur
 */
export const saveSelectedHisse = async (
  userId: string, 
  hisse: SelectedHisse[]
): Promise<void> => {
  try {
    const selectedHisseRef = collection(db, 'users', userId, 'selectedHisse');
    
    // Önce mevcut tüm document'leri sil
    const existingDocs = await getDocs(selectedHisseRef);
    const batch = writeBatch(db);
    
    existingDocs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Yeni document'leri ekle
    hisse.forEach((hisseItem) => {
      const hisseDocRef = doc(selectedHisseRef, hisseItem.code);
      batch.set(hisseDocRef, {
        code: hisseItem.code,
        order: hisseItem.order
      });
    });

    await batch.commit();
    console.log('✅ Seçili hisse senetleri kaydedildi:', hisse);
  } catch (error) {
    console.error('❌ Seçili hisse senetleri kaydedilirken hata:', error);
    throw error;
  }
};

/**
 * Bir hisse senedini seçili listeye ekle
 */
export const addSelectedHisse = async (
  userId: string,
  hisseCode: string,
  order?: number
): Promise<void> => {
  try {
    const selectedHisseRef = collection(db, 'users', userId, 'selectedHisse');
    
    // Eğer order verilmemişse, en yüksek order + 1
    if (order === undefined) {
      const existingDocs = await getDocs(selectedHisseRef);
      let maxOrder = -1;
      existingDocs.forEach((doc) => {
        const data = doc.data();
        maxOrder = Math.max(maxOrder, data.order || 0);
      });
      order = maxOrder + 1;
    }

    const hisseDocRef = doc(selectedHisseRef, hisseCode);
    await setDoc(hisseDocRef, {
      code: hisseCode,
      order: order
    });

    console.log('✅ Hisse senedi seçili listeye eklendi:', hisseCode);
  } catch (error) {
    console.error('❌ Hisse senedi eklenirken hata:', error);
    throw error;
  }
};

/**
 * Bir hisse senedini seçili listeden çıkar
 */
export const removeSelectedHisse = async (
  userId: string,
  hisseCode: string
): Promise<void> => {
  try {
    const hisseDocRef = doc(db, 'users', userId, 'selectedHisse', hisseCode);
    await deleteDoc(hisseDocRef);
    console.log('✅ Hisse senedi seçili listeden çıkarıldı:', hisseCode);
  } catch (error) {
    console.error('❌ Hisse senedi çıkarılırken hata:', error);
    throw error;
  }
};

/**
 * Kullanıcı hızlı çevirimlerini yöneten servis
 * users/{userId}/quickConvert/{conversionId} collection'ında saklar
 */

export interface QuickConvert {
  from: string;
  to: string;
  amount: number;
  order: number;
}

/**
 * Kullanıcının hızlı çevirimlerini getir (sıralı)
 */
export const getQuickConverts = async (userId: string): Promise<QuickConvert[]> => {
  try {
    const quickConvertRef = collection(db, 'users', userId, 'quickConvert');
    const q = query(quickConvertRef, orderBy('order', 'asc'));
    const querySnapshot = await getDocs(q);

    const quickConverts: QuickConvert[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      quickConverts.push({
        from: data.from || '',
        to: data.to || '',
        amount: data.amount || 100,
        order: data.order || 0
      });
    });

    console.log('✅ Hızlı çevirimler yüklendi:', quickConverts);
    return quickConverts;
  } catch (error) {
    console.error('❌ Hızlı çevirimler yüklenirken hata:', error);
    return [];
  }
};

/**
 * Kullanıcının hızlı çevirimlerini kaydet (sıralama ile birlikte)
 */
export const saveQuickConverts = async (
  userId: string, 
  quickConverts: QuickConvert[]
): Promise<void> => {
  try {
    const quickConvertRef = collection(db, 'users', userId, 'quickConvert');
    
    // Önce mevcut tüm document'leri sil
    const existingDocs = await getDocs(quickConvertRef);
    const batch = writeBatch(db);
    
    existingDocs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Yeni document'leri ekle
    quickConverts.forEach((convert, index) => {
      const convertId = `${convert.from}_${convert.to}_${convert.amount}`;
      const convertDocRef = doc(quickConvertRef, convertId);
      batch.set(convertDocRef, {
        from: convert.from,
        to: convert.to,
        amount: convert.amount,
        order: convert.order !== undefined ? convert.order : index
      });
    });

    await batch.commit();
    console.log('✅ Hızlı çevirimler kaydedildi:', quickConverts);
  } catch (error) {
    console.error('❌ Hızlı çevirimler kaydedilirken hata:', error);
    throw error;
  }
};

/**
 * Bir hızlı çevirim ekle
 */
export const addQuickConvert = async (
  userId: string,
  from: string,
  to: string,
  amount: number,
  order?: number
): Promise<void> => {
  try {
    const convertId = `${from}_${to}_${amount}`;
    const convertDocRef = doc(db, 'users', userId, 'quickConvert', convertId);
    
    // Eğer order verilmemişse, en yüksek order + 1
    if (order === undefined) {
      const quickConverts = await getQuickConverts(userId);
      const maxOrder = quickConverts.length > 0 
        ? Math.max(...quickConverts.map(c => c.order)) 
        : -1;
      order = maxOrder + 1;
    }
    
    await setDoc(convertDocRef, {
      from,
      to,
      amount,
      order
    });
    console.log('✅ Hızlı çevirim eklendi:', { from, to, amount, order });
  } catch (error) {
    console.error('❌ Hızlı çevirim eklenirken hata:', error);
    throw error;
  }
};

/**
 * Bir hızlı çevirim çıkar
 */
export const removeQuickConvert = async (
  userId: string,
  from: string,
  to: string,
  amount: number
): Promise<void> => {
  try {
    const convertId = `${from}_${to}_${amount}`;
    const convertDocRef = doc(db, 'users', userId, 'quickConvert', convertId);
    await deleteDoc(convertDocRef);
    console.log('✅ Hızlı çevirim çıkarıldı:', { from, to, amount });
  } catch (error) {
    console.error('❌ Hızlı çevirim çıkarılırken hata:', error);
    throw error;
  }
};

/**
 * Kullanıcı seçili yatırım fonlarını yöneten servis
 * users/{userId}/selectedFund collection'ında saklar
 */

export interface SelectedFund {
  key: string; // Fund'un key değeri (unique identifier)
  order: number;
}

/**
 * Kullanıcının seçili yatırım fonlarını getir (sıralı)
 */
export const getSelectedFunds = async (userId: string): Promise<SelectedFund[]> => {
  try {
    const selectedFundRef = collection(db, 'users', userId, 'selectedFund');
    const q = query(selectedFundRef, orderBy('order', 'asc'));
    const querySnapshot = await getDocs(q);

    const selectedFunds: SelectedFund[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      selectedFunds.push({
        key: data.key || doc.id,
        order: data.order || 0
      });
    });

    console.log('✅ Seçili yatırım fonları yüklendi:', selectedFunds);
    return selectedFunds;
  } catch (error) {
    console.error('❌ Seçili yatırım fonları yüklenirken hata:', error);
    return [];
  }
};

/**
 * Kullanıcının seçili yatırım fonlarını kaydet (sıralama ile birlikte)
 * Tüm collection'ı siler ve yeniden oluşturur
 */
export const saveSelectedFunds = async (
  userId: string, 
  funds: SelectedFund[]
): Promise<void> => {
  try {
    const selectedFundRef = collection(db, 'users', userId, 'selectedFund');
    
    // Önce mevcut tüm document'leri sil
    const existingDocs = await getDocs(selectedFundRef);
    const batch = writeBatch(db);
    
    existingDocs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Yeni document'leri ekle
    funds.forEach((fund) => {
      const fundDocRef = doc(selectedFundRef, fund.key);
      batch.set(fundDocRef, {
        key: fund.key,
        order: fund.order
      });
    });

    await batch.commit();
    console.log('✅ Seçili yatırım fonları kaydedildi:', funds);
  } catch (error) {
    console.error('❌ Seçili yatırım fonları kaydedilirken hata:', error);
    throw error;
  }
};

/**
 * Bir yatırım fonunu seçili listeye ekle
 */
export const addSelectedFund = async (
  userId: string,
  fundKey: string,
  order?: number
): Promise<void> => {
  try {
    const selectedFundRef = collection(db, 'users', userId, 'selectedFund');
    
    // Eğer order verilmemişse, en yüksek order + 1
    if (order === undefined) {
      const existingDocs = await getDocs(selectedFundRef);
      let maxOrder = -1;
      existingDocs.forEach((doc) => {
        const data = doc.data();
        maxOrder = Math.max(maxOrder, data.order || 0);
      });
      order = maxOrder + 1;
    }

    const fundDocRef = doc(selectedFundRef, fundKey);
    await setDoc(fundDocRef, {
      key: fundKey,
      order: order
    });

    console.log('✅ Yatırım fonu seçili listeye eklendi:', fundKey);
  } catch (error) {
    console.error('❌ Yatırım fonu eklenirken hata:', error);
    throw error;
  }
};

/**
 * Bir yatırım fonunu seçili listeden çıkar
 */
export const removeSelectedFund = async (
  userId: string,
  fundKey: string
): Promise<void> => {
  try {
    const fundDocRef = doc(db, 'users', userId, 'selectedFund', fundKey);
    await deleteDoc(fundDocRef);
    console.log('✅ Yatırım fonu seçili listeden çıkarıldı:', fundKey);
  } catch (error) {
    console.error('❌ Yatırım fonu çıkarılırken hata:', error);
    throw error;
  }
};

// ============================================================================
// FOLLOWED COLLECTIONS - Takip ve Karşılaştırma Sayfası İçin
// ============================================================================

/**
 * Kullanıcı takip edilen döviz kurlarını yöneten servis
 * users/{userId}/followedCurrency collection'ında saklar
 * Investments sayfasındaki selectedCurrency'den bağımsızdır
 */

export interface FollowedCurrency {
  code: string;
  order: number;
}

/**
 * Kullanıcının takip edilen döviz kurlarını getir (sıralı)
 */
export const getFollowedCurrencies = async (userId: string): Promise<FollowedCurrency[]> => {
  try {
    const followedCurrencyRef = collection(db, 'users', userId, 'followedCurrency');
    const q = query(followedCurrencyRef, orderBy('order', 'asc'));
    const querySnapshot = await getDocs(q);

    const followedCurrencies: FollowedCurrency[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      followedCurrencies.push({
        code: data.code || doc.id,
        order: data.order || 0
      });
    });

    console.log('✅ Takip edilen döviz kurları yüklendi:', followedCurrencies);
    return followedCurrencies;
  } catch (error) {
    console.error('❌ Takip edilen döviz kurları yüklenirken hata:', error);
    return [];
  }
};

/**
 * Kullanıcının takip edilen döviz kurlarını kaydet (sıralama ile birlikte)
 */
export const saveFollowedCurrencies = async (
  userId: string, 
  currencies: FollowedCurrency[]
): Promise<void> => {
  try {
    const followedCurrencyRef = collection(db, 'users', userId, 'followedCurrency');
    
    // Önce mevcut tüm document'leri sil
    const existingDocs = await getDocs(followedCurrencyRef);
    const batch = writeBatch(db);
    
    existingDocs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Yeni document'leri ekle
    currencies.forEach((currency) => {
      const currencyDocRef = doc(followedCurrencyRef, currency.code);
      batch.set(currencyDocRef, {
        code: currency.code,
        order: currency.order
      });
    });

    await batch.commit();
    console.log('✅ Takip edilen döviz kurları kaydedildi:', currencies);
  } catch (error) {
    console.error('❌ Takip edilen döviz kurları kaydedilirken hata:', error);
    throw error;
  }
};

/**
 * Bir döviz kurunu takip listesine ekle
 */
export const addFollowedCurrency = async (
  userId: string,
  currencyCode: string,
  order?: number
): Promise<void> => {
  try {
    const followedCurrencyRef = collection(db, 'users', userId, 'followedCurrency');
    
    // Eğer order verilmemişse, en yüksek order + 1
    if (order === undefined) {
      const existingDocs = await getDocs(followedCurrencyRef);
      let maxOrder = -1;
      existingDocs.forEach((doc) => {
        const data = doc.data();
        maxOrder = Math.max(maxOrder, data.order || 0);
      });
      order = maxOrder + 1;
    }

    const currencyDocRef = doc(followedCurrencyRef, currencyCode);
    await setDoc(currencyDocRef, {
      code: currencyCode,
      order: order
    });

    console.log('✅ Döviz kuru takip listesine eklendi:', currencyCode);
  } catch (error) {
    console.error('❌ Döviz kuru eklenirken hata:', error);
    throw error;
  }
};

/**
 * Bir döviz kurunu takip listesinden çıkar
 */
export const removeFollowedCurrency = async (
  userId: string,
  currencyCode: string
): Promise<void> => {
  try {
    const currencyDocRef = doc(db, 'users', userId, 'followedCurrency', currencyCode);
    await deleteDoc(currencyDocRef);
    console.log('✅ Döviz kuru takip listesinden çıkarıldı:', currencyCode);
  } catch (error) {
    console.error('❌ Döviz kuru çıkarılırken hata:', error);
    throw error;
  }
};

/**
 * Kullanıcı takip edilen yatırım fonlarını yöneten servis
 * users/{userId}/followedFund collection'ında saklar
 * Investments sayfasındaki selectedFund'den bağımsızdır
 */

export interface FollowedFund {
  key: string;
  order: number;
}

/**
 * Kullanıcının takip edilen yatırım fonlarını getir (sıralı)
 */
export const getFollowedFunds = async (userId: string): Promise<FollowedFund[]> => {
  try {
    const followedFundRef = collection(db, 'users', userId, 'followedFund');
    const q = query(followedFundRef, orderBy('order', 'asc'));
    const querySnapshot = await getDocs(q);

    const followedFunds: FollowedFund[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      followedFunds.push({
        key: data.key || doc.id,
        order: data.order || 0
      });
    });

    console.log('✅ Takip edilen yatırım fonları yüklendi:', followedFunds);
    return followedFunds;
  } catch (error) {
    console.error('❌ Takip edilen yatırım fonları yüklenirken hata:', error);
    return [];
  }
};

/**
 * Kullanıcının takip edilen yatırım fonlarını kaydet (sıralama ile birlikte)
 */
export const saveFollowedFunds = async (
  userId: string, 
  funds: FollowedFund[]
): Promise<void> => {
  try {
    const followedFundRef = collection(db, 'users', userId, 'followedFund');
    
    // Önce mevcut tüm document'leri sil
    const existingDocs = await getDocs(followedFundRef);
    const batch = writeBatch(db);
    
    existingDocs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Yeni document'leri ekle
    funds.forEach((fund) => {
      const fundDocRef = doc(followedFundRef, fund.key);
      batch.set(fundDocRef, {
        key: fund.key,
        order: fund.order
      });
    });

    await batch.commit();
    console.log('✅ Takip edilen yatırım fonları kaydedildi:', funds);
  } catch (error) {
    console.error('❌ Takip edilen yatırım fonları kaydedilirken hata:', error);
    throw error;
  }
};

/**
 * Bir yatırım fonunu takip listesine ekle
 */
export const addFollowedFund = async (
  userId: string,
  fundKey: string,
  order?: number
): Promise<void> => {
  try {
    const followedFundRef = collection(db, 'users', userId, 'followedFund');
    
    // Eğer order verilmemişse, en yüksek order + 1
    if (order === undefined) {
      const existingDocs = await getDocs(followedFundRef);
      let maxOrder = -1;
      existingDocs.forEach((doc) => {
        const data = doc.data();
        maxOrder = Math.max(maxOrder, data.order || 0);
      });
      order = maxOrder + 1;
    }

    const fundDocRef = doc(followedFundRef, fundKey);
    await setDoc(fundDocRef, {
      key: fundKey,
      order: order
    });

    console.log('✅ Yatırım fonu takip listesine eklendi:', fundKey);
  } catch (error) {
    console.error('❌ Yatırım fonu eklenirken hata:', error);
    throw error;
  }
};

/**
 * Bir yatırım fonunu takip listesinden çıkar
 */
export const removeFollowedFund = async (
  userId: string,
  fundKey: string
): Promise<void> => {
  try {
    const fundDocRef = doc(db, 'users', userId, 'followedFund', fundKey);
    await deleteDoc(fundDocRef);
    console.log('✅ Yatırım fonu takip listesinden çıkarıldı:', fundKey);
  } catch (error) {
    console.error('❌ Yatırım fonu çıkarılırken hata:', error);
    throw error;
  }
};

/**
 * Kullanıcı takip edilen hisse senetlerini yöneten servis
 * users/{userId}/followedHisse collection'ında saklar
 * Investments sayfasındaki selectedHisse'den bağımsızdır
 */

export interface FollowedBorsa {
  code: string;
  order: number;
}

/**
 * Kullanıcının takip edilen hisse senetlerini getir (sıralı)
 */
export const getFollowedBorsa = async (userId: string): Promise<FollowedBorsa[]> => {
  try {
    const followedBorsaRef = collection(db, 'users', userId, 'followedHisse');
    const q = query(followedBorsaRef, orderBy('order', 'asc'));
    const querySnapshot = await getDocs(q);

    const followedBorsa: FollowedBorsa[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      followedBorsa.push({
        code: data.code || doc.id,
        order: data.order || 0
      });
    });

    console.log('✅ Takip edilen hisse senetleri yüklendi:', followedBorsa);
    return followedBorsa;
  } catch (error) {
    console.error('❌ Takip edilen hisse senetleri yüklenirken hata:', error);
    return [];
  }
};

/**
 * Kullanıcının takip edilen hisse senetlerini kaydet (sıralama ile birlikte)
 */
export const saveFollowedBorsa = async (
  userId: string, 
  borsa: FollowedBorsa[]
): Promise<void> => {
  try {
    const followedBorsaRef = collection(db, 'users', userId, 'followedHisse');
    
    // Önce mevcut tüm document'leri sil
    const existingDocs = await getDocs(followedBorsaRef);
    const batch = writeBatch(db);
    
    existingDocs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Yeni document'leri ekle
    borsa.forEach((borsaItem) => {
      const borsaDocRef = doc(followedBorsaRef, borsaItem.code);
      batch.set(borsaDocRef, {
        code: borsaItem.code,
        order: borsaItem.order
      });
    });

    await batch.commit();
    console.log('✅ Takip edilen hisse senetleri kaydedildi:', borsa);
  } catch (error) {
    console.error('❌ Takip edilen hisse senetleri kaydedilirken hata:', error);
    throw error;
  }
};

/**
 * Bir hisse senedini takip listesine ekle
 */
export const addFollowedBorsa = async (
  userId: string,
  borsaCode: string,
  order?: number
): Promise<void> => {
  try {
    const followedBorsaRef = collection(db, 'users', userId, 'followedHisse');
    
    // Eğer order verilmemişse, en yüksek order + 1
    if (order === undefined) {
      const existingDocs = await getDocs(followedBorsaRef);
      let maxOrder = -1;
      existingDocs.forEach((doc) => {
        const data = doc.data();
        maxOrder = Math.max(maxOrder, data.order || 0);
      });
      order = maxOrder + 1;
    }

    const borsaDocRef = doc(followedBorsaRef, borsaCode);
    await setDoc(borsaDocRef, {
      code: borsaCode,
      order: order
    });

    console.log('✅ Hisse senedi takip listesine eklendi:', borsaCode);
  } catch (error) {
    console.error('❌ Hisse senedi eklenirken hata:', error);
    throw error;
  }
};

/**
 * Bir hisse senedini takip listesinden çıkar
 */
export const removeFollowedBorsa = async (
  userId: string,
  borsaCode: string
): Promise<void> => {
  try {
    const borsaDocRef = doc(db, 'users', userId, 'followedHisse', borsaCode);
    await deleteDoc(borsaDocRef);
    console.log('✅ Hisse senedi takip listesinden çıkarıldı:', borsaCode);
  } catch (error) {
    console.error('❌ Hisse senedi çıkarılırken hata:', error);
    throw error;
  }
};

