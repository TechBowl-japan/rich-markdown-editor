import { createContext, useContext } from "react";

interface IPortalContext {
  node: Element | null;
}

export const PortalContext = createContext({
  node: null as Element | null,
} as IPortalContext);

export const usePortalContext = (): IPortalContext => {
  return useContext(PortalContext);
};
