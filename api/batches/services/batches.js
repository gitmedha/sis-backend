"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async createBulkCollegePitch(ctx) {
    const { body } = ctx.request;

    try {
      const createdData = await strapi.services["college-pitch"].createMany(
        body
      );
      return createdData;
    } catch (error) {
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
        filters[`${field}_contains`] = searchValues[index]; // Using _contains for partial matches
      });
  
      console.log("Filters applied:", filters); // Debugging log
  
      // Query the database
      const records = await strapi.query("college-pitch").find(filters);
  
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
      if (field === "program_name") {
        const programs = await strapi.query("programs").find({
          _start: 0,
          _sort: "name:asc",
        });

        for (let row = 0; row < programs.length; row++) {
          let valueToAdd;
          valueToAdd = programs[row]["name"];

          optionsArray.push({
            key: row,
            label: valueToAdd,
            value: valueToAdd,
          });
        }

        return ctx.send(optionsArray);
      } else {
        const values = await strapi.query("college-pitch").find({
          isactive: true,
          _limit: 100,
          _start: 0,
        });

        const uniqueValuesSet = new Set();

        for (let row = 0; row < values.length; row++) {
          let valueToAdd;

          if (field) {
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
      return ctx.badRequest(
        "An error occurred while fetching distinct values."
      );
    }
  },
  async updateLastStatusChanged(batch){
    try {

      let updatedBatch = await strapi.services['batches'].update(
        { id: batch},
        { status_changed_date: new Date().toISOString().split("T")[0] }
      );
  
      return updatedBatch;
    } catch (error) {
      console.error("Error updating last status changed date:", error);
      return null;
    }
  }
};
