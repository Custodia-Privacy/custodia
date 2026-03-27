module.exports = {
  apps: [{
    name: 'custodia',
    script: 'npm',
    args: 'start',
    cwd: '/home/sentinel-pro-max/dev/swarm-company/custodia',
    env: { NODE_ENV: 'production', PORT: 3001 }
  }]
}
