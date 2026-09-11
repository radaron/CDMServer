from celery import Celery
from celery.schedules import crontab

from service.util.configuration import settings

broker_url = f"redis://{settings.redis_host}:{settings.redis_port}/0"

app = Celery("cdm_worker", broker=broker_url, backend=broker_url, include=["worker.tasks"])
app.conf.task_serializer = "json"
app.conf.result_serializer = "json"
app.conf.accept_content = ["json"]
app.conf.timezone = "UTC"

app.conf.beat_schedule = {
    "scan-wishlist-weekly": {
        "task": "worker.tasks.scan_all_wishlist",
        "schedule": crontab(hour=3, minute=0, day_of_week=1),
    },
    # "scan-wishlist-every-minute": {
    #     "task": "worker.tasks.scan_all_wishlist",
    #     "schedule": crontab(),
    # }
}
