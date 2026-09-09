import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from backend.main import app
from backend.storage.provider import storage_provider

@pytest.mark.asyncio
async def test_healthz_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/healthz")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

@pytest.mark.asyncio
async def test_readyz_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/readyz")
    assert response.status_code == 200
    assert response.json()["status"] == "ready"

@pytest.mark.asyncio
async def test_metrics_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/metrics")
    assert response.status_code == 200
    assert "cinesynapse_http_requests_total" in response.text

@pytest.mark.asyncio
async def test_storage_quota():
    quota = await storage_provider.get_storage_quota("paramount_pictures")
    assert quota["quota_human"] == "25.0 PB"
    assert quota["utilization_pct"] > 0
    assert len(quota["tiers"]) == 3
    assert quota["security"]["tpn_certification"].startswith("TPN Gold Shield")
    assert quota["bandwidth"]["aggregate_fabric_gbps"] == 800.0

@pytest.mark.asyncio
async def test_storage_security_audit_and_key_rotation():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Verify Security Audit
        res_audit = await ac.post("/api/v1/storage/security/verify", headers={"x-tenant-id": "paramount_pictures"})
        assert res_audit.status_code == 200
        audit_data = res_audit.json()
        assert audit_data["status"] == "PASSED_WITH_ZERO_INFRACTIONS"
        assert audit_data["tpn_compliance"] == "TPN Gold Shield v5.2 Certified 100%"
        assert audit_data["verified_c2pa_hashes"] > 0

        # Verify KMS Key Rotation
        res_rot = await ac.post("/api/v1/storage/security/rotate-key", headers={"x-tenant-id": "paramount_pictures"})
        assert res_rot.status_code == 200
        rot_data = res_rot.json()
        assert rot_data["status"] == "KEY_ROTATED_SUCCESSFULLY"
        assert "v4" in rot_data["old_key_version"] or "v" in rot_data["old_key_version"]
        assert rot_data["re_encrypted_assets_count"] > 0


@pytest.mark.asyncio
async def test_horror_media_listing_and_streaming():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Test listing
        res = await ac.get("/api/v1/media/horror/files")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "OK"
        assert data["footage_count"] == 4
        assert len(data["clips"]) == 4
        
        # Test range streaming for cam-a
        stream_res = await ac.get("/api/v1/media/horror/stream/cam-a", headers={"Range": "bytes=0-511"})
        assert stream_res.status_code == 206
        assert stream_res.headers.get("Content-Range", "").startswith("bytes 0-511/")
        assert len(stream_res.content) == 512

