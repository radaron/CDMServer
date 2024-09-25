import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import Table, Column, Integer, String, MetaData
from sqlalchemy.future import select

# Define the connection string
username = 'myuser'
password = 'mypassword'
hostname = 'mysql'
database_name = 'mydatabase'

connection_string = f'mysql+aiomysql://{username}:{password}@{hostname}/{database_name}'

# Create the asynchronous engine
async_engine = create_async_engine(connection_string, echo=True)

# Define the metadata
metadata = MetaData()

# Define the table schema
your_table = Table(
    'your_table_name', metadata,
    Column('id', Integer, primary_key=True),
    Column('name', String(50)),
    Column('age', Integer)
)


# Asynchronous function to create the table
async def create_table():
    async with async_engine.begin() as conn:
        await conn.run_sync(metadata.create_all)


# Asynchronous function to verify the table creation
async def verify_table():
    async with AsyncSession(async_engine) as session:
        async with session.begin():
            result = await session.execute(select(your_table))
            for row in result:
                print(row)


# Main function to run the async tasks
async def main():
    await create_table()
    await verify_table()

# Run the main function
asyncio.run(main())
