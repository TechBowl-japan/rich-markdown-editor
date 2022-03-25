import * as React from "react";
import { PortalContext } from "../hooks/usePortalContext";

interface PortalProviderProps {
  children?: React.ReactNode;
  node: Element;
}

export const PortalProvider = ({
  children,
  node,
}: PortalProviderProps): JSX.Element => {
  return (
    <PortalContext.Provider value={{ node }}>{children}</PortalContext.Provider>
  );
};
