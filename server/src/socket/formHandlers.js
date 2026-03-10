export function registerFormHandlers(io, socket, { formService }) {

  socket.on("form.create", async (payload) => {
    try {
      const created = await formService.create(payload);
      socket.emit("form.createResponse", { success: true, data: created });
    } catch (err) {
      socket.emit("form.createResponse", { success: false, error: err.message });
    }
  });

  socket.on("form.update", async ({ formId, updates }) => {
    try {
      const updated = await formService.update(formId, updates);
      socket.emit("form.updateResponse", { success: true, data: updated });
    } catch (err) {
      socket.emit("form.updateResponse", { success: false, error: err.message });
    }
  });

  socket.on("form.delete", async ({ formId }) => {
    try {
      const deleted = await formService.delete(formId);
      socket.emit("form.deleteResponse", { success: true, data: deleted });
    } catch (err) {
      socket.emit("form.deleteResponse", { success: false, error: err.message });
    }
  });

  socket.on("form.fetch", async ({ formId }) => {
    try {
      const form = await formService.fetch(formId);
      socket.emit("form.fetchResponse", { success: true, data: form });
    } catch (err) {
      socket.emit("form.fetchResponse", { success: false, error: err.message });
    }
  });

  socket.on("form.fetchAll", async () => {
    try {
      const forms = await formService.fetchAll();
      socket.emit("form.fetchAllResponse", { success: true, data: forms });
    } catch (err) {
      socket.emit("form.fetchAllResponse", { success: false, error: err.message });
    }
  });
}
