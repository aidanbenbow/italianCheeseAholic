export function createViewFormPage(engine, formId) {
  const pageNode = engine.ui.createScrollableNode({
    id: "form-builder-view-page",
    style: { background: "#304576" },
  });

  const titleNode = engine.ui.createTextNode({
    id: "form-builder-view-title",
    style: {
        width: 400,
        height: 36,
        background: "#08205a",
        color: "#b2abab",
        font: "14px sans-serif",
        paddingLeft: 20,
        paddingTop: 8,
        marginBottom: 12,
    },
  });
  titleNode.text = `Sokratov Klub`;
  engine.ui.mountNode(titleNode, pageNode);

  const nameTextNode = engine.ui.createTextNode({
    id: "form-builder-view-name-label",
    
    style: {
        width: 400,
        height: 20,
        color: "#b2abab",
        font: "12px sans-serif",
        paddingLeft: 4,
        marginBottom: 4,
    },
  });
  nameTextNode.text = "Name";

  const nameInputNode = engine.ui.createInputNode({
    id: "form-builder-view-name-input",
    placeholder: "Form Name",
    multiline: false,
    autoGrow: false,
    style: {
        width: 420,
        height: 40,
        background: "#7989ad",
        borderColor: "#374151",
        color: "#ebe5e1",
        paddingLeft: 12,
        marginBottom: 12,
    },
  });

  const institutionTextNode = engine.ui.createTextNode({
    id: "form-builder-view-institution-label",  
    style: {
        width: 400,
        height: 20,
        color: "#b2abab",
        font: "12px sans-serif",
        paddingLeft: 4,
        marginBottom: 4,
    },
  });
  institutionTextNode.text = "Institution";

  const institutionInputNode = engine.ui.createInputNode({
    id: "form-builder-view-institution-input",
    placeholder: "Institution",
    multiline: false,
    autoGrow: false,
    style: {
        width: 420,
        height: 40,
        background: "#7989ad",
        borderColor: "#374151",
        color: "#ebe5e1",
        paddingLeft: 12,
        marginBottom: 12,
    },
  });

  const feedbackTextNode = engine.ui.createTextNode({
    id: "form-builder-view-feedback-label",  
    style: {
        width: 400,
        height: 20,
        color: "#b2abab",
        font: "12px sans-serif",
        paddingLeft: 4,
        marginBottom: 4,
    },
  });
  feedbackTextNode.text = "Feedback";

  const feedbackInputNode = engine.ui.createInputNode({
    id: "form-builder-view-feedback-input",
    placeholder: "Feedback",    
    multiline: true,
    autoGrow: true,
    style: {
        width: 420, 
        minHeight: 80,
        background: "#7989ad",
        borderColor: "#374151",
        color: "#ebe5e1",
        paddingLeft: 12,
        paddingTop: 12,
    },
  });

  const saveButton = engine.ui.createButtonNode({
    id: "form-builder-view-save-button",
    label: "Save Changes",
    style: {
        font: "13px sans-serif",
        textColor: "#111827",
        background: "#E5E7EB",
        borderColor: "#9CA3AF",
        minHeight: 36,
        paddingX: 16,
        marginTop: 12,
    },
    command: "form:Save",
    commandArgs: () => ({
      formId,
        name: nameInputNode.value,
        institution: institutionInputNode.value,
        feedback: feedbackInputNode.value,
    }),
    
    });

    engine.ui.mountNode(nameTextNode, pageNode);
  engine.ui.mountNode(nameInputNode, pageNode);
  engine.ui.mountNode(institutionTextNode, pageNode);
  engine.ui.mountNode(institutionInputNode, pageNode);
  engine.ui.mountNode(feedbackTextNode, pageNode);
  engine.ui.mountNode(feedbackInputNode, pageNode);
    engine.ui.mountNode(saveButton, pageNode);

  return pageNode;
}
