import logging
import sys
from .config import settings


def setup_logging():
    logging.basicConfig(
        level=settings.log_level,
        format='{"time":"%(asctime)s","level":"%(levelname)s","service":"shipment-service","msg":"%(message)s"}',
        handlers=[logging.StreamHandler(sys.stdout)],
    )
    return logging.getLogger("shipment-service")


logger = setup_logging()
