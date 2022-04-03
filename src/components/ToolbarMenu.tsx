import * as React from "react";
import { EditorView } from "prosemirror-view";
import styled, { withTheme } from "styled-components";
import ToolbarButton from "./ToolbarButton";
import ToolbarSeparator from "./ToolbarSeparator";
import theme from "../styles/theme";
import { MenuItem } from "../types";

const FlexibleWrapper = styled.div`
  display: flex;
`;

interface ToolbarMenuProps {
  tooltip: typeof React.Component | React.FC<any>;
  commands: Record<string, any>;
  view: EditorView;
  theme: typeof theme;
  items: MenuItem[];
}

const ToolbarMenu = ({
  view,
  items,
  commands,
  theme,
  tooltip: Tooltip,
}: ToolbarMenuProps) => {
  const { state } = view;

  return (
    <FlexibleWrapper>
      {items.map((item, index) => {
        if (item.name === "separator" && item.visible !== false) {
          return <ToolbarSeparator key={index} />;
        }
        if (item.visible === false || !item.icon) {
          return null;
        }
        const Icon = item.icon;
        const isActive = item.active ? item.active(state) : false;

        return (
          <ToolbarButton
            key={index}
            onClick={() => item.name && commands[item.name](item.attrs)}
            active={isActive}
          >
            <Tooltip tooltip={item.tooltip} placement="top">
              <Icon color={theme.toolbarItem} />
            </Tooltip>
          </ToolbarButton>
        );
      })}
    </FlexibleWrapper>
  );
};

export default withTheme(ToolbarMenu);
