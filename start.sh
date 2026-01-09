#!/bin/bash
echo "🚀 Starting Categorias Microservice..."
echo "📦 Running database migrations..."
npm run migration:up
echo "✅ Migrations completed!"
echo "🚀 Starting application..."
npm run start:prod
