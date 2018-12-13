var __decorate =
  (this && this.__decorate) ||
  function(decorators, target, key, desc) {
    var c = arguments.length,
      r = c < 3 ? target : desc === null ? (desc = Object.getOwnPropertyDescriptor(target, key)) : desc,
      d;
    if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function')
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if ((d = decorators[i])) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };
(function(factory) {
  if (typeof module === 'object' && typeof module.exports === 'object') {
    var v = factory(require, exports);
    if (v !== undefined) module.exports = v;
  } else if (typeof define === 'function' && define.amd) {
    define([
      'require',
      'exports',
      'typedoc/dist/lib/models/reflections',
      'typedoc/dist/lib/converter/components',
      'typedoc/dist/lib/utils/options',
      'typedoc/dist/lib/output/events',
      'typedoc/dist/lib/output/plugins/TocPlugin',
      'typedoc/dist/lib/output/models/NavigationItem',
    ], factory);
  }
})(function(require, exports) {
  'use strict';
  Object.defineProperty(exports, '__esModule', { value: true });
  var TocGroupPlugin_1;
  const reflections_1 = require('typedoc/dist/lib/models/reflections');
  const components_1 = require('typedoc/dist/lib/converter/components');
  const options_1 = require('typedoc/dist/lib/utils/options');
  const events_1 = require('typedoc/dist/lib/output/events');
  const TocPlugin_1 = require('typedoc/dist/lib/output/plugins/TocPlugin');
  const NavigationItem_1 = require('typedoc/dist/lib/output/models/NavigationItem');
  /**
   * This plugin will generate a group menu for toc list.
   */
  let TocGroupPlugin = (TocGroupPlugin_1 = class TocGroupPlugin extends TocPlugin_1.TocPlugin {
    initialize() {
      const options = this.application.options;
      options.read({}, options_1.OptionsReadMode.Prefetch);
      const defaultTags = ['group', 'kind', 'platform'];
      const userTags = (options.getValue('toc-group') || '').split(',');
      this.groupTags = defaultTags.concat(userTags);
      this.regexp = new RegExp(`@(${this.groupTags.join('|')})`);
      this.listenTo(this.owner, {
        [events_1.PageEvent.BEGIN]: this._onRendererBeginPage,
      });
    }
    /**
     * Triggered before a document will be rendered.
     *
     * @param page  An event object describing the current render operation.
     */
    _onRendererBeginPage(page) {
      let model = page.model;
      if (!(model instanceof reflections_1.Reflection)) {
        return;
      }
      const trail = [];
      while (
        !(model instanceof reflections_1.ProjectReflection) &&
        !model.kindOf(reflections_1.ReflectionKind.SomeModule)
      ) {
        trail.unshift(model);
        model = model.parent;
      }
      const tocRestriction = this.owner.toc;
      page.toc = new NavigationItem_1.NavigationItem();
      console.log(tocRestriction);
      TocGroupPlugin_1.buildGroupedToc(model, trail, page.toc, tocRestriction);
    }
    /**
     * Create a toc navigation item structure.
     *
     * @param model   The models whose children should be written to the toc.
     * @param trail   Defines the active trail of expanded toc entries.
     * @param parent  The parent [[NavigationItem]] the toc should be appended to.
     * @param restriction  The restricted table of contents.
     */
    static buildGroupedToc(model, trail, parent, restriction) {
      const index = trail.indexOf(model);
      const children = model['children'] || [];
      if (index < trail.length - 1 && children.length > 40) {
        const child = trail[index + 1];
        const item = NavigationItem_1.NavigationItem.create(child, parent, true);
        item.isInPath = true;
        item.isCurrent = false;
        TocGroupPlugin_1.buildGroupedToc(child, trail, item);
      } else {
        children.forEach(child => {
          if (restriction && restriction.length > 0 && restriction.indexOf(child.name) === -1) {
            return;
          }
          if (child.kindOf(reflections_1.ReflectionKind.SomeModule)) {
            return;
          }
          const item = NavigationItem_1.NavigationItem.create(child, parent, true);
          if (trail.indexOf(child) !== -1) {
            item.isInPath = true;
            item.isCurrent = trail[trail.length - 1] === child;
            TocGroupPlugin_1.buildGroupedToc(child, trail, item);
          }
        });
      }
    }
  });
  TocGroupPlugin = TocGroupPlugin_1 = __decorate([components_1.Component({ name: 'toc-group' })], TocGroupPlugin);
  exports.TocGroupPlugin = TocGroupPlugin;
});
