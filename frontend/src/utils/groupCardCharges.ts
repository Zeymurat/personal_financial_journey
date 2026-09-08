import type { DebtScheduleItem } from '../types';

export type ChargeGroup = {
  /** Gerçek chargeId veya legacy:/linked: sentetik anahtar */
  chargeId: string;
  items: DebtScheduleItem[];
  total: number;
  purchaseDate: string;
  category: string;
  description: string;
  installmentCount: number;
  allPending: boolean;
  /** Sil/güncelle için tüm satır id’leri */
  itemIds: string[];
};

function metaKey(item: DebtScheduleItem): string {
  return [
    item.category || '',
    item.description || '',
    item.currency || '',
    item.purchaseDate || '',
    item.linkedExpenseId || '',
  ].join('|');
}

function amountsClose(a: number, b: number): boolean {
  return Math.abs((a || 0) - (b || 0)) <= 0.05;
}

/** sequence 1..n zinciri (n>=2) */
function consecutiveFromOne(items: DebtScheduleItem[]): DebtScheduleItem[] {
  const bySeq = new Map<number, DebtScheduleItem>();
  for (const item of items) {
    const seq = item.sequence || 0;
    if (seq > 0 && !bySeq.has(seq)) bySeq.set(seq, item);
  }
  const series: DebtScheduleItem[] = [];
  for (let s = 1; s <= bySeq.size + 2; s += 1) {
    const hit = bySeq.get(s);
    if (!hit) break;
    series.push(hit);
  }
  return series.length >= 2 ? series : [];
}

function monthsApart(a: string, b: string): number | null {
  if (!a || !b) return null;
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  if (!ay || !am || !by || !bm) return null;
  const diff = (by - ay) * 12 + (bm - am);
  // aynı ay günü civarı (±3 gün) kabul
  if (Math.abs((bd || 1) - (ad || 1)) > 3 && Math.abs(diff) >= 1) {
    /* still allow month chain on cutoff day clamp */
  }
  return diff;
}

/** Eşit tutarlı, yaklaşık aylık vadeli zincir */
function monthlyEqualChain(items: DebtScheduleItem[]): DebtScheduleItem[] {
  if (items.length < 2) return [];
  const sorted = [...items].sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
  const base = sorted[0];
  const chain = [base];
  for (let i = 1; i < sorted.length; i += 1) {
    const prev = chain[chain.length - 1];
    const cur = sorted[i];
    if (!amountsClose(prev.amount, cur.amount)) continue;
    const diff = monthsApart(prev.dueDate, cur.dueDate);
    if (diff === 1) chain.push(cur);
  }
  return chain.length >= 2 ? chain : [];
}

function toGroup(chargeId: string, items: DebtScheduleItem[]): ChargeGroup {
  const sorted = [...items].sort(
    (a, b) => (a.dueDate || '').localeCompare(b.dueDate || '') || (a.sequence || 0) - (b.sequence || 0)
  );
  const first = sorted[0];
  const total =
    first?.chargeTotal && first.chargeTotal > 0
      ? first.chargeTotal
      : sorted.reduce((sum, s) => sum + (s.amount || 0), 0);
  const installmentCount = Math.max(
    first?.installmentCount || 0,
    sorted.length
  );
  return {
    chargeId,
    items: sorted,
    total,
    purchaseDate: first?.purchaseDate || first?.dueDate || '',
    category: first?.category || '',
    description: first?.description || '',
    installmentCount,
    allPending: sorted.every((s) => s.status === 'pending'),
    itemIds: sorted.map((s) => s.id),
  };
}

/**
 * Taksitli harcamaları tek grupta toplar.
 * Yeni kayıtlarda chargeId; eskilerde linkedExpenseId / sequence / aylık zincir.
 */
export function groupCharges(schedule: DebtScheduleItem[]): ChargeGroup[] {
  const used = new Set<string>();
  const groups: ChargeGroup[] = [];

  const byRealCharge = new Map<string, DebtScheduleItem[]>();
  const byLinked = new Map<string, DebtScheduleItem[]>();
  const orphans: DebtScheduleItem[] = [];

  for (const item of schedule) {
    if (item.chargeId) {
      const list = byRealCharge.get(item.chargeId) || [];
      list.push(item);
      byRealCharge.set(item.chargeId, list);
    } else if (item.linkedExpenseId) {
      const key = `linked:${item.linkedExpenseId}`;
      const list = byLinked.get(key) || [];
      list.push(item);
      byLinked.set(key, list);
    } else {
      orphans.push(item);
    }
  }

  for (const [chargeId, items] of byRealCharge) {
    items.forEach((i) => used.add(i.id));
    groups.push(toGroup(chargeId, items));
  }
  for (const [chargeId, items] of byLinked) {
    items.forEach((i) => used.add(i.id));
    groups.push(toGroup(chargeId, items));
  }

  const remaining = orphans.filter((o) => !used.has(o.id));
  const sortedOrphans = [...remaining].sort(
    (a, b) => (a.dueDate || '').localeCompare(b.dueDate || '') || (a.sequence || 0) - (b.sequence || 0)
  );

  for (const seed of sortedOrphans) {
    if (used.has(seed.id)) continue;

    const pool = sortedOrphans.filter(
      (o) => !used.has(o.id) && metaKey(o) === metaKey(seed)
    );

    let series: DebtScheduleItem[] = [];

    const expected =
      seed.installmentCount && seed.installmentCount > 1 ? seed.installmentCount : 0;
    if (expected > 1) {
      const bySeq = consecutiveFromOne(pool);
      if (bySeq.length >= 2) {
        series = bySeq.slice(0, expected);
      } else {
        const chain = monthlyEqualChain(pool);
        if (chain.length >= 2) series = chain.slice(0, expected);
      }
    }

    if (series.length < 2) {
      const bySeq = consecutiveFromOne(pool);
      if (bySeq.length >= 2) series = bySeq;
    }
    if (series.length < 2) {
      const chain = monthlyEqualChain(pool);
      if (chain.length >= 2) series = chain;
    }
    if (series.length < 2) {
      series = [seed];
    }

    series.forEach((s) => used.add(s.id));
    const syntheticId = `legacy:${series
      .map((s) => s.id)
      .sort()
      .join(',')}`;
    groups.push(toGroup(syntheticId, series));
  }

  return groups.sort((a, b) => (b.purchaseDate || '').localeCompare(a.purchaseDate || ''));
}
