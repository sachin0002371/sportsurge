"""
Rate Limiter for Gemini API calls.
Tracks API calls per model per day using a JSON file for persistence.
Resets daily at midnight UTC.
"""
import json
import logging
import os
from datetime import datetime, timezone
from typing import Optional
from app.config import settings

logger = logging.getLogger(__name__)

import tempfile
RATE_LIMITS_FILE = os.path.join(tempfile.gettempdir(), "sportsurge_rate_limits.json")


class RateLimiter:
    """
    Tracks API call counts per model per day.
    Persists to a JSON file so limits survive restarts.
    Resets automatically when the day changes.
    """

    def __init__(self, limits_file: str = RATE_LIMITS_FILE):
        self.limits_file = limits_file
        self._cache: Optional[dict] = None
        self._cache_date: Optional[str] = None

    def _today_key(self) -> str:
        """Return today's date string in UTC."""
        return datetime.now(timezone.utc).strftime("%Y-%m-%d")

    def _load_data(self) -> dict:
        """Load rate limit data from JSON file. Resets if date changed."""
        today = self._today_key()

        # Return cached data if still valid
        if self._cache is not None and self._cache_date == today:
            return self._cache

        # Load from file
        data = {"date": today, "counts": {}}
        if os.path.exists(self.limits_file):
            try:
                with open(self.limits_file, "r") as f:
                    file_data = json.load(f)
                # Only use if it's today's data
                if file_data.get("date") == today:
                    data = file_data
            except (json.JSONDecodeError, IOError) as e:
                logger.warning(f"Rate limit file read error, resetting: {e}")

        self._cache = data
        self._cache_date = today
        return data

    def _save_data(self, data: dict):
        """Persist rate limit data to JSON file."""
        try:
            with open(self.limits_file, "w") as f:
                json.dump(data, f, indent=2)
            self._cache = data
        except IOError as e:
            logger.error(f"Rate limit file write error: {e}")

    def check_limit(self, model_key: str) -> bool:
        """
        Check if a call is allowed for the given model.
        Returns True if allowed, False if limit exceeded.
        """
        max_calls = settings.RATE_LIMIT_MODELS.get(model_key)
        if max_calls is None:
            logger.warning(f"No rate limit configured for model: {model_key}")
            return True

        data = self._load_data()
        current_count = data.get("counts", {}).get(model_key, 0)

        if current_count >= max_calls:
            logger.warning(
                f"Rate limit reached for {model_key}: {current_count}/{max_calls}"
            )
            return False

        return True

    def record_call(self, model_key: str) -> int:
        """
        Record an API call for the given model.
        Returns the new count after incrementing.
        Raises RuntimeError if limit would be exceeded.
        """
        if not self.check_limit(model_key):
            max_calls = settings.RATE_LIMIT_MODELS.get(model_key, 0)
            raise RuntimeError(
                f"Rate limit exceeded for {model_key}. "
                f"Max {max_calls} calls/day. Try again tomorrow."
            )

        data = self._load_data()
        counts = data.setdefault("counts", {})
        counts[model_key] = counts.get(model_key, 0) + 1
        self._save_data(data)

        max_calls = settings.RATE_LIMIT_MODELS.get(model_key, 0)
        logger.info(
            f"Rate limit: {model_key} {counts[model_key]}/{max_calls}"
        )
        return counts[model_key]

    def get_remaining(self, model_key: str) -> int:
        """Get remaining API calls for a model today."""
        max_calls = settings.RATE_LIMIT_MODELS.get(model_key, 0)
        if max_calls == 0:
            return 0

        data = self._load_data()
        current_count = data.get("counts", {}).get(model_key, 0)
        return max(0, max_calls - current_count)

    def get_all_limits(self) -> dict:
        """Get all model limits and current usage."""
        data = self._load_data()
        counts = data.get("counts", {})
        result = {}
        for model_key, max_calls in settings.RATE_LIMIT_MODELS.items():
            current = counts.get(model_key, 0)
            result[model_key] = {
                "model": model_key,
                "max": max_calls,
                "used": current,
                "remaining": max(0, max_calls - current),
                "percentage_used": round((current / max_calls) * 100, 1) if max_calls > 0 else 0,
            }
        return result

    def reset(self):
        """Force reset all counters (useful for testing)."""
        self._cache = None
        self._cache_date = None
        if os.path.exists(self.limits_file):
            try:
                os.remove(self.limits_file)
            except IOError:
                pass


# Global singleton instance
rate_limiter = RateLimiter()
