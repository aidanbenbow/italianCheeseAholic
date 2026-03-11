export function registerFormHandlers(io, container) {
  io.on("connection", (socket) => {
    const formService = container.resolve("formService");

    socket.on("form:create", async (data, callback) => {
      const result = await formService.createForm(data);
      callback(result);
    });

    socket.on("form:list", async (_, callback) => {
      const forms = await formService.listForms();
      callback(forms);
    });
  });
}
