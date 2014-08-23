var bS = (function() {
	var c = {};

	function error(msg) {
		console.error('Book Schedule error: ' + msg);
	}

	function d(msg) {
		console.log('Book Scedule debug: ' + msg);
	}

	if (!$) {
		if (!jQuery) {
			error('Could not find JQuery');
		} else {
			var $ = jQuery;
		}
	}

	/**
	 * Generates a function that can be used to call a function in the
	 * current object context
	 */
	function returnFunction(func, context) {
		// Create an array out of the other pass arguments
		var a = Array.prototype.slice.call(arguments);
		// Shift to remove func
		a.shift();
		// Shift to remove context
		a.shift();
		return function () {
			/**
			 * Append the arguments from the function call to the arguments
			 * given when returnFunction was called.
			 */
			a = a.concat(Array.prototype.slice.call(arguments));
			func.apply(context, a);
		};
	}

	function combineParts(args) {
		var p, i, parts = [];

		for (p in parts) {
			if (p instanceof Array) {
				for (i in p) {
					parts.push(i);
				}
			} else {
				parts.push(p);
			}
		}

		return parts;
	}

	function getId() {
		var parts = combineParts(arguments);

		if (parts.length) {
			return parts.join('-');
		} else {
			return;
		}
	}

	function getName() {
		var parts = combineParts(arguments);

		if (parts.length) {
			var name = parts.unshift();

			if (parts.length) {
				name = name + '[' + parts.join('][') + ']';
			}

			return name;
		} else {
			return;
		}
	}

	/**
	 * Internal functions for costs
	 */
	var costs = {
		/**
		 * Creates a new cost option div
		 */
		addCostDiv: function(id, value) {
			if (c[id]) {
				do {
					var nid = (new Date().getTime()).toString(16);
				} while (c[id]['costs'][nid]);

				c[id]['costs'][nid] = {
						//'div': // Stores the div DOM element
						'spaces': {}, // Stores the spaces elements
				};

				var n = c[id]['costs'][nid]; // Easy reference to cost storage

				var w,x,y,z;

				c[id]['pad'].append((n['div'] = $(document.createElement('div'))));
				n['div'].append((x = $(document.createElement('div'))));
				x.addClass('header');
				x.append(document.createTextNode('Cost Label: '));
				x.append((n['name'] = $(document.createElement('input'))));
				n['name'].attr('name', 'todo');

				// Spaces section
				n['div'].append((x = $(document.createElement('div'))));
				x.addClass('space');
				x.append((y = $(document.createElement('div'))));
				y.addClass('header');
				y.append(document.createTextNode('Spaces Available '));
				y.append((z = $(document.createElement('a'))));
				z.append(document.createTextNode('Help'));
				y.append((w = $(document.createElement('span'))));
				w.addClass('hide');
				w.append(document.createTextNode('Todo'));
				// Add toggle function to Help link
				z.click(returnFunction(this.toggle, this, w));
				// Create space pad
				x.append((n['space'] = $(document.createElement('div'))));
				// Create button
				x.append((w = $(document.createElement('a'))));
				w.append(document.createTextNode('Add space'));
				w.addClass('button');
				w.click(returnFunction(this.addSpace, this, id, nid));

				// Costs section
				n['div'].append((x = $(document.createElement('div'))));
				x.addClass('costs');
				x.append((y = $(document.createElement('div'))));
				y.addClass('header');
				y.append(document.createTextNode('Cost Options '));
				y.append((z = $(document.createElement('a'))));
				z.append(document.createTextNode('Help'));
				y.append((w = $(document.createElement('span'))));
				w.addClass('hide');
				w.append(document.createTextNode('Todo'));
				// Add toggle function to Help link
				z.click(returnFunction(this.toggle, this, w));
				// Create cost pad
				x.append((n['cost'] = $(document.createElement('div'))));
				// Create button
				x.append((w = (n['costButton'] = $(document.createElement('a')))));
				w.append(document.createTextNode('Add cost option'));
				w.addClass('button');
				w.click(returnFunction(this.addCost, this, id, nid));

				// Delete button
				n['div'].append((x = $(document.createElement('a'))));
				x.addClass('button');
				x.append(document.createTextNode('Delete Option'));
				x.click(returnFunction(costs.del, this, id, nid));
			}
		},

		del: function(id, cid) {
			if (c[id] && c[id]['costs'][cid]) {
				c[id]['costs'][cid]['div'].remove();
				delete c[id][cid];
			}
		},

		toggleGlobalCosts: function(id) {
			if (c[id]) {
				if (c[id]['globalCheck'].attr('checked')) { // Disable
				} else {
					// Disable (hide) all Add Cost Option buttons
					var cid;
					for (cid in c[id]['costs']) {
						//c[id]['costs']
					}
				}
			}
		},

		toggle: function(obj) {
			if (obj) {
				if (obj.hasClass('hide')) {
					obj.removeClass('hide');
				} else {
					obj.addClass('hide');
				}
			}
		},

		addSpace: function(id, nid) {
			if (id && c[id][nid]) {
				var n = c[id][nid]; // Easy reference to cost storage
				var sid;
				do {
					sid = (new Date().getTime()).toString(16);
				} while (n['spaces'][sid]);

				n['spaces'][sid] = {};

				var w,x,y,z;
				n['space'].append(((z = (n['spaces'][sid]['div'] = $(document.createElement('div'))))));
				z.append((w = $(document.createElement('div'))));
				w.append(document.createTextNode('Space Label: '));
				w.append((x = $(document.createElement('input'))));
				z.append((w = $(document.createElement('div'))));
				w.append(document.createTextNode(' Number of these available: '));
				w.append((x = $(document.createElement('input'))));
				x.attr('type', 'number');
				z.append((w = $(document.createElement('div'))));
				w.append(document.createTextNode(' Number of spaces available: '));
				w.append((x = $(document.createElement('input'))));
				x.attr('type', 'number');
				z.append((w = $(document.createElement('div'))));
				w.append((x = $(document.createElement('label'))));
				x.append(document.createTextNode('Required to book all spaces: '));
				w.append((y = $(document.createElement('input'))));
				y.attr('type', 'checkbox');
				z.append((x = $(document.createElement('a'))));
				x.addClass('button');
				x.append(document.createTextNode('Delete Space'));
			}
		},

		addCost: function(id, nid) {
		}
	};

	return {
		/**
		 * Handles the drawing and actions associated with the costs metabox.
		 */
		costs: {
			init: function(id) {
				if (!c[id]) {
					d('creating new costs section ' + id);
					c[id] = {
							'pad': $('#' + id), // Is the main div
							'costs': {}, // Stores each costs elements
					};

					// Create global cost options checkbox
					var x, y, z;
					var gid = getId(id, 'global');
					var gname = getName(id, 'global');
					c[id]['pad'].append((x = $(document.createElement('div'))));
					x.append((y = $(document.createElement('label'))));
					y.append(document.createTextNode('Use global cost options: '));
					y.attr('for', gid);
					x.append((y = (c[id]['globalCheck'] = $(document.createElement('input')))));
					y.attr('type', 'checkbox');
					y.attr('id', gid);
					y.attr('name', gname);
					y.change(returnFunction(costs.toggleGlobalCosts, this, id));
					c[id]['pad'].append((c[id]['global'] = $(document.createElement('div'))));

				}
			},

			/**
			 * Adds a new cost option to the item
			 */
			add: function(id) {
				d('Costs add called');
				if (c[id]) {
					d('Found costs id ' + id);
					costs.addCostDiv(id);
				}
			},
		},

		/**
		 * Handles the drawing and actions associated with the linked bookings
		 * metabox.
		 */
		bookingLink: {
			init: function(id) {
				if (!c[id]) {
					d('creating new linked bookings section ' + id);
					c[id] = {
							'pad': $('#' + id), // Is the main div
							'costs': {}, // Stores each costs elements
					};
				}
			},

			/**
			 * Adds a new cost option to the item
			 */
			add: function(id) {
				d('Costs add called');
				if (c[id]) {
					d('Found costs id ' + id);
					links.addCostDiv(id);
				}
			},
		},
	};
})();
