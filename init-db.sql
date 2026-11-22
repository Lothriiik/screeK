SELECT 'CREATE DATABASE screek'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'screek')\gexec

SELECT 'CREATE DATABASE screek_test'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'screek_test')\gexec
