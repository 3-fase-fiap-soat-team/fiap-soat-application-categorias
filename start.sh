#!/bin/bash
echo "Running migrations..."
npm run migration:up
echo "Starting application..."
npm run start:prod