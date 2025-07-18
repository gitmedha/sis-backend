'use strict';

module.exports = {
    async createBulkPmus(ctx) {
        const { body } = ctx.request;
        
        try {
          const createdData = await strapi.services['pmus'].createMany(body);
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

          if(searchField === "year"){
            const records = await strapi.query('pmus').find({
              [`${searchField}_gte`]: new Date(searchValue.start),
              [`${searchField}_lte`]: new Date(searchValue.end),
              isactive: true,
              _limit: 1000000,
              _start: 0
            });
            return ctx.send(records);
          }
          else {
            const records = await strapi.query('pmus').find({
              [`${searchField}_contains`]: searchValue,
              isactive: true,
              _limit: 1000000,
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
        const { field } = ctx.params;
        let optionsArray = [];
        try {
          const values = await strapi.query('pmus').find({
            isactive: true,
            _limit: 10000000,
            _start: 0
          });
         
          const uniqueValuesSet = new Set();
      
          for (let row = 0; row < values.length; row++) {
            let valueToAdd;
            if ((field === "medha_poc.username" && values[row]['medha_poc']?.username)) {
                valueToAdd = values[row]['medha_poc'].username;
            } else if (field) {
              valueToAdd = values[row][field];
            }
            
            if (valueToAdd && !uniqueValuesSet.has(valueToAdd)) {
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