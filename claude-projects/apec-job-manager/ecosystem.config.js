module.exports = {
  apps: [{
    name: 'apec-job-manager',
    script: 'src/server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G',
    watch: false,
    ignore_watch: [
      'node_modules',
      'logs',
      'exports',
      'screenshots',
      'dashboard'
    ],
    max_restarts: 10,
    min_uptime: '10s',
    kill_timeout: 5000
  }]
}
