'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async createBulkAlumniQueries(ctx) {
        const { body } = ctx.request;
        
        try {
          const createdData = await strapi.services['alumni-queries'].createMany(body);
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
          
          if(searchValue.hasOwnProperty('query_start')){

            const records = await strapi.query('alumni-queries').find({
              isactive:true,
              'query_start_gte': searchValue.query_start,
              'query_end_lte': searchValue.query_end,
              _limit: 1000000,
              _start: 0,
              _sort:`${searchField}:asc`
            });
            
      
            return ctx.send(records);

           
          }

          else {
         
            const records = await strapi.query('alumni-queries').find({
              [`${searchField}_contains`]: searchValue,
              isactive:true,
              _limit:1000000,
              _start: 0,
              _sort:`${searchField}:asc`
            });
            
      
            return ctx.send(records);

          }
          
        } catch (error) {
        
          throw error;
        }
      },
      async findDistinctField(ctx) {
        const { field } = ctx.params; // Extract the field name from the query parameters
        let optionsArray = [];
      
        try {
          const values = await strapi.query('alumni-queries').find({
            isactive:true,
            _limit: 1000000,
            _start: 0
          });
      
          const uniqueValuesSet = new Set();
      
          for (let row = 0; row < values.length; row++) {
            let valueToAdd;
      
            if (field === "student_id") {
              valueToAdd = values[row][field].student_id;
            }

            else if(field){
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
          
          return ctx.badRequest('An error occurred while fetching distinct values.');
        }
      }
};
