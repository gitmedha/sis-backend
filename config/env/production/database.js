module.exports = ({ env }) => ({
    defaultConnection: 'default',
    connections: {
      default: {
        connector: 'bookshelf',
        settings: {
          client: 'postgres',
          host: env('DATABASE_HOST', 'sis-production.postgres.database.azure.com'),
          port: env.int('DATABASE_PORT', 5432),
          database: env('DATABASE_NAME', 'medha_sis'),
          username: env('DATABASE_USERNAME', 'sis_admin@sis-production'),
          password: env('DATABASE_PASSWORD', 'medha123A!'),
          ssl: env.bool('DATABASE_SSL', true),
        },
        options: {}
      },
    },
  });