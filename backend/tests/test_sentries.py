import pytest
from backend.services.sentries import MicroSentryEngine

def test_fractional_timecode_drift():
    # Camera at 23.976 on 24.000 fps project
    res = MicroSentryEngine.check_timecode_drift(camera_fps=23.976, target_fps=24.000, runtime_seconds=7200.0)
    assert res["severity"] == "CRITICAL"
    assert res["drift_seconds"] == 7.2
    assert res["auto_remediation"] == "APPLY_0.1_PERCENT_AUDIO_PULL_UP"

def test_timecode_locked():
    res = MicroSentryEngine.check_timecode_drift(camera_fps=24.000, target_fps=24.000)
    assert res["severity"] == "INFO"
    assert res["drift_frames"] == 0.0

def test_meal_penalty_grace_period():
    # 5.5 hours elapsed (under 6h)
    res = MicroSentryEngine.check_meal_penalty(hours_elapsed=5.5, crew_count=100)
    assert res["severity"] == "INFO"
    assert res["financial_exposure_usd"] == 0.0

def test_meal_penalty_breached():
    # 6.75 hours elapsed (3 intervals) for 140 crew
    res = MicroSentryEngine.check_meal_penalty(hours_elapsed=6.75, crew_count=140)
    assert res["severity"] == "CRITICAL"
    assert res["intervals_breached"] == 3
    # 25 + 35 + 50 = 110 * 140 = 15,400
    assert res["financial_exposure_usd"] == 15400.0

def test_prop_continuity():
    # Discrepancy > 15%
    res = MicroSentryEngine.check_prop_continuity(level_a=0.42, level_b=0.68)
    assert res["severity"] == "WARNING"
    assert res["difference_pct"] == 26.0

def test_c2pa_manifest_check():
    res = MicroSentryEngine.check_c2pa_manifest(has_c2pa=False, hash_match=False)
    assert res["severity"] == "CRITICAL"
    assert res["auto_remediation"] == "RECONSTRUCT_C2PA_LEAF_FROM_ROOT_RAW"
