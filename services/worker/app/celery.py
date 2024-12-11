from . import app
from . import tasks

# This is required to ensure the tasks are registered
app.autodiscover_tasks(['app.tasks'])
