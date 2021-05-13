module.exports = {
  apps: [
    {
      name: 'medha-sis-strapi-dev',
      cwd: '/home/sis_admin/medha-backend-strapi',
      script: 'npm',
      args: 'run develop',
      env: {
        NODE_ENV: 'development',
        DB_HOST: 'localhost',
        DB_PORT: '5432',
        DB_NAME: 'medha_sis',
        DB_USER: 'postgres',
        DB_PASS: 'postgres_sis',
        // JWT_SECRET: 'aSecretKey',
      },
    },
  ],
};
