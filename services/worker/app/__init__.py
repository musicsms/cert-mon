from celery import Celery
import os

app = Celery('app',
            broker=os.getenv('REDIS_URL', 'redis://redis:6379/0'),
            backend=os.getenv('REDIS_URL', 'redis://redis:6379/0'))

app.conf.update(
    task_default_queue='celery',
    task_routes={
        'app.tasks.check_certificate': {'queue': 'celery'}
    },
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    enable_utc=True,
)
