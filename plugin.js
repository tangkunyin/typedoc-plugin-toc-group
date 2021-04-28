'use strict';
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
		if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function') r = Reflect.decorate(decorators, target, key, desc);
		else for (var i = decorators.length - 1; i >= 0; i--) if ((d = decorators[i])) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
		return c > 3 && r && Object.defineProperty(target, key, r), r;
	};
exports.__esModule = true;
var reflections_1 = require('typedoc/dist/lib/models/reflections');
var components_1 = require('typedoc/dist/lib/converter/components');
var events_1 = require('typedoc/dist/lib/output/events');
var NavigationItem_1 = require('typedoc/dist/lib/output/models/NavigationItem');
var converter_1 = require('typedoc/dist/lib/converter/converter');
var TocPlugin_1 = require('typedoc/dist/lib/output/plugins/TocPlugin');
exports.PLUGIN_NAME = 'toc-group';
exports.PLUGIN_SHORT_NAME = 'tocg';
var DEFAULT_UNGROUPED_NAME = 'Others';
var DEPRECATED_REGEXP = new RegExp(/^@deprecated$/);
/**
 * This plugin will generate a group menu for toc list.
 */
var TocGroupPlugin = /** @class */ (function(_super) {
	__extends(TocGroupPlugin, _super);
	function TocGroupPlugin() {
		var _this = (_super !== null && _super.apply(this, arguments)) || this;
		_this.defaultTags = ['group', 'kind', 'platform'];
		return _this;
	}
	TocGroupPlugin.prototype.initialize = function() {
		var _a;
		_super.prototype.initialize.call(this);
		this.listenTo(
			this.owner,
			((_a = {}),
			(_a[converter_1.Converter.EVENT_BEGIN] = this.onBegin),
			(_a[converter_1.Converter.EVENT_RESOLVE_BEGIN] = this.onBeginResolve),
			(_a[events_1.PageEvent.BEGIN] = this.onBeginRendererPage),
			_a),
		);
	};
	TocGroupPlugin.prototype.isHomePage = function(page) {
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
	};
	TocGroupPlugin.prototype.onBegin = function() {
		var options = this.application.options;
		var userTags = (options.getValue(exports.PLUGIN_NAME) || '').split(',');
		var groupTags = this.defaultTags.concat(userTags).filter(function(item) {
			return item.length;
		});
		this.regexp = new RegExp('@(' + groupTags.join('|') + ')');
	};
	TocGroupPlugin.prototype.onBeginResolve = function(context) {
		var groupedData = [];
		var deprecatedData = new Set();
		var mapedTocData = {};
		var reflections = context.project.reflections;
		for (var key in reflections) {
			var ref = reflections[key];
			var comment = ref.comment;
			if (!comment || !comment.tags) continue;
			for (var _i = 0, _a = comment.tags; _i < _a.length; _i++) {
				var tag = _a[_i];
				// add deprecated item names
				if (DEPRECATED_REGEXP.test('@' + tag.tagName)) deprecatedData.add(ref.name);
				// add special tags
				if (this.regexp.test('@' + tag.tagName)) {
					groupedData.push(ref.name);
					var groupKey = tag.text.split(/\r\n?|\n/)[0];
					if (!mapedTocData[groupKey]) mapedTocData[groupKey] = [];
					mapedTocData[groupKey].push(ref.name);
					break;
				}
			}
		}
		var homePath = this.application.options.getValue('homePath') || 'modules/_index_.' + context.project.name.replace(/\-/g, '') + '.html';
		// put them into context.project.
		context.project[exports.PLUGIN_NAME] = { groupedData: groupedData, deprecatedData: deprecatedData, mapedTocData: mapedTocData, homePath: homePath, regexp: this.regexp };
	};
	/**
	 * Triggered before a document will be rendered.
	 *
	 * @param page  An event object describing the current render operation.
	 */
	TocGroupPlugin.prototype.onBeginRendererPage = function(page) {
		var model = page.model;
		if (!(model instanceof reflections_1.Reflection)) {
			return;
		}
		var trail = [];
		while (!(model instanceof reflections_1.ProjectReflection) && !model.kindOf(reflections_1.ReflectionKind.SomeModule)) {
			trail.unshift(model);
			model = model.parent;
		}
		var tocRestriction = this.owner.toc;
		page.toc = new NavigationItem_1.NavigationItem();
		TocPlugin_1.TocPlugin.buildToc(model, trail, page.toc, tocRestriction);
		this.buildGroupTocContent(page);
	};
	TocGroupPlugin.prototype.buildGroupTocContent = function(page) {
		var _a = page.project[exports.PLUGIN_NAME],
			groupedData = _a.groupedData,
			deprecatedData = _a.deprecatedData,
			mapedTocData = _a.mapedTocData,
			homePath = _a.homePath,
			regexp = _a.regexp;
		if (typeof mapedTocData === 'object' && Object.keys(mapedTocData).length) {
			// set ungrouped and remove grouped data.
			if (!mapedTocData[DEFAULT_UNGROUPED_NAME]) {
				var defaultGroups_1 = [];
				page.toc.children.forEach(function(item) {
					if (groupedData.indexOf(item.title) === -1) {
						defaultGroups_1.push(item.title);
					}
				});
				if (defaultGroups_1.length) mapedTocData[DEFAULT_UNGROUPED_NAME] = defaultGroups_1;
			}
			var updatedToc = Object.keys(mapedTocData).map(function(key) {
				var groupedValue = mapedTocData[key];
				var root = new NavigationItem_1.NavigationItem(key, homePath);
				root['groupTitle'] = key;
				root.children = page.toc.children.filter(function(item) {
					if (regexp.test('@!' + item.reflection.kind)) return false;
					if (deprecatedData.has(item.title)) {
						item['deprecated'] = true;
					}
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
	};
	TocGroupPlugin = __decorate([components_1.Component({ name: exports.PLUGIN_NAME })], TocGroupPlugin);
	return TocGroupPlugin;
})(TocPlugin_1.TocPlugin);
exports.TocGroupPlugin = TocGroupPlugin;
