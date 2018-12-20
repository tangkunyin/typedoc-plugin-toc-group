var __decorate =
	(this && this.__decorate) ||
	function(decorators, target, key, desc) {
		var c = arguments.length,
			r = c < 3 ? target : desc === null ? (desc = Object.getOwnPropertyDescriptor(target, key)) : desc,
			d;
		if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function') r = Reflect.decorate(decorators, target, key, desc);
		else for (var i = decorators.length - 1; i >= 0; i--) if ((d = decorators[i])) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
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
			'typedoc/dist/lib/output/events',
			'typedoc/dist/lib/output/models/NavigationItem',
			'typedoc/dist/lib/converter/converter',
			'typedoc/dist/lib/output/plugins/TocPlugin',
		], factory);
	}
})(function(require, exports) {
	'use strict';
	Object.defineProperty(exports, '__esModule', { value: true });
	const reflections_1 = require('typedoc/dist/lib/models/reflections');
	const components_1 = require('typedoc/dist/lib/converter/components');
	const events_1 = require('typedoc/dist/lib/output/events');
	const NavigationItem_1 = require('typedoc/dist/lib/output/models/NavigationItem');
	const converter_1 = require('typedoc/dist/lib/converter/converter');
	const TocPlugin_1 = require('typedoc/dist/lib/output/plugins/TocPlugin');
	exports.PLUGIN_NAME = 'toc-group';
	exports.PLUGIN_SHORT_NAME = 'tocg';
	const DEFAULT_UNGROUPED_NAME = 'Others';
	/**
	 * This plugin will generate a group menu for toc list.
	 */
	let TocGroupPlugin = class TocGroupPlugin extends TocPlugin_1.TocPlugin {
		/**
		 * This plugin will generate a group menu for toc list.
		 */
		constructor() {
			super(...arguments);
			this.defaultTags = ['group', 'kind', 'platform'];
		}
		initialize() {
			super.initialize();
			this.listenTo(this.owner, {
				[converter_1.Converter.EVENT_BEGIN]: this.onBegin,
				[converter_1.Converter.EVENT_RESOLVE_BEGIN]: this.onBeginResolve,
				[events_1.PageEvent.BEGIN]: this.onBeginRendererPage,
			});
		}
		isHomePage(page) {
			if (page && page.url && page.project) {
				try {
					if (page.url.indexOf(page.project[exports.PLUGIN_NAME].homePath) > -1) {
						return true;
					}
				} catch (e) {
					console.log(e);
				}
			}
			return false;
		}
		onBegin() {
			const options = this.application.options;
			const userTags = (options.getValue(exports.PLUGIN_NAME) || '').split(',');
			const groupTags = this.defaultTags.concat(userTags).filter(item => item.length);
			this.regexp = new RegExp(`@(${groupTags.join('|')})`);
		}
		onBeginResolve(context) {
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
			context.project[exports.PLUGIN_NAME] = { groupedData, mapedTocData, homePath };
		}
		/**
		 * Triggered before a document will be rendered.
		 *
		 * @param page  An event object describing the current render operation.
		 */
		onBeginRendererPage(page) {
			let model = page.model;
			if (!(model instanceof reflections_1.Reflection)) {
				return;
			}
			const trail = [];
			while (!(model instanceof reflections_1.ProjectReflection) && !model.kindOf(reflections_1.ReflectionKind.SomeModule)) {
				trail.unshift(model);
				model = model.parent;
			}
			const tocRestriction = this.owner.toc;
			page.toc = new NavigationItem_1.NavigationItem();
			TocPlugin_1.TocPlugin.buildToc(model, trail, page.toc, tocRestriction);
			this.buildGroupTocContent(page);
		}
		buildGroupTocContent(page) {
			if (this.isHomePage(page)) {
				const { groupedData, mapedTocData, homePath } = page.project[exports.PLUGIN_NAME];
				if (typeof mapedTocData === 'object' && Object.keys(mapedTocData).length) {
					// set ungrouped and remove grouped data.
					if (!mapedTocData[DEFAULT_UNGROUPED_NAME]) {
						const defaultGroups = [];
						page.toc.children.forEach(item => {
							if (groupedData.indexOf(item.title) === -1) {
								defaultGroups.push(item.title);
							}
						});
						if (defaultGroups.length) mapedTocData[DEFAULT_UNGROUPED_NAME] = defaultGroups;
					}
					const updatedToc = Object.keys(mapedTocData).map(key => {
						const groupedValue = mapedTocData[key];
						const root = new NavigationItem_1.NavigationItem(key, homePath);
						root['groupTitle'] = key;
						root.children = page.toc.children.filter(item => {
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
	};
	TocGroupPlugin = __decorate([components_1.Component({ name: exports.PLUGIN_NAME })], TocGroupPlugin);
	exports.TocGroupPlugin = TocGroupPlugin;
});
