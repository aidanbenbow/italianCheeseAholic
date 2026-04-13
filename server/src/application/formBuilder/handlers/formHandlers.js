export function registerFormRoutes(app, container) {
  const formService = container.resolve("formService");

  app.post("/forms", async (req, res) => {
    const result = await formService.create(req.body);
    res.json(result);
  });

  app.get("/forms", async (req, res) => {
    const result = await formService.fetchAll(req.query);
    res.json(result);
  });

  app.get("/forms/:id", async (req, res) => {
    const result = await formService.fetchWithResults(req.params.id);
    res.json(result);
  });

  app.post("/forms/:id/submissions", async (req, res) => {
    const result = await formService.submit(req.params.id, req.body);
    res.json(result);
  });
}

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
