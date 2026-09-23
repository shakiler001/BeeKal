-- Extra databases created on first initialisation of the Postgres volume.
--
-- Umami shares the Postgres instance but must not share the application's
-- database: its migrations are its own, and mixing them would make a Beekal
-- schema diff unreadable.
SELECT 'CREATE DATABASE umami'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'umami')\gexec
