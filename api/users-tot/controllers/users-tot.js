"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async createBulkTots(ctx) {
    const { body } = ctx.request;
    try {
      const createdData = await strapi.services["users-tot"].createMany(body);
      return createdData;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
  
      
      async searchOps(ctx) {
  try {
    let filters = {};
    const { searchFields, searchValues, searchField, searchValue } = ctx.request.body;

    if (searchFields && searchValues && searchFields.length > 0) {
      searchFields.forEach((field, index) => {
        const value = searchValues[index];

        if (field === "start_date" || field === "end_date") {
          filters[`${field}_gte`] = new Date(value.start);
          filters[`${field}_lte`] = new Date(value.end);
        } else if (field === "gender") {
          filters[field] = value;
        } else {
          filters[`${field}_contains`] = value;
        }
      });
    } 
    else if (searchField && searchValue) {
      if (searchField === "start_date" || searchField === "end_date") {
        filters[`${searchField}_gte`] = new Date(searchValue.start);
        filters[`${searchField}_lte`] = new Date(searchValue.end);
      } else if (searchField === "gender") {
        filters[searchField] = searchValue;
      } else {
        filters[`${searchField}_contains`] = searchValue;
      }
    } else {
      return ctx.badRequest("Field and value are required.");
    }

    // Always apply isactive + limits
    filters.isactive = true;
console.log("Filters applied:", filters); 

    const records = await strapi.query("users-tot").find({
      ...filters,
      _limit: 1000000,
      _start: 0,
    });
console.log("Records found:", records.length);
    return ctx.send(records);
  } catch (error) {
    console.log(error);
    throw error;
  }
}
,
      async findDistinctField(ctx) {
        const { field } = ctx.params; // Extract the field name from the query parameters
        let optionsArray = [];
        try {
      
          const values = await strapi.query('users-tot').find({
            isactive:true,
            _limit: 10000000,
            _start: 0,
          });
         

      
          const uniqueValuesSet = new Set();
      
          for (let row = 0; row < values.length; row++) {
            let valueToAdd;
            if ((field === "trainer_1.username" && values[row]['trainer_1']?.username) || (field === "trainer_2.username" && values[row]['trainer_2']?.username)) {
                valueToAdd = field === "trainer_1.username"?values[row]['trainer_1'].username:values[row]['trainer_2'].username;
            } else if (field) {
              valueToAdd = values[row][field];
            }
            if (!uniqueValuesSet.has(valueToAdd)) {

              optionsArray.push({
                key: row,
                label: valueToAdd,
                value: valueToAdd,
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
