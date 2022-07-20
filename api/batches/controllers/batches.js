const { sanitizeEntity } = require('strapi-utils');

module.exports = {

  async create(ctx) {
    let entity;
    logged_in_user = ctx.state.user.id;
    data = ctx.request.body;
    data.assigned_to = data.assigned_to == null ? logged_in_user : data.assigned_to;
    data.created_by_frontend = logged_in_user;
    data.updated_by_frontend = logged_in_user;
    entity = await strapi.services.batches.create(data);
    return sanitizeEntity(entity, { model: strapi.models.batches});
  },

  async update(ctx) {
    const { id } = ctx.params;
    let entity;
    logged_in_user = ctx.state.user.id;
    data = ctx.request.body;
    data.updated_by_frontend = logged_in_user;
    entity = await strapi.services.batches.update({ id }, data);

    if (data.status === 'Complete') {
      await strapi.services['batches'].handleProgramEnrollmentOnCompletion(entity);
    } else if (data.status === 'Certified') {
      await strapi.services['batches'].handleProgramEnrollmentOnCertification(entity);
    }

    return sanitizeEntity(entity, { model: strapi.models.batches });
  },

  async delete(ctx) {
    const { id } = ctx.params;
    const record = await strapi.services.batches.findOne({ id });
    if (!record.assigned_to) {
        ctx.throw(401, 'This record is not assigned to any user!');
    } else if (
        (ctx.state.user.role.name == "Basic" && record.assigned_to.id == ctx.state.user.id) ||
        (ctx.state.user.role.name == "Advanced" && record.medha_area == ctx.state.user.area) ||
        ctx.state.user.role.name == "Admin"
    ) {
        const entity = await strapi.services.batches.delete({ id });
        return sanitizeEntity(entity, { model: strapi.models.batches });
    } else {
        ctx.throw(401, 'You are not allowed to delete this record!', { user: ctx.state.user.username});
    }
  },

  async generateCertificates(ctx) {
    const { id } = ctx.params;
    const batch = await strapi.services['batches'].findOne({ id });
    let updatedBatch = await strapi.services['batches'].generateProgramEnrollmentCertificates(batch);

    // AuditLog: batch generate certificates triggered by user
    await strapi.services['audit-logs'].create({
      user: ctx.state?.user?.id,
      action: 'batch_certificate_generation',
      content: `Certificates generation triggered by user "${ctx.state.user.username}" having ID ${ctx.state.user.id} for batch "${batch.name}" having ID ${batch.id}`,
    });
    return ctx.send({batch: updatedBatch});
  },

  async emailCertificates(ctx) {
    const { id } = ctx.params;
    const batch = await strapi.services['batches'].findOne({ id });
    await strapi.services['batches'].emailProgramEnrollmentCertificates(batch);

    // AuditLog: batch email certificates triggered by user
    await strapi.services['audit-logs'].create({
      user: ctx.state?.user?.id,
      action: 'batch_certificate_email',
      content: `Certificates emails triggered by user "${ctx.state.user.username}" having ID ${ctx.state.user.id} for batch "${batch.name}" having ID ${batch.id}`,
    });
    return ctx.send({batch: batch});
  },
};
