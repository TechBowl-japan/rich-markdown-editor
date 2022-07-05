import * as React from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider } from "styled-components";
import { EditorView, Decoration, NodeView } from "prosemirror-view";
import Extension from "../lib/Extension";
import Node from "../nodes/Node";
import { light as lightTheme, dark as darkTheme } from "../styles/theme";
import Editor from "../";

type Component = (options: {
  node: Node;
  theme: typeof lightTheme;
  isSelected: boolean;
  isEditable: boolean;
  getPos: () => number;
}) => React.ReactElement;

export default class ComponentView implements NodeView {
  component: Component;
  editor: Editor;
  extension: Extension;
  node: Node;
  view: EditorView;
  getPos: () => number;
  decorations: Decoration[];
  isSelected = false;
  dom: HTMLElement;
  reactRoot: ReactDOM.Root | null;

  // See https://prosemirror.net/docs/ref/#view.NodeView
  constructor(
    component,
    { editor, extension, node, view, getPos, decorations }
  ) {
    this.component = component;
    this.editor = editor;
    this.extension = extension;
    this.getPos = getPos;
    this.decorations = decorations;
    this.node = node;
    this.view = view;
    this.dom = node.type.spec.inline
      ? document.createElement("span")
      : document.createElement("div");
    this.reactRoot = ReactDOM.createRoot(this.dom);

    this.renderElement();
  }

  renderElement() {
    const { dark } = this.editor.props;
    const theme = this.editor.props.theme || (dark ? darkTheme : lightTheme);

    const children = this.component({
      theme,
      node: this.node,
      isSelected: this.isSelected,
      isEditable: this.view.editable,
      getPos: this.getPos,
    });

    this.reactRoot?.render(
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    );
  }

  update(node) {
    if (node.type !== this.node.type) {
      return false;
    }

    this.node = node;
    this.renderElement();
    return true;
  }

  selectNode() {
    if (this.view.editable) {
      this.isSelected = true;
      this.renderElement();
    }
  }

  deselectNode() {
    if (this.view.editable) {
      this.isSelected = false;
      this.renderElement();
    }
  }

  stopEvent() {
    return true;
  }

  destroy() {
    if (this.reactRoot) {
      this.reactRoot.unmount();
      this.reactRoot = null;
    }

    // FIXME: This is a hack to prevent the editor from crashing when a node is removed.
    this.dom = null as unknown as HTMLElement;
  }

  ignoreMutation() {
    return true;
  }
}
