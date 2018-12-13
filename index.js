var plugin = require('./plugin');
module.exports = function(PluginHost) {
  var app = PluginHost.owner;
  /**
   * used like so:
   * --toc-group tocGroup,platform,kind
   * or
   * -slt tocGroup,platform,kind
   */
  app.options.addDeclaration({ name: 'toc-group', short: 'tocg' });

  app.converter.addComponent('toc-group', plugin.TocGroupPlugin);
};
