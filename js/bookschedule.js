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

	/**
	 * Internal functions for costs
	 */
	var costs = {
		/**
		 * Creates a new cost option div
		 */
		addCostDiv: function(id, value) {
			do {
				var nid = (new Date().getTime()).toString(16);
			} while (c[id][nid]);

			c[id][nid] = {
					//'div': // Stores the div DOM element
					'spaces': {}, // Stores the spaces elements
			};

			var n = c[id][nid]; // Easy reference to cost storage

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
			y.append(document.createTextNode('Spaces '));
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
			// Create space pad
			x.append((n['space'] = $(document.createElement('div'))));
			// Create button
			x.append((w = $(document.createElement('a'))));
			w.append(document.createTextNode('Add cost option'));
			w.click(returnFunction(this.addCost, this, id, nid));
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
		},

		addCost: function(id, nid) {
		}
	};

	return {
		costs: {
			init: function(id) {
				if (!c[id]) {
					d('creating new costs section ' + id);
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
					costs.addCostDiv(id);
				}
			},
		},
	};
})();
