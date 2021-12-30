'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/concepts/models.html#lifecycle-hooks)
 * to customize this model
 */

module.exports = {
  lifecycles: {
    // Called after an entry is deleted
    async beforeDelete(params) {
      const { id } = params;

      // find program enrollments for the student and delete them
      await strapi.query('program-enrollments').delete({ student: id })

      // find employment connections for the student and delete them
      await strapi.query('employment-connections').delete({ student: id })
    },
  },
};
