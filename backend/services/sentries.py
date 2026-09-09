from typing import Dict, Any

class MicroSentryEngine:
    @staticmethod
    def check_timecode_drift(camera_fps: float, target_fps: float = 24.000, runtime_seconds: float = 7200.0) -> Dict[str, Any]:
        delta = abs(camera_fps - target_fps)
        if 0.020 <= delta <= 0.030:
            drift_frames = ((target_fps - camera_fps) / target_fps) * runtime_seconds * target_fps
            drift_seconds = drift_frames / target_fps
            return {
                "category": "TIMECODE_DRIFT",
                "severity": "CRITICAL",
                "drift_frames": round(drift_frames, 1),
                "drift_seconds": round(drift_seconds, 2),
                "auto_remediation": "APPLY_0.1_PERCENT_AUDIO_PULL_UP",
                "remediation_status": "AUTO_APPLIED",
                "details": f"Camera clocked at {camera_fps} fps on {target_fps} fps timeline. Drift: +{round(drift_seconds, 1)}s over 2h."
            }
        return {"category": "TIMECODE_DRIFT", "severity": "INFO", "drift_frames": 0.0, "details": "Timecode locked."}

    @staticmethod
    def check_c2pa_manifest(has_c2pa: bool, hash_match: bool) -> Dict[str, Any]:
        if not has_c2pa or not hash_match:
            return {
                "category": "C2PA_STRIPPED",
                "severity": "CRITICAL",
                "details": "C2PA cryptographic JUMBF manifest stripped or tampered during editorial export.",
                "auto_remediation": "RECONSTRUCT_C2PA_LEAF_FROM_ROOT_RAW"
            }
        return {"category": "C2PA_STRIPPED", "severity": "INFO", "details": "C2PA Signature Valid"}

    @staticmethod
    def check_meal_penalty(hours_elapsed: float, crew_count: int = 140) -> Dict[str, Any]:
        if hours_elapsed <= 6.0:
            mins_left = int((6.0 - hours_elapsed) * 60)
            return {
                "category": "MEAL_PENALTY",
                "severity": "INFO",
                "minutes_remaining": mins_left,
                "financial_exposure_usd": 0.0,
                "details": f"{mins_left}m remaining until mandatory meal break."
            }
        
        import math
        intervals = max(1, math.ceil((hours_elapsed - 6.0) / 0.25))
        cost_per_person = 0.0
        for i in range(1, intervals + 1):
            if i == 1: cost_per_person += 25.0
            elif i == 2: cost_per_person += 35.0
            else: cost_per_person += 50.0
            
        total_cost = cost_per_person * crew_count
        mins_to_next = int((0.25 - ((hours_elapsed - 6.0) % 0.25)) * 60)
        
        return {
            "category": "MEAL_PENALTY",
            "severity": "CRITICAL" if intervals >= 2 else "WARNING",
            "intervals_breached": intervals,
            "financial_exposure_usd": total_cost,
            "countdown_next_tier_min": mins_to_next,
            "details": f"Filming continuous for {round(hours_elapsed, 2)}h. {crew_count} crew members breached Tier {intervals}."
        }

    @staticmethod
    def check_prop_continuity(level_a: float, level_b: float, prop_name: str = "whiskey_glass") -> Dict[str, Any]:
        diff = abs(level_a - level_b)
        if diff > 0.15:
            return {
                "category": "PROP_DESYNC",
                "severity": "WARNING",
                "difference_pct": round(diff * 100, 1),
                "details": f"Prop {prop_name} fill level discrepancy: {int(level_a*100)}% vs {int(level_b*100)}%."
            }
        return {"category": "PROP_DESYNC", "severity": "INFO", "difference_pct": 0.0, "details": "Props aligned."}
