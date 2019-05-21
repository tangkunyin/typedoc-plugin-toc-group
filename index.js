'use strict';

const P = require('./plugin');

module.exports = function(PluginHost) {
	const app = PluginHost.owner;
	if (app.converter.hasComponent(P.PLUGIN_NAME)) {
		return;
	}
	if (app.renderer.hasComponent(P.PLUGIN_NAME)) {
		return;
	}

	/**
	 * used like so:
	 * --toc-group group,kind,platform
	 * or
	 * -tocg group,kind,platform
	 *************** Notice **************
	 * if you insert like !256，the type 256 will not be shown in toc menu.(num. value is defined in enum ReflectionKind)
	 */
	app.options.addDeclaration({ name: P.PLUGIN_NAME, short: P.PLUGIN_SHORT_NAME });
	app.options.addDeclaration({
		help: 'The file name of the page that has the grouped menu.',
		name: 'homePath',
	});

	app.converter.addComponent(P.PLUGIN_NAME, P.TocGroupPlugin);

	app.renderer.addComponent(P.PLUGIN_NAME, P.TocGroupPlugin);
};
