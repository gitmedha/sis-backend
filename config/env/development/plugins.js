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
      depthLimit: 10,
      amountLimit: 100,
      apolloServer: {
        tracing: true,
      },
    }

  });