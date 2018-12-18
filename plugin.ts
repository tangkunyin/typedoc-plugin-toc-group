import { Reflection, ReflectionKind, ProjectReflection, DeclarationReflection } from 'typedoc/dist/lib/models/reflections';
import { Component } from 'typedoc/dist/lib/converter/components';
import { Options, OptionsReadMode } from 'typedoc/dist/lib/utils/options';
import { PageEvent } from 'typedoc/dist/lib/output/events';
import { NavigationItem } from 'typedoc/dist/lib/output/models/NavigationItem';
import { Converter } from 'typedoc/dist/lib/converter/converter';
import { Context } from 'typedoc/dist/lib/converter/context';
import { TocPlugin } from 'typedoc/dist/lib/output/plugins/TocPlugin';

export const PLUGIN_NAME = 'toc-group';
export const PLUGIN_SHORT_NAME = 'tocg';

/**
 * This plugin will generate a group menu for toc list.
 */
@Component({ name: PLUGIN_NAME })
export class TocGroupPlugin extends TocPlugin {
	private regexp: RegExp;
	private defaultTags = ['group', 'kind', 'platform'];

	initialize() {
		this.listenTo(this.owner, {
			[Converter.EVENT_BEGIN]: this.onBegin,
			[Converter.EVENT_RESOLVE_BEGIN]: this.onBeginResolve,
			[PageEvent.BEGIN]: this.onBeginRendererPage,
		});
	}

	private onBegin() {
		const options: Options = this.application.options;
		const userTags = (options.getValue(PLUGIN_NAME) || '').split(',');
		const groupTags = this.defaultTags.concat(userTags).filter(item => item.length);
		this.regexp = new RegExp(`@(${groupTags.join('|')})`);
	}

	private onBeginResolve(context: Context) {
		const tocGroups: Array<any> = [];
		const homePath: string = `modules/_index_.${context.project.name.replace(/\-/g, '')}.html`;

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
					const existGroup = tocGroups.find((value, index, arr) => {
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
					!tocGroups.find((value, index, arr) => {
						return key in value;
					})
				) {
					tocGroups.push(group);
				}
			}
		}

		// Put them into context.project.
		context.project[PLUGIN_NAME] = { tocGroups, homePath };
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

		TocGroupPlugin.buildGroupToc(model, trail, page.toc, tocRestriction, page);
	}

	static isHomePage(page: PageEvent) {
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

	static buildGroupToc(model: Reflection, trail: Reflection[], parent: NavigationItem, restriction?: string[], page?: PageEvent) {
		const index = trail.indexOf(model);
		const children = model['children'] || [];

		if (index < trail.length - 1 && children.length > 40) {
			const child = trail[index + 1];
			const item = NavigationItem.create(child, parent, true);
			item.isInPath = true;
			item.isCurrent = false;
			TocGroupPlugin.buildGroupToc(child, trail, item);
		} else {
			children.forEach((child: DeclarationReflection) => {
				if (restriction && restriction.length > 0 && restriction.indexOf(child.name) === -1) {
					return;
				}

				if (child.kindOf(ReflectionKind.SomeModule)) {
					return;
				}

				const item = NavigationItem.create(child, parent, true);

				if (this.isHomePage(page)) {
					console.log(item.title);
					// TODO.
					if (item.title === 'xxx') {
						const groupedToc = page.project[PLUGIN_NAME].tocGroups;

						console.log(groupedToc);
					}
				}

				if (trail.indexOf(child) !== -1) {
					item.isInPath = true;
					item.isCurrent = trail[trail.length - 1] === child;
					TocGroupPlugin.buildGroupToc(child, trail, item);
				}
			});
		}
	}
}
