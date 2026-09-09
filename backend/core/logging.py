import json
import logging
import datetime
from collections import deque
from typing import List, Dict, Any

class JSONLogFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "severity": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "correlation_id": getattr(record, "correlation_id", "system-init"),
            "tenant_id": getattr(record, "tenant_id", "global")
        }
        if hasattr(record, "extra_fields"):
            log_data.update(record.extra_fields)
        return json.dumps(log_data)

# In-memory telemetry log buffer for UI live log streaming (Ring Buffer of 200 entries)
class TelemetryLogBuffer:
    def __init__(self, max_size=200):
        self.buffer: deque = deque(maxlen=max_size)

    def append(self, log_entry: Dict[str, Any]):
        self.buffer.append(log_entry)

    def get_recent(self, limit: int = 50) -> List[Dict[str, Any]]:
        return list(self.buffer)[-limit:]

telemetry_buffer = TelemetryLogBuffer()

def log_telemetry(severity: str, source: str, message: str, tenant_id: str = "paramount_pictures", **kwargs):
    entry = {
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "severity": severity,
        "source": source,
        "message": message,
        "tenant_id": tenant_id,
        **kwargs
    }
    telemetry_buffer.append(entry)
    print(f"[{entry['severity']}] [{entry['source']}] {entry['message']}")
