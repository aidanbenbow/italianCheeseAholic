export function createResultsPage(engine, form, submissions) {
  const page = engine.ui.createScrollableNode({
    id: "results-page",
    style: { background: form.theme?.page || {} }
  });

  // Title
  const title = engine.ui.createTextNode({
    id: "results-title",
    style: {
      font: "16px sans-serif",
      color: form.theme?.label?.color || "#fff",
      marginBottom: 16
    }
  });
  title.text = `${form.title} – Results`;
  engine.ui.mountNode(title, page);

  // -------------------------
  // Render submissions
  // -------------------------
  submissions.forEach((submission, index) => {
    const container = engine.ui.createScrollableNode({
      id: `submission-${index}`,
      style: {
        marginBottom: 16,
        padding: 12,
        background: "#1f2937"
      }
    });

    // Render each answer
    for (const fieldId in submission.answers) {
      const row = engine.ui.createTextNode({
        id: `${index}-${fieldId}`,
        style: form.theme?.label || {}
      });

      row.text = `${fieldId}: ${submission.answers[fieldId]}`;
      engine.ui.mountNode(row, container);
    }

    engine.ui.mountNode(container, page);
  });

  return page;
}