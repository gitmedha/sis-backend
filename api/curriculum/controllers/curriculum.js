'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async createBulkCurriculum(ctx) {
        const { body } = ctx.request;
        
        try {
          const createdData = await strapi.services['curriculum'].createMany(body);
          return createdData;
       
        } catch (error) {
          console.error(error);
          throw error;
        }
      },
      
     async searchOps(ctx) {
            const { searchField, searchValue } = ctx.request.body;

  try {
    if (!searchField || !searchValue) {
      return ctx.badRequest('Field and value are required.');
    }

    if (searchField === "start_date" || searchField === "end_date") {
      const records = await strapi.query('curriculum').find({
        [`${searchField}_gte`]: new Date(searchValue.start),
        [`${searchField}_lte`]: new Date(searchValue.end),
        isactive: true,
        _limit: 1000000,
        _start: 0
      });
      return ctx.send(records);
    } else {
      const records = await strapi.query('curriculum').find({
        [`${searchField}_contains`]: searchValue,
        isactive: true,
        _limit: 1000000,
        _start: 0
      });
      return ctx.send(records);
    }

  } catch (error) {
    console.log(error);
    return ctx.internalServerError('Search failed.');
  }
}
,
async findDistinctField(ctx) {
    const { field } = ctx.params;
    let optionsArray = [];

  try {
    const values = await strapi.query('curriculum').find({
      isactive: true,
      _limit: 1000000,
      _start: 0
    });

    const uniqueValuesSet = new Set();

    for (let row = 0; row < values.length; row++) {
      let valueToAdd = values[row][field];

      if (valueToAdd !== undefined && !uniqueValuesSet.has(valueToAdd)) {
        optionsArray.push({
          key: row,
          label: valueToAdd,
          value: valueToAdd
        });
        uniqueValuesSet.add(valueToAdd);
      }
    }

    return ctx.send(optionsArray);
  } catch (error) {
    console.log("error", error);
    return ctx.badRequest('An error occurred while fetching distinct values.');
  }
}
};
