const ReactDOM = require('react-dom');
const ReactDOMClient = require('react-dom/client');
const nodes = new Map();

export const parameters = {
  layout: "padded",
  actions: { argTypesRegex: "^on[A-Z].*" },
}

// HACK: this will enable the concurrent mode of ReactDOM
ReactDOM.render = (app, rootNode) => {
	let root = nodes.get(rootNode);
	if (!root) {
		root = ReactDOMClient.createRoot(rootNode); // depending on your react version this might be `.createRoot`
		nodes.set(rootNode, root);
	}
  console.debug('preview.js: now rendering with concurrent mode')
	root.render(app);
};

ReactDOM.unmountComponentAtNode = (component) => {
	const root = nodes.get(component);
	if (root) {
		root.unmount();
		return true;
	} else {
		console.error("ReactDOM injection: can't unmount the given component");
		return false;
	}
};
