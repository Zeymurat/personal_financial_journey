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


def build_installment_due_dates(
    purchase_date: date,
    cutoff_day: int,
    installment_count: int,
) -> List[date]:
    count = max(1, int(installment_count))
    first = next_statement_date(purchase_date, cutoff_day)
    return [add_months(first, i) for i in range(count)]


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
    Period: (previous_statement, next_statement] — charges with dueDate == next_statement.
    """
    day = max(1, min(int(cutoff_day), 28))
    # Next cutoff relative to as_of using same classic rule
    next_cut = next_statement_date(as_of, day)
    # Previous cutoff = one month before next
    prev_cut = add_months(next_cut, -1)
    return prev_cut, next_cut
