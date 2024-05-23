'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async findAll(ctx) {
        try{
            const knex = strapi.connections.default;
            const geographiesList = await knex("geographies").select("*");
            console.log(geographiesList, "List")
            return ctx.send(geographiesList);
          } catch (error) {
            console.log(error);
            return ctx.badRequest(
              "An error occurred while fetching distinct values."
            );
        }
    },
};
