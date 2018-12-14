'use strict';

const P = require('./plugin');

module.exports = function(PluginHost) {
  const app = PluginHost.owner;
  if (app.converter.hasComponent(P.PLUGIN_NAME)) {
    return;
  }

  /**
   * used like so:
   * --toc-group group,kind,platform
   * or
   * -slt group,kind,platform
   */
  app.options.addDeclaration({ name: P.PLUGIN_NAME, short: P.PLUGIN_SHORT_NAME });

  app.converter.addComponent(P.PLUGIN_NAME, P.TocGroupPlugin);
};
