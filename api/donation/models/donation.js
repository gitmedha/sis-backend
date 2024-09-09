'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to  customize this model
 */

module.exports = {

    lifecycles: {
        async beforeCreate(data) {
          if (!data.student_id || !data.donation_id || !data.amount || !data.status) {
            throw new Error('Required fields are missing');
          }
        },
      },
};
