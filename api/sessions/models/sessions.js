'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

module.exports = {
  lifecycles: {
    // Called before an entry is deleted
    async beforeDelete(params) {
      const { id } = params;
      if (!id) return

      // find program enrollments for the student and delete them
      await strapi.query('attendance').delete({ session: id })
    }
  }
};
