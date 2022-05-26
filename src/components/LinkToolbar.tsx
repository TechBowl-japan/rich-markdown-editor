import * as React from "react";
import { EditorView } from "prosemirror-view";
import LinkEditor, { SearchResult } from "./LinkEditor";
import FloatingToolbar from "./FloatingToolbar";
import createAndInsertLink from "../commands/createAndInsertLink";
import baseDictionary from "../dictionary";
import { createRef, useCallback, useEffect } from "react";

type Props = {
  isActive: boolean;
  view: EditorView;
  tooltip: typeof React.Component | React.FC<any>;
  dictionary: typeof baseDictionary;
  onCreateLink?: (title: string) => Promise<string>;
  onSearchLink?: (term: string) => Promise<SearchResult[]>;
  onClickLink: (href: string, event: MouseEvent) => void;
  onShowToast?: (msg: string, code: string) => void;
  onClose: () => void;
};

function isActive(props: Props) {
  const { view } = props;
  const { selection } = view.state;

  try {
    const paragraph = view.domAtPos(selection.from);
    return props.isActive && !!paragraph.node;
  } catch (err) {
    return false;
  }
}

const LinkToolbar = (props: Props) => {
  const { onClose, onCreateLink, ...rest } = props;

  const refMenu = createRef<HTMLDivElement>();
  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      const { target } = event;

      if (
        event.target &&
        refMenu.current &&
        target instanceof Node &&
        refMenu.current.contains(target)
      ) {
        return;
      }

      onClose();
    },
    [refMenu, onClose]
  );

  const handleOnCreateLink = useCallback(
    async (title: string) => {
      const { dictionary, onCreateLink, view, onClose, onShowToast } = props;

      onClose();
      view.focus();

      if (!onCreateLink) {
        return;
      }

      const { dispatch, state } = view;
      const { from, to } = state.selection;
      if (from !== to) {
        // selection must be collapsed
        return;
      }

      const href = `creating#${title}…`;

      // Insert a placeholder link
      dispatch(
        view.state.tr
          .insertText(title, from, to)
          .addMark(
            from,
            to + title.length,
            state.schema.marks.link.create({ href })
          )
      );

      createAndInsertLink(view, title, href, {
        onCreateLink,
        onShowToast,
        dictionary,
      });
    },
    [
      props.dictionary,
      props.onCreateLink,
      props.view,
      props.onClose,
      props.onShowToast,
    ]
  );

  const handleOnSelectLink = useCallback(
    ({
      href,
      title,
    }: {
      href: string;
      title: string;
      from: number;
      to: number;
    }) => {
      const { view, onClose } = props;

      onClose();
      view.focus();

      const { dispatch, state } = view;
      const { from, to } = state.selection;
      if (from !== to) {
        // selection must be collapsed
        return;
      }

      dispatch(
        view.state.tr
          .insertText(title, from, to)
          .addMark(
            from,
            to + title.length,
            state.schema.marks.link.create({ href })
          )
      );
    },
    [props.view, props.onClose]
  );

  useEffect(() => {
    window.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleClickOutside]);

  const { selection } = rest.view.state;
  const active = isActive(props);

  return (
    <FloatingToolbar ref={refMenu} active={active} {...rest}>
      {active && (
        <LinkEditor
          from={selection.from}
          to={selection.to}
          onCreateLink={onCreateLink ? handleOnCreateLink : undefined}
          onSelectLink={handleOnSelectLink}
          onRemoveLink={onClose}
          {...rest}
        />
      )}
    </FloatingToolbar>
  );
};

export default LinkToolbar;
