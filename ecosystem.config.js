module.exports = {
  apps: [
    {
      name: "aibiliti",
      script: "./dist/index.js", // Path to the entry point of your application
      instances: "1", // Number of instances to be started
      exec_mode: "cluster", // Enables cluster mode
    },
  ],
};
