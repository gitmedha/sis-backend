'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async createBulkSamarths(ctx) {
        const { body } = ctx.request;
        
        try {
          const createdData = await strapi.services['dte-samarth-sdit'].createMany(body);
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
          
          const records = await strapi.query('dte-samarth-sdit').find({
            [`${searchField}_contains`]: searchValue,
            _limit:1000000,
            _start: 0
          });
          
    
          return ctx.send(records);
        } catch (error) {
          console.log(error);
          throw error;
        }
      },
      async findDistinctField(ctx) {
        const { field } = ctx.params; // Extract the field name from the query parameters
        let optionsArray = [];
      
        try {
          const values = await strapi.query('dte-samarth-sdit').find({
            _limit: 1000000,
            _start: 0
          });
      
          const uniqueValuesSet = new Set();
      
          for (let row = 0; row < values.length; row++) {
            let valueToAdd;
      
            if(field){
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
          console.log(error);
          return ctx.badRequest('An error occurred while fetching distinct values.');
        }
      }
};

