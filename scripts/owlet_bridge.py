#!/usr/bin/env python3
"""
Owlet -> Supabase bridge for Tombstone.

Polls the Owlet API and upserts normalized snapshots into the
`owlet_readings` table used by the Tombstone app.
"""

from __future__ import annotations

import json
import logging
import os
import time
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional

import requests
from owlet_api.owletapi import OwletAPI

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
    prop = props.get(key)
    if prop is None:
        return None
    return getattr(prop, "value", prop)


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
    for key, prop in props.items():
        value = getattr(prop, "value", None)
        try:
            json.dumps(value)
            data[key] = value
        except TypeError:
            data[key] = str(value)
    return data


def recorded_at_ms(props: Dict[str, Any]) -> int:
    ts = get_prop_value(props, "TIMESTAMP")
    parsed = as_float(ts)
    if parsed is None:
        return int(time.time() * 1000)
    # Owlet example shows UNIX seconds with fraction.
    if parsed > 10_000_000_000:
        return int(parsed)
    return int(parsed * 1000)


def build_row(child_id: str, props: Dict[str, Any]) -> Dict[str, Any]:
    dsn = str(get_prop_value(props, "DSN") or "unknown")
    hr = as_int(get_prop_value(props, "HEART_RATE"))
    ox = as_float(get_prop_value(props, "OXYGEN_LEVEL"))
    movement = as_float(get_prop_value(props, "MOVEMENT"))
    sock_conn = as_bool(get_prop_value(props, "SOCK_CONNECTION"))
    battery = as_float(get_prop_value(props, "BATT_LEVEL"))

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
        "sleepState": normalize_sleep_state(get_prop_value(props, "SOCK_OFF"), movement),
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
        raise RuntimeError(f"Supabase upsert failed ({response.status_code}): {response.text[:400]}")


def choose_device(api: OwletAPI, configured_dsn: Optional[str]) -> Any:
    devices = api.get_devices()
    if not devices:
        raise RuntimeError("No Owlet devices found for this account")

    if not configured_dsn:
        return devices[0]

    for device in devices:
        try:
            device.update()
            props = device.get_properties()
            if str(get_prop_value(props, "DSN") or "") == configured_dsn:
                return device
        except Exception:
            continue

    raise RuntimeError(f"Configured OWLET_DEVICE_DSN not found: {configured_dsn}")


def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
    )

    owlet_email = env_required("OWLET_EMAIL")
    owlet_password = env_required("OWLET_PASSWORD")
    supabase_url = env_required("SUPABASE_URL")
    supabase_service_role_key = env_required("SUPABASE_SERVICE_ROLE_KEY")

    child_id = os.getenv("TOMBSTONE_CHILD_ID", DEFAULT_CHILD_ID).strip() or DEFAULT_CHILD_ID
    poll_seconds = env_int("OWLET_POLL_SECONDS", 30)
    configured_dsn = os.getenv("OWLET_DEVICE_DSN", "").strip() or None

    api = OwletAPI(owlet_email, owlet_password)
    api.login()
    logging.info("Owlet login succeeded")

    device = choose_device(api, configured_dsn)
    logging.info("Owlet device selected")

    while True:
        try:
            device.update()
            device.reactivate()
            props = device.get_properties()
            row = build_row(child_id, props)
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
                api.login()
                device = choose_device(api, configured_dsn)
                logging.info("Re-authenticated with Owlet after error")
            except Exception as relogin_exc:
                logging.exception("Owlet re-login failed: %s", relogin_exc)

        time.sleep(max(5, poll_seconds))


if __name__ == "__main__":
    main()
