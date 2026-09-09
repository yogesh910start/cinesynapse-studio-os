import unittest
from backend.services.sentries import MicroSentryEngine
from backend.database.clickhouse_client import clickhouse_engine
from backend.storage.provider import storage_provider
from backend.config import settings

class TestCineSynapseCore(unittest.TestCase):
    def test_fractional_timecode_drift(self):
        res = MicroSentryEngine.check_timecode_drift(camera_fps=23.976, target_fps=24.000, runtime_seconds=7200.0)
        self.assertEqual(res["severity"], "CRITICAL")
        self.assertEqual(res["drift_seconds"], 7.2)
        self.assertEqual(res["auto_remediation"], "APPLY_0.1_PERCENT_AUDIO_PULL_UP")

    def test_meal_penalty_calculation(self):
        res = MicroSentryEngine.check_meal_penalty(hours_elapsed=6.75, crew_count=140)
        self.assertEqual(res["severity"], "CRITICAL")
        self.assertEqual(res["intervals_breached"], 3)
        self.assertEqual(res["financial_exposure_usd"], 15400.0)

    def test_prop_continuity_detection(self):
        res = MicroSentryEngine.check_prop_continuity(level_a=0.42, level_b=0.68)
        self.assertEqual(res["severity"], "WARNING")
        self.assertEqual(res["difference_pct"], 26.0)

    def test_c2pa_manifest_validation(self):
        res = MicroSentryEngine.check_c2pa_manifest(has_c2pa=False, hash_match=False)
        self.assertEqual(res["severity"], "CRITICAL")
        self.assertEqual(res["auto_remediation"], "RECONSTRUCT_C2PA_LEAF_FROM_ROOT_RAW")

    def test_clickhouse_columnar_simulation(self):
        state = clickhouse_engine.get_tenant_state("paramount_pictures")
        self.assertEqual(state["active_project"], "CHRONO-2026")
        self.assertTrue(len(state["likeness"]) > 0)
        self.assertEqual(state["likeness"][0]["actor_id"], "ACTOR_MARCUS_VANCE")

    def test_scenario_trigger_state_mutation(self):
        res = clickhouse_engine.trigger_scenario("paramount_pictures", "timecode_drift")
        self.assertEqual(res["status"], "PULL_UP_APPLIED")

if __name__ == "__main__":
    unittest.main()
