# cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte d990067a9 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
_clock.py - the one clock of the harness scripts: Brasília time.

Why it exists (F73 R4, audit 2026-10-25): the same "now in Brasília" was written in 19 files, with two different
fallbacks when the zone database is missing. The device bridge and the cloud run in UTC (2026-10-09), so a script that
reads the host's clock writes the wrong hour into a log entry. Every script asks this module instead.

The fallback is ONE: a fixed UTC-3 (Brasília has had no daylight saving since 2019).
"""
from datetime import date, datetime, timedelta, timezone

TZ_NAME = "America/Sao_Paulo"
_FALLBACK = timezone(timedelta(hours=-3))
STAMP = "%Y-%m-%d %H:%M"


def tz(name=None):
    """The tzinfo of `name` (Brasília by default); the fixed UTC-3 when the zone database cannot give it."""
    try:
        from zoneinfo import ZoneInfo
        return ZoneInfo(name or TZ_NAME)
    except Exception:
        return _FALLBACK


def now(name=None):
    """Now, timezone-aware, in `name` (Brasília by default)."""
    return datetime.now(tz(name))


def now_naive(name=None):
    """Now without tzinfo, in `name` - the shape the `AAAA-MM-DD HH:MM` stamps of the repository compare against."""
    return now(name).replace(tzinfo=None)


def today(name=None) -> date:
    return now(name).date()


def stamp(name=None, fmt=STAMP):
    """Now as text; the default is the `AAAA-MM-DD HH:MM` of the log and the `## Now`."""
    return now(name).strftime(fmt)


def iso(name=None):
    """Now as ISO-8601 with the offset, to the second."""
    return now(name).isoformat(timespec="seconds")


def contract_today(cfg) -> date:
    """Today in the zone the contract declares (Brasília by default)."""
    return today(contract_tz(cfg))


def contract_iso(cfg):
    """The instant of this pass in the contract's zone, ISO-8601 with the offset."""
    return iso(contract_tz(cfg))


def to_naive(moment, name=None):
    """An aware datetime as the naive wall clock of `name` (Brasília by default)."""
    return moment.astimezone(tz(name)).replace(tzinfo=None)


def contract_tz(cfg):
    """The zone a contract declares (`locale.timezone`), Brasília when it declares none."""
    return ((cfg or {}).get("locale") or {}).get("timezone") or TZ_NAME


def from_timestamp(ts, name=None):
    """A unix timestamp as an aware datetime in `name` (Brasília by default)."""
    return datetime.fromtimestamp(int(ts), tz(name))
