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
      host: env('SMTP_HOST', 'smtp.office365.com'),
      port: env('SMTP_PORT', 587),
      // secure: true,
      // secureConnection: false,
      // tls: { ciphers: 'SSLv3'},
      auth: {
        user: env('SMTP_USER'),
        pass: env('SMTP_PASSWORD'),
      },
      // ... any custom nodemailer options
    },
    settings: {
      defaultFrom: env('SMTP_USER', 'sis.admin@medha.org.in'),
      defaultReplyTo: env('SMTP_USER', 'sis.admin@medha.org.in'),
    },
  },

  upload: {
  provider: 'aws-s3',
  providerOptions: {
    accessKeyId: 'AKIAYKQAZ2TY2FND7R6N',
    secretAccessKey: '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',
    region: 'ap-south-1',
    params: {
      Bucket: 'medhasisstg',
    },
   },
  },
});

