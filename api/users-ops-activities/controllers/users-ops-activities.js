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

  async searchOps(ctx) {
    const { searchFields, searchValues } = ctx.request.body;
  
    try {
      if (
        !Array.isArray(searchFields) || 
        !Array.isArray(searchValues) || 
        searchFields.length !== searchValues.length
      ) {
        return ctx.badRequest('Fields and values must be provided as equal-length arrays.');
      }
  
      let filters = { isactive: true, _limit: 1000000, _start: 0 };
  
      searchFields.forEach((field, index) => {
        filters[`${field}_contains`] = searchValues[index];  // Using _contains for partial matches
      });
  
      console.log("Filters applied:", filters); // Debugging log
  
      const records = await strapi.query('users-ops-activities').find(filters);
      
      console.log("Records found:", records); // Debugging log
      
      return ctx.send(records);
    } catch (error) {
      console.error('Error in searchOps:', error);
      return ctx.internalServerError('Something went wrong.');
    }
  },
  async findDistinctField(ctx) {
    const { field } = ctx.params; // Extract the field name from the query parameters
    let optionsArray = [];
  
    try {


      if (field === 'program_name') {
        const programs = await strapi.query('programs').find({
          _start:0
        })

  
      for (let row = 0; row < programs.length; row++) {
        let valueToAdd;
        valueToAdd = programs[row]['name'];

        optionsArray.push({
          key: row,
          label: valueToAdd,
          value: valueToAdd,
        });
      }
  
      return ctx.send(optionsArray);
      }
      else {
      const totalRecords = await strapi.query("users-ops-activities").count();
      const values = await strapi.query('users-ops-activities').find({
        isactive:true,
        _limit: totalRecords,
        _start: 0,
      });
     
      const uniqueValuesSet = new Set();
  
      for (let row = 0; row < values.length; row++) {
        let valueToAdd;
  
        if (field === "assigned_to") {
          valueToAdd = values[row][field].username;
        } else if (field === "batch") {
          valueToAdd = values[row][field].name;
        } else if (field === "area") {
          valueToAdd = values[row][field];
        }
        else if (field === "program_name"){
          valueToAdd = values[row][field];
        }
        // console.log(valueToAdd);
        if (!uniqueValuesSet.has(valueToAdd)) {
          optionsArray.push({
            key: row,
            label: valueToAdd,
            value: valueToAdd,
          });
          
          uniqueValuesSet.add(valueToAdd);
        }
      }
      // console.log(optionsArray);
      return ctx.send(optionsArray);

      }
      
    } catch (error) {
   
      return ctx.badRequest('An error occurred while fetching distinct values.');
    }
  }
  
    
};