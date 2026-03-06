module.exports = {
  apps: [{
    name: 'lovelifestyle',
    cwd: '/var/www/lovelifestyle',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      NEXT_SERVER_ACTIONS_ENCRYPTION_KEY: 'ePsIjS74nB3LB7Ji5Mz42CdutjtZ+MU3ZcYoAn13fKo='
    },
    instances: 1,
    exec_mode: 'fork',
    watch: false
  }]
};
