import { createBannerNode }     from "../components/common/banner.js";
import { createArticleInputs } from "../components/common/inputs.js";

/**
 * createCreatePage
 * Builds the create-article form page.
 *
 * @param {object} engine
 * @param {{ onNavigateToList: () => void, onSavePress: () => void }} options
 * @returns {{ pageNode: SceneNode, inputs: object }}
 */
export function createCreatePage(engine, { onNavigateToList, onSavePress }) {
  const pageNode = engine.ui.createScrollableNode({
    id:    "blog-create-page",
    style: { background: "#0F172A" },
  });

  const bannerNode = createBannerNode(engine, {
    id:   "blog-create-banner",
    text: "Create New Article",
  });

  const backButton = engine.ui.createButtonNode({
    id:    "blog-back-to-list-button",
    label: "← Back to Articles",
    style: {
      font:        "13px sans-serif",
      textColor:   "#111827",
      background:  "#E5E7EB",
      borderColor: "#9CA3AF",
      minHeight:   36,
      paddingX:    16,
    },
    onPress: () => onNavigateToList(),
  });

  const inputs = createArticleInputs(engine);

  const saveButton = engine.ui.createButtonNode({
    id:    "blog-save-button",
    label: "Save Article",
    style: {
      font:        "13px sans-serif",
      textColor:   "#111827",
      background:  "#E5E7EB",
      borderColor: "#9CA3AF",
      minHeight:   36,
      paddingX:    16,
    },
    onPress: () => onSavePress(),
  });

  engine.ui.mountNode(bannerNode,          pageNode);
  engine.ui.mountNode(backButton,          pageNode);
  engine.ui.mountNode(inputs.titleNode,    pageNode);
  engine.ui.mountNode(inputs.excerptNode,  pageNode);
  engine.ui.mountNode(inputs.contentNode,  pageNode);
  engine.ui.mountNode(inputs.photoNode,    pageNode);
  engine.ui.mountNode(inputs.statusNode,   pageNode);
  engine.ui.mountNode(saveButton,          pageNode);

  return { pageNode, inputs };
}
