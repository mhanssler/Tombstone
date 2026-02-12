#!/usr/bin/env python3
"""
Owlet -> Supabase bridge for Tombstone.

Polls Owlet cloud and upserts normalized snapshots into
`owlet_readings` in Supabase.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import time
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional

import requests
from pyowletapi.api import OwletAPI

DEFAULT_CHILD_ID = "00000000-0000-0000-0000-000000000001"
UPSERT_ENDPOINT = "/rest/v1/owlet_readings?on_conflict=id"


def env_required(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"Missing required env var: {name}")
    return value


def env_int(name: str, default: int) -> int:
    value = os.getenv(name)
    if value is None or value.strip() == "":
        return default
    return int(value)


def get_prop_value(props: Dict[str, Any], key: str) -> Any:
    item = props.get(key)
    if item is None:
        return None
    if isinstance(item, dict):
        if "value" in item:
            return item.get("value")
        return item
    return getattr(item, "value", item)


def as_float(value: Any) -> Optional[float]:
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def as_int(value: Any) -> Optional[int]:
    if value is None or value == "":
        return None
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return None


def as_bool(value: Any) -> Optional[bool]:
    if value is None or value == "":
        return None
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return value != 0
    if isinstance(value, str):
        lowered = value.strip().lower()
        if lowered in ("1", "true", "yes", "on"):
            return True
        if lowered in ("0", "false", "no", "off"):
            return False
    return None


def normalize_sleep_state(sock_off: Any, movement: Any) -> str:
    sock_off_bool = as_bool(sock_off)
    movement_num = as_float(movement)

    if sock_off_bool:
        return "unknown"
    if movement_num is None:
        return "unknown"
    if movement_num <= 0:
        return "asleep"
    return "awake"


def safe_raw_payload(props: Dict[str, Any]) -> Dict[str, Any]:
    data: Dict[str, Any] = {}
    for key, item in props.items():
        value = item.get("value") if isinstance(item, dict) else getattr(item, "value", item)
        try:
            json.dumps(value)
            data[key] = value
        except TypeError:
            data[key] = str(value)
    return data


def parse_realtime_vitals(props: Dict[str, Any]) -> Dict[str, Any]:
    raw = get_prop_value(props, "REAL_TIME_VITALS")
    if isinstance(raw, str):
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, dict):
                return parsed
        except json.JSONDecodeError:
            return {}
    if isinstance(raw, dict):
        return raw
    return {}


def recorded_at_ms(props: Dict[str, Any]) -> int:
    # pyowletapi v3 field
    ts = get_prop_value(props, "data_updated_at")
    parsed = as_float(ts)
    if parsed is None:
        # v2 fallback
        ts2 = get_prop_value(props, "TIMESTAMP")
        parsed = as_float(ts2)
    if parsed is None:
        return int(time.time() * 1000)

    # if seconds -> ms
    if parsed < 10_000_000_000:
        return int(parsed * 1000)
    return int(parsed)


def build_row(child_id: str, dsn: str, props: Dict[str, Any]) -> Dict[str, Any]:
    rt_vitals = parse_realtime_vitals(props)

    hr = as_int(
        get_prop_value(props, "heart_rate")
        or rt_vitals.get("hr")
        or get_prop_value(props, "HEART_RATE")
        or get_prop_value(props, "hr")
    )
    ox = as_float(
        get_prop_value(props, "oxygen_saturation")
        or rt_vitals.get("ox")
        or get_prop_value(props, "OXYGEN_LEVEL")
        or get_prop_value(props, "ox")
    )
    movement = as_float(
        get_prop_value(props, "movement")
        or rt_vitals.get("mv")
        or get_prop_value(props, "MOVEMENT")
        or get_prop_value(props, "mv")
    )
    sock_conn = as_bool(
        get_prop_value(props, "sock_connection")
        or rt_vitals.get("sc")
        or get_prop_value(props, "SOCK_CONNECTION")
        or get_prop_value(props, "sc")
    )
    battery = as_float(
        get_prop_value(props, "battery_percentage")
        or rt_vitals.get("bat")
        or get_prop_value(props, "BATT_LEVEL")
        or get_prop_value(props, "bat")
    )

    ts_ms = recorded_at_ms(props)
    source_session_id = f"{dsn}:{ts_ms}"
    record_id = str(uuid.uuid5(uuid.NAMESPACE_URL, source_session_id))

    return {
        "id": record_id,
        "childId": child_id,
        "recordedAt": ts_ms,
        "heartRateBpm": hr,
        "oxygenSaturationPct": ox,
        "movementLevel": movement,
        "sleepState": normalize_sleep_state(
            get_prop_value(props, "sock_off") or get_prop_value(props, "SOCK_OFF"),
            movement,
        ),
        "sockConnected": sock_conn,
        "batteryPct": battery,
        "sourceDeviceId": dsn,
        "sourceSessionId": source_session_id,
        "rawPayload": safe_raw_payload(props),
        "createdAt": ts_ms,
        "updatedAt": ts_ms,
        "syncStatus": "synced",
        "_deleted": False,
    }


def supabase_error_hint(status_code: int, response_text: str) -> Optional[str]:
    lowered = response_text.lower()
    if "invalid api key" in lowered:
        return (
            "Check that SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are from the same project, "
            "and that the key was copied completely."
        )
    if "42501" in lowered or "row-level security" in lowered:
        return (
            "Bridge upserts require a service_role key. Do not use anon/authenticated keys for "
            "SUPABASE_SERVICE_ROLE_KEY."
        )
    if status_code in (401, 403):
        return "Auth failed. Bridge writes require SUPABASE_SERVICE_ROLE_KEY (service_role), not anon."
    return None


def upsert_row(supabase_url: str, service_role_key: str, row: Dict[str, Any]) -> None:
    url = f"{supabase_url.rstrip('/')}{UPSERT_ENDPOINT}"
    headers = {
        "apikey": service_role_key,
        "Authorization": f"Bearer {service_role_key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal",
    }
    response = requests.post(url, headers=headers, json=[row], timeout=20)
    if response.status_code >= 400:
        body = response.text[:400]
        hint = supabase_error_hint(response.status_code, response.text)
        if hint:
            raise RuntimeError(f"Supabase upsert failed ({response.status_code}): {body} | Hint: {hint}")
        raise RuntimeError(f"Supabase upsert failed ({response.status_code}): {body}")


async def choose_device_dsn(api: OwletAPI, configured_dsn: Optional[str]) -> str:
    devices = await api.get_devices()
    response_devices = devices.get("response", [])
    if not response_devices:
        raise RuntimeError("No Owlet devices found for this account")

    if configured_dsn:
        for item in response_devices:
            dsn = str(item.get("device", {}).get("dsn", ""))
            if dsn == configured_dsn:
                return dsn
        raise RuntimeError(f"Configured OWLET_DEVICE_DSN not found: {configured_dsn}")

    return str(response_devices[0].get("device", {}).get("dsn", ""))


async def run_bridge() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

    owlet_email = env_required("OWLET_EMAIL")
    owlet_password = env_required("OWLET_PASSWORD")
    supabase_url = env_required("SUPABASE_URL")
    supabase_service_role_key = env_required("SUPABASE_SERVICE_ROLE_KEY")

    child_id = os.getenv("TOMBSTONE_CHILD_ID", DEFAULT_CHILD_ID).strip() or DEFAULT_CHILD_ID
    poll_seconds = env_int("OWLET_POLL_SECONDS", 30)
    configured_dsn = os.getenv("OWLET_DEVICE_DSN", "").strip() or None
    owlet_region = os.getenv("OWLET_REGION", "world").strip().lower() or "world"

    api = OwletAPI(region=owlet_region, user=owlet_email, password=owlet_password)

    try:
        await api.authenticate()
        logging.info("Owlet authentication succeeded (region=%s)", owlet_region)
        dsn = await choose_device_dsn(api, configured_dsn)
        logging.info("Owlet device selected: %s", dsn)

        while True:
            try:
                response = await api.get_properties(dsn)
                props = response.get("response", {})
                row = build_row(child_id, dsn, props)
                upsert_row(supabase_url, supabase_service_role_key, row)

                iso = datetime.fromtimestamp(row["recordedAt"] / 1000, tz=timezone.utc).isoformat()
                logging.info(
                    "Upserted %s HR=%s O2=%s movement=%s sock=%s",
                    iso,
                    row["heartRateBpm"],
                    row["oxygenSaturationPct"],
                    row["movementLevel"],
                    row["sockConnected"],
                )
            except Exception as exc:
                logging.exception("Bridge loop error: %s", exc)
                try:
                    await api.authenticate()
                    dsn = await choose_device_dsn(api, configured_dsn)
                    logging.info("Re-authenticated with Owlet after error")
                except Exception as relogin_exc:
                    logging.exception("Owlet re-auth failed: %s", relogin_exc)

            await asyncio.sleep(max(5, poll_seconds))
    finally:
        await api.close()


if __name__ == "__main__":
    asyncio.run(run_bridge())
