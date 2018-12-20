import { Reflection, ReflectionKind, ProjectReflection } from 'typedoc/dist/lib/models/reflections';
import { Component } from 'typedoc/dist/lib/converter/components';
import { Options } from 'typedoc/dist/lib/utils/options';
import { PageEvent } from 'typedoc/dist/lib/output/events';
import { NavigationItem } from 'typedoc/dist/lib/output/models/NavigationItem';
import { Converter } from 'typedoc/dist/lib/converter/converter';
import { Context } from 'typedoc/dist/lib/converter/context';
import { TocPlugin } from 'typedoc/dist/lib/output/plugins/TocPlugin';

export const PLUGIN_NAME = 'toc-group';
export const PLUGIN_SHORT_NAME = 'tocg';

const DEFAULT_UNGROUPED_NAME = 'Others';

/**
 * This plugin will generate a group menu for toc list.
 */
@Component({ name: PLUGIN_NAME })
export class TocGroupPlugin extends TocPlugin {
	private regexp: RegExp;
	private defaultTags = ['group', 'kind', 'platform'];

	initialize() {
		super.initialize();
		this.listenTo(this.owner, {
			[Converter.EVENT_BEGIN]: this.onBegin,
			[Converter.EVENT_RESOLVE_BEGIN]: this.onBeginResolve,
			[PageEvent.BEGIN]: this.onBeginRendererPage,
		});
	}

	isHomePage(page: PageEvent) {
		if (page && page.url && page.project) {
			try {
				if (page.url.indexOf(page.project[PLUGIN_NAME].homePath) > -1) {
					return true;
				}
			} catch (e) {
				console.log(e);
			}
		}
		return false;
	}

	private onBegin() {
		const options: Options = this.application.options;
		const userTags = (options.getValue(PLUGIN_NAME) || '').split(',');
		const groupTags = this.defaultTags.concat(userTags).filter(item => item.length);
		this.regexp = new RegExp(`@(${groupTags.join('|')})`);
	}

	private onBeginResolve(context: Context) {
		const groupedData = [];
		const mapedTocData = {};
		const reflections = context.project.reflections;

		for (const key in reflections) {
			const ref = reflections[key];
			const comment = ref.comment;

			if (!comment || !comment.tags) continue;

			for (const tag of comment.tags) {
				if (this.regexp.test(`@${tag.tagName}`)) {
					groupedData.push(ref.name);

					const groupKey = tag.text.split(/\r\n?|\n/)[0];
					if (!mapedTocData[groupKey]) mapedTocData[groupKey] = [];
					mapedTocData[groupKey].push(ref.name);
					break;
				}
			}
		}

		const homePath = `modules/_index_.${context.project.name.replace(/\-/g, '')}.html`;
		// put them into context.project.
		context.project[PLUGIN_NAME] = { groupedData, mapedTocData, homePath };
	}

	/**
	 * Triggered before a document will be rendered.
	 *
	 * @param page  An event object describing the current render operation.
	 */
	private onBeginRendererPage(page: PageEvent) {
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
		TocPlugin.buildToc(model, trail, page.toc, tocRestriction);

		this.buildGroupTocContent(page);
	}

	private buildGroupTocContent(page: PageEvent) {
		if (this.isHomePage(page)) {
			const { groupedData, mapedTocData, homePath } = page.project[PLUGIN_NAME];
			if (typeof mapedTocData === 'object' && Object.keys(mapedTocData).length) {
				// set ungrouped and remove grouped data.
				if (!mapedTocData[DEFAULT_UNGROUPED_NAME]) {
					const defaultGroups = [];
					page.toc.children.forEach((item: NavigationItem) => {
						if (groupedData.indexOf(item.title) === -1) {
							defaultGroups.push(item.title);
						}
					});
					if (defaultGroups.length) mapedTocData[DEFAULT_UNGROUPED_NAME] = defaultGroups;
				}

				const updatedToc = Object.keys(mapedTocData).map((key: string) => {
					const groupedValue = mapedTocData[key];
					const root = new NavigationItem(key, homePath);
					root['groupTitle'] = key;
					root.children = page.toc.children.filter((item: NavigationItem) => {
						if (groupedValue.indexOf(item.title) > -1) {
							item.parent = root;
							return true;
						}
						return false;
					});
					return root;
				});

				if (updatedToc && updatedToc.length) {
					page.toc.children = updatedToc;
				}
			}
		}
	}
}
