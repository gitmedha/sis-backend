module.exports = ({ env }) => ({
    host: env('HOST', '0.0.0.0'),
    port: env.int('PORT', 1337),
    url: env('STRAPI_APP_URL', 'http://localhost:1337'),
    frontend_url: env('MEDHA_FRONTEND_APP_URL', 'http://localhost:3000/students'),
    admin: {
      auth: {
        secret: env('ADMIN_JWT_SECRET', '5d062827bca2413203eb73dfa175efa6'),
      },
    },
  });
