"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async createBulkTots(ctx) {
    const { body } = ctx.request;
    try {
      const createdData = await strapi.services["users-tot"].createMany(body);
      return createdData;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
  
//  async searchOps(ctx){
//   try {
//     const { searchField, searchValue } = ctx.request.body;

//       // Validate if searchField and searchValue are provided
//     if (!searchField || !searchValue) {
//       return ctx.badRequest('Field and value are required.');
//     }

//     if(searchField ==="start_date"){
//       const records = await strapi.query('users-tot').find({
//         [`${searchField}_gte`]: new Date(searchValue.start),
//         [`${searchField}_lte`]: new Date(searchValue.end),
//         isactive:true,
//         _limit:1000000,
//         _start: 0
//       });
//       return ctx.send(records);
//     }
//     else if(searchField === "end_date"){
//       const records = await strapi.query('users-tot').find({
//         [`${searchField}_gte`]: new Date(searchValue.start),
//         [`${searchField}_lte`]: new Date(searchValue.end),
//         isactive:true,
//         _limit:1000000,
//         _start: 0
//       });
//       return ctx.send(records);
//     }
//     else {

//       const records = await strapi.query('users-tot').find({
//         [`${searchField}_contains`]: searchValue,
//         isactive:true,
//         _limit:1000000,
//         _start: 0
//       });
      
      


//       return ctx.send(records);
//     }
    
//   } catch (error) {
//     console.log(error);
//     throw error;
//   }
//  },

async searchOps(ctx) {
  console.log("Request Body:", ctx.request.body); // Log the request body

  const { searchFields, searchValues } = ctx.request.body;

  try {
    // Validate if searchFields and searchValues are provided as equal-length arrays
    if (
      !Array.isArray(searchFields) ||
      !Array.isArray(searchValues) ||
      searchFields.length !== searchValues.length
    ) {
      console.error("Validation failed: Fields and values must be equal-length arrays.");
      return ctx.badRequest('Fields and values must be provided as equal-length arrays.');
    }

    // Log the searchFields and searchValues
    console.log("Search Fields:", searchFields);
    console.log("Search Values:", searchValues);

    // Initialize filters with default values
    let filters = { isactive: true };

    // Add search filters dynamically
    searchFields.forEach((field, index) => {
      if (field === "start_date" || field === "end_date") {
        // Check if the searchValues[index] is an object with start and end properties
        if (
          !searchValues[index] ||
          typeof searchValues[index] !== "object" ||
          !searchValues[index].start ||
          !searchValues[index].end
        ) {
          console.error(`Invalid date range for ${field}:`, searchValues[index]);
          throw new Error(`Invalid date range for ${field}. Expected { start: "YYYY-MM-DD", end: "YYYY-MM-DD" }.`);
        }

        // Handle date range filtering for start_date and end_date
        filters[`${field}_gte`] = new Date(searchValues[index].start);
        filters[`${field}_lte`] = new Date(searchValues[index].end);
      } else {
        // Handle partial matching for other fields
        filters[`${field}_contains`] = searchValues[index];
      }
    });

    console.log("Filters applied:", filters); // Debugging log

    // Fetch records from the users-tot table
    const records = await strapi.query('users-tot').find({ _where: filters });

    console.log("Records found:", records.length); // Debugging log

    // Return the fetched records or empty array if none found
    return ctx.send(records.length > 0 ? records : []);
  } catch (error) {
    console.error('Error in searchOps:', error);
    return ctx.internalServerError(error.message || 'Something went wrong.');
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
