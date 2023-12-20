'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async createBulkupskills(ctx) {
        const { body } = ctx.request;
        
        try {
          const createdData = await strapi.services['students-upskilling'].createMany(body);
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
          
          if(searchValue.hasOwnProperty('start_date')){

            const records = await strapi.query('students-upskilling').find({
              'start_date': searchValue.start_date,
              'end_date': searchValue.end_date,
              isactive:true,
              _limit: 1000000,
              _start: 0,
            });
            
      
            return ctx.send(records);

           
          }
          else {
            const records = await strapi.query('students-upskilling').find({
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
          if (field === 'program_name') {
            const programs = await strapi.query('programs').find({
              _start:0,
              _sort:'name:asc'
            })
    
          console.log("prg", programs.length);
      
          for (let row = 0; row < programs.length; row++) {
            let valueToAdd;
            valueToAdd = programs[row]['name'];
    
            optionsArray.push({
              key: row,
              label: valueToAdd,
              value: valueToAdd,
            });
          }
    
          console.log("optionsArray:",optionsArray);
      
          return ctx.send(optionsArray);
          }
          else {
            let sortValue;

            if(field =='institution' ){
              sortValue = "institution.name:asc";
            }
           else if (field == "assigned_to") {
              sortValue = "assigned_to.username:asc";
            } else {
              sortValue = `${field}:asc`;
            }
              const values = await strapi.query('students-upskilling').find({
                isactive:true,
                _limit: 1000000,
                _start: 0,
                _sort:sortValue
              });
            
              const uniqueValuesSet = new Set();
          
              for (let row = 0; row < values.length; row++) {
                let valueToAdd;
          
                if (field === "student_id") {
                  valueToAdd = values[row][field].full_name;
    
                }
                else if (field === "assigned_to"){
                  valueToAdd = values[row][field].username;
                }
                else if (field === "institution"){
                  valueToAdd = values[row][field].name;
                }
                
                else if (field) {
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

          }
        
        } catch (error) {
        
          return ctx.badRequest('An error occurred while fetching distinct values.');
        }
      }
};
