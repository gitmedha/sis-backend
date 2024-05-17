'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async createBulkTots(ctx) {
        const { body } = ctx.request;
        
        try {
          const createdData = await strapi.services['users-tot'].createMany(body);
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
          
          const records = await strapi.query('users-tot').find({
            [`${searchField}_contains`]: searchValue,
            isactive:true,
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
          let sortValue;

        if(field =='batch' ){
          sortValue = "batch.name:asc";
        }
        else if (field == "assigned_to") {
          sortValue = "assigned_to.username:asc";
        } else {
          sortValue = `${field}:asc`;
        }
          const values = await strapi.query('users-tot').find({
            isactive:true,
            _limit: 1000000,
            _start: 0,
            _sort:sortValue,
          });
      
      
          const uniqueValuesSet = new Set();
      
          for (let row = 0; row < values.length; row++) {
            let valueToAdd;
      
            if (field === "trainer_1.username" || field === "trainer_2.username") {
                valueToAdd = field === "trainer_1.username"?values[row]['trainer_1'].username:values[row]['trainer_2'].username
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
          
          return ctx.badRequest('An error occurred while fetching distinct values.');
        }
      }
};
