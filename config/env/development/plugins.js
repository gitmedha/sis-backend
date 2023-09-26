module.exports = ({ env }) => ({

  sentry: {
    dsn: env('SENTRY_DSN', 'https://c3400bacbfd045cc9fd1ca5f4780df48@o1107979.ingest.sentry.io/6135322'),
  },

  graphql: {
    endpoint: '/graphql',
    shadowCRUD: true,
    playgroundAlways: false,
    depthLimit: 7,
    amountLimit: 500,
    apolloServer: {
      tracing: true,
    },
  },

  email: {
    provider: 'nodemailer',
    providerOptions: {
      host: env('SMTP_HOST'),
      port: env('SMTP_PORT'),
      auth: {
        user: env('SMTP_USER'),
        pass: env('SMTP_PASSWORD'),
      },
    },
    settings: {
      defaultFrom: env('SMTP_USER'),
      defaultReplyTo: env('SMTP_USER'),
    },
  },

  upload: {
    provider: 'aws-s3',
    providerOptions: {
      accessKeyId: env('S3_ACCESS_KEY_ID'),
      secretAccessKey: env('S3_SECRET_KEY'),
      region: env('S3_REGION'),
      params: {
        Bucket: env('S3_BUCKET'),
      },
    },
  },
});
