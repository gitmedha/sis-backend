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

      // Handle date range filters using the specific field names
      if (field === 'start_date_from') {
        filters['start_date_gte'] = new Date(value); // Start date >= provided value
      } else if (field === 'start_date_to') {
        filters['start_date_lte'] = new Date(value); // Start date <= provided value
      } else if (field === 'end_date_from') {
        filters['end_date_gte'] = new Date(value);   // End date >= provided value
      } else if (field === 'end_date_to') {
        filters['end_date_lte'] = new Date(value);   // End date <= provided value
      } else {
        // Handle regular text filters
        filters[`${field}_contains`] = value; // Using _contains for partial matches
      }
    });

    console.log("Filters applied:", filters); // Debugging log

    // Query the database
    const records = await strapi.query("students-upskilling").find(filters);

    console.log("Records found:", records.length); // Debugging log

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
