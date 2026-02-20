#!/bin/sh

# Esperar a que la DB esté lista (simple sleep o loop de conexión)
echo "Esperando a que la base de datos esté lista..."
until nc -z $DATABASE_HOST $DATABASE_PORT; do
  echo "Postgres no disponible - esperando..."
  sleep 2
done

echo "Ejecutando migraciones..."
npm run migration:run

echo "Poblando base de datos (Seeding)..."
npm run seed

echo "Iniciando aplicación..."
npm run start:prod
