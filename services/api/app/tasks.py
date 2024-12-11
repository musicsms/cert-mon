from celery import Celery
import os

celery = Celery('app',
                broker=os.getenv('REDIS_URL', 'redis://redis:6379/0'),
                backend=os.getenv('REDIS_URL', 'redis://redis:6379/0'))

celery.conf.update(
    task_default_queue='celery',
    task_routes={
        'app.tasks.check_certificate': {'queue': 'celery'}
    },
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    enable_utc=True,
)

@celery.task(name='app.tasks.check_certificate')
def check_certificate(cert_id):
    """
    This is a placeholder task that will be executed by the worker service.
    The actual implementation is in the worker service.
    """
    return {'cert_id': cert_id}
