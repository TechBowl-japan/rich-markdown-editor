import { Selection, TextSelection, Transaction } from "prosemirror-state";
import { textblockTypeInputRule } from "prosemirror-inputrules";
import copy from "copy-to-clipboard";
import Prism, { LANGUAGES } from "../plugins/Prism";
import toggleBlockType from "../commands/toggleBlockType";
import isInCode from "../queries/isInCode";
import Node from "./Node";
import { ToastType } from "../types";

const PERSISTENCE_KEY = "rme-code-language";
const DEFAULT_LANGUAGE = "javascript";

export default class CodeFence extends Node {
  get languageOptions() {
    return Object.entries(LANGUAGES);
  }

  get name() {
    return "code_fence";
  }

  get schema() {
    return {
      attrs: {
        language: {
          default: DEFAULT_LANGUAGE,
        },
      },
      content: "text*",
      marks: "",
      group: "block",
      code: true,
      defining: true,
      draggable: false,
      parseDOM: [
        { tag: "pre", preserveWhitespace: "full" },
        {
          tag: ".code-block",
          preserveWhitespace: "full",
          contentElement: "code",
          getAttrs: (dom: HTMLDivElement) => {
            return {
              language: dom.dataset.language,
            };
          },
        },
      ],
      toDOM: (node) => {
        const button = document.createElement("button");
        button.innerText = "Copy";
        button.type = "button";
        button.addEventListener("click", this.handleCopyToClipboard);

        const select = document.createElement("select");
        select.addEventListener("change", this.handleLanguageChange);

        this.languageOptions.forEach(([key, label]) => {
          const option = document.createElement("option");
          const value = key === "none" ? "" : key;
          option.value = value;
          option.innerText = label;
          option.selected = node.attrs.language === value;
          select.appendChild(option);
        });

        return [
          "div",
          { class: "code-block", "data-language": node.attrs.language },
          ["div", { contentEditable: false }, select, button],
          ["pre", ["code", { spellCheck: false }, 0]],
        ];
      },
    };
  }

  commands({ type, schema }) {
    return (attrs) =>
      toggleBlockType(type, schema.nodes.paragraph, {
        language: localStorage?.getItem(PERSISTENCE_KEY) || DEFAULT_LANGUAGE,
        ...attrs,
      });
  }

  keys({ type, schema }) {
    return {
      "Shift-Ctrl-\\": toggleBlockType(type, schema.nodes.paragraph),
      "Shift-Enter": (state, dispatch) => {
        if (!isInCode(state)) return false;
        const { tr, selection }: { tr: Transaction; selection: TextSelection } =
          state;
        const text = selection?.$anchor?.nodeBefore?.text;

        let newText = "\n";

        if (text) {
          const splitByNewLine = text.split("\n");
          const numOfSpaces =
            splitByNewLine[splitByNewLine.length - 1].search(/\S|$/);
          newText += " ".repeat(numOfSpaces);
        }

        dispatch(tr.insertText(newText, selection.from, selection.to));
        return true;
      },
      Tab: (state, dispatch) => {
        if (!isInCode(state)) return false;

        const { tr, selection } = state;
        dispatch(tr.insertText("  ", selection.from, selection.to));
        return true;
      },
    };
  }

  handleCopyToClipboard = (event) => {
    const { view } = this.editor;
    const element = event.target;
    const { top, left } = element.getBoundingClientRect();
    const result = view.posAtCoords({ top, left });

    if (result) {
      const node = view.state.doc.nodeAt(result.pos);
      if (node) {
        copy(node.textContent);
        if (this.options.onShowToast) {
          this.options.onShowToast(
            this.options.dictionary.codeCopied,
            ToastType.Info
          );
        }
      }
    }
  };

  handleLanguageChange = (event) => {
    const { view } = this.editor;
    const { tr } = view.state;
    const element = event.target;
    const { top, left } = element.getBoundingClientRect();
    const result = view.posAtCoords({ top, left });

    if (result) {
      const language = element.value;

      const transaction = tr
        .setSelection(Selection.near(view.state.doc.resolve(result.inside)))
        .setNodeMarkup(result.inside, undefined, {
          language,
        });
      view.dispatch(transaction);

      localStorage?.setItem(PERSISTENCE_KEY, language);
    }
  };

  get plugins() {
    return [Prism({ name: this.name })];
  }

  inputRules({ type }) {
    return [textblockTypeInputRule(/^```$/, type)];
  }

  toMarkdown(state, node) {
    state.write("```" + (node.attrs.language || "") + "\n");
    state.text(node.textContent, false);
    state.ensureNewLine();
    state.write("```");
    state.closeBlock(node);
  }

  get markdownToken() {
    return "fence";
  }

  parseMarkdown() {
    return {
      block: "code_block",
      getAttrs: (tok) => ({ language: tok.info }),
    };
  }
}
