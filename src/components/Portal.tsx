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

export const Portal = ({ children, node }: PortalProps): JSX.Element => {
  const refDefaultNode = useRef(null as Element | null);
  const { node: ctxNode } = usePortalContext();

  useEffect(() => {
    return () => {
      if (refDefaultNode.current) {
        refDefaultNode.current.remove();
      }
    };
  }, []);

  if (!domAvailable) {
    return <></>;
  }

  if (!node && !refDefaultNode.current) {
    refDefaultNode.current = document.createElement("div");
    document.body.appendChild(refDefaultNode.current);
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const containerNode = node ?? ctxNode ?? refDefaultNode.current!;
  return createPortal(children, containerNode);
};
