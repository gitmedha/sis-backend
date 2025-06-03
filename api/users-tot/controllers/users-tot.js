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

          if(searchField ==="start_date"){
            const records = await strapi.query('users-tot').find({
              [`${searchField}_gte`]: new Date(searchValue.start),
              [`${searchField}_lte`]: new Date(searchValue.end),
              isactive:true,
              _limit:1000000,
              _start: 0
            });
            return ctx.send(records);
          }
          else if(searchField === "end_date"){
            const records = await strapi.query('users-tot').find({
              [`${searchField}_gte`]: new Date(searchValue.start),
              [`${searchField}_lte`]: new Date(searchValue.end),
              isactive:true,
              _limit:1000000,
              _start: 0
            });
            return ctx.send(records);
          }
          else if (searchField === 'age') {
                let ageRange = searchValue; // e.g., "18-25" or "56+"
                let ageConditions = {};

                if (ageRange.includes('+')) {
                  // Handle cases like "56+"
                  const minAge = parseInt(ageRange.replace('+', ''), 10);
                  ageConditions = {
                    age_gte: minAge,
                  };
                } else {
                  // Handle ranges like "18-25"
                  const [minAge, maxAge] = ageRange.split('-').map(Number);
                  ageConditions = {
                    age_gte: minAge,
                    age_lte: maxAge,
                  };
                }

                const records = await strapi.query('users-tot').find({
                  ...ageConditions,
                  isactive: true,
                  _limit: 1000000,
                  _start: 0,
                });

                return ctx.send(records);
              }
          else if (searchField === "gender"){
            const records = await strapi.query('users-tot').find({
              [searchField]: searchValue,
              isactive:true,
              _limit:1000000,
              _start: 0
            });
            
            
      

            return ctx.send(records);

          }
          else {

            const records = await strapi.query('users-tot').find({
              [`${searchField}_contains`]: searchValue,
              isactive:true,
              _limit:1000000,
              _start: 0
            });
            
            
      

            return ctx.send(records);
          }
          
        } catch (error) {
          console.log(error);
          throw error;
        }
      },
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
