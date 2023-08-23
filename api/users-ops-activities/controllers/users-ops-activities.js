'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async createBulkOperations(ctx) {
    const { body } = ctx.request;

    try {
      const createdData = await strapi.services['users-ops-activities'].createMany(body);
      return createdData;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  async searchOps (ctx){

    const {searchField,searchValue}=ctx.request.body
  
    try{
      // if (!searchField || !searchValue) {
      //   return ctx.badRequest('Field and value are required.');
      // }
      const result = await strapi.query('users-ops-activities').find({
        [searchField]: searchValue,
      });
  
      return ctx.send(result);

    }
    catch(error){
      console.log(error)
      throw error;
    }
  }
};
