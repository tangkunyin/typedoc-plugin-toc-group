import {
  Reflection,
  ReflectionKind,
  ProjectReflection,
  DeclarationReflection,
} from 'typedoc/dist/lib/models/reflections';
import { Component } from 'typedoc/dist/lib/converter/components';
import { Options, OptionsReadMode } from 'typedoc/dist/lib/utils/options';
import { PageEvent, RendererEvent } from 'typedoc/dist/lib/output/events';
import { NavigationItem } from 'typedoc/dist/lib/output/models/NavigationItem';
import { RendererComponent } from 'typedoc/dist/lib/output/components';

export const PLUGIN_NAME = 'toc-group';
export const PLUGIN_SHORT_NAME = 'tocg';

/**
 * This plugin will generate a group menu for toc list.
 */
@Component({ name: PLUGIN_NAME })
export class TocGroupPlugin extends RendererComponent {
  groupTags: string[];
  regexp: RegExp;
  navigation: NavigationItem;

  initialize() {
    const options: Options = this.application.options;
    options.read({}, OptionsReadMode.Prefetch);

    const defaultTags = ['group', 'kind', 'platform'];
    const userTags = (options.getValue(PLUGIN_NAME) || '').split(',');
    this.groupTags = defaultTags.concat(userTags);
    this.regexp = new RegExp(`@(${this.groupTags.join('|')})`);

    this.listenTo(this.owner, {
      [RendererEvent.BEGIN]: this.onBeginRenderer,
      [PageEvent.BEGIN]: this.onBeginPage,
    });
  }

  /**
   * Triggered before the renderer starts rendering a project.
   *
   * @param event  An event object describing the current render operation.
   */
  private onBeginRenderer(event: RendererEvent) {
    console.log('onBeginRenderer 你到底走了没走');
    this.navigation = this.owner.theme.getNavigation(event.project);
  }

  /**
   * Triggered before a document will be rendered.
   *
   * @param page  An event object describing the current render operation.
   */
  private onBeginPage(page: PageEvent) {
    console.log('onBeginPage 你到底走了没走');

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
