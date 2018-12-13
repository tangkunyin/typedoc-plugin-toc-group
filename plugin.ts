import {
  Reflection,
  ReflectionKind,
  ProjectReflection,
  DeclarationReflection,
} from 'typedoc/dist/lib/models/reflections';
import { Component } from 'typedoc/dist/lib/converter/components';
import { Options, OptionsReadMode } from 'typedoc/dist/lib/utils/options';
import { PageEvent } from 'typedoc/dist/lib/output/events';
import { TocPlugin } from 'typedoc/dist/lib/output/plugins/TocPlugin';
import { NavigationItem } from 'typedoc/dist/lib/output/models/NavigationItem';

/**
 * This plugin will generate a group menu for toc list.
 */
@Component({ name: 'toc-group' })
export class TocGroupPlugin extends TocPlugin {
  groupTags: string[];
  regexp: RegExp;

  initialize() {
    const options: Options = this.application.options;
    options.read({}, OptionsReadMode.Prefetch);

    const defaultTags = ['group', 'kind', 'platform'];
    const userTags = (options.getValue('toc-group') || '').split(',');
    this.groupTags = defaultTags.concat(userTags);
    this.regexp = new RegExp(`@(${this.groupTags.join('|')})`);

    this.listenTo(this.owner, {
      [PageEvent.BEGIN]: this._onRendererBeginPage,
    });
  }

  /**
   * Triggered before a document will be rendered.
   *
   * @param page  An event object describing the current render operation.
   */
  private _onRendererBeginPage(page: PageEvent) {
    let model = page.model;
    if (!(model instanceof Reflection)) {
      return;
    }

    const trail: Reflection[] = [];
    while (!(model instanceof ProjectReflection) && !model.kindOf(ReflectionKind.SomeModule)) {
      trail.unshift(model);
      model = model.parent;
    }

    const tocRestriction = this.owner.toc;
    page.toc = new NavigationItem();

    console.log(tocRestriction);

    TocGroupPlugin.buildGroupedToc(model, trail, page.toc, tocRestriction);
  }

  /**
   * Create a toc navigation item structure.
   *
   * @param model   The models whose children should be written to the toc.
   * @param trail   Defines the active trail of expanded toc entries.
   * @param parent  The parent [[NavigationItem]] the toc should be appended to.
   * @param restriction  The restricted table of contents.
   */
  static buildGroupedToc(model: Reflection, trail: Reflection[], parent: NavigationItem, restriction?: string[]) {
    const index = trail.indexOf(model);
    const children = model['children'] || [];

    if (index < trail.length - 1 && children.length > 40) {
      const child = trail[index + 1];
      const item = NavigationItem.create(child, parent, true);
      item.isInPath = true;
      item.isCurrent = false;
      TocGroupPlugin.buildGroupedToc(child, trail, item);
    } else {
      children.forEach((child: DeclarationReflection) => {
        if (restriction && restriction.length > 0 && restriction.indexOf(child.name) === -1) {
          return;
        }

        if (child.kindOf(ReflectionKind.SomeModule)) {
          return;
        }

        const item = NavigationItem.create(child, parent, true);
        if (trail.indexOf(child) !== -1) {
          item.isInPath = true;
          item.isCurrent = trail[trail.length - 1] === child;
          TocGroupPlugin.buildGroupedToc(child, trail, item);
        }
      });
    }
  }
}
