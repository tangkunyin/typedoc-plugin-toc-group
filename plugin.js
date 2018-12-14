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
      'typedoc/dist/lib/converter/components',
      'typedoc/dist/lib/converter/converter',
    ], factory);
  }
})(function(require, exports) {
  'use strict';
  Object.defineProperty(exports, '__esModule', { value: true });
  const components_1 = require('typedoc/dist/lib/converter/components');
  const converter_1 = require('typedoc/dist/lib/converter/converter');
  exports.PLUGIN_NAME = 'toc-group';
  exports.PLUGIN_SHORT_NAME = 'tocg';
  /**
   * This plugin will generate a group menu for toc list.
   */
  let TocGroupPlugin = class TocGroupPlugin extends components_1.ConverterComponent {
    /**
     * This plugin will generate a group menu for toc list.
     */
    constructor() {
      super(...arguments);
      this.defaultTags = ['group', 'kind', 'platform'];
      this.tocGroups = [];
    }
    initialize() {
      this.listenTo(this.owner, {
        [converter_1.Converter.EVENT_BEGIN]: this.onBegin,
        [converter_1.Converter.EVENT_RESOLVE_BEGIN]: this.onBeginResolve,
      });
    }
    onBegin() {
      const options = this.application.options;
      const userTags = (options.getValue(exports.PLUGIN_NAME) || '').split(',');
      const groupTags = this.defaultTags.concat(userTags).filter(item => item.length);
      this.regexp = new RegExp(`@(${groupTags.join('|')})`);
    }
    onBeginResolve(context) {
      const reflections = context.project.reflections;
      for (const key in reflections) {
        const ref = reflections[key];
        const comment = ref.comment;
        if (!comment || !comment.tags) continue;
        let group = {};
        for (const tag of comment.tags) {
          if (this.regexp.test(`@${tag.tagName}`)) {
            const groupKey = tag.text.split(/\r\n?|\n/)[0];
            // 如果有，直接放进去
            const existGroup = this.tocGroups.find((value, index, arr) => {
              return groupKey in value;
            });
            if (existGroup) group = existGroup;
            if (!group[groupKey]) group[groupKey] = [];
            group[groupKey].push(ref.name);
            break;
          }
        }
        // 去重
        if (Object.keys(group).length) {
          const key = Object.keys(group)[0];
          if (
            !this.tocGroups.find((value, index, arr) => {
              return key in value;
            })
          ) {
            this.tocGroups.push(group);
          }
        }
      }
      // 最终数据
      console.dir(this.tocGroups);
    }
  };
  TocGroupPlugin = __decorate([components_1.Component({ name: exports.PLUGIN_NAME })], TocGroupPlugin);
  exports.TocGroupPlugin = TocGroupPlugin;
});
