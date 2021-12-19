module.exports = ({ env }) => ({
    /* upload: {
      provider: 'azure-storage',
      providerOptions: {
        account: env('medhasisfiles'),
        accountKey: env('2HM6xrhwEOmm8ciRRIB8f2VjZ62DoXbR03mRgZWblHmnt0UzNnrVNTthG3+UpHWazw1EmdLPX5HkvGAyBvb44A=='),
        // serviceBaseURL: env('STORAGE_URL'),
        containerName: env('staging-server-files'),
        // cdnBaseURL: env('STORAGE_CDN_URL'),
        defaultPath: 'assets',
        maxConcurrent: 10
      }
    }*/

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
          user: 'sis.admin@medha.org.in',
          pass: 'sisadmin123A',
        },
        // ... any custom nodemailer options
      },
      settings: {
        defaultFrom: 'SIS Admin <sis.admin@medha.org.in>',
        defaultReplyTo: 'sis.admin@medha.org.in',
      },
    },    

  });