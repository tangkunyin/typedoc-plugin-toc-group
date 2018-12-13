import { PLUGIN_NAME, PLUGIN_SHORT_NAME, TocGroupPlugin } from './plugin';

module.exports = PluginHost => {
  const app = PluginHost.owner;

  if (app.renderer.hasComponent(PLUGIN_NAME)) {
    return;
  }

  /**
   * used like so:
   * --toc-group group,kind,platform
   * or
   * -slt group,kind,platform
   */
  app.options.addDeclaration({ name: PLUGIN_NAME, short: PLUGIN_SHORT_NAME });

  app.renderer.addComponent(PLUGIN_NAME, TocGroupPlugin);
};
