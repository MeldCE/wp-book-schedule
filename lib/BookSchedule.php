<?php
//require_once('utils.php');
require_once('wp-settings/WPSettings.php');
require_once('Currency.php');

class BookSchedule {
	protected static $instance = null;
	protected static $runAdminInit = false;
	protected static $runInit = false;
	protected static $settings = null;
	protected static $types = null;
	protected static $idPre = 'bs_';
	protected static $locationType = 'bs_locations';
	protected static $coststimesMeta = 'bs_coststimes';
	protected static $bookingType = 'bs_bookings';
	protected static $popupInserted = false;
	protected static $cookie = 'bookschedule';
	protected static $lp;
	protected static $options;
	protected static $nonceKey = 'book-schedule';
	protected static $nonceMetaContext = 'book-schedule-metabox';
	protected static $noncePrinted = false;
	protected static $itemDetails = array();

	function __destruct() {
		if (static::$lp) {
			fclose(static::$lp);
		}
	}

	protected static function d($line, $data) {
		if (static::$lp) {
			fwrite(static::$lp, $line . ': ' . print_r($data, 1) . "\n");
		}
	}

	protected function  __construct() {
		global $wpdb;

		//static::$lp = fopen('bookSchedule.log', 'a');
		try {
			$currencies = $this->getCurrenciesArray(true);
		} catch (CurrencyException $e) {
			$this->echoError($e->getMessage());
			$currencies = array();
		}

		static::$options = array(
				'title' => __('Book Schedule Options', 'book_schedule'),
				'id' => 'bSOptions',
				'useTabs' => true,
				'prefix' => 'bs_',
				'settings' => array(
					'items' => array(
							'title' => __('Items Options', 'book_schedule'),
							'fields' => array(
									'version' => array(
											'type' => 'internal',
									),
									'item_types' => array(
											'title' => __('Item Types', 'book_schedule'),
											'description' => __('The types of items that will be '
													. 'bookable.', 'book_schedule'),
											'type' => 'multiple',
											'multiple' => true,
											'fields' => array(
													'name' => array(
														'title' => __('Type Name', 'book_schedule'),
														'description' => __('The name of the type of '
																. 'item. Should be plural.',
																'book_schedule'),
														'type' => 'text',
													),
													'slug' => array(
														'title' => __('Slug Name', 'book_schedule'),
														'description' => __('A URL-friendly name of the '
																. 'type of item. It should not contain '
																. 'spaces or capital letters. Changing '
																. 'the slug of existing item types will '
																. 'result in the loss of the current items '
																. 'of that type.', 'book_schedule'),
														'type' => 'slug',
													),
													'singular' => array(
														'title' => __('Singular Type Name',
																'book_schedule'),
														'description' => __('The singular name of the '
																. 'type of item.', 'book_schedule'),
														'type' => 'text',
													),
													'description' => array(
														'title' => __('Type Description',
																'book_schedule'),
														'description' => __('The description of the '
																. 'type.', 'book_schedule'),
														'type' => 'longtext',
													),
													'additionalInfoFields' => array(
															'title' => __('Additional Information Fields', 'book_scedule'),
															'description' => __('Create any additional '
																	. 'fields you want to be available when '
																	. 'creating an event of this type',
																	'book_schedule'),
															'type' => 'multiple',
															'multiple' => true,
															'fields' => array(
																	'name' => array(
																			'title' => __('Field Name', 'book_schedule'),
																			'description' => __('The name of the type of '
																					. 'item. Should be plural.',
																					'book_schedule'),
																			'type' => 'text',
																	),
																	'slug' => array(
																			'title' => __('Slug Name', 'book_schedule'),
																			'description' => __('A URL-friendly name of the '
																					. 'type of item. It should not contain '
																					. 'spaces or capital letters. Changing '
																					. 'the slug of existing item types will '
																					. 'result in the loss of the current items '
																					. 'of that type.', 'book_schedule'),
																			'type' => 'slug',
																	),
																	'type' => array(
																			'title' => __('Field Type', 'book_schedule'),
																			'description' => __('The type of field.',
																					'book_schedule'),
																			'type' => 'select',
																			'values' => array(
																				'text' => 'Text',
																				'formatted' => 'Formatted Text',
																			)
																	)
															),
													),
											)
									),
									/*'additionalTaxonamies' => array(
											'title' => __('Additional Taxonamies', 'book_scedule'),
											'description' => __('Create any taxonamies '
													. 'you want to be available for this '
													. 'type of item',
													'book_schedule'),
											'type' => 'multiple',
											'multiple' => true,
											'fields' => array(
													'name' => array(
															'title' => __('Taxonamy Name', 'book_schedule'),
															'description' => __('The name of the type of '
																	. 'item. Should be plural.',
																	'book_schedule'),
															'type' => 'text',
													),
													'slug' => array(
															'title' => __('Slug Name', 'book_schedule'),
															'description' => __('A URL-friendly name of the '
																	. 'taxonamy. It should not contain '
																	. 'spaces or capital letters. Changing '
																	. 'the slug of existing item types will '
																	. 'result in the loss of the current items '
																	. 'of that type.', 'book_schedule'),
															'type' => 'slug',
													),
													'hierarchical' => array(
															'title' => __('Hierarchical', 'book_schedule'),
															'description' => __('Whether or not '
																	. 'taxonamy should be hierarchical.',
																	'book_schedule'),
															'type' => 'boolean',
													)
											),
									),*/
							)
					),
					'emails' => array(
						'title' => __('Email Options', 'book_schedule'),
						'fields' => array(
							'fromEmail' => array(
								'title' => __('From Email', 'book_schedule'),
								'description' => __('Email address to send the alert '
										. 'and confirmation emails from', 'book_schedule'),
								'type' => 'text',
							),
							'sendAlert' => array(
								'title' => __('Send Alert Emails To:', 'book_schedule'),
								'description' => __('If selected, an email will be '
									 . 'sent to the users of the selected roles everytime '
									 . 'a new booking is received or a booking is updated.',
									 'book_schedule'),
								'type' => 'select',
								'values' => array(),
							),
							'alertSubject' => array(
								'title' => __('Alert Email Subject',
										'book_schedule'),
								'description' => __('Subject of the alert email.',
										'book_schedule'),
								'type' => 'text',
							),
							'alertEmail' => array(
								'title' => __('Alert Email', 'book_schedule'),
								'description' => __('Email to be sent to the people of '
										. 'the role specified above. %items% will be '
										. 'replaced with a formatted list of the booked/'
										. 'inquired items.', 'book_schedule'),
								'type' => 'formatted',
							),
							'sendConfirmation' => array(
									'title' => __('Send Confirmation Email',
											'book_schedule'),
									'description' => __('If this option is checked, the '
											. 'a confirmation email will be sent to anyone '
											. 'who submits a new booking/inquiry.',
											'book_schedule'),
									'type' => 'boolean',
									'default' => true,
							),
							'confirmationSubject' => array(
								'title' => __('Confirmation Email Subject',
										'book_schedule'),
								'description' => __('Subject of the confirmation email.',
										'book_schedule'),
								'type' => 'text',
							),
							'confirmationEmail' => array(
								'title' => __('Confirmation Email', 'book_schedule'),
								'description' => __('Email to be sent to the person who '
										. 'submitted the booking/inquiry. %items% will be '
										. 'replaced with a formatted list of the booked/'
										. 'inquired items.', 'book_schedule'),
								'type' => 'formatted',
							),
						),
					),
					'other' => array(
						'title' => __('Other Options', 'book_schedule'),
						'fields' => array(
							'version' => array(
								'type' => 'internal',
							),
							'baseCurrency' => array(
								'title' => __('Base currency', 'book_schedule'),
								'type' => 'select',
								'values' => $currencies,
								'check' => array($this, 'setBaseCurrency'),
								'get' => array($this, 'getBaseCurrency'),
								'default' => 'USD',
							),
							'currencies' => array(
								'title' => __('Additional currencies', 'book_schedule'),
								'description' => __('Select the currencies that are to be '
										. 'used on this site. If none are selected, currencies '
										. 'will not be able to be selected and everything will '
										. 'be in the base currency. The base currency will '
										. 'automatically selected.', 'book_schedule'),
								'type' => 'select',
								'values' => $currencies,
								'multiple' => true,
								'check' => array($this, 'setCurrencies'),
								'get' => array($this, 'getCurrencies'),
							),
							'conversionPercentage' => array(
								'title' => __('Additional conversion percentage',
										'book_schedule'),
								'type' => 'number',
								'default' => 2
							),
							'haveArchives' => array(
								'title' => __('Have archives', 'book_schedule'),
								'description' => __('If this option is checked, the '
										. 'the items will be configured to have an '
										. 'archives page.',
										'book_schedule'),
								'type' => 'boolean',
								'default' => true,
							),
							'showPopup' => array(
								'title' => __('Show booking pop-up', 'book_schedule'),
								'description' => __('If this option is checked, the '
										. 'booking popup, showing currently selected '
										. 'items will be displayed on over page.',
										'book_schedule'),
								'type' => 'boolean',
								'default' => true,
							),
						),
					),
				),
		);

		static::$settings = new WPSettings(static::$options);
	}

	protected static function &instance() {
		if (!static::$instance) {
			static::$instance = new self();
		}

		return static::$instance;
	}

	/**
	 * Returns either an array of the item types or a specific
	 * item type.
	 *
	 * @param $typeSlug string If supplied, will return only the type information
	 *              with the given slug, or null if does not exist.
	 * @return array Either an array containing all the types or an array
	 *         containing the information on a single type
	 * @retval null The given type does not exist.
	 */
	protected static function &types($typeSlug = null) {
		if (!static::$types) {
			static::$types = static::$settings->item_types;
		}

		if ($typeSlug) {
			foreach (static::$types as &$type) {
				if ($type['slug'] === $typeSlug) {
					return $type;
				}
			}
		} else {
			return static::$types;
		}
		
		return null;
	}

	/**
	 * Checks and sets the bookschedule cookie.
	 */
	static function checkCookie() {
		if (!isset($_COOKIE[static::$cookie])) {
			$_COOKIE[static::$cookie] = uniqid();
			setcookie(static::$cookie, $_COOKIE[static::$cookie]);
		}
	}

	/**
	 * Function to initialise the plugin when in the dashboard
	 */
	static function adminInit() {
		if (!static::$runAdminInit) {
			require_once( ABSPATH . '/wp-admin/includes/user.php' );

			$me = static::instance();
	
			$roles = array('' => '');
			foreach (get_editable_roles() as $r => $role) {
				$roles[$r] = $role['name'];
			}
			static::$options['settings']['emails']['fields']['sendAlert']['values']
					= $roles;

			add_action('admin_enqueue_scripts', array(&$me, 'adminEnqueue'));
			add_action('admin_menu', array(&$me, 'adminMenuInit'));

			static::$runAdminInit = true;
		}
	}

	/**
	 * Function to initialise post types from the item types.
	 */
	static function registerPostTypes() {
		if (!static::$runInit) {
			static::$runInit = true;

			$me = static::instance();

			$haveArchive = static::$settings->haveArchives;

			if (($types = static::types())) {
				foreach ($types as $t => &$type) {
					/// @todo Remove once slug is type checked
					// Ensure slug does not have spaces and capitals
					$type['slug'] = strtolower(str_replace(' ', '_', $type['slug']));

					register_post_type($type['slug'], array(
							'label' => __("$type[name]", 'book_schedule'),
							'labels' => array(
									//'name' => '',
									'singular_name' => __("$type[singular]", 'book_schedule'),
									'add_new_item' => __("Add New $type[singular]",
											'book_schedule'),
									'edit_item' => __("Edit $type[singular]",
											'book_schedule'),
									'new_item' => __("New $type[singular]",
											'book_schedule'),
									'view_item' => __("View $type[singular]",
											'book_schedule'),
									'search_items' => __("Search $type[name]",
											'book_schedule'),
									'no_found' => __("$type[singular] not found",
										 'book_schedule'),
									'not_found_in_trash' => __("No $type[name] found in Trash",
											'book_schedule'),
							),
							'description' => __("$type[description]", 'book_schedule'),
							'public' => true,
							'show_ui' => true,
							'taxonomies' => array('category'),
							'menu_postition' => 30,
							'menu_icon' => 'dashicons-clock',
							'supports' => array('title', 'editor', 'excerpt', 'thumbnail',
									'trackbacks', 'revisions'),
							/// @todo 'taxonomies' => array(),
							'has_archive' => ($haveArchive ? true : false),
					));
				}
			}
			
			// Register location post type
			register_post_type(static::$locationType, array(
					'label' => __("Locations", 'book_schedule'),
					'labels' => array(
							//'name' => '',
							'singular_name' => __("Location", 'book_schedule'),
							'add_new_item' => __("Add New Location",
									'book_schedule'),
							'edit_item' => __("Edit Location",
									'book_schedule'),
							'new_item' => __("New Location",
									'book_schedule'),
							'view_item' => __("View Location",
									'book_schedule'),
							'search_items' => __("Search Locations",
									'book_schedule'),
							'no_found' => __("Location not found",
								 'book_schedule'),
							'not_found_in_trash' => __("No Locations found in Trash",
									'book_schedule'),
					),
					'description' => __("Locations for items in Book Schedule",
							'book_schedule'),
					'public' => true,
					'show_ui' => true,
					//'taxonomies' => array('category'),
					'menu_postition' => 30,
					'menu_icon' => 'dashicons-clock',
					'supports' => array('title', 'editor', 'thumbnail', 'revisions'),
					'has_archive' => true,
			));

			/**
			 * Register the booking post type.
			 * Used to store user bookings
			 */
			register_post_type(static::$bookingType, array(
					'label' => __("Bookings", 'book_schedule'),
					'labels' => array(
							//'name' => '',
							'singular_name' => __("Bookings", 'book_schedule'),
							'add_new_item' => __("Add New Booking",
									'book_schedule'),
							'edit_item' => __("Edit Booking",
									'book_schedule'),
							'new_item' => __("New Booking",
									'book_schedule'),
							'view_item' => __("View Booking",
									'book_schedule'),
							'search_items' => __("Search Bookings",
									'book_schedule'),
							'no_found' => __("Booking not found",
								 'book_schedule'),
							'not_found_in_trash' => __("No Bookings found in Trash",
									'book_schedule'),
					),
					'description' => __("Bookings from Book Schedule",
							'book_schedule'),
					'public' => true,
					'exclude_from_search' => true,
					'publicly_queryable' => false,
					'has_archive' => false,
					'show_ui' => true,
					'show_in_nav_menus' => false,
					//'taxonomies' => array('category'),
					'menu_postition' => 30,
					'menu_icon' => 'dashicons-clock',
					'supports' => array('revisions', 'comments'),
					'has_archive' => true,
			));

		}
	}

	/**
	 * Registers the special meta boxes for items in Book Schedule.
	 */
	static function registerMetaboxes() {
		$me = static::instance();
		
		if (($types = static::types())) {
			foreach ($types as $t => &$type) {
				/// @todo Remove once slug is type checked
				// Ensure slug does not have spaces and capitals
				$type['slug'] = strtolower(str_replace(' ', '_', $type['slug']));
			
				// Register metabox for additional information if have any
				if (isset($type['additionalInfoFields'])
						&& $type['additionalInfoFields']) {
					add_meta_box('additional', __('Additional Information',
							'book_schedule'), array(&$me, 'printAdditionalMeta'), $type['slug'],
							'normal', 'high', array($type));
				}
				
				// Running and Costs Box
				add_meta_box('timings', __("$type[singular] Locations, Times and Costs",
						'book_schedule'), array(&$me, 'printCostsMeta'), $type['slug'],
						'normal', 'high', array($type));
			}
		}

		// Add location details metabox
		add_meta_box('details', __('Locations',
				'book_schedule'), array(&$me, 'printLocationDetailsMeta'),
				static::$locationType, 'normal', 'high');
		
		// Booking Items
		add_meta_box('bookedItems', __('Items ',
				'book_schedule'), array(&$me, 'printItemsMeta'),
				static::$bookingType, 'normal', 'high');
				
		// Booking Status
		add_meta_box('bookingStatus', __('Booking Status ',
				'book_schedule'), array(&$me, 'printStatusMeta'),
				static::$bookingType, 'normal', 'high');
	}

	/**
	 * Enqueues scripts and stylesheets used by Gallery Hierarchy in the admin
	 * pages.
	 */
	static function adminEnqueue() {
		static::enqueue();
		wp_enqueue_script('wpsettings', 
				plugins_url('/lib/wp-settings/js/wpsettings.min.js', dirname(__FILE__)));
		wp_enqueue_style('wpsettings', 
				plugins_url('/lib/wp-settings/css/wpsettings.min.css', dirname(__FILE__)));
		/// @todo @see http://codex.wordpress.org/I18n_for_WordPress_Developers
		wp_enqueue_script('object-builder',
				plugins_url('/lib/object-builder/objectBuilder.js',
				dirname(__FILE__)));
		wp_enqueue_style('object-builder',
				plugins_url('/lib/object-builder/objectBuilder.css',
				dirname(__FILE__)));
		wp_enqueue_script('book-schedule', 
				plugins_url('/js/bookschedule.js', dirname(__FILE__)),
				array('object-builder'));
		/*wp_enqueue_script('jquery-ui-multiselect', 
				plugins_url('/lib/jquery-ui-multiselect/src/jquery.multiselect.min.js', dirname(__FILE__)),
				array('jquery', 'jquery-ui-core'));
		wp_enqueue_script('jquery-ui-multiselect-filter', 
				plugins_url('/lib/jquery-ui-multiselect/src/jquery.multiselect.filter.min.js', dirname(__FILE__)),
				array('jquery', 'jquery-ui-core', 'jquery-ui-multiselect'));
		wp_enqueue_style('jquery-ui-multiselect',
				plugins_url('/lib/jquery-ui-multiselect/jquery.multiselect.css', dirname(__FILE__)));
		wp_enqueue_style('jquery-ui-multiselect-filter',
				plugins_url('/lib/jquery-ui-multiselect/jquery.multiselect.filter.css', dirname(__FILE__)));*/
		wp_enqueue_script('jquery-ui-timepicker', 
				plugins_url('/lib/jquery-ui-timepicker/src/jquery-ui-timepicker-addon.js', dirname(__FILE__)),
				array('jquery', 'jquery-ui-core', 'jquery-ui-datepicker', 'jquery-ui-slider'));
		wp_enqueue_style('jquery-ui-timerpicker',
				plugins_url('/lib/jquery-ui-timepicker/src/jquery-ui-timepicker-addon.css', dirname(__FILE__)));
		wp_enqueue_style('ghierarchy-jquery-ui',
				plugins_url('/css/jquery-ui/jquery-ui.min.css', dirname(__FILE__)));
		wp_enqueue_style('ghierarchy-jquery-ui-structure',
				plugins_url('/css/jquery-ui/jquery-ui.structure.min.css', dirname(__FILE__)));
		wp_enqueue_style('ghierarchy-jquery-ui-theme',
				plugins_url('/css/jquery-ui/jquery-ui.theme.min.css', dirname(__FILE__)));
		//wp_enqueue_style( 'dashicons' );
	}

	/**
	 * Enqueues scripts and stylesheets used by Gallery Hierarchy.
	 */
	static function enqueue() {
		/*wp_enqueue_script('moment',
				plugins_url('/lib/moment/moment.min.js', dirname(__FILE__)),
				array('jquery'));
		wp_enqueue_script('fullcalendar',
				plugins_url('/lib/fullcalendar/dist/fullcalendar.js',
				dirname(__FILE__)), array('jquery', 'moment'));
		wp_enqueue_style('fullcalendar',
				plugins_url('lib/fullcalendar/dist/fullcalendar.css',
				dirname(__FILE__)));*/
		wp_enqueue_style('bookschedule',
				plugins_url('css/bookschedule.css', dirname(__FILE__)));
		wp_enqueue_script('bookschedule',
				plugins_url('js/bookschedule.js', dirname(__FILE__)), array('jquery'));
	}

	static function head() {
		/*echo '<script type="text/javascript">'
				. 'jQuery(document).ready(function() {'
				. 'jQuery("div[data-calendar=\'calendar\']").fullCalendar({'
				. 'contentHeight: 400'
				. '});'
				. '});'
				. '</script>';*/
	}

	/**
	 * Adds links to the plugin metadata on the Installed plugins page
	 */
	static function pluginMeta($links, $file) {
		/// @todo Make better
		if ( $file == plugin_basename(str_replace('lib', 'book-schedule.php', __DIR__))) {
			$links[] = '<a '
					. 'href="https://github.com/weldstudio/wp-book-schedule/issues"'
					. 'title="' . __('Issues', 'book_schedule') . '">'
					. __('Issues', 'book_schedule') . '</a>';
			$links[] = '<a href="http://gittip.weldce.com" title="'
					. __('Gift a weekly amount', 'book_schedule')
					. '" target="_blank">'
					. __('Gift a weekly amount', 'book_schedule') . '</a>';
			$links[] = '<a href="http://gift.weldce.com" title="'
					. __('Gift a little', 'book_schedule') . '" target="_blank">'
					. __('Gift a little', 'book_schedule') . '</a>';
		}

		return $links;
	}

	/**
	 * Function to create the Gallery Hierarchy admin menu.
	 * Called by @see gHierarchy::init()
	 */
	function adminMenuInit() {
		add_menu_page(__('Book Schedule', 'book_schedule'), 
				__('Book Schedule', 'book_schedule'), 'edit_posts',
				'bookSchedule', array(&$this, 'calendarPage'),
				'dashicons-clock', 51);
		/*add_submenu_page('bookSchedule',
				__('Load Images into Gallery Hierarchy', 'book_schedule'),
				__('Load Images', 'book_schedule'), 'upload_files', 'gHLoad',
				array(&$this, 'loadPage'));*/
		add_submenu_page('bookSchedule',
				__('Book Schedule Options', 'book_schedule'),
				__('Options', 'book_schedule'), 'manage_options', 'bSOptions',
				array(static::$settings, 'printOptions'));
	}

	protected function echoError($message) {
		echo '<div id="message" class="error">' . __('Book Schedule Error: ',
				'book_schedule') . $message . '</div>';
	}

	protected function checkFunctions() {
		/*if (!function_exists('finfo_file')) {
			$this->echoError(__('The required Fileinfo Extension is not installed. Please install it',
					'book_schedule'));
			$this->disable = true;
		}*/
	}

	function getCurrenciesArray($full = false) {
		$array = array();

		if ($currencies = Currency::getCurrencies($full)) {
			foreach ($currencies as $c => &$currency) {
				$array[$c] = $currency['currencyName'] . ' (' . $c . ')';
			}
		}

		asort($array);

		return $array;
	}

	function getBaseCurrency() {
		if ($base = Currency::getBase()) {
			return $base;
		} else {
			return null;
		}
	}

	function setBaseCurrency($value) {
		Currency::setBase($value);

		return null;
	}

	function getCurrencies() {
		if ($currencies = Currency::getCurrencies($full)) {
			return array_keys($currencies);
		} else {
			return null;
		}
	}

	function setCurrencies($value) {
			system("echo 'setting currencies received " . print_r($value, 1) . "' >> /tmp/currency.log");

		if (is_array($value)) {
			if (count($value)) {
				if ($base = Currency::getBase()) {
					if (!in_array($base, $value)) {
						array_push($value, $base);
					}
				}
			}
			system("echo 'setting currencies " . print_r($value, 1) . "' >> /tmp/currency.log");
			Currency::setSelectedCurrencies($value, false);
		}

		return null;
	}

	protected function &getItemDetails($postId) {
		if (!isset(static::$itemDetails[$postId])) {
			if (($data = get_post_meta($postId, static::$coststimesMeta))) {
				static::$itemDetails[$postId] = $data;
			}
		}

		return static::$itemDetails[$postId];
	}

	protected function extractItemDetail($postId, $detail, &$data = null,
			&$details = null) {
		if (!is_null($data) || ($data = $this->getItemDetails($postId))) {
			if (!is_null($details)) {
				$details = array();
			}
			if (!is_array($detail)) {
				$detail = array($detail);
			}

			foreach ($detail as $d) {
				if (isset($data[$d])) {
					$details[$d] = $data[$d];
				}
			}

			if (isset($data['option'])) {
				$details['option'] = array();

				foreach ($data['option'] as &$option) {
					$oDetails = array(
						'label' => $option['label']
					);
					$this->extractItemDetail($postId, $detail, $option['option'], $oDetails);

					array_push($details['option'], $oDetails);
				}
			}

			return $details;
		}

		return null;
	}

	/**
	 * Saves the information from the metaboxes when a post is saved
	 *
	 * @param int $postId The ID of the post being saved.
	 */
	static function saveMetaboxes($postId) {
		// Check if our nonce is set.
		if (!isset($_POST[static::$nonceKey])) {
			return;
		}

		// Verify that the nonce is valid.
		if (!wp_verify_nonce($_POST[static::$nonceKey],
				static::$nonceMetaContext)) {
			return;
		}
		// If this is an autosave, our form has not been submitted, so we don't want to do anything.
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}
		// Check the user's permissions.
		if (isset($_POST['post_type']) && 'page' == $_POST['post_type']) {
			if (!current_user_can( 'edit_page', $postId)) {
				return;
			}
		} else {
			if (!current_user_can('edit_post', $postId)) {
				return;
			}
		}
		/* OK, it's safe for us to save the data now. */
		// Save location link
		if (isset($_POST['location'])) {
			// Check it is a valid location
			if (($id = (intval($_POST['location'])))) {
				if (($post = get_post($id))
						&& $post->post_type === static::$locationType) {
					update_post_meta($postId, static::$locationType, $id);
				}
			}
		}

		// Save costs information
		if (isset($_POST['coststimes'])) {
			/// @todo Validate
			update_post_meta($postId, static::$coststimesMeta, $_POST['coststimes']);
		}
		
		// Get the post type information
		if ($type = static::types($_POST['post_type'])) {
			if (isset($type['additionalInfoFields'])
					&& $type['additionalInfoFields']) {
				$data = array();
				foreach ($type['additionalInfoFields'] as &$field) {
					// Make sure that it is set.
					if (!isset($_POST[$field['slug']])) {
						continue;
					}

					switch($field['type']) {
						case 'text':
							// Sanitize user input.
							$value = sanitize_text_field($_POST[$field['slug']]);
							break;
						case 'formatted':
							$value = $_POST[$field['slug']];
							break;
					}

					update_post_meta($postId, static::$idPre . $field['slug'], $value);
				}
			}
		}
	}

	/**
	 * Handles the retrieving of locations for the locations, times and costs
	 * metabox.
	 * @todo Add nonce
	 */
	static function ajaxGetLocations() {
		$me = static::instance();
		$error = false;
		
		// Get locations
		$args = array('post_type' => static::$locationType);

		$locations = array();
		$locationPosts = get_posts($args);

		foreach($locationPosts as &$location) {
			$locations[$location->ID] = $location->post_title;
		}

		// Return information
		header('Content-Type: application/json');
		
		echo json_encode($locations);
		
		exit;
	}

	/**
	 * Handles the add booking AJAX request.
	 * @todo Add nonce
	 */
	static function ajaxAdd() {
		$me = static::instance();
		$error = false;

		if (isset($_POST['bs_add']) && ($data =& $_POST['bs_add'])) {
			// Check if we have a nonce
			if (isset($data['nonce']) && isset($data['item'])
					&& isset($data['item']['id'])) {
				// See if the id is a valid item
				if (($id = (intval($data['item']['id'])))) {
					if (($post = get_post($id))
							&& static::types($post->post_type)) {
						// Update/create a booking/inquiry
						if (!($booking = $me->getBookingsData($data['type'], 'draft'))) {
							// Create a new booking/inquiry
							$booking = array(
									'status' => 'draft',
							);
						}

						if (!isset($booking['type'])) {
							$booking['type'] = $data['type'];
						}
						if (!isset($booking['items'])) {
							$booking['items'] = array();
						}

						// Check that the item isn't already in the booking
						if ($data['type'] == 'inquiry') {
							foreach ($booking['items'] as &$item) {
								if ($item['id'] == $data['item']['id']) {
									$error = __('This item is already in your inquiry',
											'book_schedule');
									break;
								}
							}
						}

						if (!$error) {
							$booking['items'][uniqid()] = $data['item'];

							$me->updateBooking($booking);
						}

						// Return information
						header('Content-Type: application/json');
						if ($error) {
							echo json_encode(array(
									'nonce' => $data['nonce'],
									'error' => $error
							));
						} else {
							echo json_encode(array(
									'nonce' => $data['nonce'],
									'title' => $post->post_title,
									'url' => get_permalink($post->ID),
									'id' => $post->ID
							));
						}
					}
				}
			}
		}
		
		exit;
	}

	static function ajaxRemove() {
		$me = static::instance();

		$error = false;
		$success = false;

		if (isset($_POST['bs_removeItem']) && ($data =& $_POST['bs_removeItem'])) {
			// Get booking
			if (!($booking = $me->getBookingsData($data['type'], 'draft'))) {
				$error = __('You do currently not have a ' . $data['type'],
						'book_schedule');
			} else if (!isset($booking['items']) || !count($booking['items'])) {
				$error = __('You currently do not have any items in your '
						. $data['type'], 'book_schedule');
			}

			if (!$error) {
					// Try and find the item
					$found = false;
					if (($keys = array_keys($booking['items']))) {
						foreach ($keys as $i) {
							if ($booking['items'][$i]['id'] == $data['id']) {
								unset($booking['items'][$i]);
								$found = true;
								break;
							}
						}
					}

					if ($found) {
						$me->updateBooking($booking);
						$success = __('Item deleted from your ' . $data['type'],
								'book_schedule');
					} else {
						$success = __('Could not find item in your ' . $data['type'],
								'book_schedule');
					}
			}
		} else {
			$error = __('Invalid request. Please try again', 'book_schedule');
		}
		
		// Return information
		header('Content-Type: application/json');
		if ($error) {
			echo json_encode(array(
					'error' => $error
			));
		} else if (isset($success)) {
			echo json_encode(array(
					'success' => $success
			));
		}
		
		exit;
	}

	static function ajaxBook() {
		$me = static::instance();

		$error = false;
		$form = false;

		if (isset($_POST['bs_book']) && ($data =& $_POST['bs_book'])) {
			// Get booking
			if (!($booking = $me->getBookingsData($data['type'], 'draft', true))) {
				$error = __('You do currently not have a ' . $data['type'],
						'book_schedule');
			} else if (!isset($booking['items']) || !count($booking['items'])) {
				$error = __('You currently do not have any items in your '
						. $data['type'], 'book_schedule');
			}

			if (!$error) {
				if (is_user_logged_in()) {
					$form = '<p>' . __('Confirming your ' . $data['type'] . ' is for:',
							'book_schedule') . '</p><ul>';
					foreach ($booking['items'] as &$item) {
						$form .= '<li>' . get_the_title($item['id']) . '</li>';
					}
					$form .= '</ul>';
				} else {
					$error = __('You must be <a target="_blank" href="'
							. wp_registration_url() . '">registered</a> and <a '
							. 'target="_blank" href="' . wp_login_url() . '">logged in</a> '
							. 'to submit a ' . $data['type'], 'book_schedule');
				}
			}
		} else if (isset($_POST['bs_send']) && ($data =& $_POST['bs_send'])) {
			// Get booking
			if (!($booking = $me->getBookingsData($data['type'], 'draft'))) {
				$error = __('You do currently not have a ' . $data['type'],
						'book_schedule');
			} else if (!isset($booking['items']) || !count($booking['items'])) {
				$error = __('You currently do not have any items in your '
						. $data['type'], 'book_schedule');
			}

			if (!$error) {
				if (is_user_logged_in()) {
					// Publish the booking
					$booking['status'] = 'publish';
					$me->updateBooking($booking);
					if (isset($data['comment']) && $data['comment']) {
						$user = wp_get_current_user();
						$args = array(
								'comment_post_ID' => $booking['ID'],
								'comment_content' => $data['comment'],
								'comment_approved' => 1,
								'user_id' => $user->ID,
						);
						wp_insert_comment($args);
					}
					$success = __(ucwords($data['type']) . ' sent.', 'book_schedule');
				} else {
					$error = __('You must be <a target="_blank" href="'
							. wp_registration_url() . '">registered</a> and <a '
							. 'target="_blank" href="' . wp_login_url() . '">logged in</a> '
							. 'to submit a ' . $data['type'], 'book_schedule');
				}
			}
		} else {
			$error = __('Invalid request. Please try again', 'book_schedule');
		}
		
		// Return information
		header('Content-Type: application/json');
		if ($error) {
			echo json_encode(array(
					'error' => $error
			));
		} else if (isset($success)) {
			echo json_encode(array(
					'success' => $success
			));
		} else if (isset($form)) {
			echo json_encode(array(
					'form' => $form
			));
		}
		
		exit;
	}

	static function  formatEmail($post, $email) {
		// Get items
		$data = get_post_meta($post->ID, static::$bookingType, true);
		$items = '<ul>';
		foreach ($data['items'] as &$item) {
			$items .= '<li><a href="' . get_permalink($item['id']) . '">'
					. get_the_title($item['id']) . '</a></li>';
		}
		$items .= '</ul>';
	}

	static function alertNewBooking($post) {
		if ($post) {
			if ($post->post_type == static::$bookingType) {

				if (($role = static::$settings->sendAlert)) {
					$users = get_users(array(
							'role' => $role,
							'fields' => array('display_name', 'user_email')
							));
					static::sendEmail($users, static::$settings->alertSubject,
							static::formatEmail($post, static::$settings->alertEmail));
				}

				if (static::$settings->sendConfirmation) {
					// Get submitter user
					if (($user = get_userdata($post->post_author))) {
						static::sendEmail(array($users),
								static::$settings->confirmationSubject,
								static::formatEmail($post,
								static::$settings->confirmationEmail));
					}
				}
			}
		}
	}

	protected static function sendEmail($users, $subject, $body) {
		if (($headers = static::$settings->fromEmail)) {
			$headers = "From: $headers\r\n";
		}
		foreach ($users as &$user) {
			wp_mail($user->user_email, $subject, $body, $headers);
		}
	}

	/**
	 * Retrieves the given additional information for the current post.
	 * Must be called from inside the loop.
	 *
	 * @param $item string The slug of the information to return
	 */
	static function getAdditional($item) {
		if (get_the_ID()) {
			if (($type = get_post_type()) && ($type = static::types($type))) {
				if (isset($type['additionalInfoFields'])
						&& $type['additionalInfoFields']) {
					foreach ($type['additionalInfoFields'] as &$field) {
						if ($field['slug'] === $item) {
							return get_post_meta(get_the_ID(), static::$idPre . $item,
									true);
						}
					}
				}
			}
		}

		return false;
	}

	static function getLocation() {
		if (get_the_ID()) {
			if (($type = get_post_type()) && ($type = static::types($type))) {
				if (($location = get_post_meta(get_the_ID(), static::$locationType,
						true))) {
					return get_post($location);
				}
			}
		}
		
		return false;
	}

	static function getPriceDetails() {
		if (get_the_ID()) {
			$me = static::instance();

			return $me->extractItemDetail(get_the_ID(), 'price');
		}
		
		return null;
	}

	/**
	 * Returns a javascript call to be included on a button to add the
	 * current post to the current booking.
	 */
	static function bookJavascript() {
		if (get_the_ID()) {
			if (($type = get_post_type()) && ($type = static::types($type))) {
				return 'bS.book.add(\'booking\', \'' . get_the_id() . '\');';
			}
		}
	}

	/**
	 * Returns a javascript call to be included on a button to add the
	 * current post to the current inquiry.
	 */
	static function inquireJavascript() {
		if (get_the_ID()) {
			if (($type = get_post_type()) && ($type = static::types($type))) {
				return 'bS.book.add(\'inquiry\', \'' . get_the_id() . '\');';
			}
		}
	}

	/**
	 * Called during the get_footer action to create the bookings popup
	 */
	static function printBookingPopup() {
		$me = static::instance();

		if (static::$settings->showPopup && !static::$popupInserted) {

			$id = uniqid();

			echo '<div id="' . $id . '" class="bsBookingPopup">'
					. '<div id="' . $id . 'bookingsButton" class="button">'
					. __('My Bookings and Inquires', 'book_schedule') . '</div>'
					. '<div class="bookingsFrame" id="' . $id . 'bookingsFrame">'
					. '<div id="' . $id . 'message" class="message"></div>'
					. '<div id="' . $id . 'bookings" class="bookings"></div>'
					. '<div class="calendarFrame" id="' . $id . 'calendarFrame"></div>'
					. '</div></div>';
			if (($data = $me->getBookingsData(null, null, true))) {
				$data = str_replace('\'', '\\\'', json_encode($data));
			} else {
				$data = '';
			}
			echo '<script type="text/javascript">'
					. 'bS.book.init(\'' . $id . '\', \'' . admin_url('admin-ajax.php')
					. '\', \'' . $data . '\');'
					. '</script>';

			// Store that we have inserted the popup
			static::$popupInserted = true;
		}
	}

	/**
	 * Updates/creates booking with the given data.
	 *
	 * @param $data array Data for the booking.
	 */
	protected function updateBooking($data) {
		$postData = array(
				'post_status' => $data['status'],
				'post_type' => static::$bookingType,
				'ping_status' => 'closed',
				'comment_status' => 'open',
		);

		// Add user if logged in
		if (is_user_logged_in()) {
			$user = wp_get_current_user();
			$postData['post_author'] = $user->ID;
			$postData['post_title'] = $user->user_firstname . ' '
					. $user->user_lastname;
		} else {
			$postData['post_title'] = 'Guest';
		}

		$postData['post_title'] .= ' ' . date('Y-m-d');

		// Submit post
		if (isset($data['ID'])) {
			$postData['ID'] = $data['ID'];
			//wp_update_post
			$postId = wp_update_post($postData);
		} else {
			//wp_insert_post
			$postId = wp_insert_post($postData);
		}

		// Add user/session ID
		if (isset($postData['post_author'])) {
			update_post_meta($postId, static::$idPre . 'user', $postData['post_author']);
		} else {
			update_post_meta($postId, static::$idPre . 'session', $_COOKIE[static::$cookie]);
		}
		
		// Add items
		update_post_meta($postId, static::$bookingType, array(
				'type' => $data['type'], 'items' => $data['items']));
	}

	/**
	 * Retrieves all or particular bookings of the current user.
	 *
	 * @param $type ('inquiry'|'booking') If specified, will only return
	 *              the types of booking specified.
	 * @param $status ('draft'|'publish') If specified, will only return
	 *                the bookings with the specified status.
	 * @return array If the $status is draft and a $type is specified will
	 *         return the single draft booking of that $type, otherwise
	 *         will return an array of bookings.
	 */
	protected function getBookingsData($type = null, $status = null, $forJSON = false) {
		if (!in_array($type, array('inquiry', 'booking'))) {
			$type = null;
		}

		// Get bookings
		$args = array(
				'nopaging' => true,
				'post_status' => ($status ? $status : array('publish', 'draft')),
				'post_type' => static::$bookingType,
				'orderby' => 'date',
				'order' => 'DESC',
				'meta_query' => array(
						array(
								'key' => static::$idPre . 'session',
								'value' => $_COOKIE[static::$cookie],
								'compare' => '='
						),
				),
		);

		if ($status && $status != 'draft') {
			$status = 'submitted';
		}

		// Check if a user is logged
		if (is_user_logged_in()) {
			$user = wp_get_current_user();
			$args['meta_query']['relation'] = 'OR';
			$args['meta_query'][] = array(
					'key' => static::$idPre . 'user',
					'value' => $user->ID,
					'compare' => '='
			);
		}


		$data = array();

		if (($bookings = get_posts($args))) {
			foreach ($bookings as &$b) {
				// Get the booked/inquired items and the titles and links
				if (($booking = get_post_meta($b->ID, static::$bookingType, true))) {
					if (isset($booking['items'])) {
						foreach ($booking['items'] as &$item) {
							if (($post = get_post($item['id']))) {
								if ($forJSON) {
									$item['url'] = get_permalink($post->ID);
									$item['title'] = $post->post_title;
								}
								$item['id'] = $item['id'];
							}
						}
					}

					$booking['status'] = $b->post_status;
					$booking['ID'] = $b->ID;
					$booking['date'] = $b->post_date;
					/// @todo Include administration info for administrators.
				}

				// Group into type -> status
				if (!isset($data[$booking['type']])) {
					$data[$booking['type']] = array();
				}

				if ($booking['status'] === 'draft') {
					if (!isset($data[$booking['type']][$booking['status']])) {
						$data[$booking['type']]['draft'] = $booking;
					} else {
						// @todo Need to merge drafts
						if ($booking['type'] == 'inquiry') {
							if (isset($booking['items'])) {
								if (!isset($data[$booking['type']]['draft']['items'])) {
									$data[$booking['type']]['draft']['items']
											= $booking['items'];
								} else {
									foreach ($booking['items'] as &$item) {
										$found = false;
										foreach ($data[$booking['type']]['draft']['items'] as &$sitem) {
											if (isset($item['id']) && isset($item['id'])
													&& $item['id'] == $item['id']) {
												$found = true;
												break;
											}
										}
										if (!$found) {
											$data[$booking['type']]['draft']['items'][] = $item;
										}
									}
								}
							}
						}

						// Delete duplicate
						wp_delete_post($b->ID, true);
					}
				} else {
					if (!isset($data[$booking['type']]['submitted'])) {
						$data[$booking['type']]['submitted'] = array();
					}
					$data[$booking['type']]['submitted'][] = $booking;
				}
			}
		}

		if ($type) {
			if (isset($data[$type])) {
				$data = $data[$type];
			} else {
				return false;
			}

			if ($status) {
				if (isset($data[$status])) {
					return $data[$status];
				} else {
					return false;
				}
			} else {
					return $data;
			}
		}

		return $data;
	}

	protected function printMetaNonce() {
		if (!static::$noncePrinted) {
			wp_nonce_field( static::$nonceMetaContext, static::$nonceKey);

			static::$noncePrinted = true;
		}
	}

	/**
	 * Prints the additional information metabox in the post edit view.
	 *
	 * @param $post Object The object of the item that is being edited
	 * @param $metabox array The metabox data.
	 */
	function printAdditionalMeta($post, $metabox) {
		$this->printMetaNonce();

		$type = $metabox['args'][0];

		foreach ($type['additionalInfoFields'] as $field) {
			$data = get_post_meta($post->ID, static::$idPre . $field['slug'], true);

			echo '<h4>' . __($field['name'], 'book_schedule') . '</h4>';

			switch ($field['type']) {
				case 'text':
					echo '<input name="' . $field['slug'] . '"'
							. ($data ? ' value="' . $data . '"' : '')
							. '>';
					break;
				case 'formatted':
					wp_editor(($data ? $data : ''), $field['slug']);
					break;
			}
		}
	}

	/**
	 * Prints the costs metabox in the post edit view.
	 *
	 * @param $post Object The object of the item that is being edited.
	 * @param $metabox array The metabox data.
	 */
	function printCostsMeta($post, $metabox) {
		$this->printMetaNonce();

		$id = uniqid();
		// Get costs metadata
		$data = get_post_meta($post->ID, static::$coststimesMeta, true);
		$currencies = $this->getCurrenciesArray();

		echo '<div id="' . $id . '" class="bsDetailsMeta"></div>';
		echo '<script type="text/javascript">'
				. 'jQuery(function() {bS.costs.init(\'' . $id . '\', \''
				. admin_url('admin-ajax.php'). '\', \'' . $data
				. '\'' . ($currencies ? ', \''
				. str_replace('\'', '\\\'', json_encode($currencies)) . '\'' : '')
				. ');})</script>';
	}

	function printLocationDetailsMeta($post, $metabox) {
		$this->printMetaNonce();

		$id = uniqid();
		echo '<div id="' . $id . '"></div>';
		echo '<a class="button" onclick="bS.locations.add(\'' . $id . '\')">'
				. __('Add Location', 'book_schedule') . '</a>';
		echo '<script type="text/javascript">'
				. 'bS.costs.init(\'' . $id . '\');'
				. '</script>';
	}

	function printItemsMeta($post) {
		$this->printMetaNonce();

		// Get the metadata
		if (($data = get_post_meta($post->ID, static::$bookingType, true))) {
			if (isset($data['items'])) {
				echo '<ul>';
				foreach ($data['items'] as &$item) {
					echo '<li><a target="_blank" href="' . get_permalink($item['id'])
							. '">' . get_the_title($item['id']) . '</a></li>';
				}
				echo '<ul>';
			}
		}
	}

	function printStatusMeta($post) {
		$this->printMetaNonce();

		// Get the metadata
		if (($data = get_post_meta($post->ID, static::$bookingType, true))) {
			// Print type
			if (isset($data['type'])) {
				echo '<p><strong>Type:</strong> ' . ucwords($data['type']) . '</p>';
			}
		}
	}

	/**
	 * Prints the Load Images page
	 */
	function calendarPage() {
		$this->checkFunctions();

		echo '<h1>' . __('Book Schedule', 'book_schedule')
				. '</h1>';

		echo '<div data-calendar="calendar"></div>';
		
	}

	/**
	 * Controls the generation of HTML for the shortcode replacement.
	 * This function will also fill out the attributes with the default
	 * values from the plugin options (does not use the Wordpress function to do
	 * this to save unnessecary calls to get_option).
	 *
	 * @param $atts Array Associative array containing the attriutes specified in
	 *              the shortcode
	 * @param $content string Content inside of the shortcode (shouldn't be any)
	 * @param $tag string Tag of the shortcode.
	 */
	static function doShortcode($atts, $content, $tag) {
		global $wpdb, $wp_query, $more;

		$me = static::instance();

		switch ($tag) {
			case 'bs-list':
				$args = array();
				// Check we have the required information
				if (!isset($atts['type']) || !static::types($atts['type'])) {
					$types = static::types();
					$atts['type'] = array();
					foreach ($types as &$type) {
						array_push($atts['type'], $type['slug']);
					}
					
					if (static::types(get_post_type())) {
						$args['post__not_in'] = array(get_the_ID());
					}
				}

				// Build query
				$args['post_type'] = $atts['type'];

				// Check if we have categories
				if (isset($atts['category'])) {
					$atts['category'] = explode(',', $atts['category']);

					$c = 0;
					while ($c < count($atts['category'])) {
						if (is_numeric($atts['category'][$c])) {
							$atts['category'][$c] = intval($atts['category'][$c]);
							if ($atts['category'][$c]) {
								$c++;
								continue;
							}
						}
						array_splice($atts['category'], $c, 1);
					}

					if (count($atts['category'])) {
						$args['category__in'] = $atts['category'];
					}
				}

				if (isset($atts['order'])) {
					$args['orderby'] = $atts['order'];
				}

				if (isset($atts['limit'])) {
					if (is_numeric($atts['limit'])) {
						$args['posts_per_page'] = intval($atts['limit']);
					}
				}

				if (isset($atts['template']) && locate_template(
						(is_array($atts['type']) ? array($atts['template'] . '.php')
						: array($atts['template'] . '-' . $atts['type'] . '.php',
						$atts['template'] . '.php')))) {
					$slug = $atts['template'];
				} else if (locate_template(
						(is_array($atts['type']) ? array('bookable.php')
						: array('bookable-' . $atts['type'] . '.php',
						'bookable.php')))) {
					$slug = 'bookable';
				} else {
					$slug = null;
				}

				// Save original query
				$originalQuery = $wp_query;
				$originalMore = $more;
				$more = 0;
				$wp_query = new WP_Query($args);

				if (have_posts()) {
					ob_start();

					if ($slug) {
						get_template_part($slug, $atts['type']);
					} else {
						while(have_posts()) {
							the_post();
							?>
							<article id="post-<?php the_ID(); ?>" <?php post_class(); ?> >
								<div class="blog_text">
									<?php
										if (has_post_thumbnail()) {
											echo '<figure><a href="' 
													. get_permalink() . '" >';
											echo get_the_post_thumbnail(get_the_ID(), 'thumbnail', array(
													'title'	=> trim(strip_tags(get_the_title()))
													));
											echo '</a></figure>';
										}
									?>
									<div class="text">
										<h2>
											<a href="<?php the_permalink(); ?>">
												<?php the_title(); ?>
											</a>
										</h2>
										<p>
											<?php 
												if (has_excerpt()) {
													echo the_excerpt();
												} else {
												}
											?>
										</p>
									</div>
								</div>
							</article>
							<?php
						}
					}


					// Restore query back to the original
					$wp_query = $originalQuery;
					$more = $originalMore;

					$html = ob_get_clean();
				} else {
					if (isset($atts['none'])) {
						$html = $atts['none'];
					} else {
						$html = __('None found', 'book_schedule');
					}
				}
				break;
		}

		return $html;
	}

	/**
	 * Sets the two transients involved with scanning folders
	 * @param $scan string String to set scan transient to
	 * @param $status string String to set the status transient to
	 */
	static function setScanTransients($scan, $status, &$files = null) {
		if ($files) {
			set_transient(static::$filesTransient, json_encode($files),
					static::$filesTransientTime);
		}
		set_transient(static::$statusTransient, $status,
				static::$statusTransientTime);
		set_transient(static::$statusTimeTransient, time(),
				static::$statusTimeTransientTime);
		set_transient(static::$scanTransient, $scan,
				static::$scanTransientTime);
		static::$nextSet = time() + 10;
	}

	static function checkVersion() {
		$me = static::instance();
		$newVersion = false;

		switch (static::$settings->version) {
			case '0.2':
				/**
				 * Add prefix onto start of metadata
				 */

				$types = $me::types();

				foreach ($types as &$type) {
					if (isset($type['additionalInfoFields']) && $type['additionalInfoFields']) {
						$args = array('post_type' => $type['slug'], 'posts_per_page' => -1);
						$posts = get_posts($args);

						foreach ($posts as &$post) {
							foreach ($type['additionalInfoFields'] as &$field) {
								if (($data = get_post_meta($post->ID, $field['slug'], true))) {
									update_post_meta($postId, static::$idPre . $field['slug'], $data);
								}
							}
						}
					}
				}
			case false:
				$newVersion = '0.3';
		}
	
		if ($newVersion) {
			static::$settings->version = $newVersion;
		}
	}

	/**
	 * Ensures that everything is set up for this plugin when it is activated
	 * including the required tables in the database.
	 * @todo Add index for dir and image names
	 */
	static function install() {
		global $wpdb;

		$me = static::instance();

		require_once( ABSPATH . 'wp-admin/includes/upgrade.php' );
		
		$sql = $me->buildTableSql($me->dirTable, static::$dirTableFields, 'id');
		dbDelta($sql);

		$sql = $me->buildTableSql($me->imageTable,
				static::$imageTableFields, 'id');
		dbDelta($sql);
	}

	/**
	 * Builds an SQL statement for creating a table.
	 * @param $table string Name of the table.
	 * @param $fields array Associative array of the field name and details
	 * @param $primary string The field name to use as the primary key
	 */
	protected function buildTableSql($table, $fields, $primary) {
		global $wpdb;

		/*
		 * We'll set the default character set and collation for this table.
		 * If we don't do this, some characters could end up being converted 
		 * to just ?'s when saved in our table.
		 */
		$charset_collate = '';

		if ( ! empty( $wpdb->charset ) ) {
		  $charset_collate = "DEFAULT CHARACTER SET {$wpdb->charset}";
		}

		if ( ! empty( $wpdb->collate ) ) {
		  $charset_collate .= " COLLATE {$wpdb->collate}";
		}
		$sql = 'CREATE TABLE ' . $table . " ( \n";

		foreach ($fields as $f => &$field) {
			$sql .= $f . ' ' . $field . ", \n";
		}

		$sql .= 'PRIMARY KEY  (' . $primary . ") \n";
		$sql .= ') ' . $charset_collate . ';';

		return $sql;
	}
}
