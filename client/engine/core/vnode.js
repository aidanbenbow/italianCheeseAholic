export class VNode {
  constructor(type, props = {}, children = []) {
    this.type = type;          // string or class
    this.props = props;        // style, id, command, etc.
    this.children = children;  // array of VNodes
    this.key = props.key ?? null; // for stable diffing
  }
}