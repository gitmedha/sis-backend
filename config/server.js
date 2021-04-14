module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  url: env('PUBLIC_URL', 'http://34.217.26.87:1337/'),
  admin: {
    auth: {
      secret: env('ADMIN_JWT_SECRET', '5d062827bca2413203eb73dfa175efa6'),
    },
  },
});
