module.exports = {
  apps: [{
    name: 'custodia',
    script: '.next/standalone/server.js',
    cwd: '/home/sentinel-pro-max/dev/swarm-company/custodia',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      // Sentry — DSN is a public identifier (baked into client bundle anyway).
      // Auth token + org/project live in .env.local for build-time source map upload.
      NEXT_PUBLIC_SENTRY_DSN: 'https://adede79e6fb00205b0ea8e32644c29bd@o4511262655840256.ingest.de.sentry.io/4511262658003024',
      SENTRY_DSN: 'https://adede79e6fb00205b0ea8e32644c29bd@o4511262655840256.ingest.de.sentry.io/4511262658003024',
    },
  }],
}
