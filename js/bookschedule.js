var bS = (function() {
	// Private store for costs
	var c = {};
	// Private store for times
	var t = {};
	// Private store for book
	var b = false;



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
	function rFunc(func, context, include) {
		// Create an array out of the other pass arguments
		var a = Array.prototype.slice.call(arguments);
		// Shift to remove func
		a.shift();
		// Shift to remove context
		a.shift();
		// Shift to remove include
		a.shift();
		return function () {
			/**
			 * Append the arguments from the function call to the arguments
			 * given when rFunc was called.
			 */
			if (include) {
				a = a.concat(Array.prototype.slice.call(arguments));
			}
			func.apply(context, a);
		};
	}

	function combineParts(args) {
		var a, i, parts = [];

		for (a in args) {
			if (args[a] instanceof Array) {
				for (i in args[a]) {
					parts.push(args[a][i]);
				}
			} else {
				parts.push(args[a]);
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

	function setInputType(obj, type) {
		// Check for faking it
		var faking;
		obj.attr('type', 'faketype');

		if (obj.attr('type') == 'fakelog') {
			faking = true;
		}

		obj.attr('type', type);

		if (!faking) {
			if (obj.attr('type') == type) {
				return true;
			} else {
				return false;
			}
		} else {
			return null;
		}
	}

	function createDate(date, time, range) {
		var f, field;
		if (date || time) {
			if (range) {
				field = [
					$(document.createElement('input')),
					$(document.createElement('input'))
				];
			} else {
				field = $(document.createElement('input'));
			}
		} else {
			return null;
		}

		if (range) {
			if (date && time) {
				//if (!setInputType(field, 'datetime')) {
					$.timepicker.datetimeRange(field[0], field[1], {
						timeFormat: 'HH:mm',
						stepMinute: 5
					});
				//}
			} else if (date) {
				//field.attr('type', 'date');
				$.timepicker.dateRange(field[0], field[1]);
			} else if (time) {
				//field.attr('type', 'time');
				$.timepicker.timerange(field[0], field[1], {
					timeFormat: 'HH:mm',
					stepMinute: 5
				});
			}
		} else {
			if (date && time) {
				//if (!setInputType(field, 'datetime')) {
					field.datetimepicker({
						timeFormat: 'HH:mm',
						stepMinute: 5
					});
				//}
			} else if (date) {
				//field.attr('type', 'date');
				field.datepicker();
			} else if (time) {
				//field.attr('type', 'time');
				field.timepicker({
					timeFormat: 'HH:mm',
					stepMinute: 5
				});
			}
		}

		return field;
	}

	/**
	 * Toggles the visibility of a given object (using the hide class).
	 * If a labelObject is given, it will change the HTML of the label
	 * object to either Show/Hide + label, or if hide is given, hide
	 * when the object is shown and label when the object is hidden.
	 *
	 * @param toggleObject jQueryObject Object to toggle the visibility on.
	 * @param labelObject jQueryObject Object to change the HTML in.
	 * @param label string Used for the HTML of the label object. If hide given
	 *              will be the show label, else will be prepended with
	 *              Show/Hide.
	 * @param hide string If given, will be used for the HTML of the label object
	 *             when the toggled object is shown.
	 */
	function toggle(toggleObject, labelObject, label, hide) {
		if (toggleObject) {
			if (toggleObject.hasClass('hide')) {
				toggleObject.removeClass('hide');
				if (labelObject) {
					if (hide) {
						labelObject.html(label);
					} else {
						labelObject.html('Hide ' + label);
					}
				}
			} else {
				toggleObject.addClass('hide');
				if (labelObject) {
					if (hide) {
						labelObject.html(hide);
					} else {
						labelObject.html('Show ' + label);
					}
				}
			}
		}
	}

	function isEmpty(map) {
		for(var key in map) {
			if (map.hasOwnProperty(key)) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Create a labelled frame.
	 *
	 * @param obj jQueryObject Object to add the frame to.
	 * @param label string/jQueryObject Frame label.
	 * @param options Object Object containing any of the following options:
	 *                class string Class(es) (separated with a space) to add to
	 *                      the containing div.
	 *                frameClass string Class(es) (separated with a space) to add
	 *                           to the frame div.
	 *                hideable boolean If true, the frame will be hideable.
	 *                hide boolean If true, the frame will be hidden on
	 *                     creation.
	 *                hoverShow boolean If true, frame will be shown when
	 *                          label is hovered over.
	 *                labelObject jQueryObject If given, will be the label
	 *                            object passed to the toggle function. *Must
	 *                            be set when label is a jQuery Object.
	 *                toggleLabel string If given, will be passed as the
	 *                            label to the toggle function. *Must be set
	 *                            when label is a jQuery Object.
	 *                toggleHideLabel string If given, will be passed as the
	 *                                hide label to the toggle function.
	 *                returnFrame boolean If true, will return an array
	 *                            containing the frame and the inside div
	 * @return jQueryObject of the newly created frame.
	 */
	function createLabelledFrame(obj, label, options) {
		if (obj) {
			if (!options) {
				options = {};
			}

			var z, y, x, w;
			var stringLabel = (typeof(label) == "string");
			obj.append((z = $(document.createElement('div'))));
			if (options['class']) {
				z.addClass(options['class']);
			}
			z.append((w = $(document.createElement('div'))));
			w.append(label);

			z.append((x = $(document.createElement('div'))));
			if (options['frameClass']) {
				x.addClass(options['frameClass']);
			}

			if (options['hideable']) {
				if (options['hide']) {
					x.addClass('hide');
				}

				if (options['hoverShow']) {
					z.addClass('hoverShow');
				} else {
					w.click(rFunc(toggle, this, false, x,
							(options['labelObject'] ? options['labelObject'] : (stringLabel ? w : null)),
							(options['toggleLabel'] ? options['toggleLabel'] : (stringLabel ? label : null)),
							(options['toggleHideLabel'] ? options['toggleHideLabel'] : null)
							));
				}
			}

			if (options['returnFrame']) {
				return [z, x];
			} else {
				return x;
			}
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
				z.click(rFunc(this.toggle, this, false, w));
				// Create space pad
				x.append((n['space'] = $(document.createElement('div'))));
				// Create button
				x.append((w = $(document.createElement('a'))));
				w.append(document.createTextNode('Add space'));
				w.addClass('button');
				w.click(rFunc(this.addSpace, this, false, id, nid));

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
				z.click(rFunc(this.toggle, this, false, w));
				// Create cost pad
				x.append((n['cost'] = $(document.createElement('div'))));
				// Create button
				x.append((w = (n['costButton'] = $(document.createElement('a')))));
				w.append(document.createTextNode('Add cost option'));
				w.addClass('button');
				w.click(rFunc(this.addCost, this, false, id, nid));

				// Delete button
				n['div'].append((x = $(document.createElement('a'))));
				x.addClass('button');
				x.append(document.createTextNode('Delete Option'));
				x.click(rFunc(costs.del, this, false, id, nid));
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

	var times = {
		repeats: {
			day: { ly: 'Daily', ls: 'day(s)' },
			week: { ly: 'Weekly', ls: 'week(s)' },
			month: { ly: 'Monthly', ls: 'month(s)' },
			year: { ly: 'Yearly', ls: 'year(s)' },
		},

		drawRepeatPad: function(id) {
			if (times.valuesChanged(id, true, 'repeat')) {
				var z, y, i;
				var type; /// @todo current value
				t[id]['repeatPad'].html('');
				console.log('Redrawing pad');
				if (times.value(id, 'repeat')) {
					t[id]['repeatParts'] = {};
					var parts = t[id]['repeatParts'];
					t[id]['repeatPad'].html('Repeat ');
					t[id]['repeatPad'].append(z = $(document.createElement('select')));
					for (i in times.repeats) {
						if (!type) type = i;
						z.append(y = $(document.createElement('option')));
						y.html(times.repeats[i]['ly']);
						y.val(i);
					}
					z.change(rFunc(times.drawRepeatOn, this, false, id));
					parts['type'] = z;

					// every
					t[id]['repeatPad'].append(' every ');
					t[id]['repeatPad'].append(parts['freq'] = $(document.createElement('input')));

					t[id]['repeatPad'].append(parts['freqLabel'] = $(document.createElement('span')));

					// on the
					t[id]['repeatPad'].append(parts['onPad'] = $(document.createElement('div')));
					times.drawRepeatOn(id);

					//t[id]['repeatPad'].append(' until ');
					//t[id]['repeatPad'].append(data['untilPlace'] = $(document.createElement('span')));
					//data['untilPlace'].append(repeats[type]['until']);

				}

				times.drawDayPad(id);
				times.refreshPreviousValues(id, 'repeat');
			}
		},

		drawRepeatOn: function(id) {
			var parts = t[id]['repeatParts'];
			parts['onPad'].html('');
			var type = parts['type'].val();
			console.log('Type of repeat is ' + type);
			parts['freqLabel'].html(times.repeats[type]['ls']);
			parts['onPad'].html('');
			switch (type) {
				case 'day':
					break;
				case 'week':
					parts['onPad'].append(' on ');
					var z, d, days = {
						mon: 'Monday',
						tue: 'Tuesday',
						wed: 'Wednesday',
						thu: 'Thursday',
						fri: 'Friday',
						sat: 'Saturday',
						sun: 'Sunday'
					};
					for (d in days) {
						eid = getId(id, 'repeat', 'on', '');
						ename = getName(id, 'repeat', 'on');
						parts['onPad'].append(z = $(document.createElement('input')));
						z.attr('type', 'checkbox');
						z.attr('id', eid);
						z.attr('name', ename);
						z.val(d);
						parts['onPad'].append(y = $(document.createElement('label')));
						y.html(days[d]);
						y.attr('for', eid);
						parts['onPad'].append(' ');
					}
					break;
				case 'month':
				case 'year':
			}
		},

		drawDayPad: function(id) {
			var p = t[id]['dayPad'], z;
			p.html('');

			console.log('Drawing day pad');

			if (times.value(id, 'multiday', true)) { // Multi-day
				if (times.value(id, 'repeat')) { // Repeating
					p.append('Number of days: ');
					p.append(z = $(document.createElement('input')));
					z.attr('type', 'number');
				} else {
					p.append('Dates: ');
					var fields = createDate(true, false, true);
					p.append(fields[0], ' - ', fields[1]);
				}
			} else { // Single-day
				if (times.value(id, 'repeat')) { // Repeating
				} else {
					p.append('Date: ');
					p.append(createDate(true));
				}
			}
			
			times.drawTimesPad(id);
		},

		drawTimesPad: function(id) {
			var p = t[id]['timePad'], c = t[id]['timeChecksPad'], z, y, eid, ename;
			
			if (times.valuesChanged(id, true, 'multiday')) {
				c.html('');
				
				if (times.value(id, 'multiday', true) && !times.value(id, 'allDay', true)) {
					// Specify times per day
					eid = getId(id, 'timePerDay');
					ename = getName(id, 'timePerDay');
					c.append(y = $(document.createElement('input')));
					y.attr('type', 'checkbox');
					y.attr('id', eid);
					y.attr('name', ename);
					y.change(rFunc(times.drawTimesPad, this, false, id));
					t[id]['timePerDay'] = y;
					c.append(y = $(document.createElement('label')));
					y.html('Specify times for each day');
					y.attr('for', eid);
				}
			}

			if (times.valuesChanged(id, true, 'multiday', 'allDay')) {
				p.html('');
			}

			times.refreshPreviousValues(id, 'multiday', 'allDay');
		},

		valuesChanged: function(id) {
			var s, update, changed = false;
			var args = Array.prototype.slice.call(arguments);
			args.shift();
			if (args[0] === true) {
				update = true;
				args.shift();
			}

			if (!t[id]['storedValues']) {
				t[id]['storedValues'] = {};
				if (!update) return true;
			}

			for (s in args) {
				if (t[id][args[s]] && t[id][args[s]].attr) {
					switch(t[id][args[s]].attr('type')) {
						case 'checkbox':
							if (typeof(t[id]['storedValues'][args[s]]) === 'undefined' ||
									update) {
								console.log('updating stored of ' + args[s]);
								t[id]['storedValues'][args[s]] = t[id][args[s]].attr('checked');
							}
							break;
						default:
							if (typeof(t[id]['storedValues'][args[s]]) === 'undefined' ||
									update) {
								console.log('updating stored of ' + args[s]);
								t[id]['storedValues'][args[s]] = t[id][args[s]].val();
							}
							break;
					}

					console.log('stored ' + args[s] + ': ' + t[id]['storedValues'][args[s]]);
					console.log('previous ' + args[s] + ': ' + t[id]['previousValues'][args[s]]);

					if ((t[id]['storedValues'][args[s]] && !t[id]['previousValues'][args[s]]) 
							|| (!t[id]['storedValues'][args[s]] && t[id]['previousValues'][args[s]])) {
						changed = true;
					}
				}
			}

			console.log(t[id]['storedValues']);
			if (changed) console.log('changed');
			else console.log('no change');
			return changed;
		},

		refreshPreviousValues: function(id) {
			var s;
			var args = Array.prototype.slice.call(arguments);
			args.shift();

			if (!t[id]['storedValues']) {
				t[id]['storedValues'] = {};
			}
			if (!t[id]['previousValues']) {
				t[id]['previousValues'] = {};
			}

			for (s in args) {
				if (typeof(t[id]['storedValues'][args[s]]) !== 'undefined') {
					t[id]['previousValues'][args[s]] = t[id]['storedValues'][args[s]];
				} else if (t[id]['previousValues'][args[s]]) {
					delete(t[id]['previousValues'][args[s]]);
				}
			}
		},

		value: function(id, value, update) {
			if (typeof(t[id]['storedValues'][value]) === 'undefined' || update) {
				if (t[id][value] && t[id][value].attr) {
					switch(t[id][value].attr('type')) {
						case 'checkbox':
							t[id]['storedValues'][value] = t[id][value].attr('checked');
							break;
						default:
							t[id]['storedValues'][value] = t[id][value].val();
							break;
					}
				} else {
					return null;
				}
			}

			console.log(value + ': ' + t[id]['storedValues'][value]);

			return t[id]['storedValues'][value];
		},
	};

	var book = {
		add: function(type, nonce, data, textStatus, jqXHR) {
			// Check we have valid data
			if (data['nonce'] && data['nonce'] == nonce) {
				// Check if there was an error on the server
				if (data['error']) {
					book.message(data['error'], 'error', 4000);
				} else {
					var id = (new Date().getTime()).toString(16);
					if (!b['data'][type]['draft']['items']) {
						b['data'][type]['draft']['items'] = {};
					}
					b['data'][type]['draft']['items'][id] = data;
					// Create div if it hasn't already
					if (!b['data'][type]['draftDiv']) {
						var divs = book.createDraftFrame(b['draftDiv'], type, true);
						b['data'][type]['draftDiv'] = divs[1];
						b['data'][type]['draftFrame'] = divs[0];
					}
					
					book.addItem(type, b['data'][type]['draftDiv'], b['data'][type]['draft']['items'], id, true); 

					/// @todo language
					book.message('Item was added to your ' + type + '.', 'success', 2000);
				}
			} else {
				book.message('There was an error processing your request. Please try again.', 'error', 4000);
			}
		},

		createDraftFrame: function(obj, type, returnFrame) {
			if (obj) {
				var z, y, x, w;
				v = createLabelledFrame(obj, 'Current ' + type, {
					'class': type,
					'frameClass': 'items',
					'returnFrame': returnFrame
				});

				if (returnFrame) {
					w = v[0];
					v = v[1];
				}

				v.append((y = $(document.createElement('div'))));
				v.append((x = $(document.createElement('a'))));
				x.html('Submit ' + type);
				x.addClass('button');
				x.click(rFunc(book.book, this, false, type));

				if (returnFrame) {
					return [w, y];
				} else {
					return y;
				}
			}
		},

		book: function (type) {
			if (b) {
				book.message('Checking your ' + type + '...', null, 2000);

				$.post(b['ajaxurl'] + '?action=bs_book', {'bs_book': {'type': type}}, rFunc(book.confirmBooking, this, true, type));
			}
		},

		confirmBooking: function(type, data, textStatus, jqXHR) {
			if (b) {
				if (data['error']) {
					book.message(data['error'], 'error', 4000);
				} else if (data['form']) {
					var z, y;
					book.message(data['form'], 'confirm', true);
					b['message'].append((z = $(document.createElement('p'))));
					z.html('Please write if you have anything to add to your ' + type);
					b['message'].append((z = $(document.createElement('textarea'))));
					b['message'].append((y = $(document.createElement('a'))));
					y.html('Send');
					y.addClass('button');
					y.click(rFunc(book.sendBooking, this, false, type, z));
					b['message'].append((y = $(document.createElement('a'))));
					y.html('Cancel');
					y.addClass('button');
					y.click(rFunc(book.message, this, false, 'Cancelled', null, 2000));
				} else {
					book.message('There was an error processing your request. Please try again.', 'error', 4000);
				}
			}
		},

		sendBooking: function(type, commentField) {
			if (b) {
				$.post(b['ajaxurl'] + '?action=bs_book', {'bs_send': {'type': type, 'comment': (commentField && commentField.val) ? commentField.val() : ''}}, rFunc(book.bookingSent, this, true, type));
				book.message('Sending ' + type + '...', null, 2000);
			}
		},

		bookingSent: function(type, data, textStatus, jqXHR) {
			if (b) {
				if (data['success']) {
					book.message(data['success'], 'success', 2000);
					if (b['data'][type]['draftDiv']) {
						b['data'][type]['draftFrame'].remove();
						delete(b['data'][type]['draftFrame']);
						delete(b['data'][type]['draftDiv']);
						b['data'][type]['draft']['items'] = [];
					}
				} else if (data['error']) {
					book.message(data['error'], 'error', 4000);
				} else {
					book.message('There was an error processing your request. Please try again.', 'error', 4000);
				}
			}
		},

		addItems: function(type, obj, items, remove) {
			if (obj) {
				for (i in items) {
					book.addItem(type, obj, items, i, remove);
				}
			}
		},

		addItem: function(type, obj, items, i, remove) {
			var z, y;

			obj.append((z = $(document.createElement('div'))));
			z.append((y = $(document.createElement('a'))));
			y.html(items[i]['title']);
			y.attr('href', items[i]['url']);
			if (remove) {
				z.append((y = $(document.createElement('a'))));
				y.html('Remove');
				y.addClass('remove');
				y.click(rFunc(book.removeItem, this, false, type, items, i, z));
			}
		},

		removeItem: function(type, store, i, obj) {
			if (b) {
				$.post(b['ajaxurl'] + '?action=bs_remove', { 'bs_removeItem': { 'type': type, 'id': store[i]['id'] }}, rFunc(book.completeRemove, this, true, type, store, i, obj));
				book.message('Deleting item...', null, 2000);
			}
		},

		completeRemove: function(type, store, i, obj, data, textStatus, jqXHR) {
			if (b) {
				if (data['success']) {
					book.message(data['success'], 'success', 2000);
					delete store[i];
					obj.remove();
				} else if (data['error']) {
					book.message(data['error'], 'error', 4000);
				} else {
					book.message('There was an error processing your request. Please try again.', 'error', 4000);
				}
			}
		},

		addBooking: function(type, obj, data, remove) {
			if (obj) {
				var d, z, y;
				for (d in data) {
					if (data[d]['items']) {
						// Create div
						obj.append((z = $(document.createElement('div'))));
						var label = (data[d]['date'] ? data[d]['date'] : type);
						data[d]['div'] = createLabelledFrame(obj, label, {
							'class': 'booking',
							'frameClass': 'booking',
							'hideable': true,
							'hide': true,
							'toggleLabel': label,
							'toggleHideLabel': label
						});
						
						book.addItems(type, data[d]['div'], data[d]['items'], remove);
					}
				}
			}
		},

		frameTimeout: {},

		showFrame: function(frame, time) {
			if (b && b[frame]) {
				if (!b[frame].hasClass('open')) {
					b[frame].addClass('open');
				}
				if (book.frameTimeout[frame]) {
					clearTimeout(book.frameTimeout[frame]);
				}
				if (time !== true) {
					book.frameTimeout[frame] = setTimeout(rFunc(function() {
						b[frame].removeClass('open');
						book.message();
						delete book.frameTimeout[frame];
						}, this, false), time);
				}
			}
		},


		messageClasses: false,

		/**
		 * Shows a message in the message box.
		 *
		 * @param msg string Message to be shown.
		 * @param cls string Class or classes (separated by spaces) to add to
		 *            the message box for the duration that the message is
		 *            shown.
		 * @param time int If given, the time of which the booking popup will
		 *             be opened for. If not given, the popup will not be opened.
		 */
		message: function(msg, cls, time) {
			if (b) {
				// Clear classes
				if (book.messageClasses) {
					b['message'].removeClass(book.messageClasses);
					book.messageClasses = false;
				}

				if (!msg) { // Clear messages
					b['message'].html('');
				} else {
					b['message'].html(msg);

					if (cls) {
						b['message'].addClass(cls);
						book.messageClasses = cls;
					}
				}

				// Show frame
				if (time) {
					book.showFrame('bookingsFrame', time);
				}
			}
		},
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
					y.change(rFunc(costs.toggleGlobalCosts, this, false, id));
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
		 * Handles the drawing and actions associated with the timing metabox.
		 *
		 * Repeating ?
		 *  y
		 * Single/multi day
		 */
		times: {
			init: function(id) {
				if (!t[id]) {
					d('creating new times section ' + id);
					t[id] = {
							'pad': $('#' + id), // Is the main div
							'multiday': null, // Multiday checkbox
							'storedValues' : {},
							'previousValues': {},

					};

					var x, y, z, eid, ename;

					// Create day specification
					eid = getId(id, 'multiple');
					ename = getName(id, 'multiple');
					console.log(getId(id, 'multiple'));
					t[id]['pad'].append(z = $(document.createElement('input')));
					z.attr('type', 'checkbox');
					console.log(eid);
					z.attr('id', eid);
					z.attr('name', ename);
					z.change(rFunc(times.drawDayPad, this, false, id));
					t[id]['multiday'] = z;
					t[id]['pad'].append(y = $(document.createElement('label')));
					y.html('Multi-day event');
					y.attr('for', eid);

					t[id]['pad'].append(' ');

					// Create repeat option
					eid = getId(id, 'repeat');
					ename = getName(id, 'repeat');
					t[id]['pad'].append(z = $(document.createElement('input')));
					z.attr('type', 'checkbox');
					z.attr('id', eid);
					z.attr('name', ename);
					z.change(rFunc(times.drawRepeatPad, this, false, id));
					t[id]['repeat'] = z;
					t[id]['pad'].append(y = $(document.createElement('label')));
					y.html('Repeating event');
					y.attr('for', eid);

					// Draw repeat pad
					t[id]['pad'].append(t[id]['repeatPad'] = $(document.createElement('div')));

					t[id]['pad'].append(t[id]['dayPad'] = $(document.createElement('div')));

					// Create time specification
					t[id]['pad'].append(z = $(document.createElement('div')));
					z.html('Times: ');
					
					// All Day
					eid = getId(id, 'allDay');
					ename = getName(id, 'allDay');
					z.append(y = $(document.createElement('input')));
					y.attr('type', 'checkbox');
					y.attr('id', eid);
					y.attr('name', ename);
					y.change(rFunc(times.drawTimesPad, this, false, id));
					t[id]['allDay'] = y;
					z.append(y = $(document.createElement('label')));
					y.html('All day event');
					y.attr('for', eid);
					z.append(' ');

					z.append(t[id]['timeChecksPad'] = $(document.createElement('span')));
					
					z.append(t[id]['timePad'] = $(document.createElement('div')));
					
					times.drawRepeatPad(id);
				}
			}
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
		
		/**
		 * Handles the drawing and actions associated with modifying current
		 * bookings and the bookings popup
		 */
		book: {
			/**
			 * Initialises the booking functionality and the booking popup.
			 * 
			 * @param id string Base Id of popup objects.
			 * @param bookings object Current booking information separated
			 *                 into type (inquiry/booking) then by draft/submitted.
			 */
			init: function(id, ajaxurl, bookings) {
				if (!b) {
					console.log(bookings);

					if (bookings) {
						bookings = JSON.parse(bookings);
					} else {
						bookings = {};
					}

					b = {
						'id': id,
						'ajaxurl': ajaxurl,
						'pad': $('#' + id),
						'button': $('#' + id + 'button'),
						'bookings': $('#' + id + 'bookings'),
						'bookingsFrame': $('#' + id + 'bookingsFrame'),
						'message': $('#' + id + 'message'),
						//'': $('#' + id + ''),
						'data': {
								'inquiry': {
										'draft': {
										},
										'submitted': [],
								},
								'booking': {
										'draft': {
										},
										'submitted': [],
								},
						}
					};

					$.extend(true, b['data'], bookings);
				
					// Create main divs
					var w,x,y,z;
					b['bookings'].append((b['draftDiv'] = $(document.createElement('div'))));
					b['draftDiv'].addClass('currentBookings');

					b['data']['booking']['submittedDiv'] = createLabelledFrame(b['bookings'], 'Show previous bookings', {
						'class': 'postBookings',
						'hideable': true,
						'hide': true,
						'toggleLabel': 'previous bookings',
					});
					
					b['data']['inquiry']['submittedDiv'] = createLabelledFrame(b['bookings'], 'Show previous inquiries', {
						'class': 'postBookings',
						'hideable': true,
						'hide': true,
						'toggleLabel': 'previous inquiries',
					});

					// Build data and divs
					var type;
					for (type in b['data']) {
						if (b['data'][type]['draft'] && b['data'][type]['draft']['items'] && !isEmpty(b['data'][type]['draft']['items'])) {
							var divs = book.createDraftFrame(b['draftDiv'], type, true);
							b['data'][type]['draftDiv'] = divs[1];
							b['data'][type]['draftFrame'] = divs[0];

							book.addItems(type, b['data'][type]['draftDiv'], b['data'][type]['draft']['items'], true);
						}

						if (b['data'][type]['submitted'].length) {
							book.addBooking(type, b['data'][type]['submittedDiv'], b['data'][type]['submitted']);
						}
					}
				}
			},

			add: function(type, id) {
				if (b && type == 'inquiry') {
					// Send booking request to server
					book.message('Adding item to your ' + type + '...', null, 2000);
					var nonce = (new Date().getTime()).toString(16);
					$.post(b['ajaxurl'] + '?action=bs_add', {'bs_add': {'type': type, 'item': { 'id': id}, 'nonce': nonce}}, rFunc(book.add, this, true, type, nonce));
				}
			},
		},
	};
})();
