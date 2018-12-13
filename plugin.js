var __extends =
  (this && this.__extends) ||
  (function() {
    var extendStatics = function(d, b) {
      extendStatics =
        Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array &&
          function(d, b) {
            d.__proto__ = b;
          }) ||
        function(d, b) {
          for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
        };
      return extendStatics(d, b);
    };
    return function(d, b) {
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : ((__.prototype = b.prototype), new __());
    };
  })();
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
      'typedoc/dist/lib/output/models/NavigationItem',
      'typedoc/dist/lib/output/components',
    ], factory);
  }
})(function(require, exports) {
  'use strict';
  Object.defineProperty(exports, '__esModule', { value: true });
  var reflections_1 = require('typedoc/dist/lib/models/reflections');
  var components_1 = require('typedoc/dist/lib/converter/components');
  var options_1 = require('typedoc/dist/lib/utils/options');
  var events_1 = require('typedoc/dist/lib/output/events');
  var NavigationItem_1 = require('typedoc/dist/lib/output/models/NavigationItem');
  var components_2 = require('typedoc/dist/lib/output/components');
  exports.PLUGIN_NAME = 'toc-group';
  exports.PLUGIN_SHORT_NAME = 'tocg';
  var TocGroupPlugin = (function(_super) {
    __extends(TocGroupPlugin, _super);
    function TocGroupPlugin() {
      return (_super !== null && _super.apply(this, arguments)) || this;
    }
    TocGroupPlugin_1 = TocGroupPlugin;
    TocGroupPlugin.prototype.initialize = function() {
      var _a;
      var options = this.application.options;
      options.read({}, options_1.OptionsReadMode.Prefetch);
      var defaultTags = ['group', 'kind', 'platform'];
      var userTags = (options.getValue(exports.PLUGIN_NAME) || '').split(',');
      this.groupTags = defaultTags.concat(userTags);
      this.regexp = new RegExp('@(' + this.groupTags.join('|') + ')');
      this.listenTo(
        this.owner,
        ((_a = {}),
        (_a[events_1.RendererEvent.BEGIN] = this.onBeginRenderer),
        (_a[events_1.PageEvent.BEGIN] = this.onBeginPage),
        _a),
      );
    };
    TocGroupPlugin.prototype.onBeginRenderer = function(event) {
      console.log('onBeginRenderer 你到底走了没走');
      this.navigation = this.owner.theme.getNavigation(event.project);
    };
    TocGroupPlugin.prototype.onBeginPage = function(page) {
      console.log('onBeginPage 你到底走了没走');
      var model = page.model;
      if (!(model instanceof reflections_1.Reflection)) {
        return;
      }
      var trail = [];
      while (
        !(model instanceof reflections_1.ProjectReflection) &&
        !model.kindOf(reflections_1.ReflectionKind.SomeModule)
      ) {
        trail.unshift(model);
        model = model.parent;
      }
      var tocRestriction = this.owner.toc;
      page.toc = new NavigationItem_1.NavigationItem();
      TocGroupPlugin_1.buildGroupedToc(model, trail, page.toc, tocRestriction);
    };
    TocGroupPlugin.buildGroupedToc = function(model, trail, parent, restriction) {
      var index = trail.indexOf(model);
      var children = model['children'] || [];
      if (index < trail.length - 1 && children.length > 40) {
        var child = trail[index + 1];
        var item = NavigationItem_1.NavigationItem.create(child, parent, true);
        item.isInPath = true;
        item.isCurrent = false;
        TocGroupPlugin_1.buildGroupedToc(child, trail, item);
      } else {
        children.forEach(function(child) {
          if (restriction && restriction.length > 0 && restriction.indexOf(child.name) === -1) {
            return;
          }
          if (child.kindOf(reflections_1.ReflectionKind.SomeModule)) {
            return;
          }
          var item = NavigationItem_1.NavigationItem.create(child, parent, true);
          if (trail.indexOf(child) !== -1) {
            item.isInPath = true;
            item.isCurrent = trail[trail.length - 1] === child;
            TocGroupPlugin_1.buildGroupedToc(child, trail, item);
          }
        });
      }
    };
    var TocGroupPlugin_1;
    TocGroupPlugin = TocGroupPlugin_1 = __decorate(
      [components_1.Component({ name: exports.PLUGIN_NAME })],
      TocGroupPlugin,
    );
    return TocGroupPlugin;
  })(components_2.RendererComponent);
  exports.TocGroupPlugin = TocGroupPlugin;
});
