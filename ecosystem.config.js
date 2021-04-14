module.exports = {
  apps: [
    {
      name: 'strapi-dev',
      cwd: '/srv/strapi/mystrapiapp',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'development',
        DB_HOST: 'localhost',
        DB_PORT: '5432',
        DB_NAME: 'medha_sis',
        DB_USER: 'postgres',
        DB_PASS: 'postgres_stpc',
        JWT_SECRET: 'ff822c83-d3ad-42ad-8146-e69dae75f5df',
      },
    },
  ],
};
