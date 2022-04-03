import * as React from "react";
import { useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { usePortalContext } from "../hooks/usePortalContext";

interface PortalProps {
  children?: React.ReactNode;
  node?: Element;
}

const domAvailable =
  typeof window !== "undefined" &&
  window.document &&
  window.document.createElement;

let globalPortal = null as HTMLDivElement | null;

export const Portal = ({ children, node }: PortalProps): JSX.Element => {
  const { node: ctxNode } = usePortalContext();

  if (!domAvailable) {
    return <></>;
  }

  if (!node && !ctxNode && !globalPortal) {
    globalPortal = document.createElement("div");
    globalPortal.setAttribute("data-techtrain-portal", "");
    document.body.appendChild(globalPortal);
  }

  if ((node || ctxNode) && globalPortal) {
    globalPortal.remove();
    globalPortal = null;
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const containerNode = node ?? ctxNode ?? globalPortal!;
  return createPortal(children, containerNode);
};
