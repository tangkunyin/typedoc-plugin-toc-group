var plugin = require('./plugin');
module.exports = function(PluginHost) {
  var app = PluginHost.owner;
  /**
   * used like so:
   * --toc-group group,kind,platform
   * or
   * -slt group,kind,platform
   */
  app.options.addDeclaration({ name: 'toc-group', short: 'tocg' });

  app.converter.addComponent('toc-group', plugin.TocGroupPlugin);
};
