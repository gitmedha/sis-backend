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
    entity = await strapi.services.employers.create(data);
    return sanitizeEntity(entity, { model: strapi.models.employers });
  },

  async update(ctx) {
    const { id } = ctx.params;
    let entity;
    logged_in_user = ctx.state.user.id;
    data = ctx.request.body;
    data.updated_by_frontend = logged_in_user;
    entity = await strapi.services.employers.update({ id }, data);
    return sanitizeEntity(entity, { model: strapi.models.employers });
  },

  async delete(ctx) {
    const { id } = ctx.params;
    const record = await strapi.services.employers.findOne({ id });
    if (!record.assigned_to) {
      ctx.throw(401, "This record is not assigned to any user!");
    } else if (
      (ctx.state.user.role.name == "Basic" &&
        record.assigned_to.id == ctx.state.user.id) ||
      (ctx.state.user.role.name == "Advanced" &&
        record.medha_area == ctx.state.user.area) ||
      ctx.state.user.role.name == "Admin"
    ) {
      const entity = await strapi.services.employers.delete({ id });
      return sanitizeEntity(entity, { model: strapi.models.employers });
    } else {
      ctx.throw(401, "You are not allowed to delete this record!", {
        user: ctx.state.user.username,
      });
    }
  },

  async findDuplicate(ctx) {
    let { name } = ctx.request.body;

    try {
      // find duplicate record

      if (!name.length) {
        return ctx.send("Record Not Found");
      }

      const employer = await strapi
        .query("employers")
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
        return key === "" ? value : decodeURIComponent(value);
      }
    );

    try {
      const values = await strapi.query("employers").find({
        _limit: 100,
        _start: 0,
        ...((tab === "my_data" && { assigned_to: infoObject.id }) ||
          (tab === "my_state" && { state: infoObject.state }) ||
          (tab === "my_area" && { medha_area: infoObject.area })),
      });

      const uniqueValuesSet = new Set();

      for (let row = 0; row < values.length; row++) {
        let valueToAdd;

        if (values[row][field] && field === "assigned_to") {
          valueToAdd = values[row][field].username.trim();
        } else {
          valueToAdd = values[row][field].trim();
        }
        if (values[row][field]) {
          if (!uniqueValuesSet.has(valueToAdd)) {
            optionsArray.push({
              key: row,
              label: valueToAdd,
              value: valueToAdd,
            });
            uniqueValuesSet.add(valueToAdd);
          }
        }
      }

      return ctx.send(optionsArray);
    } catch (error) {
      return ctx.badRequest(error.message);
    }
  },
};
