"""Debt / credit-card helpers shared by Firestore debt flows."""
from __future__ import annotations

from calendar import monthrange
from datetime import date, datetime, timedelta
from typing import List, Optional, Tuple

CC_MIN_PAYMENT_LIMIT_THRESHOLD = 50_000


def parse_date(value: str) -> date:
    if isinstance(value, date) and not isinstance(value, datetime):
        return value
    text = str(value).strip()
    if 'T' in text:
        text = text.split('T')[0]
    return datetime.strptime(text, '%Y-%m-%d').date()


def format_date(value: date) -> str:
    return value.isoformat()


def clamp_day(year: int, month: int, day: int) -> date:
    last = monthrange(year, month)[1]
    return date(year, month, min(day, last))


def next_statement_date(purchase_date: date, cutoff_day: int) -> date:
    """
    Classic card cycle:
    if purchase_day >= cutoff_day → next month cutoff
    else → this month cutoff
    """
    day = max(1, min(int(cutoff_day), 28))
    if purchase_date.day >= day:
        if purchase_date.month == 12:
            return clamp_day(purchase_date.year + 1, 1, day)
        return clamp_day(purchase_date.year, purchase_date.month + 1, day)
    return clamp_day(purchase_date.year, purchase_date.month, day)


def add_months(base: date, months: int) -> date:
    month_index = base.month - 1 + months
    year = base.year + month_index // 12
    month = month_index % 12 + 1
    return clamp_day(year, month, base.day)


def with_anchor_day(value: date, anchor_day: int) -> date:
    """Keep year/month; set the day from the purchase (clamped to the month)."""
    return clamp_day(value.year, value.month, max(1, int(anchor_day)))


def build_installment_due_dates(
    purchase_date: date,
    cutoff_day: int,
    installment_count: int,
) -> List[date]:
    """Due day is the statement cutoff. A 26 Sep purchase with cutoff 15 starts 15 Oct."""
    count = max(1, int(installment_count))
    first = next_statement_date(purchase_date, cutoff_day)
    return [add_months(first, i) for i in range(count)]


def build_charge_due_dates(
    purchase_date: date,
    installment_count: int,
    paid_installment_count: int = 0,
    first_pending_due: Optional[date] = None,
    first_due: Optional[date] = None,
    cutoff_day: int = 1,
) -> List[date]:
    """
    Card installment calendar on the statement cutoff day.
    Catch-up with no explicit first pending date anchors the first unpaid
    slice on that statement date and walks paid slices backward.
    """
    n = max(1, int(installment_count))
    paid = max(0, min(int(paid_installment_count or 0), n))
    if first_pending_due is not None and 0 < paid < n:
        return build_due_dates_from_first_pending(first_pending_due, n, paid)
    if first_due is not None:
        return build_due_dates_from_first(first_due, n)
    if 0 < paid < n:
        anchor = next_statement_date(purchase_date, cutoff_day)
        return build_due_dates_from_first_pending(anchor, n, paid)
    return build_installment_due_dates(purchase_date, cutoff_day, n)


def build_due_dates_from_first_pending(
    first_pending_due: date,
    installment_count: int,
    paid_installment_count: int = 0,
) -> List[date]:
    """
    Catch-up: ilk bekleyen vade biliniyor (örn. 3. taksit = 3 Ekim).
    Ödenen taksitler geriye, kalanlar ileriye aylık dizilir.
    """
    n = max(1, int(installment_count))
    paid = max(0, min(int(paid_installment_count or 0), n))
    return [add_months(first_pending_due, i - paid) for i in range(n)]


def build_due_dates_from_first(
    first_due: date,
    installment_count: int,
) -> List[date]:
    """1. taksit vadinden itibaren eşit aylık."""
    n = max(1, int(installment_count))
    return [add_months(first_due, i) for i in range(n)]


def build_loan_due_dates(start_date: date, installment_count: int) -> List[date]:
    count = max(1, int(installment_count))
    return [add_months(start_date, i) for i in range(count)]


def split_equal_amounts(total: float, count: int) -> List[float]:
    """Equal split in kuruş; remainder on last installment."""
    n = max(1, int(count))
    total_cents = int(round(float(total) * 100))
    base = total_cents // n
    amounts = [base / 100.0] * n
    remainder = total_cents - base * n
    amounts[-1] = (base + remainder) / 100.0
    return amounts


# TR kredi ürün tipleri → faiz üzerinden KKDF / BSMV (hesaplama araçları ile uyumlu)
# Konut: muaf | Özel: 15/5 | İhtiyaç / Taşıt / İş yeri: 15/15
LOAN_TYPE_CONSUMER = 'consumer'  # bireysel ihtiyaç
LOAN_TYPE_VEHICLE = 'vehicle'  # taşıt
LOAN_TYPE_COMMERCIAL = 'commercial'  # yatırım amaçlı iş yeri
LOAN_TYPE_HOUSING = 'housing'  # konut
LOAN_TYPE_SPECIAL = 'special'  # özel

LOAN_TAX_PROFILES = {
    LOAN_TYPE_HOUSING: (0.0, 0.0),
    LOAN_TYPE_SPECIAL: (0.15, 0.05),
    LOAN_TYPE_CONSUMER: (0.15, 0.15),
    LOAN_TYPE_VEHICLE: (0.15, 0.15),
    LOAN_TYPE_COMMERCIAL: (0.15, 0.15),
}

DEFAULT_LOAN_TYPE = LOAN_TYPE_CONSUMER


def normalize_loan_type(loan_type: Optional[str]) -> str:
    key = (loan_type or DEFAULT_LOAN_TYPE).strip().lower()
    if key not in LOAN_TAX_PROFILES:
        return DEFAULT_LOAN_TYPE
    return key


def loan_tax_rates(loan_type: Optional[str] = None) -> Tuple[float, float]:
    """Returns (kkdf_rate, bsmv_rate) as decimals."""
    return LOAN_TAX_PROFILES[normalize_loan_type(loan_type)]


def loan_effective_monthly_rate(
    monthly_interest_percent: float,
    loan_type: Optional[str] = None,
) -> float:
    """Aylık akdi faiz (%) → KKDF+BSMV dahil efektif aylık oran (ondalık)."""
    r = max(0.0, float(monthly_interest_percent or 0)) / 100.0
    if r <= 0:
        return 0.0
    kkdf, bsmv = loan_tax_rates(loan_type)
    return r * (1.0 + kkdf + bsmv)


def annuity_payment(principal: float, monthly_rate: float, count: int) -> float:
    """Eşit taksit (annuity). monthly_rate ondalık (örn. 0.05265)."""
    n = max(1, int(count))
    p = float(principal)
    r = float(monthly_rate)
    if n == 1:
        return round(p, 2)
    if r <= 1e-12:
        return round(p / n, 2)
    raw = p * r * (1.0 + r) ** n / ((1.0 + r) ** n - 1.0)
    return round(raw, 2)


def compute_loan_installment_amount(
    principal: float,
    monthly_interest_percent: float,
    installment_count: int,
    installment_override: Optional[float] = None,
    loan_type: Optional[str] = None,
) -> float:
    """
    Kredi aylık taksit tutarı.
    installment_override > 0 ise banka tutarı elle geçer; aksi halde
    aylık faiz + ürün tipine göre KKDF/BSMV ile annuity.
    """
    if installment_override is not None:
        try:
            ov = float(installment_override)
        except (TypeError, ValueError):
            ov = 0.0
        if ov > 0:
            return round(ov, 2)

    n = max(1, int(installment_count))
    p = float(principal)
    r_eff = loan_effective_monthly_rate(monthly_interest_percent, loan_type)
    if r_eff <= 0:
        return split_equal_amounts(p, n)[0] if n else round(p, 2)
    return annuity_payment(p, r_eff, n)


def build_fixed_installment_amounts(installment_amount: float, count: int) -> List[float]:
    """Aynı taksit tutarını N kez (kuruş yuvarlı)."""
    n = max(1, int(count))
    unit = round(float(installment_amount), 2)
    return [unit] * n


# TCMB azami aylık oranlar (1 Ekim 2026). Dönem borcuna göre tavan.
# Ekstre faizine KKDF %15 + BSMV %15 biner.
CC_INTEREST_TAX_FACTOR = 1.30
CC_INTEREST_TIERS = (
    (30_000.0, 3.25, 3.55),
    (180_000.0, 3.75, 4.05),
    (float('inf'), 4.25, 4.55),
)


def cc_ceiling_rates(statement_balance: float) -> Tuple[float, float]:
    """Returns (akdi, gecikme) monthly percent ceilings for a statement balance."""
    balance = max(0.0, float(statement_balance or 0))
    for ceiling, contractual, late in CC_INTEREST_TIERS:
        if balance < ceiling or ceiling == float('inf'):
            return contractual, late
    return 4.25, 4.55


def estimate_revolving_interest(
    unpaid: float,
    cycle_paid: float,
    minimum: float,
    tier_balance: float,
) -> Tuple[float, float, str]:
    """
    Interest posted when the statement rolls.
    Minimum met → contractual rate. Below minimum → late rate.
    Includes KKDF + BSMV. This is a ceiling estimate, not the bank's exact kuruş.
    """
    unpaid_amount = round(max(0.0, float(unpaid or 0)), 2)
    if unpaid_amount <= 0.02:
        return 0.0, 0.0, 'none'
    contractual, late = cc_ceiling_rates(tier_balance)
    if float(cycle_paid or 0) + 0.02 >= float(minimum or 0):
        rate, kind = contractual, 'contractual'
    else:
        rate, kind = late, 'late'
    interest = round(unpaid_amount * rate / 100.0 * CC_INTEREST_TAX_FACTOR, 2)
    return interest, rate, kind


def card_statement_figures(
    period_item_sum: float,
    carried: float,
    statement_credit: float,
    cycle_paid: float,
    credit_limit: float,
) -> dict:
    """
    gross = this statement's installments + carried revolving − credit.
    periodBalance and minPayment are what is still due after payments this cycle.
    """
    credit = max(0.0, float(statement_credit or 0))
    carried_amount = max(0.0, float(carried or 0))
    gross = round(max(0.0, float(period_item_sum or 0) + carried_amount - credit), 2)
    paid = round(max(0.0, float(cycle_paid or 0)), 2)
    if paid > gross:
        paid = gross
    remaining_period = round(max(0.0, gross - paid), 2)
    minimum, min_rate = compute_cc_min_payment(credit_limit, gross)
    min_remaining = round(max(0.0, minimum - paid), 2)
    # Tier uses the bill before this cycle's payments.
    interest, rate, kind = estimate_revolving_interest(remaining_period, paid, minimum, gross)
    return {
        'grossPeriodBalance': gross,
        'periodBalance': remaining_period,
        'cyclePaidAmount': paid,
        'minPayment': min_remaining,
        'minPaymentOriginal': minimum,
        'minPaymentRatePercent': min_rate,
        'estimatedInterest': interest,
        'interestRatePercent': rate,
        'interestKind': kind,
        'carriedBalance': round(carried_amount, 2),
        'statementCredit': round(credit, 2),
    }


def compute_cc_min_payment(credit_limit: float, statement_balance: float) -> Tuple[float, float]:
    """
    BDDK-style: limit <= 50_000 → 20%, else 40%.
    Returns (min_payment, rate_percent).
    """
    balance = max(0.0, float(statement_balance or 0))
    limit = float(credit_limit or 0)
    rate = 20.0 if limit <= CC_MIN_PAYMENT_LIMIT_THRESHOLD else 40.0
    return round(balance * rate / 100.0, 2), rate


def open_statement_period(as_of: date, cutoff_day: int) -> Tuple[date, date]:
    """
    Open statement window ending at the next statement date after (or on) as_of's cycle.
    Period: (previous_statement, next_statement].
    A slice belongs to this statement when its due date falls inside the window
    (3 Oct is in the 15 Oct statement), not only when the due day equals the cutoff.
    """
    day = max(1, min(int(cutoff_day), 28))
    # Next cutoff relative to as_of using same classic rule
    next_cut = next_statement_date(as_of, day)
    # Previous cutoff = one month before next
    prev_cut = add_months(next_cut, -1)
    return prev_cut, next_cut


def due_in_open_statement(due: date, prev_cut: date, next_cut: date) -> bool:
    """True when due is inside (prev_cut, next_cut]."""
    return prev_cut < due <= next_cut


def statement_due_date(cycle_end: date, days: int = 10) -> date:
    """Son ödeme: kesim günü + 10."""
    return cycle_end + timedelta(days=days)


def loan_amortization_slices(
    original: float,
    monthly_interest_percent: float,
    installment_count: int,
    installment_amount: float,
    loan_type: Optional[str] = None,
) -> List[dict]:
    """Her taksit için faiz+vergi ve anapara. Sıra ödeme sırasıdır."""
    count = max(1, int(installment_count or 1))
    installment = round(float(installment_amount or 0), 2)
    rate = loan_effective_monthly_rate(monthly_interest_percent, loan_type)
    balance = max(0.0, float(original or 0))
    slices = []
    for _ in range(count):
        interest = max(0.0, balance * rate)
        principal = installment - interest
        if principal > balance:
            principal = balance
        if principal < 0:
            principal = 0.0
        balance = max(0.0, balance - principal)
        slices.append({
            'interest': interest,
            'principal': principal,
            'balanceAfter': balance,
        })
        if balance <= 0.004:
            break
    return slices


def early_interest_discount(
    interest: float,
    due: date,
    previous_due: Optional[date],
    as_of: date,
) -> float:
    """Erken günde faiz indirimi. Dönemden uzunsa faiz tamamen düşer."""
    early_days = (due - as_of).days
    if early_days <= 0:
        return 0.0
    if previous_due and due > previous_due:
        period_days = (due - previous_due).days
    else:
        period_days = 30
    if period_days <= 0:
        return 0.0
    fraction = min(1.0, early_days / period_days)
    return round(max(0.0, float(interest)) * fraction, 2)


def quote_loan_prepayment(
    original: float,
    monthly_interest_percent: float,
    installment_count: int,
    installment_amount: float,
    loan_type: Optional[str],
    schedule: List[dict],
    pay_count: int,
    as_of: date,
) -> dict:
    """Seçilen bekleyen taksitler için tam tutar, taban (anapara) ve tahmini ödeme."""
    ordered = sorted(schedule, key=lambda s: (s.get('sequence') or 0, s.get('dueDate') or ''))
    slices = loan_amortization_slices(
        original,
        monthly_interest_percent,
        installment_count or len(ordered),
        installment_amount,
        loan_type,
    )
    pending_idx = [(i, s) for i, s in enumerate(ordered) if s.get('status') == 'pending']
    chosen = pending_idx[: max(0, int(pay_count))]
    full = 0.0
    suggested = 0.0
    minimum = 0.0
    for index, item in chosen:
        amount = round(float(item.get('amount') or 0), 2)
        interest = 0.0
        if index < len(slices):
            interest = round(min(amount, max(0.0, float(slices[index]['interest']))), 2)
        try:
            due = parse_date(item.get('dueDate'))
        except (TypeError, ValueError):
            due = as_of
        previous = None
        if index > 0 and ordered[index - 1].get('dueDate'):
            try:
                previous = parse_date(ordered[index - 1]['dueDate'])
            except (TypeError, ValueError):
                previous = None
        discount = min(interest, early_interest_discount(interest, due, previous, as_of))
        pay = round(amount - discount, 2)
        floor = round(max(0.0, amount - interest), 2)
        full += amount
        suggested += pay
        minimum += floor
    return {
        'full': round(full, 2),
        'suggested': round(suggested, 2),
        'minimum': round(minimum, 2),
    }
