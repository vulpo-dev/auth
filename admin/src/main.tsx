import "open-props/open-props.min.css";
import "werkbank/style/base.css";
import "./style.css";

import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { Auth } from "@vulpo-dev/auth-react";
import { Provider } from "react-redux";

import { Router } from "./app/router";
import { AuthClient } from "./app/auth";
import { Store } from "./app/store";

function main() {
	let container = document.getElementById("root");

	if (!container) {
		return;
	}

	let root = createRoot(container);

	root.render(
		<Provider store={Store}>
			<Auth.Provider value={AuthClient}>
				<RouterProvider router={Router} />
			</Auth.Provider>
		</Provider>,
	);
}

main();
