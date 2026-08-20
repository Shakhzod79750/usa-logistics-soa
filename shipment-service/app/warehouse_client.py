import httpx
from fastapi import HTTPException
from .config import settings
from .logging_config import logger


async def check_and_reserve_stock(warehouse_id: int, sku_items: list, token: str):
    """Calls the Warehouse Service to verify a warehouse exists. Demonstrates
    SOA-style synchronous, cross-language-capable service-to-service
    interoperability (this pair happens to be Python <-> Python; the
    Tracking -> Shipment pair is the Node.js <-> Python leg)."""
    url = f"{settings.warehouse_service_url}/warehouses/{warehouse_id}"
    headers = {"Authorization": f"Bearer {token}"}
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url, headers=headers)
        if resp.status_code == 404:
            raise HTTPException(status_code=400, detail=f"Warehouse {warehouse_id} does not exist")
        resp.raise_for_status()
        return resp.json(), resp.status_code
    except httpx.RequestError as exc:
        logger.error(f"Warehouse Service unreachable: {exc}")
        raise HTTPException(status_code=503, detail="Warehouse Service is currently unavailable")
