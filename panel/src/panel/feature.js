import { isObject } from "@/helpers/object";
import { isUrl } from "@/helpers/url";
import Module from "./module.js";

/**
 * Default state for all features
 */
export const defaults = () => {
	return {
		// the feature component
		component: null,
		// loading state
		isLoading: false,
		// event listeners
		on: {},
		// relative path to this feature
		path: null,
		// all props for the feature component
		props: {},
		// the query parameters form the latest request
		query: {},
		// referrer can be used to redirect properly in handlers
		referrer: null,
		// timestamp from the backend to force refresh the reactive state
		timestamp: null
	};
};

/**
 * Feature objects isolate functionality and state
 * of Panel features like drawers, dialogs,
 * notifications and views.
 *
 * @param {Object} panel The panel singleton
 * @param {String} key Sets the $key for the feature. Backend responses use this key for features.
 * @param {Object} defaults Sets the default state of the feature
 */
export default (panel, key, defaults) => {
	const parent = Module(key, defaults);

	return {
		/**
		 * Features inherit all the module methods
		 * and reactive defaults are also merged
		 * through them.
		 */
		...parent,

		/**
		 * @param {Object}
		 */
		addEventListeners(listeners) {
			// ignore invalid listeners
			if (isObject(listeners) === false) {
				return;
			}

			for (const event in listeners) {
				if (typeof listeners[event] === "function") {
					this.on[event] = listeners[event];
				}
			}
		},

		/**
		 * Emits a feature event
		 *
		 * @example
		 * panel.dialog.emit("submit", {})
		 *
		 * @param {String} event
		 * @param  {...any} args
		 * @returns {any}
		 */
		emit(event, ...args) {
			if (this.hasEventListener(event) === true) {
				return this.on[event](...args);
			}

			// return a dummy listener
			return () => {};
		},

		/**
		 * Checks if a listener exists
		 *
		 * @param {String} event
		 * @returns {Boolean}
		 */
		hasEventListener(event) {
			return typeof this.on[event] === "function";
		},

		/**
		 * Checks if the feature can be submitted
		 *
		 * @returns {Boolean}
		 */
		hasSubmitter() {
			// the feature has a custom submit listener
			if (this.hasEventListener("submit") === true) {
				return true;
			}

			// the feature can be submitted to the backend
			if (typeof this.path === "string") {
				return true;
			}

			return false;
		},

		/**
		 * Loads a feature from the server
		 * and opens it afterwards
		 *
		 * @example
		 * panel.view.load("/some/view");
		 *
		 * @example
		 * panel.view.load("/some/view", () => {
		 *   // submit
		 * });
		 *
		 * @example
		 * panel.view.load("/some/view", {
		 *   query: {
		 *     search: "Find me"
		 *   }
		 * });
		 *
		 * @param {String|URL} url
		 * @param {Object|Function} options
		 * @returns {Object} Returns the current state
		 */
		async load(url, options = {}) {
			// each feature can have its own loading state
			// the panel.open method also triggers the global loading
			// state for the entire panel. This adds fine-grained controll
			// over apropriate spinners.
			this.isLoading = true;

			// the global open method is used to make sure
			// that a response can also trigger other features.
			// For example, a dialog request could also open a drawer
			// or a notification by sending the matching object
			await panel.open(url, options);

			// stop the feature loader
			this.isLoading = false;

			// add additional listeners from the options
			this.addEventListeners(options.on);

			// return the final state
			return this.state();
		},

		/**
		 * Opens the feature either by URL or by
		 * passing a state object
		 *
		 * @example
		 * panel.dialog.view({
		 *   component: "k-page-view",
		 *	 props: {},
		 *   on: {
		 *     submit: () => {}
		 * 	 }
		 * });
		 *
		 * See load for more examples
		 *
		 * @param {String|URL|Object} feature
		 * @param {Object|Function} options
		 * @returns {Object} Returns the current state
		 */
		async open(feature, options = {}) {
			// simple wrapper to allow passing a submit handler
			// as second argument instead of the options
			if (typeof options === "function") {
				options = {
					on: {
						submit: options
					}
				};
			}

			// the feature needs to be loaded first
			// before it can be opened. This will route
			// the request through panel.open
			if (isUrl(feature) === true) {
				return this.load(feature, options);
			}

			// set the new state
			this.set(feature);

			// add additional listeners from the options
			this.addEventListeners(options.on);

			// trigger optional open listeners
			this.emit("open", feature, options);

			// return the final state
			return this.state();
		},

		/**
		 * Sends a post request to the backend route for
		 * this Feature
		 *
		 * @param {Object} value
		 * @param {Object} options
		 */
		async post(value, options = {}) {
			if (!this.path) {
				throw new Error(`The ${this.key()} cannot be posted`);
			}

			// start the loader
			this.isLoading = true;

			// if no value has been passed to the submit method,
			// take the value object from the props
			value = value ?? this.props?.value ?? {};

			try {
				return await panel.post(this.path, value, options);
			} catch (error) {
				panel.notification.error(error);
			} finally {
				// stop the loader
				this.isLoading = false;
			}

			return false;
		},

		/**
		 * Reloads the properties for the feature
		 */
		async refresh(options = {}) {
			options.url = options.url ?? this.url();

			const response = await panel.get(options.url, options);
			const state = response["$" + this.key()];

			// the state cannot be updated
			if (!state || state.component !== this.component) {
				return;
			}

			this.props = state.props;

			return this.state();
		},

		/**
		 * If the feature has a path, it can be reloaded
		 * with this method to replace/refresh its state
		 *
		 * @example
		 * panel.view.reload();
		 *
		 * @param {Object, Boolean} options
		 */
		async reload(options = {}) {
			if (!this.path) {
				return false;
			}

			this.open(this.url(), options);
		},

		/**
		 * Sets a new active state for the feature
		 * This is done whenever the state is an object
		 * and not undefined or null
		 *
		 * @param {Object} state
		 */
		set(state) {
			parent.set.call(this, state);

			// reset the event listeners
			this.on = {};

			// register new listeners
			this.addEventListeners(state.on ?? {});

			return this.state();
		},

		/**
		 * Creates a full URL object for the current path
		 *
		 * @returns {URL}
		 */
		url() {
			return panel.url(this.path, this.query);
		}
	};
};
