module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  url: 'https://sis-api-staging.medha.org.in',
  frontend_url: env('MEDHA_FRONTEND_APP_URL', 'https://sis-staging.medha.org.in'),
  admin: {
    auth: {
      secret: env('ADMIN_JWT_SECRET', '5d062827bca2413203eb73dfa175efa6'),
    },
  },
});
