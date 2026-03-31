/**
 * createArticleInputs
 * Creates and returns all input nodes for the create-article form.
 * Each node is keyed by a stable, readable name.
 *
 * @param {object} engine
 * @returns {{ titleNode, excerptNode, contentNode, photoNode, statusNode }}
 */
export function createArticleInputs(engine) {
  const shared = {
    width:       420,
    height:      40,
    background:  "#7989ad",
    borderColor: "#374151",
    color:       "#e37725",
    paddingLeft: 12,
  };

  const titleNode = engine.ui.createInputNode({
    id:          "blog-title-input",
    placeholder: "Enter article title",
    style: { ...shared, color: "#ebe5e1" },
  });

  const excerptNode = engine.ui.createInputNode({
    id:          "blog-excerpt-input",
    placeholder: "Enter short excerpt",
    style:       shared,
  });

  const contentNode = engine.ui.createInputNode({
    id:          "blog-content-input",
    placeholder: "Enter article content",
    style:       shared,
  });

  const photoNode = engine.ui.createInputNode({
    id:          "blog-photo-input",
    placeholder: "Enter photo URL (optional)",
    style:       shared,
  });

  const statusNode = engine.ui.createInputNode({
    id:          "blog-status-input",
    placeholder: "Status: draft or published",
    value:       "draft",
    style:       shared,
  });

  return { titleNode, excerptNode, contentNode, photoNode, statusNode };
}

/**
 * clearArticleInputs
 * Resets all form inputs back to their default state after a successful save.
 *
 * @param {{ titleNode, excerptNode, contentNode, photoNode, statusNode }} inputs
 */
export function clearArticleInputs(inputs) {
  inputs.titleNode.value   = "";
  inputs.excerptNode.value = "";
  inputs.contentNode.value = "";
  inputs.photoNode.value   = "";
  inputs.statusNode.value  = "draft";
}
