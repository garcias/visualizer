requirejs.config({
	waitSeconds: 0,
	paths: {
		ace: "components/ace/lib/ace",
		d3: "components/d3/d3.min",
		fancytree: "components/fancytree/src/jquery.fancytree",
		jqgrid: "components/jqgrid_edit/js/jquery.jqGrid",
		jquery: "components/jquery/jquery.min",
		jqueryui: "components/jquery-ui/ui/minified/jquery-ui.min",
		ckeditor: "components/ckeditor/ckeditor",
		threejs: "components/three.js/build/three.min",
		forms: "lib/forms",
		plot: "lib/plot/plot",
		ChemDoodle: "lib/chemdoodle/ChemDoodleWeb-unpacked",
		pouchdb: "components/pouchdb/dist/pouchdb-nightly.min",
		uri: "components/uri.js/src",
    underscore: "./components/underscore/underscore",
    svgedit: "./lib/svg-edit-2.7/embedapi"
	},
	shim: {
		"d3": {
			exports: "d3"
		},
		"threejs": {
			exports: "THREE"
		},
		"components/x2js/xml2json.min": {
			exports: "X2JS"
		},
		"components/leaflet/leaflet": {
			exports: "L",
			init: function() {
				return this.L.noConflict();
			}
		},
		"components/jit/Jit/jit": {
			exports: "$jit"
		},
		"ckeditor": {
			exports: "CKEDITOR"
		},
    "components/three.js/examples/js/controls/TrackballControls": ["threejs"],
		"jqgrid": ["jquery", "components/jqgrid_edit/js/i18n/grid.locale-en"],
		"libs/jsmol/js/JSmolApplet": ["libs/jsmol/JSmol.min.nojq"],
		"lib/flot/jquery.flot.pie": ["jquery", "lib/flot/jquery.flot"],
		"jqueryui": ["jquery"],
		"ChemDoodle": ["lib/chemdoodle/ChemDoodleWeb-libs"],
		"components/farbtastic/src/farbtastic": ["components/jquery/jquery-migrate.min"],
		"lib/pixastic/pixastic": ["lib/pixastic/pixastic/pixastic.core"],
		"components/fancytree/src/jquery.fancytree.dnd": ["fancytree"],
		"lib/parallel-coordinates/d3.parcoords": ["d3"]
	}
});

require(['jquery'], function($) {
	"use strict";

	function DataObject(object, recursive, forceCopy) {
		if (object) {
			for (var i in object) {
				if (object.hasOwnProperty(i)) {
					if (recursive) {
						this[i] = DataObject.check(object[i], true, forceCopy);
					} else {
						this[i] = object[i];
					}
				}
			}
		}
	}

	DataObject.check = function(object, recursive, forceCopy) {
		if (!forceCopy && (object instanceof DataObject || object instanceof DataArray)) {
			return object;
		} else if (object instanceof Array) {
			return new DataArray(object, recursive, forceCopy);
		} else if (object === null) {
			return null;
		} else if (typeof object === "object") {
			return new DataObject(object, recursive, forceCopy);
		} else {
			return object;
		}
	};

	function DataArray(arr, recursive, forceCopy) {
		var newArr = [];
		if (arr) {
			if (!(arr instanceof Array))
				throw "DataArray can only be constructed from arrays";
			for (var i = 0, l = arr.length; i < l; i++) {
				if (recursive) {
					newArr[i] = DataObject.check(arr[i], recursive, forceCopy);
				} else {
					newArr[i] = arr[i];
				}
			}
		}
		newArr.__proto__ = DataArray.prototype;
		return newArr;
	}

	DataArray.prototype = Object.create(Array.prototype);
	Object.defineProperty(DataArray.prototype, "constructor", DataArray);

	window.DataObject = DataObject;
	window.DataArray = DataArray;

	function ViewObject(object, recursive, forceCopy) {
		if (object) {
			for (var i in object) {
				if (object.hasOwnProperty(i)) {
					if (recursive) {
						this[i] = ViewObject.check(object[i], true, forceCopy);
					} else {
						this[i] = object[i];
					}
				}
			}
		}
	}

	ViewObject.check = function(object, recursive, forceCopy) {
		if (!forceCopy && (object instanceof ViewObject || object instanceof ViewArray)) {
			return object;
		} else if (object instanceof Array) {
			return new ViewArray(object, recursive, forceCopy);
		} else if (object === null) {
			return null;
		} else if (typeof object === "object") {
			return new ViewObject(object, recursive, forceCopy);
		} else {
			return object;
		}
	};

	function ViewArray(arr, recursive, forceCopy) {
		var newArr = [];
		if (arr) {
			if (!(arr instanceof Array))
				throw "ViewArray can only be constructed from arrays";
			for (var i = 0, l = arr.length; i < l; i++) {
				if (recursive) {
					newArr[i] = ViewObject.check(arr[i], recursive, forceCopy);
				} else {
					newArr[i] = arr[i];
				}
			}
		}
		newArr.__proto__ = ViewArray.prototype;
		return newArr;
	}

	ViewObject.prototype = Object.create(DataObject.prototype);
	Object.defineProperty(ViewObject.prototype, "constructor", ViewObject);

	ViewArray.prototype = Object.create(DataArray.prototype);
	Object.defineProperty(ViewArray.prototype, "constructor", ViewArray);

	window.ViewObject = ViewObject;
	window.ViewArray = ViewArray;

	var nativeTypes = ["string", "boolean", "number", "undefined"];

	var resurrectObject = {
		value: function() {
			var obj = {};
			if (nativeTypes.indexOf(this.getType()) > -1)
				return this.get();
			for (var i in this) {
				if (this[i] instanceof DataArray || this[i] instanceof DataObject) {
					obj[i] = this[i].resurrect();
				} else {
					obj[i] = this[i];
				}
			}
			return obj;
		}
	};

	var resurrectArray = {
		value: function() {
			var obj = [];
			for (var i = 0, l = this.length; i < l; i++) {
				if (this[i] instanceof DataArray || this[i] instanceof DataObject) {
					obj[i] = this[i].resurrect();
				} else {
					obj[i] = this[i];
				}
			}
			return obj;
		}
	};

	var dataGetter = {
		value: function(prop, returnDeferred) {
			if (typeof (prop) !== "undefined") {
				var val = this.get();
				if (returnDeferred) { // Returns a deferred if asked
					if (typeof (val[prop]) !== "undefined") {
						if (val[prop] && val[prop].fetch) {
							return val[prop].fetch();
						} else {
							return $.Deferred().resolve(val[prop]);
						}
					} else {
						return $.Deferred().reject();
					}
				} else {
					return val[prop];
				}
			}
			if (this.hasOwnProperty("value") && this.hasOwnProperty("type"))
				return this.value;
			return this;
		}
	};

	var dataSetter = {
		value: function(prop, value, recursive) {
			if (recursive) {
				if (value instanceof Array)
					value = new DataArray(value, true);
				else if (typeof value === 'object')
					value = new DataObject(value, true);
			}
			this[prop] = value;
			return this;
		}
	};

	var viewSetter = {
		value: function(prop, value, recursive) {
			if (recursive) {
				if (value instanceof Array)
					value = new ViewArray(value, true);
				else if (typeof value === 'object')
					value = new ViewObject(value, true);
			}
			this[prop] = value;
			return this;
		}
	};

	var dataDuplicator = {
		value: function(source) {
			return DataObject.check(this, true, true);
		}
	};

	var getChild = {
		value: function(jpath, setParents) {

			if (jpath && jpath.split) { // Old version
				jpath = jpath.split('.');
				jpath.shift();
			}

			if (!jpath || jpath.length === 0) {
				return $.Deferred().resolve(this);
			}

			var el = jpath.shift(); // Gets the current element and removes it from the array
			var self = this;

			var subEl = this.get(el, true).pipe(function(subEl) {

				if (setParents) {

					switch (typeof subEl) {

						case 'string':
							subEl = new DataObject({type: "string", value: subEl});
							break;

						case 'number':
							subEl = new DataObject({type: "number", value: subEl});
							break;
							
						case 'boolean':
							subEl = new DataObject({type: "boolean", value: subEl});
					}

					if (subEl && subEl.linkToParent) {
						subEl.linkToParent(self, el);
					}
				}

				if (!subEl || (jpath.length === 0)) {
					return subEl;
				}


				return subEl.getChild(jpath, setParents);
			});

			return subEl;
		}
	};

	var getChildSync = {
		value: function(jpath, setParents) {

			if (jpath && jpath.split) { // Old version
				jpath = jpath.split('.');
				jpath.shift( );
			}

			if (!jpath) {
				return;
			}

			var el = jpath.shift(); // Gets the current element and removes it from the array
			var subEl = this.get(el, false);

			if (subEl === null)
				return;

			switch (typeof subEl) {
				case 'undefined':
					return;
					break;

				case 'string':
					subEl = new DataObject({type: "string", value: subEl});
					break;

				case 'number':
					subEl = new DataObject({type: "number", value: subEl});
					break;

				case 'boolean':
					subEl = new DataObject({type: "boolean", value: subEl});
					break;
			}

			if (!subEl.__parent) {

				Object.defineProperty(subEl, '__parent', {value: this, writable: false, configurable: false, enumerable: false});
				Object.defineProperty(subEl, '__name', {value: el, writable: false, configurable: false, enumerable: false});

			}

			if (jpath.length === 0) {
				return subEl;
			}

			return subEl.getChildSync(jpath, setParents);
		}
	};

	var linkToParent = {
		value: function(parent, name) {

			if (this.__parent) {
				return;
			}

			parent[ name ] = this;

			Object.defineProperty(this, '__parent', {value: parent, writable: false, configurable: false, enumerable: false});
			Object.defineProperty(this, '__name', {value: name, writable: false, configurable: false, enumerable: false});
		}
	};

	var setChild = {
		value: function(jpath, newValue, options) {
			var self = this;

			options = options || {};

			if (jpath.split) { // Old version
				jpath = jpath.split('.');
				jpath.shift();
			}

			if (!jpath || jpath.length === 0) {
				this.value = newValue;
				this.triggerChange(options.moduleid);
				return $.Deferred().resolve(this);
			}

			var jpathLength = jpath.length;
			if (jpathLength === 1) { // Ok we're done, let's set it

				return $.Deferred().resolve(this.set(jpath[0], newValue)).then(function() {

					if (!options.mute) {
						//			self.triggerChange( options.moduleid );
					}

				});
			}

			var el = jpath.shift();
			if (!this[el]) // We need to set an empty object to create the elements
				this.set(el, new DataObject());
			return this
					.get(el, true)
					.pipe(function(el) {
						el.setChild(jpath, newValue, options);
					})
					.done(function() {
						// This has been commented so that there's no trigger for every level, which would cause the first level 
						// to trigger n times (n = nb of levels in jpath).
						// HOWEVER, that may cause an issue for the updating of subelements of the main element
						// This can be solved. We'd have to prevent parenting the trigger and uncomment this line
						if (!options.mute) {
							self.triggerChange(options.moduleid, true);
						}
					});
		}
	};

	var dataChanged = {
		value: function(moduleid, noBubble) {

			if (!this._listenersDataChanged) {

				if (this.__parent) {
					this.__parent.triggerChange(moduleid);
				}

				return;
			}

			var i = 0,
					l = this._listenersDataChanged.length;

			for (; i < l; i++) {

				if (moduleid === undefined || (this._listenersDataChanged[i][1] !== moduleid)) {

					this._listenersDataChanged[ i ][ 0 ].call(this, this);

				}
			}
			// Trigger on the parent if it exists !
			if (this.__parent && !noBubble && this.__parent.triggerChange) {
				this.__parent.triggerChange(moduleid);
			}
		}
	};

	var listenDataChanged = {
		value: function(callback, moduleid) {

			if (!this._listenersDataChanged)
				Object.defineProperty(this, '_listenersDataChanged', {
					value: [],
					enumerable: false,
					writable: true,
					configurable: true
				});

			this._listenersDataChanged.push([callback, moduleid]);
		}
	};

	var unbindChange = {
		value: function(moduleid) {
			if (this._listenersDataChanged) {
				for (var i = 0, l = this._listenersDataChanged.length; i < l; i++) {
					if (!moduleid || this._listenersDataChanged[ i ][ 1 ] === moduleid) {
						this._listenersDataChanged.splice(i, 1);
					}
				}
			}
		}
	};

	var getType = {
		value: function() {
			var type = typeof this;
			if (type !== "object") // Native types: number, string, boolean
				return type;
			if (this instanceof Array)
				return "array";
			if (this.hasOwnProperty("type") && (this.hasOwnProperty("value") || this.hasOwnProperty("url")))
				return this.type;
			return type;
		}
	};

	var fetch = {
		value: function() {

			var self = this,
					deferred = $.Deferred( );

			if (!this.url) { // No need for fetching. Still returning a deferred, though.
				return deferred.resolve(this);
			}
			require(['src/util/urldata'], function(urlData) { // We don't know yet if URLData has been loaded

				urlData.get(self.url, false, self.timeout).then(function(data) {

					data = DataObject.check(data, true);	// Transform the input into a DataObject

					Object.defineProperty(self, 'value', {// Sets the value to the object
						enumerable: self._keep || false, // If this._keep is true, then we will save the fetched data
						writable: true,
						configurable: false,
						value: data
					});

					deferred.resolve(self);
				}, function(data) {
					deferred.reject(self);
				});
			});

			return deferred;
		}
	};
	/*
	 * Performs a deep merge of an object into another.Properties of the from object will overwrite those of the to object.
	 * Result is different from jQuery.extend in the way that arrays are completely overwritten
	 */
	function merge(to, from) {
		for (var i in from) {
			var el = from[i];
			if (typeof el === "object") {
				if (el instanceof Array) {
					to[i] = el;
				}
				else if (el !== null) {
					if (!to[i])
						to[i] = {};
					merge(to[i], el);
				}
			} else {
				to[i] = el;
			}
		}
	}

	var mergeWithObject = {
		value: function(objectToMerge, moduleId, noBubble) {
			if((typeof (objectToMerge) !== "object") || (objectToMerge instanceof Array))
				return;
			merge(this, objectToMerge);
			this.triggerChange(moduleId, noBubble);
		}
	};

	var mergeWithArray = {
		value: function(objectToMerge, moduleId, noBubble) { // TODO find a way to implement this
			this.triggerChange(moduleId, noBubble);
			return console.warn("mergeWith method not yet implemented for DataArray");
		}
	};

	var commonProperties = {
		set: dataSetter,
		get: dataGetter,
		setChild: setChild,
		getChild: getChild,
		getChildSync: getChildSync,
		onChange: listenDataChanged,
		duplicate: dataDuplicator,
		unbindChange: unbindChange,
		linkToParent: linkToParent,
		triggerChange: dataChanged,
		getType: getType
	};

	Object.defineProperties(DataObject.prototype, commonProperties);
	Object.defineProperties(DataArray.prototype, commonProperties);

	Object.defineProperty(DataObject.prototype, "fetch", fetch);
	Object.defineProperty(DataObject.prototype, "resurrect", resurrectObject);
	Object.defineProperty(DataObject.prototype, "mergeWith", mergeWithObject);

	Object.defineProperty(DataArray.prototype, "resurrect", resurrectArray);
	Object.defineProperty(DataArray.prototype, "mergeWith", mergeWithArray);

	// Special setters for view objects
	Object.defineProperty(ViewObject.prototype, 'set', viewSetter);
	Object.defineProperty(ViewArray.prototype, 'set', viewSetter);

	Object.defineProperties(String.prototype, {
		getType: {
			value: function() {
				return 'string';
			}
		},
		get: {
			value: function() {
				return this;
			}
		}
	});

	Object.defineProperties(Number.prototype, {
		getType: {
			value: function() {
				return 'number';
			}
		},
		get: {
			value: function() {
				return this;
			}
		}
	});

	Object.defineProperties(Boolean.prototype, {
		getType: {
			value: function() {
				return 'boolean';
			}
		},
		get: {
			value: function() {
				return this;
			}
		}
	});

	$(document).ready(function() {
		require(["src/main/entrypoint", "uri/URI.fragmentQuery"], function(EntryPoint, URI) {
			var url = new URI(window.location.href);
			var type = (url.search().length > 0) ? "search" : (url.fragment()[0] === "?" ? "fragment" : "search");
			var query = new URI(url[type]()).query(true);
			EntryPoint.init(query, type.replace(type[0], type[0].toUpperCase()));
		});
	});
});
