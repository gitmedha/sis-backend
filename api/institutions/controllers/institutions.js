const { sanitizeEntity } = require("strapi-utils");

module.exports = {
  async create(ctx) {
    let entity;
    logged_in_user = ctx.state.user.id;
    data = ctx.request.body;
    data.assigned_to =
      data.assigned_to == null ? logged_in_user : data.assigned_to;
    data.created_by_frontend = logged_in_user;
    data.updated_by_frontend = logged_in_user;
    entity = await strapi.services.institutions.create(data);
    return sanitizeEntity(entity, { model: strapi.models.institutions });
  },

  async update(ctx) {
    const { id } = ctx.params;
    let entity;
    logged_in_user = ctx.state.user.id;
    data = ctx.request.body;
    data.updated_by_frontend = logged_in_user;
    entity = await strapi.services.institutions.update({ id }, data);
    return sanitizeEntity(entity, { model: strapi.models.institutions });
  },

  async delete(ctx) {
    const { id } = ctx.params;
    const record = await strapi.services.institutions.findOne({ id });
    if (!record.assigned_to) {
      ctx.throw(401, "This record is not assigned to any user!");
    } else if (
      (ctx.state.user.role.name == "Basic" &&
        record.assigned_to.id == ctx.state.user.id) ||
      (ctx.state.user.role.name == "Advanced" &&
        record.medha_area == ctx.state.user.area) ||
      ctx.state.user.role.name == "Admin"
    ) {
      const entity = await strapi.services.institutions.delete({ id });
      return sanitizeEntity(entity, { model: strapi.models.institutions });
    } else {
      ctx.throw(401, "You are not allowed to delete this record!", {
        user: ctx.state.user.username,
      });
    }
  },
  async findDuplicate(ctx) {
    let { name } = ctx.request.body;

    try {
      if (!name.length) {
        return ctx.send("Record Not Found");
      }

      const employer = await strapi
        .query("institutions")
        .findOne({ name_contains: name });

      if (employer) {
        return ctx.send("Record Found");
      }

      return ctx.send("Record Not Found");
    } catch (err) {
      ctx.throw(500, "Internal Server Error");
    }
  },
  async findDistinctField(ctx) {
    const { field, tab, info } = ctx.params; // Extract the field name from the query parameters
    let optionsArray = [];

    const queryString = info.substring();
    const infoObject = JSON.parse(
      '{"' + queryString.replace(/&/g, '","').replace(/=/g, '":"') + '"}',
      function (key, value) {
        return key === "" ? value : decodeURIComponent(value.replace(/\+/g, ' '));
      }
    );

    try {
      const totalRecords = await strapi.query("institutions").count();
      const values = await strapi.query("institutions").find({
        _limit: totalRecords,
        _start: 0,
        ...((tab === "my_data" && { assigned_to: infoObject.id }) ||
          (tab === "my_state" && { state: infoObject.state }) ||
          (tab === "my_area" && { medha_area: infoObject.area })),
      });

      const uniqueValuesSet = new Set();

      for (let row = 0; row < values.length; row++) {
        let valueToAdd;

        if (values[row][field] && field == "assigned_to") {
          valueToAdd = values[row][field].username;
        } else {
          if (values[row][field]) {
            valueToAdd = values[row][field];
          }
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
      return ctx.badRequest(
        "An error occurred while fetching distinct values."
      );
    }
  },
  async paymentRequired(ctx) {
    try {
      const knex = strapi.connections.default;
      const paymentMappingData = await knex("payment_mapping").select("*");
      return ctx.send(paymentMappingData);
    } catch (error) {
      console.log(error);
      return ctx.badRequest(
        "An error occurred while fetching distinct values."
      );
    }
  },

  async search(ctx) {
    try {
      // Extract the search query from the request's query parameters
      const query = ctx.query.q || '';  // 'q' is the query parameter for search

      // If there's no query, return the first 20 institutions with only 'id' and 'name'
      if (!query) {
        const institutions = await strapi.query('institutions').find({
          _limit: 20, // Limit to the first 20 institutions // Select only the 'id' and 'name' fields
        });

        return institutions;
      }

      // Perform the search in the database and return only 'id' and 'name'
      const searchedInstitutions = await strapi.query('institutions').find({
        where: {
          $or: [
            { name: { $contains: query } },
            { description: { $contains: query } },
            { type: { $contains: query } },
            { city: { $contains: query } },
            { state: { $contains: query } },
            { district: { $contains: query } }
          ]
        },
        _limit: 20, // Limit to 20 results (you can adjust this number) // Select only the 'id' and 'name' fields
      });

      return searchedInstitutions;
    } catch (err) {
      console.error(err); // Log error to console for debugging
      ctx.throw(500, 'An error occurred while searching institutions'); // Proper error handling
    }
  },
  async fetchAllInstitutions(ctx) {
    try {
      // Fetch all institutions without limits
      const allInstitutions = await strapi.query("institutions").find({ _limit: -1 });
      return allInstitutions;
    } catch (error) {
      console.error("Error fetching institutions:", error);
      ctx.throw(500, "An error occurred while fetching institutions.");
    }
  },
};
