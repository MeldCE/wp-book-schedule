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
			var args = a;
			/**
			 * Append the arguments from the function call to the arguments
			 * given when rFunc was called.
			 */
			if (include) {
				args = a.concat(Array.prototype.slice.call(arguments));
			}
			func.apply(context, args);
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

	function uniqid() {
		return (new Date().getTime()).toString(16);
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

	var timeMeasurements = {
		mins: {
			label: 'minutes',
		},
		hours: {
			label: 'hours',
		},
		days: {
			label: 'days',
		},
		nights: {
			label: 'nights',
		},
		weeks: {
			label: 'weeks',
		},
		months: {
			label: 'months',
		},
		years: {
			label: 'years',
		},
	};

	function drawTimeMeasurement(obj, value) {
		var z, y, m;
		
		obj.append(z = $(document.createElement('select')));

		for (m in timeMeasurements) {
			z.append(y = $(document.createElement('option')));
			y.val(m);
			y.html(timeMeasurements[m].label);
			if ((value && value == m) || (!value && m == 'days')) {
				y.attr('selected', true);
			}
		}

		return z;
	}

	var ajaxurl;

	var locations = {
		locations: null,
		locationObjects: [],

		newLocation: function(obj, value) {
			if (obj) {
				locations.locationObjects.push(obj);

				if (locations.locations) {
					locations.updateLocationList(obj, value);
				} else {
					$.post(ajaxurl + '?action=bs_locations', {},
							rFunc(locations.receiveLocations, this, true, obj, value));
				}
			}
		},

		receiveLocations: function(obj, value, data, textStatus, jqXHR) {
			if (data) {
				locations.locations = data;
				if (obj) {
					locations.updateLocationList(obj, value);
				} else {
					var o;
					for (o in locations.locationObjects) {
						locations.updateLocationList(locations.locationObjects[o]);
					}
				}
			}
		},

		/// @todo Change so that it does not wipe values but appends/deletes
		updateLocationList: function(obj, value) {
			var l, z, value
	
			if (!value) {
				value = obj.val();
			}

			// Clear current locations
			obj.html('');

			// Create blank location
			obj.append(z = $(document.createElement('option')));

			for (l in locations.locations) {
				obj.append(z = $(document.createElement('option')));
				z.val(l);
				z.html(locations.locations[l]);
				if (value && value == l) {
					z.attr('selected', true);
				}
			}
		},
	};

	/**
	 * Internal functions for costs
	 */
	var costs = {
		drawLocation: function(obj, id, value) {
			var z, i, data = {};

			obj.html('');
			i = uniqid();

			obj.append(z = $(document.createElement('label')));
			z.html('Location: ');
			z.attr('for', i);
			obj.append(data.location = $(document.createElement('select')));
			data.location.attr('id', i);
			locations.newLocation(data.location, (value ? value.location : null));
			data.location.change(rFunc(ObjectBuilder.reparse, this, false, id));

			obj.data(data);
		},

		parseLocation: function(obj, id) {
			var data = obj.data();

			return value = {
				type: 'location',
				location: data.location.val(),
			};
		},

		drawOption: function (obj, id, value) {
			var z, i, data = {};

			obj.html('<h4>Option</h4>');
			i = uniqid();

			obj.append(z = $(document.createElement('label')));
			z.html('Label:');
			z.attr('for', i);
			obj.append(data.label = $(document.createElement('input')));
			data.label.attr('id', i);
			if (value) {
				console.log('drawn option ' + value.label + ' (' + value.option.length + ' elements)');
				data.label.val(value.label);
			}
			data.label.change(rFunc(ObjectBuilder.reparse, this, false, id));

			data.pad = ObjectBuilder.createPad(id, obj, {}, (value ? value.option : null));

			obj.data(data);
		},

		parseOption: function (obj, id) {
			var data = obj.data();

			return value = {
				type: 'option',
				label: data.label.val(),
				option: ObjectBuilder.parsePadObject(id, data.pad)
			};
		},

		drawExclusion: function (obj, id, value) {
			var z, y, i, data = {};

			obj.html('<h4>Exclusion</h4>');
			i = uniqid();

			obj.append(y = $(document.createElement('span')));
			y.append(z = $(document.createElement('label')));
			z.html('Label:');
			z.attr('for', i);
			y.append(data.label = $(document.createElement('input')));
			if (value) {
				data.label.val(value.label);
			}
			data.label.attr('id', i);
			data.label.change(rFunc(ObjectBuilder.reparse, this, false, id));

			data.pad = ObjectBuilder.createPad(id, obj, {
				multiple: true
			}, (value ? value.exclusion : null));

			obj.data(data);
		},

		parseExclusion: function (obj, id) {
			var data = obj.data();

			return value = {
				type: 'exclusion',
				label: data.label.val(),
				exclusion: ObjectBuilder.parsePadObject(id, data.pad)
			};
		},

		drawSpecificDate: function (obj, id, value) {
			var z, i, data = {};

			obj.html('Date ');
			
			obj.append(data.date = $(document.createElement('input')));
			if (value) {
				data.date.val(value.date);
			}
			data.date.datepicker({
				dateFormat: 'yy-mm-dd'
			});
			data.date.change(rFunc(ObjectBuilder.reparse, this, false, id));

			data.pad = ObjectBuilder.createPad(id, obj, {
				multiple: true,
				types: ['part-time', 'part-detail']
			}, (value ? value.details : null));

			obj.data(data);
		},

		parseSpecificDate: function (obj, id) {
			var data = obj.data();

			return value = {
				type: 'specificDate',
				label: data.date.val(),
				details: ObjectBuilder.parsePadObject(id, data.pad)
			};
		},

		drawDays: function (obj, id, value) {
			var z, data = {};
		
			obj.html('');
			obj.append(data.number = $(document.createElement('input')));
			data.number.attr('type', 'number');
			if (value) {
				data.number.val(value.number);
			} else {
				data.number.val('1');
			}
			data.number.change(rFunc(ObjectBuilder.reparse, this, false, id));

			obj.append(z = $(document.createElement('span')));
			z.html(' day(s)');

			data.pad = ObjectBuilder.createPad(id, obj, {
				multiple: true,
				types: ['part-time', 'part-detail']
			}, (value ? value.details : null));
			
			obj.data(data);
		},

		parseDays: function (obj, id) {
			var data = obj.data();
			
			return {
				type: 'days',
				number: data.number.val(),
				details: ObjectBuilder.parsePadObject(id, data.pad)
			};
		},

		drawTime: function (obj, id, value) {
			var z, y, data = {};
			
			obj.html('Time: ');

			obj.append(data.start = $(document.createElement('input')));
			obj.append(' - ');
			obj.append(data.end = $(document.createElement('input')));
			if (value) {
				data.start.val(value.start);
				data.end.val(value.end);
			}
			$.timepicker.timeRange(data.start, data.end, {
				timeFormat: 'HH:mm',
				stepMinute: 5
			});
			data.start.change(rFunc(ObjectBuilder.reparse, this, false, id));
			data.end.change(rFunc(ObjectBuilder.reparse, this, false, id));

			obj.data(data);
		},

		parseTime: function (obj, id) {
			var data = obj.data();
			
			return {
				type: 'time',
				start: data.start.val(),
				end: data.end.val()
			};
		},

		timeUnits: {
			min: 'minute(s)',
			hour: 'hour(s)',
		},

		drawUserTime: function (obj, id, value) {
			var z, y, i, data = {};
			
			obj.html('<header>User-specifiable Time</header>');

			obj.append(y = $(document.createElement('div')));
			y.append('Block size range: ');
			y.append(data.minLength = $(document.createElement('input')));
			data.minLength.attr('type', 'number');
			y.append(' - ');
			y.append(data.maxLength = $(document.createElement('input')));
			data.maxLength.attr('type', 'number');
			y.append(' ');c
			y.append(data.lengthUnit = $(document.createElement('select')));
			for (i in costs.timeUnits) {
				data.lengthUnit.append(z = $(document.createElement('option')));
				z.val(i);
				z.html(costs.timeUnits[i]);
				if (value && value.lengthUnit == i) {
					z.attr('selected', true);
				}
			}
			
			obj.append(y = $(document.createElement('div')));
			y.append('Time availability: ');
			y.append(data.start = $(document.createElement('input')));
			y.append(' - ');
			y.append(data.end = $(document.createElement('input')));
			if (value) {
				data.minLength.val(value.minLength);
				data.maxLength.val(value.maxLength);
				data.start.val(value.start);
				data.end.val(value.end);
			}
			$.timepicker.timeRange(data.start, data.end, {
				timeFormat: 'HH:mm',
				stepMinute: 5
			});
			data.start.change(rFunc(ObjectBuilder.reparse, this, false, id));
			data.end.change(rFunc(ObjectBuilder.reparse, this, false, id));

			obj.data(data);
		},

		parseUserTime: function (obj, id) {
			var data = obj.data();
			
			return {
				type: 'userTime',
				minLength: data.minLength.val(),
				maxLength: data.maxLength.val(),
				lengthUnit: data.lengthUnit.val(),
				start: data.start.val(),
				end: data.end.val()
			};
		},

		repeats: {
			day: { ly: 'Daily', ls: 'day(s)' },
			week: { ly: 'Weekly', ls: 'week(s)' },
			month: { ly: 'Monthly', ls: 'month(s)' },
			year: { ly: 'Yearly', ls: 'year(s)' },
		},

		drawRepeatOn: function(id, obj, data, value) {
			if (!data) {
				data = obj.data();
			}

			data.onPad.html('');
			var type = data.type.val();
			console.log('Type of repeat is ' + type);
			data.freqLabel.html(' ' + costs.repeats[type]['ls']);
			switch (type) {
				case 'day':
					break;
				case 'week':
					data.onPad.append(' on ');
					var z, d, days = {
						mon: 'Monday',
						tue: 'Tuesday',
						wed: 'Wednesday',
						thu: 'Thursday',
						fri: 'Friday',
						sat: 'Saturday',
						sun: 'Sunday'
					};
					data.on = [];
					for (d in days) {
						eid = uniqid();
						data.onPad.append(y = $(document.createElement('label')));
						y.html(days[d]);
						y.attr('for', eid);
						data.onPad.append(z = $(document.createElement('input')));
						z.attr('type', 'checkbox');
						z.attr('id', eid);
						z.val(d);
						data.onPad.append(' ');
						data.on.push(z);
						if (value && value.on.indexOf(d) !== -1) {
							z.attr('checked', true);
						}
						z.change(rFunc(ObjectBuilder.reparse, this, false, id));
					}
					break;
				case 'month':
					data.onPad.append(data.onType = $(document.createElement('select')));
					data.onType.change(rFunc(ObjectBuilder.reparse, this, false, id));
					break;
				case 'year':
					data.onPad.append(' on the ');
					data.onPad.append(data.on = $(document.createElement('input')));
					if (value) {
						data.on.val(value.on);
					}
					data.on.datepicker({
						dateFormat: 'mm-dd',
						changeYear: false
					});
					data.on.change(rFunc(ObjectBuilder.reparse, this, false, id));
					break;
			}
			
			if (obj) {
				obj.data(data);
			}
		},

		drawRepeat: function (obj, id, value) {
			var z, y, i, data = {};
			var type; /// @todo current value
				
			obj.html('Repeat ');
			obj.append(z = $(document.createElement('select')));
			for (i in costs.repeats) {
				if (!type) type = i;
				z.append(y = $(document.createElement('option')));
				y.html(costs.repeats[i]['ly']);
				y.val(i);
				if (value && value.repeatType == i) {
					y.attr('selected', true);
				}
			}
			z.change(rFunc(costs.drawRepeatOn, this, false, id, obj));
			z.change(rFunc(ObjectBuilder.reparse, this, false, id));
			data.type = z;

			// every
			obj.append(' every ');
			obj.append(data.freq = $(document.createElement('input')));
			if (value) {
				data.freq.val(value.frequency);
			} else {
				data.freq.val('1');
			}
			data.freq.change(rFunc(ObjectBuilder.reparse, this, false, id));
	
			obj.append(data.freqLabel = $(document.createElement('span')));

			// on the
			obj.append(data.onPad = $(document.createElement('span')));
			
			// Draw on the
			costs.drawRepeatOn(id, null, data, value);

			//t[id]['repeatPad'].append(' until ');
			//t[id]['repeatPad'].append(data['untilPlace'] = $(document.createElement('span')));
			//data['untilPlace'].append(repeats[type]['until']);
			
			data.pad = ObjectBuilder.createPad(id, obj, {
				multiple: true,
				types: ['part-repeat', 'part-days', 'part-exclusion'],
			}, (value ? value.data : null));
			
			obj.data(data);
		},

		parseRepeat: function (obj, id) {
			var data;
			if (data = obj.data()) {
				var parsed = {
					type: 'repeat',
					repeatType: data.type.val(),
					frequency: data.freq.val(),
					data: ObjectBuilder.parsePadObject(id, data.pad)
				};

				parsed = costs.parseRepeatOn(id, parsed, data);

				return parsed;
			}
		},

		parseRepeatOn: function (id, parsed, data) {
			var type = data.type.val();
			console.log('Type of repeat is ' + type);
			data.freqLabel.html(' ' + costs.repeats[type]['ls']);
			switch (type) {
				case 'day':
					break;
				case 'week':
					parsed.on = [];
					for (d in data.on) {
						if (data.on[d].attr('checked')) {
							parsed.on.push(data.on[d].val());
						}
					}
					break;
				case 'month':
					parsed.onType = data.onType.val();
					break;
				case 'year':
					parsed.on = data.on.val();
					break;
			}

			return parsed;
		},
	
		pricePers: {
			oneoff: {
				label: ''
			},
			hourly: {
				label: 'per hour',
				upto: 'hour(s)',
			},
			daily: {
				label: 'per day',
				upto: 'day(s)',
			},
			weekly: {
				label: 'per week',
				upto: 'week(s)',
			},
			monthly: {
				label: 'per month',
				upto: 'month(s)',
			},
			yearly: {
				label: 'per year',
				upto: 'year(s)',
			}
		},

		drawPrice: function (cid, obj, id, value) {
			var z, i, data = {};

			obj.html('Price: ');
		
			// Value
			obj.append(data.price = $(document.createElement('input')));
			data.price.attr('type', 'number');
			if (value) {
				data.price.val(value.price);
			}
			data.price.change(rFunc(ObjectBuilder.reparse, this, false, id));
			
			// Currency
			if (c[cid] && c[cid].currencies) {
				obj.append(data.currency = $(document.createElement('select')));
				for (i in c[cid].currencies) {
					data.currency.append(z = $(document.createElement('option')));
					z.val(i);
					z.html(c[cid].currencies[i]);
					if (value && value.currency == i) {
						z.attr('selected' ,true);
					}
				}
			}

			obj.append(' ');

			obj.append(data.per = $(document.createElement('select')));
			for (i in costs.pricePers) {
				data.per.append(z = $(document.createElement('option')));
				z.html(costs.pricePers[i].label);
				z.val(i);
				if (value) {
					if (value.per == i) {
						z.attr('selected', true);
					}
				}
			}

			obj.append(data.uptoSpan = $(document.createElement('span')));

			costs.drawUpto(obj, id, value, data);

			data.per.change(rFunc(ObjectBuilder.reparse, this, false, id));
			data.per.change(rFunc(costs.drawUpto, this, false, obj, id));

			obj.data(data);
		},

		drawUpto: function(obj, id, value, data) {
			var per, current;
			
			if (!data) {
				data = obj.data();
			}

			// Get current value if we have one
			if (!value && data.upto) {
				current = data.upto.val();
			}

			data.uptoSpan.html('');

			// Check if we have an interval
			if ((per = data.per.val()) !== 'oneoff') {
				data.uptoSpan.append(' up to ');
				data.uptoSpan.append(data.upto = $(document.createElement('input')));
				data.upto.attr('type', 'number');
				if (value) {
					data.upto.val(value.upto);
				} else if (current) {
					data.upto.val(current);
				}
				data.uptoSpan.append(' ' + costs.pricePers[per].upto);
			}
		},

		parsePrice: function (obj, id) {
			var data = obj.data();
			
			var value = {
				type: 'price',
				price: data.price.val(),
				per: data.per.val()
			};

			if (data.currency) {
				value.currency = data.currency.val();
			}

			return value;
		},

		drawDetail: function (obj, id, value) {
			var z, data = {};

			obj.html('Details:'),
			
			obj.append(data.input = $(document.createElement('textarea')));
			if (value) {
				data.input.val(value.detail);
			}
			data.input.change(rFunc(ObjectBuilder.reparse, this, false, id));

			obj.data(data);
		},

		parseDetail: function (obj, id) {
			var data = obj.data();
			
			return {
				type: 'detail',
				detail: data.input.val()
			};
		},

		drawBookingLimit: function(obj, id, value) {
			var z, y, i, data = {};

			obj.html('<h4>Booking Limit</h4>');

			i = uniqid();
			obj.append(y = $(document.createElement('div')));
			y.append(z = $(document.createElement('label')));
			z.html('Minimum booking length: ');
			z.attr('for', i);
			y.append(data.minLength = $(document.createElement('input')));
			data.minLength.attr('type', 'number');
			data.minLength.attr('id', i);
			data.minLengthUnit = drawTimeMeasurement(y, (value ? value.minLengthUnit : null));

			i = uniqid();
			obj.append(y = $(document.createElement('div')));
			y.append(z = $(document.createElement('label')));
			z.html('Maximum booking length: ');
			z.attr('for', i);
			y.append(data.maxLength = $(document.createElement('input')));
			data.maxLength.attr('type', 'number');
			data.maxLength.attr('id', i);
			data.maxLengthUnit = drawTimeMeasurement(y, (value ? value.maxLengthUnit : null));

			i = uniqid();
			obj.append(y = $(document.createElement('div')));
			y.append(z = $(document.createElement('label')));
			z.html('Minimum length ahead can be booked: ');
			z.attr('for', i);
			y.append(data.minAhead = $(document.createElement('input')));
			data.minAhead.attr('type', 'number');
			data.minAhead.attr('id', i);
			data.minAheadUnit = drawTimeMeasurement(y, (value ? value.minAheadUnit : null));

			i = uniqid();
			obj.append(y = $(document.createElement('div')));
			y.append(z = $(document.createElement('label')));
			z.html('Maximum length ahead can be booked: ');
			z.attr('for', i);
			y.append(data.maxAhead = $(document.createElement('input')));
			data.maxAhead.attr('type', 'number');
			data.maxAhead.attr('id', i);
			data.maxAheadUnit = drawTimeMeasurement(y, (value ? value.minAheadUnit : null));

			i = uniqid();
			obj.append(y = $(document.createElement('div')));
			y.append(z = $(document.createElement('label')));
			z.html('Maximum concurrently running: ');
			z.attr('for', i);
			y.append(data.maxConcurrent = $(document.createElement('input')));
			data.maxConcurrent.attr('type', 'number');
			data.maxConcurrent.attr('id', i);

			// @todo Help text obj.append('<footer>The size 

			if (value) {
				data.minLength.val(value.minLength);
				data.maxLength.val(value.maxLength);
				data.minAhead.val(value.minAhead);
				data.maxAhead.val(value.maxAhead);
				data.maxConcurrent.val(value.maxAhead);
			}

			data.minLength.change(rFunc(ObjectBuilder.reparse, this, false, id));
			data.minLengthUnit.change(rFunc(ObjectBuilder.reparse, this, false, id));
			data.maxLength.change(rFunc(ObjectBuilder.reparse, this, false, id));
			data.maxLengthUnit.change(rFunc(ObjectBuilder.reparse, this, false, id));
			data.minAhead.change(rFunc(ObjectBuilder.reparse, this, false, id));
			data.minAheadUnit.change(rFunc(ObjectBuilder.reparse, this, false, id));
			data.maxAhead.change(rFunc(ObjectBuilder.reparse, this, false, id));
			data.maxAheadUnit.change(rFunc(ObjectBuilder.reparse, this, false, id));
			data.maxConcurrent.change(rFunc(ObjectBuilder.reparse, this, false, id));

			obj.data(data);
		},

		parseBookingLimit: function(obj, id) {
			var data = obj.data();

			return value = {
				type: 'bookingLimit',
				minLength: data.minLength.val(),
				minLengthUnit: data.minLengthUnit.val(),
				maxLength: data.maxLength.val(),
				maxLengthUnit: data.maxLengthUnit.val(),
				minAhead: data.minAhead.val(),
				minAheadUnit: data.minAheadUnit.val(),
				maxAhead: data.maxAhead.val(),
				maxAheadUnit: data.maxAheadUnit.val(),
				maxConcurrent: data.maxConcurrent.val(),
			};
		},

		drawLimit: function(obj, id, value) {
			var z, i, data = {};

			obj.html('<h4>Limit</h4>');

			i = uniqid();
			obj.append(z = $(document.createElement('label')));
			z.html('Size: ');
			z.attr('for', i);
			obj.append(data.size = $(document.createElement('input')));
			data.size.attr('type', 'number');
			data.size.attr('id', i);

			obj.append(' ');
			i = uniqid();
			obj.append(data.all = $(document.createElement('input')));
			data.all.attr('type', 'checkbox');
			data.all.attr('id', i);
			obj.append(z = $(document.createElement('label')));
			z.html(' pay for all');
			z.attr('for', i);
	
			obj.append(' ');
			i = uniqid();
			obj.append(z = $(document.createElement('label')));
			z.html('Number Available: ');
			z.attr('for', i);
			obj.append(data.number = $(document.createElement('input')));
			data.number.attr('type', 'number');
			data.number.attr('id', i);

			// @todo Help text obj.append('<footer>The size 

			if (value) {
				data.size.val(value.size);
				data.number.val(value.number);
				if (data.all) {
					data.all.attr('checked', true);
				}
			} else {
				data.size.val('1');
				data.number.val('1');
			}
			data.size.change(rFunc(ObjectBuilder.reparse, this, false, id));
			data.number.change(rFunc(ObjectBuilder.reparse, this, false, id));
			data.all.change(rFunc(ObjectBuilder.reparse, this, false, id));

			obj.data(data);
		},

		parseLimit: function(obj, id) {
			var data = obj.data();

			return value = {
				type: 'limit',
				size: data.size.val(),
				number: data.number.val(),
				all: (data.all.attr('checked') ? true : false)
			};
		},


		drawLink: function(obj, id, value) {
			/*var z, y, data = {};
			
			obj.html('Time: ');

			obj.append(data.start = $(document.createElement('input')));
			obj.append(' - ');
			obj.append(data.end = $(document.createElement('input')));
			if (value) {
				data.start.val(value.start);
				data.end.val(value.end);
			}
			$.timepicker.timeRange(data.start, data.end, {
				timeFormat: 'HH:mm',
				stepMinute: 5
			});
			data.start.change(rFunc(ObjectBuilder.reparse, this, false, id));
			data.end.change(rFunc(ObjectBuilder.reparse, this, false, id));

			obj.data(data);*/
		},

		parseLink: function(obj, id) {
			var data = obj.data();
			
			return {
				type: 'time',
			};
		},


		parsePad: function(id, pad) {
			var obj = {};

			ObjectBuilder.iterateObjects(pad, function(el, type, element) {
				// Check type of element exists
				if (costs.elements[type] && costs.elements[type].elements[element]) {
					switch (element) {
						/*case 'date':
						case 'days':
						case 'time':
						case 'userTime':
						case 'repeat':
						case 'price':
						case 'detail':
						case 'location':
						case 'limit':
						case 'bookingLimit':
						case 'link':
						case 'exclusion':
						case 'option':*/
						default:
							if (!(obj[element])) {
								obj[element] = [];
							}

							obj[element].push(costs.elements[type].elements[element].parse(el, id));

							break;
					}
				}
			});

			return obj;
		},

		populatePad: function(id, pad, value) {
			console.log('custom populate');
			if (value) {
				console.log(value);
				var t, e, i;
				for (t in costs.elements) {
					for (e in costs.elements[t].elements) {
						// See if there are any prices
						if (value[e]) {
							for (i in value[e]) {
								ObjectBuilder.createElement(id, pad, t, e, value[e][i]);
							}
						}
					}
				}
			}
		},

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
			if (id && c[id]['costs'][nid]) {
				var n = c[id]['costs'][nid]; // Easy reference to cost storage
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
			if (id && c[id]['costs'][nid]) {
				var n = c[id]['costs'][nid]; // Easy reference to cost storage
				var sid;
				do {
					sid = (new Date().getTime()).toString(16);
				} while (n['costs'][sid]);

				n['spaces'][sid] = {};

				var w,x,y,z;
				n['space'].append(((z = (n['spaces'][sid]['div'] = $(document.createElement('div'))))));
				z.append((w = $(document.createElement('div'))));
				w.append(document.createTextNode('Label: '));
				w.append((x = $(document.createElement('input'))));
				z.append((w = $(document.createElement('div'))));
				w.append(document.createTextNode(' Price: '));
				w.append((x = $(document.createElement('input'))));
				x.attr('type', 'number');
				z.append((x = $(document.createElement('a'))));
				x.addClass('button');
				x.append(document.createTextNode('Delete Cost'));
			} else {
				console.log('Not found');
			}
		}
	};

	costs.elements = {
		part: {
			elements: {
				price: {
					label: 'Price',
					parse: costs.parsePrice,
				},
				location: {
					label: 'Location',
					draw: costs.drawLocation,
					parse: costs.parseLocation,
				},
				option: {
					label: 'Option',
					draw: costs.drawOption,
					parse: costs.parseOption,
				},
				repeat: {
					label: 'Repeat',
					draw: costs.drawRepeat,
					parse: costs.parseRepeat,
				},
				date: {
					label: 'Specific Date(s)',
					draw: costs.drawSpecificDate,
					parse: costs.parseSpecificDate
				},
				days: {
					label: 'Day(s)',
					draw: costs.drawDays,
					parse: costs.parseDays,
				},
				time: {
					label: 'Time',
					draw: costs.drawTime,
					parse: costs.parseTime,
				},
				userTime: {
					label: 'User-specifiable Time',
					draw: costs.drawUserTime,
					parse: costs.parseUserTime,
				},
				detail: {
					label: 'Detail',
					draw: costs.drawDetail,
					parse: costs.parseDetail,
				},
				limit: {
					label: 'Size Limit',
					draw: costs.drawLimit,
					parse: costs.parseLimit,
				},
				bookingLimit: {
					label: 'Booking Limit',
					draw: costs.drawBookingLimit,
					parse: costs.parseBookingLimit
				},
				link: {
					label: 'Linked booking',
					draw: costs.drawLink,
					parse: costs.parseLink,
				},
				exclusion: {
					label: 'Exclusion',
					draw: costs.drawExclusion,
					parse: costs.parseExclusion,
				},
			}
		}
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

	var calendar = {
		days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday',
				'Friday', 'Saturday'],

		drawMonth: function(obj, events) {
			var nextEventStart = 0;
			var event, nextEvent;
			var e, start, current = new Date().valueOf();
			var i, z, y;

			// Go through events and get future events
			for (e in events) {
				if (!events[e].start instanceof Date) {
					event = new Date(events[e].start);
					start = nextEvent.valueOf();
				} else {
					event = events[e].start;
					start = nextEvent.valueOf();
				}

				if (start > current) {
					if (!nextEventStart || start < nextEventStart) {
						nextEventStart = start;
						nextEvent = event;
					}
				}
			}

			// Set next event to today if don't have an event
			if (!nextEvent) {
				nextEvent = new Date;
			}

			// Draw the month
			obj.html('');

			// Create a prev/next
			obj.append(z = $(document.createElement('div')));

			// Find the first sunday @todo option
			var month = new Date(nextEvent);

			month.setDate(1);

			month = month - month.getDay();

			// Start printing the calendar
			// Print the header first
			obj.append(z = $(document.createElement('div')));
			for (i in calendar.days) {
				z.append(y = $(document.createElement('div')));
				y.html(calendar.days[i]);
			}
		}
	}

	return {
		/**
		 * Handles the drawing and actions associated with the costs metabox.
		 */
		costs: {
			init: function(id, url, value, currencies) {
				console.log('Received value of ' + value);
				
				if (url) {
					ajaxurl = url;
				}

				if (!c[id]) {
					d('creating new costs section ' + id);
					c[id] = {
							'pad': $('#' + id), // Is the main div
							'costs': {}, // Stores each costs elements
					};

					if (currencies && ((currencies = JSON.parse(currencies)))) {
						console.log(currencies);
						c[id].currencies = currencies;
					}

					var z, y;

					// Help
					z = createLabelledFrame(c[id].pad, 'Show help', {
						'hideable': true,
						'hide': true,
						'toggleLabel': 'help'
					});

					z.html('<p>In this section detail the times, locations and cost of '
							+ 'the bookable item by clicking and dragging components onto '
							+ 'the pad. For detailed instructions, visit the documentation '
							+ 'page.</p>'
							+ '<p>If you leave this blank, the event will be free termed '
							+ 'event that can be booked.</p>');

					// Create input
					c[id].pad.append(z = $(document.createElement('input')));
					z.attr('type', 'hidden');
					z.attr('name', 'coststimes');

					c[id].pad.append(y = $(document.createElement('div')));

					// Set the draw function for the price
					costs.elements.part.elements.price.draw = rFunc(costs.drawPrice, this, true, id);

					if (value) {
						try {
							value = JSON.parse(value);
						} catch(e) {
							value = null;
						}
					}

					ObjectBuilder.create(y, costs.elements, {
							input: z,
							parse: costs.parsePad,
							populate: costs.populatePad,
							multiple: true,
							types: ['part-option', 'part-date', 'part-userTime', 'part-repeat', 'part-price', 'part-detail', 'part-location', 'part-limit', 'part-bookingLimit', 'part-link', 'part-exclusion'],
							}, value);
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
						'calendarFrame': $('#' + id + 'calendarFrame'),
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

			addOption: function(time) {
				// Go through 
			}
		},
	};
})();
