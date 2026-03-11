export function registerDorcasHandlers(io, container) {
  io.on("connection", (socket) => {
    const reportService = container.resolve("reportService");

    socket.on("dorcas:fetchReports", async (payload, callback) => {
      const result = await reportService.fetchReports(payload);
      callback(result);
    });

    socket.on("dorcas:getReport", async (id, callback) => {
      const report = await reportService.getReport(id);
      callback(report);
    });
  });
}
