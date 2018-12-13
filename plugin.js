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
      'typedoc/dist/lib/ts-internal',
      'typedoc/dist/lib/utils/options',
    ], factory);
  }
})(function(require, exports) {
  'use strict';
  Object.defineProperty(exports, '__esModule', { value: true });
  const components_1 = require('typedoc/dist/lib/converter/components');
  const converter_1 = require('typedoc/dist/lib/converter/converter');
  const _ts = require('typedoc/dist/lib/ts-internal');
  const options_1 = require('typedoc/dist/lib/utils/options');
  /**
   * This plugin will generate a group menu for toc list.
   */
  let TocGroupPlugin = class TocGroupPlugin extends components_1.ConverterComponent {
    initialize() {
      const options = this.application.options;
      options.read({}, options_1.OptionsReadMode.Prefetch);
      const defaultTags = ['tocGroup', 'kind', 'platform'];
      const userTags = (options.getValue('toc-group') || '').split(',');
      this.groupTags = defaultTags.concat(userTags);
      this.regexp = new RegExp(`@(${this.groupTags.join('|')})`);
      this.listenTo(this.owner, converter_1.Converter.EVENT_CREATE_DECLARATION, this.onDeclaration, 1000);
    }
    onDeclaration(context, reflection, node) {
      if (!node) return;
      const sourceFile = _ts.getSourceFileOfNode(node);
      if (!sourceFile) return;
      const comment = _ts.getJSDocCommentRanges(node, sourceFile.text);
      if (!comment || !comment.length) return;
      const { pos, end } = comment[0];
      const rawComment = sourceFile.text.substring(pos, end);
      const lines = rawComment.split(/\r\n?|\n/);
      const nontagLines = lines.filter(line => !this.regexp.exec(line));
      const tagLines = lines.filter(line => this.regexp.exec(line));
      const rearrangedCommentText = []
        .concat(nontagLines.slice(0, -1))
        .concat(tagLines)
        .concat(nontagLines.slice(-1))
        .join('\n');
      sourceFile.text = sourceFile.text.substring(0, pos) + rearrangedCommentText + sourceFile.text.substring(end);
      console.log('my-toc-group-plugin==========>', sourceFile.text);
    }
  };
  TocGroupPlugin = __decorate([components_1.Component({ name: 'toc-group' })], TocGroupPlugin);
  exports.TocGroupPlugin = TocGroupPlugin;
});
