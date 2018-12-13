import { Reflection } from 'typedoc/dist/lib/models/reflections/abstract';
import { Component, ConverterComponent } from 'typedoc/dist/lib/converter/components';
import { Converter } from 'typedoc/dist/lib/converter/converter';
import { Context } from 'typedoc/dist/lib/converter/context';
import * as _ts from 'typedoc/dist/lib/ts-internal';
import { Options, OptionsReadMode } from 'typedoc/dist/lib/utils/options';

/**
 * This plugin will generate a group menu for toc list.
 */
@Component({ name: 'toc-group' })
export class TocGroupPlugin extends ConverterComponent {
  groupTags: string[];
  regexp: RegExp;

  initialize() {
    const options: Options = this.application.options;
    options.read({}, OptionsReadMode.Prefetch);

    const defaultTags = ['platform', 'tocGroup'];
    const userTags = (options.getValue('toc-group') || '').split(',');
    this.groupTags = defaultTags.concat(userTags);
    this.regexp = new RegExp(`@(${this.groupTags.join('|')})`);

    this.listenTo(this.owner, Converter.EVENT_CREATE_DECLARATION, this.onDeclaration, 1000);
  }

  private onDeclaration(context: Context, reflection: Reflection, node?) {
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


  }
}
