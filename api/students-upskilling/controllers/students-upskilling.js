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
        const { searchFields, searchValues } = ctx.request.body;
      
        try {
          // Validate input
          if (
            !Array.isArray(searchFields) ||
            !Array.isArray(searchValues) ||
            searchFields.length !== searchValues.length
          ) {
            return ctx.badRequest("Fields and values must be provided as equal-length arrays.");
          }
      
          // Initialize filters
          let filters = { isactive: true, _limit: 1000000, _start: 0 };
      
          // Add search filters dynamically
          searchFields.forEach((field, index) => {
            const value = searchValues[index];
      
            if (typeof value === "object" && value.hasOwnProperty("start_date")) {
              // Handle date range filters
              filters[`${field}_gte`] = value.start_date; // Greater than or equal to start date
              filters[`${field}_lte`] = value.end_date;   // Less than or equal to end date
            } else {
              // Handle regular text filters
              filters[`${field}_contains`] = value; // Using _contains for partial matches
            }
          });
      
          console.log("Filters applied:", filters); // Debugging log
      
          // Query the database
          const records = await strapi.query("students-upskilling").find(filters);
      
          console.log("Records found:", records); // Debugging log
      
          // Return the results
          return ctx.send(records);
        } catch (error) {
          console.error("Error in searchOps:", error);
          return ctx.internalServerError("Something went wrong.");
        }
      },
      async findDistinctField(ctx) {
        const { field } = ctx.params; // Extract the field name from the query parameters
        let optionsArray = [];
      
        try {
          if (field === 'program_name') {
            const programs = await strapi.query('programs').find({
              _start:0,
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
            
              const values = await strapi.query('students-upskilling').find({
                isactive:true,
                _limit: 100,
                _start: 0,
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
