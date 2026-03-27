#!/bin/bash
set -e
cd /home/sentinel-pro-max/dev/swarm-company/custodia
git pull origin main
npm ci
npm run build
pm2 restart custodia || pm2 start npm --name custodia -- start
