module.exports = {
    apps: [{
        name: "bundleapp-backend",
        script: "/var/www/app/backend/index.js",
        instances: "max",
        exec_mode: "cluster",
        max_memory_restart: "300M"
    }]
}