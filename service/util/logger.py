import logging

logging.basicConfig(
    format="%(asctime)s - %(module)s - %(levelname)s - %(message)s", level=logging.DEBUG
)

logger = logging.getLogger("CDMServer")
