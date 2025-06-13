module.exports = {
  apps: [{
    name: 'chat-app',
    script: './src/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 7777
    },
    max_memory_restart: '1G',
    watch: false,
    merge_logs: true,
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss'
  }]
};