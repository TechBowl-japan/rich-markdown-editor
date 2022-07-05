import refractor from "refractor/core";
import flattenDeep from "lodash/flattenDeep";
import { EditorStateConfig, Plugin, PluginKey, Transaction } from "prosemirror-state";
import { Node } from "prosemirror-model";
import { Decoration, DecorationSet, EditorView } from "prosemirror-view";
import { findBlockNodes } from "prosemirror-utils";
import { loadSyntaxHighlight } from "../lib/refractor";

export const LANGUAGES = {
  none: "None", // additional entry to disable highlighting
  bash: "Bash",
  css: "CSS",
  clike: "C",
  csharp: "C#",
  go: "Go",
  markup: "HTML",
  objectivec: "Objective-C",
  java: "Java",
  javascript: "JavaScript",
  json: "JSON",
  perl: "Perl",
  php: "PHP",
  powershell: "Powershell",
  python: "Python",
  ruby: "Ruby",
  rust: "Rust",
  sql: "SQL",
  typescript: "TypeScript",
  yaml: "YAML",
};

type ParsedNode = {
  text: string;
  classes: string[];
};

const cache: Record<number, { node: Node; decorations: Decoration[] }> = {};

function getDecorations({ doc, name }: { doc: Node; name: string }) {
  let isIncompleteRender = false;

  const decorations: Decoration[] = [];
  const blocks: { node: Node; pos: number }[] = findBlockNodes(doc).filter(
    (item) => item.node.type.name === name
  );

  function parseNodes(
    nodes: refractor.RefractorNode[],
    classNames: string[] = []
  ): any {
    return nodes.map((node) => {
      if (node.type === "element") {
        const classes = [...classNames, ...(node.properties.className || [])];
        return parseNodes(node.children, classes);
      }

      return {
        text: node.value,
        classes: classNames,
      };
    });
  }

  const promises = [] as Promise<unknown>[];

  blocks.forEach((block) => {
    let startPos = block.pos + 1;
    const language = block.node.attrs.language;
    const isRegistered = refractor.registered(language);

    isIncompleteRender = isIncompleteRender || !isRegistered;
    if (!language || language === "none" || !isRegistered) {
      const p = loadSyntaxHighlight(language);
      if (p) {
        promises.push(p);
      }
      return;
    }

    if (!cache[block.pos] || !cache[block.pos].node.eq(block.node)) {
      const nodes = refractor.highlight(block.node.textContent, language);
      const _decorations = flattenDeep(parseNodes(nodes))
        .map((node: ParsedNode) => {
          const from = startPos;
          const to = from + node.text.length;

          startPos = to;

          return {
            ...node,
            from,
            to,
          };
        })
        .filter((node) => node.classes && node.classes.length)
        .map((node) =>
          Decoration.inline(node.from, node.to, {
            class: node.classes.join(" "),
          })
        );

      cache[block.pos] = {
        node: block.node,
        decorations: _decorations,
      };
    }
    cache[block.pos].decorations.forEach((decoration) => {
      decorations.push(decoration);
    });
  });

  Object.keys(cache)
    .filter((pos) => !blocks.find((block) => block.pos === Number(pos)))
    .forEach((pos) => {
      delete cache[Number(pos)];
    });

  return [
    DecorationSet.create(doc, decorations),
    isIncompleteRender,
    promises,
  ] as const;
}

export default function Prism({ name }) {
  let highlighted = false;
  let isIncompleteRender = false;
  let promise = Promise.resolve(undefined as unknown);
  let theView = null as EditorView | null;

  return new Plugin({
    key: new PluginKey("prism"),
    state: {
      init: (_: EditorStateConfig, { doc }) => {
        return DecorationSet.create(doc, []);
      },
      apply: (transaction: Transaction, decorationSet, oldState, state) => {
        const nodeName = state.selection.$head.parent.type.name;
        const previousNodeName = oldState.selection.$head.parent.type.name;
        const codeBlockChanged =
          transaction.docChanged && [nodeName, previousNodeName].includes(name);
        const ySyncEdit = !!transaction.getMeta("y-sync$");

        if (
          !highlighted ||
          isIncompleteRender ||
          codeBlockChanged ||
          ySyncEdit
        ) {
          highlighted = true;
          const [res, flag, promises] = getDecorations({
            doc: transaction.doc,
            name,
          });
          isIncompleteRender = flag;

          if (isIncompleteRender) {
            promise = Promise.all([promise, ...promises]);
            promise.then(() => {
              if (theView?.isDestroyed) {
                theView = null;
                return;
              }

              theView?.dispatch(
                theView.state.tr.setMeta("prism", { loaded: true })
              );
            });
          }

          return res;
        }

        return decorationSet.map(transaction.mapping, transaction.doc);
      },
    },
    view: (view) => {
      theView = view;

      if (!highlighted || isIncompleteRender) {
        // we don't highlight code blocks on the first render as part of mounting
        // as it's expensive (relative to the rest of the document). Instead let
        // it render un-highlighted and then trigger a defered render of Prism
        // by updating the plugins metadata
        setTimeout(() => {
          if (view.isDestroyed) {
            return;
          }

          view.dispatch(view.state.tr.setMeta("prism", { loaded: true }));
        }, 10);
      }
      return {};
    },
    props: {
      decorations(state) {
        return this.getState(state);
      },
    },
  });
}
