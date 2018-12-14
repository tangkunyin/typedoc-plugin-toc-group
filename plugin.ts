import { Component, ConverterComponent } from 'typedoc/dist/lib/converter/components';
import { Options } from 'typedoc/dist/lib/utils/options';
import { PageEvent, RendererEvent } from 'typedoc/dist/lib/output/events';
import { NavigationItem } from 'typedoc/dist/lib/output/models/NavigationItem';
import { Converter } from 'typedoc/dist/lib/converter/converter';
import { Context } from 'typedoc/dist/lib/converter/context';

export const PLUGIN_NAME = 'toc-group';
export const PLUGIN_SHORT_NAME = 'tocg';

/**
 * This plugin will generate a group menu for toc list.
 */
@Component({ name: PLUGIN_NAME })
export class TocGroupPlugin extends ConverterComponent {
  regexp: RegExp;
  private defaultTags = ['group', 'kind', 'platform'];
  private tocGroups: Array<any> = [];

  initialize() {
    this.listenTo(this.owner, {
      [Converter.EVENT_BEGIN]: this.onBegin,
      [Converter.EVENT_RESOLVE_BEGIN]: this.onBeginResolve,
    });
  }

  onBegin() {
    const options: Options = this.application.options;
    const userTags = (options.getValue(PLUGIN_NAME) || '').split(',');
    const groupTags = this.defaultTags.concat(userTags).filter(item => item.length);
    this.regexp = new RegExp(`@(${groupTags.join('|')})`);
  }

  onBeginResolve(context: Context) {
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
}
