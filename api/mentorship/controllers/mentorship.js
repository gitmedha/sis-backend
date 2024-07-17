'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async createBulkmentorship(ctx) {
        const { body } = ctx.request;
        
        try {
          const createdData = await strapi.services['mentorship'].createMany(body);
          return createdData;
       
        } catch (error) {
          console.error(error);
          throw error;
        }
      },
      async searchOps (ctx) { 
        const { searchField, searchValue } = ctx.request.body;
        console.log(ctx.request.body);
        try {
          if (!searchField || !searchValue) {
            return ctx.badRequest('Field and value are required.');
          }
            console.log(ctx.request.body,"line28");
          
            const records = await strapi.query('mentorship').find({
              [`${searchField}_contains`]: searchValue,
              isactive:true,
              _limit:1000000,
              _start: 0
            });
            
            console.log(records);
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
          
        
            
              const values = await strapi.query('mentorship').find({
                isactive:true,
                _limit: 100,
                _start: 0,
              });
            
              const uniqueValuesSet = new Set();
          
              for (let row = 0; row < values.length; row++) {
                let valueToAdd;
          
                if (field === "mentor_name") {
                  console.log(values[row][field]);
                  valueToAdd = values[row][field];
                }
                if (field === "mentor_domain") {
                  console.log(values[row][field]);
                  valueToAdd = values[row][field];
                }
                if (field === "mentor_company_name") {
                  console.log(values[row][field]);
                  valueToAdd = values[row][field];
                }
                if (field === "designation") {
                  console.log(values[row][field]);
                  valueToAdd = values[row][field];
                }
                if (field === "mentor_area") {
                  console.log(values[row][field]);
                  valueToAdd = values[row][field];
                }
                if (field === "mentor_state") {
                  console.log(values[row][field]);
                  valueToAdd = values[row][field];
                }
                if (field === "outreach") {
                  console.log(values[row][field]);
                  valueToAdd = values[row][field];
                }
                if (field === "onboarding_date") {
                  console.log(values[row][field]);
                  valueToAdd = values[row][field];
                }
                if (field === "medha_area") {
                  console.log(values[row][field]);
                  valueToAdd = values[row][field];
                }
                if (field === "program_name") {
                  console.log(values[row][field]);
                  valueToAdd = values[row][field];
                }
                if (field === "status") {
                  console.log(values[row][field]);
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
              console.log(optionsArray);
              return ctx.send(optionsArray); 

          
        
        } catch (error) {
        
          return ctx.badRequest('An error occurred while fetching distinct values.');
        }
      }
};
