/**
 * createBannerNode
 * A labelled header bar used at the top of each page.
 *
 * @param {object} engine
 * @param {{ id: string, text?: string, style?: object }} options
 * @returns SceneNode
 */
export function createBannerNode(engine, { id, text, style = {} } = {}) {
  const node = engine.ui.createTextNode({
    id,
    style: {
      width:      420,
      height:     36,
      background: "#767e91",
      color:      "#b2abab",
      font:       "14px sans-serif",
      paddingLeft: 16,
      ...style,
    },
  });

  if (text !== undefined) node.text = text;

  return node;
}
