from celery import Celery
import os

app = Celery('app',
            broker=os.getenv('REDIS_URL', 'redis://redis:6379/0'),
            backend=os.getenv('REDIS_URL', 'redis://redis:6379/0'),
            include=['app.tasks'])

app.conf.update(
    task_default_queue='celery',
    task_routes={
        'app.tasks.check_certificate': {'queue': 'celery'},
        'app.tasks.check_all_certificates': {'queue': 'celery'}
    },
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    enable_utc=True,
    beat_schedule={
        'check-certificates-every-16-hours': {
            'task': 'app.tasks.check_all_certificates',
            'schedule': 16 * 3600,  # 16 hours in seconds
        },
    }
)

# Import tasks to ensure they are registered
from . import tasks
