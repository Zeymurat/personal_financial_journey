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
