module.exports = ({ env }) => ({

  upload: {
    provider: 'azure-storage',
    providerOptions: {
      account: env('STORAGE_ACCOUNT', 'medhasisfiles'),
      accountKey: env('STORAGE_ACCOUNT_KEY', '2HM6xrhwEOmm8ciRRIB8f2VjZ62DoXbR03mRgZWblHmnt0UzNnrVNTthG3+UpHWazw1EmdLPX5HkvGAyBvb44A=='),
      serviceBaseURL: env('STORAGE_URL', 'https://medhasisfiles.blob.core.windows.net/'),
      containerName: env('STORAGE_CONTAINER_NAME', 'staging-server-files'),
      // cdnBaseURL: env('STORAGE_CDN_URL'),
      defaultPath: 'development-files',
      maxConcurrent: 10
    }
  },

  graphql: {
    endpoint: '/graphql',
    shadowCRUD: true,
    playgroundAlways: false,
    depthLimit: 7,
    amountLimit: 100,
    apolloServer: {
      tracing: true,
    },
  }

});