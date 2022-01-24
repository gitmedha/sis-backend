'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

module.exports = {
  lifecycles: {
    // Called after an entry is deleted
    async beforeDelete(params) {
      const { id } = params;
      if (!id) return

      // find attendances for the program enrollment and delete them
      await strapi.query('attendance').delete({ program_enrollment: id });
    },
  },
};
