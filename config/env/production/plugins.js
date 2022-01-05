module.exports = ({ env }) => ({

  graphql: {
    endpoint: '/graphql',
    shadowCRUD: true,
    playgroundAlways: false,
    depthLimit: 7,
    amountLimit: 100,
    apolloServer: {
      tracing: false,
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
        user: env('SMTP_USER', 'sis.admin@medha.org.in'),
        pass: env('SMTP_PASSWORD', 'sisadmin123A'),
      },
      // ... any custom nodemailer options
    },
    settings: {
      defaultFrom: env('SMTP_USER', 'sis.admin@medha.org.in'),
      defaultReplyTo: env('SMTP_USER', 'sis.admin@medha.org.in'),
    },
  },    

  upload: {
    provider: 'azure-storage',
    providerOptions: {
      account: env('STORAGE_ACCOUNT', 'medhasisfiles'),
      accountKey: env('STORAGE_ACCOUNT_KEY', '2HM6xrhwEOmm8ciRRIB8f2VjZ62DoXbR03mRgZWblHmnt0UzNnrVNTthG3+UpHWazw1EmdLPX5HkvGAyBvb44A=='),
      serviceBaseURL: env('STORAGE_URL', 'https://medhasisfiles.blob.core.windows.net/'),
      containerName: env('STORAGE_CONTAINER_NAME', 'production-server-files'),
      // cdnBaseURL: env('STORAGE_CDN_URL'),
      defaultPath: 'file-uploads',
      maxConcurrent: 10
    }
  },
});