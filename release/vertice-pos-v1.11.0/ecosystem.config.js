module.exports = {
    apps: [
        {
            name: 'vertice-api',
            script: 'dist/index.js',
            cwd: './vertice-nodejs-api',
            instances: 1,
            exec_mode: 'fork',
            watch: false,
            autorestart: true,
            max_restarts: 10,
            min_uptime: '10s',
            max_memory_restart: '500M',
            env: {
                NODE_ENV: 'production',
                PORT: 3000,
                HOST: '0.0.0.0'
            },
            error_file: './logs/api-error.log',
            out_file: './logs/api-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true,
            kill_timeout: 5000,
            listen_timeout: 10000,
            shutdown_with_message: true,
            wait_ready: false,
            restart_delay: 4000,
            exp_backoff_restart_delay: 100,
            cron_restart: '0 3 * * *' // Restart diario a las 3 AM
        },
        {
            name: 'vertice-print',
            script: 'index.js',
            cwd: './vertice-print-server',
            instances: 1,
            exec_mode: 'fork',
            watch: false,
            autorestart: true,
            max_restarts: 10,
            min_uptime: '10s',
            max_memory_restart: '300M',
            env: {
                NODE_ENV: 'production',
                PORT: 3001
            },
            error_file: './logs/print-error.log',
            out_file: './logs/print-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true,
            kill_timeout: 5000,
            listen_timeout: 10000,
            restart_delay: 4000,
            exp_backoff_restart_delay: 100,
            cron_restart: '0 3 * * *'
        }
    ]
};
