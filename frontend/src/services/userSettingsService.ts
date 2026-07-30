/**
 * Preferences BFF — Firebase client SDK yerine Django API.
 * Export imzaları UI ile uyumlu kalır; userId parametresi geriye dönük
 * uyumluluk içindir (yetki token UID ile backend'de).
 */

import { preferencesAPI } from './apiService';

export interface SelectedCurrency {
  code: string;
  order: number;
}

export interface SelectedHisse {
  code: string;
  order: number;
}

export interface QuickConvert {
  from: string;
  to: string;
  amount: number;
  order: number;
}

export interface SelectedFund {
  key: string;
  order: number;
}

export interface FollowedCurrency {
  code: string;
  order: number;
}

export interface FollowedFund {
  key: string;
  order: number;
}

export interface FollowedBorsa {
  code: string;
  order: number;
}

type PrefResource =
  | 'selected-currencies'
  | 'selected-hisse'
  | 'selected-funds'
  | 'followed-currencies'
  | 'followed-hisse'
  | 'followed-funds'
  | 'quick-converts';

async function listItems<T>(resource: PrefResource): Promise<T[]> {
  try {
    const res = await preferencesAPI.get(resource);
    if (res?.success && Array.isArray(res.data)) {
      return res.data as T[];
    }
    return [];
  } catch (error) {
    console.error(`Preferences GET ${resource} hatası:`, error);
    return [];
  }
}

async function replaceItems<T>(resource: PrefResource, items: T[]): Promise<void> {
  await preferencesAPI.put(resource, items);
}

// --- Selected currencies ---

export const getSelectedCurrencies = async (
  _userId: string
): Promise<SelectedCurrency[]> => listItems<SelectedCurrency>('selected-currencies');

export const saveSelectedCurrencies = async (
  _userId: string,
  currencies: SelectedCurrency[]
): Promise<void> => replaceItems('selected-currencies', currencies);

export const addSelectedCurrency = async (
  userId: string,
  currencyCode: string,
  order?: number
): Promise<void> => {
  const existing = await getSelectedCurrencies(userId);
  if (existing.some((c) => c.code === currencyCode)) return;
  const nextOrder =
    order !== undefined
      ? order
      : existing.length
        ? Math.max(...existing.map((c) => c.order)) + 1
        : 0;
  await saveSelectedCurrencies(userId, [
    ...existing,
    { code: currencyCode, order: nextOrder },
  ]);
};

export const removeSelectedCurrency = async (
  userId: string,
  currencyCode: string
): Promise<void> => {
  const existing = await getSelectedCurrencies(userId);
  await saveSelectedCurrencies(
    userId,
    existing.filter((c) => c.code !== currencyCode)
  );
};

export const updateCurrencyOrder = async (
  userId: string,
  currencies: SelectedCurrency[]
): Promise<void> => saveSelectedCurrencies(userId, currencies);

// --- Selected hisse ---

export const getSelectedHisse = async (
  _userId: string
): Promise<SelectedHisse[]> => listItems<SelectedHisse>('selected-hisse');

export const saveSelectedHisse = async (
  _userId: string,
  hisse: SelectedHisse[]
): Promise<void> => replaceItems('selected-hisse', hisse);

export const addSelectedHisse = async (
  userId: string,
  hisseCode: string,
  order?: number
): Promise<void> => {
  const existing = await getSelectedHisse(userId);
  if (existing.some((h) => h.code === hisseCode)) return;
  const nextOrder =
    order !== undefined
      ? order
      : existing.length
        ? Math.max(...existing.map((h) => h.order)) + 1
        : 0;
  await saveSelectedHisse(userId, [
    ...existing,
    { code: hisseCode, order: nextOrder },
  ]);
};

export const removeSelectedHisse = async (
  userId: string,
  hisseCode: string
): Promise<void> => {
  const existing = await getSelectedHisse(userId);
  await saveSelectedHisse(
    userId,
    existing.filter((h) => h.code !== hisseCode)
  );
};

// --- Quick converts ---

export const getQuickConverts = async (
  _userId: string
): Promise<QuickConvert[]> => listItems<QuickConvert>('quick-converts');

export const saveQuickConverts = async (
  _userId: string,
  quickConverts: QuickConvert[]
): Promise<void> => replaceItems('quick-converts', quickConverts);

export const addQuickConvert = async (
  userId: string,
  from: string,
  to: string,
  amount: number,
  order?: number
): Promise<void> => {
  const existing = await getQuickConverts(userId);
  const idMatch = (c: QuickConvert) =>
    c.from === from && c.to === to && c.amount === amount;
  if (existing.some(idMatch)) return;
  const nextOrder =
    order !== undefined
      ? order
      : existing.length
        ? Math.max(...existing.map((c) => c.order)) + 1
        : 0;
  await saveQuickConverts(userId, [
    ...existing,
    { from, to, amount, order: nextOrder },
  ]);
};

export const removeQuickConvert = async (
  userId: string,
  from: string,
  to: string,
  amount: number
): Promise<void> => {
  const existing = await getQuickConverts(userId);
  await saveQuickConverts(
    userId,
    existing.filter(
      (c) => !(c.from === from && c.to === to && c.amount === amount)
    )
  );
};

// --- Selected funds ---

export const getSelectedFunds = async (
  _userId: string
): Promise<SelectedFund[]> => listItems<SelectedFund>('selected-funds');

export const saveSelectedFunds = async (
  _userId: string,
  funds: SelectedFund[]
): Promise<void> => replaceItems('selected-funds', funds);

export const addSelectedFund = async (
  userId: string,
  fundKey: string,
  order?: number
): Promise<void> => {
  const existing = await getSelectedFunds(userId);
  if (existing.some((f) => f.key === fundKey)) return;
  const nextOrder =
    order !== undefined
      ? order
      : existing.length
        ? Math.max(...existing.map((f) => f.order)) + 1
        : 0;
  await saveSelectedFunds(userId, [
    ...existing,
    { key: fundKey, order: nextOrder },
  ]);
};

export const removeSelectedFund = async (
  userId: string,
  fundKey: string
): Promise<void> => {
  const existing = await getSelectedFunds(userId);
  await saveSelectedFunds(
    userId,
    existing.filter((f) => f.key !== fundKey)
  );
};

// --- Followed currencies ---

export const getFollowedCurrencies = async (
  _userId: string
): Promise<FollowedCurrency[]> =>
  listItems<FollowedCurrency>('followed-currencies');

export const saveFollowedCurrencies = async (
  _userId: string,
  currencies: FollowedCurrency[]
): Promise<void> => replaceItems('followed-currencies', currencies);

export const addFollowedCurrency = async (
  userId: string,
  currencyCode: string,
  order?: number
): Promise<void> => {
  const existing = await getFollowedCurrencies(userId);
  if (existing.some((c) => c.code === currencyCode)) return;
  const nextOrder =
    order !== undefined
      ? order
      : existing.length
        ? Math.max(...existing.map((c) => c.order)) + 1
        : 0;
  await saveFollowedCurrencies(userId, [
    ...existing,
    { code: currencyCode, order: nextOrder },
  ]);
};

export const removeFollowedCurrency = async (
  userId: string,
  currencyCode: string
): Promise<void> => {
  const existing = await getFollowedCurrencies(userId);
  await saveFollowedCurrencies(
    userId,
    existing.filter((c) => c.code !== currencyCode)
  );
};

// --- Followed funds ---

export const getFollowedFunds = async (
  _userId: string
): Promise<FollowedFund[]> => listItems<FollowedFund>('followed-funds');

export const saveFollowedFunds = async (
  _userId: string,
  funds: FollowedFund[]
): Promise<void> => replaceItems('followed-funds', funds);

export const addFollowedFund = async (
  userId: string,
  fundKey: string,
  order?: number
): Promise<void> => {
  const existing = await getFollowedFunds(userId);
  if (existing.some((f) => f.key === fundKey)) return;
  const nextOrder =
    order !== undefined
      ? order
      : existing.length
        ? Math.max(...existing.map((f) => f.order)) + 1
        : 0;
  await saveFollowedFunds(userId, [
    ...existing,
    { key: fundKey, order: nextOrder },
  ]);
};

export const removeFollowedFund = async (
  userId: string,
  fundKey: string
): Promise<void> => {
  const existing = await getFollowedFunds(userId);
  await saveFollowedFunds(
    userId,
    existing.filter((f) => f.key !== fundKey)
  );
};

// --- Followed borsa (followedHisse) ---

export const getFollowedBorsa = async (
  _userId: string
): Promise<FollowedBorsa[]> => listItems<FollowedBorsa>('followed-hisse');

export const saveFollowedBorsa = async (
  _userId: string,
  borsa: FollowedBorsa[]
): Promise<void> => replaceItems('followed-hisse', borsa);

export const addFollowedBorsa = async (
  userId: string,
  borsaCode: string,
  order?: number
): Promise<void> => {
  const existing = await getFollowedBorsa(userId);
  if (existing.some((b) => b.code === borsaCode)) return;
  const nextOrder =
    order !== undefined
      ? order
      : existing.length
        ? Math.max(...existing.map((b) => b.order)) + 1
        : 0;
  await saveFollowedBorsa(userId, [
    ...existing,
    { code: borsaCode, order: nextOrder },
  ]);
};

export const removeFollowedBorsa = async (
  userId: string,
  borsaCode: string
): Promise<void> => {
  const existing = await getFollowedBorsa(userId);
  await saveFollowedBorsa(
    userId,
    existing.filter((b) => b.code !== borsaCode)
  );
};
