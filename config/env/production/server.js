module.exports = ({ env }) => ({
    host: env('HOST', '0.0.0.0'),
    port: env.int('PORT', 1338),
    admin: {
      auth: {
        secret: env('ADMIN_JWT_SECRET', '5d062827bca2413203eb73dfa175efa6'),
      },
    },
  });
  