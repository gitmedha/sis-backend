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
          const records = await strapi.query("mentorship").find(filters);
      
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
