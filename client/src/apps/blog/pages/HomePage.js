/** @jsx h */
import {h} from "../../../engine/core/h.js";

// export function HomePage() {
//   return (
//     <container style={{ padding: 40 }}>
//       <button
//         label="Create New Post"
//         command="posts.create"
//         components={["hover", "press", "command"]}
//         style={{
//           paddingX: 20,
//           paddingY: 12,
//           font: "20px sans-serif"
//         }}
//       />
//     </container>
//   );
// }

export function HomePage() {
  return h(
    "container",
    { style: { padding: 40 } },
    h("button", {
      label: "Create New Post",
      command: "posts.create",
      components: ["hover", "press", "command"],
      style: {
        paddingX: 20,
        paddingY: 12,
        font: "20px sans-serif"
      }
    })
  );
}