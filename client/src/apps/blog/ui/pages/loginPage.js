import { createBannerNode } from "../components/common/banner.js";

export function createLoginPage(engine, { onNavigateToList, onLoginPress }) {
  const pageNode = engine.ui.createScrollableNode({
    id: "blog-login-page",
    style: { background: "#0F172A" },
  });

  const bannerNode = createBannerNode(engine, {
    id: "blog-login-banner",
    text: "Admin Login",
  });

  const backButton = engine.ui.createButtonNode({
    id: "blog-login-back-button",
    label: "← Back to Articles",
    style: {
      font: "13px sans-serif",
      textColor: "#111827",
      background: "#E5E7EB",
      borderColor: "#9CA3AF",
      minHeight: 36,
      paddingX: 16,
    },
    onPress: () => onNavigateToList(),
  });

  const usernameNode = engine.ui.createInputNode({
    id: "blog-login-username-input",
    placeholder: "Admin username",
    multiline: false,
    autoGrow: false,
    style: {
      width: 420,
      height: 40,
      background: "#7989ad",
      borderColor: "#374151",
      color: "#ebe5e1",
      paddingLeft: 12,
    },
  });

  const passwordNode = engine.ui.createInputNode({
    id: "blog-login-password-input",
    placeholder: "Password",
    multiline: false,
    autoGrow: false,
    style: {
      width: 420,
      height: 40,
      background: "#7989ad",
      borderColor: "#374151",
      color: "#ebe5e1",
      paddingLeft: 12,
    },
  });

  const statusNode = engine.ui.createTextNode({
    id: "blog-login-status",
    style: {
      width: 420,
      minHeight: 30,
      background: "#111827",
      color: "#D1D5DB",
      font: "12px sans-serif",
      paddingLeft: 12,
      paddingTop: 8,
      wrap: true,
    },
  });
  statusNode.text = "Sign in with your admin username and password.";

  const loginButton = engine.ui.createButtonNode({
    id: "blog-login-submit-button",
    label: "Sign In",
    style: {
      font: "13px sans-serif",
      textColor: "#111827",
      background: "#E5E7EB",
      borderColor: "#9CA3AF",
      minHeight: 36,
      paddingX: 16,
    },
    onPress: () => onLoginPress(),
  });

  engine.ui.mountNode(bannerNode, pageNode);
  engine.ui.mountNode(backButton, pageNode);
  engine.ui.mountNode(usernameNode, pageNode);
  engine.ui.mountNode(passwordNode, pageNode);
  engine.ui.mountNode(statusNode, pageNode);
  engine.ui.mountNode(loginButton, pageNode);

  return {
    pageNode,
    usernameNode,
    passwordNode,
    setStatus(message, color = "#D1D5DB") {
      statusNode.text = message;
      statusNode.style.color = color;
    },
    clearForm() {
      usernameNode.value = "";
      passwordNode.value = "";
    },
  };
}
