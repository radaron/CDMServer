# CDMServer
CDM - Centralized Download Manager Server


## Database migration

When DB datastructure changes you can run
```
alembic revision --autogenerate -m "<migration name here>"
```
Then run the migration
```
alembic upgrade head
```