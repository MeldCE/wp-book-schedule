<?php
//require_once('utils.php');
require_once('wp-settings/WPSettings.php');

class BookSchedule {
	protected static $instance = null;
	protected static $runAdminInit = false;
	protected static $runInit = false;
	protected static $settings = null;
	protected static $types = null;

	protected static $imageTableFields = array(
			'id' => 'smallint(5) NOT NULL AUTO_INCREMENT',
			'file' => 'text NOT NULL',
			'width' => 'smallint(5) unsigned NOT NULL',
			'height' => 'smallint(5) unsigned NOT NULL',
			'added' => 'timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP',
			'taken' => 'timestamp',
			'title' => 'text',
			'comment' => 'text',
			'tags' => 'text',
			'metadata' => 'text',
			'exclude' => 'tinyint(1) unsigned NOT NULL DEFAULT 0',
	);

	protected static $dirTableFields = array(
			'id' => 'smallint(5) NOT NULL AUTO_INCREMENT',
			'dir' => 'varchar(350) NOT NULL',
			'added' => 'timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP',
	);


	protected function  __construct() {
		global $wpdb;

		$options = array(
				'title' => __('Book Schedule Options', 'book_schedule'),
				'id' => 'bSOptions',
				'useTabs' => true,
				'prefix' => 'bs_',
				'settings' => array(
						'items' => array(
								'title' => __('Items Options', 'book_schedule'),
								'fields' => array(
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
														'type' => array(
															'title' => __('Type of Item', 'book_schedule'),
															'description' => __(''),
															'type' => 'select',
															'values' => array(
																	'termed' => __('Termed Event',
																		'book_schedule'),
																	'event' => __('(Repeating) Event',
																		'book_schedule'),
															),
													)
												)
										),
								)
						)
				)
		);

		static::$settings = new WPSettings($options);
	}

	protected static function &instance() {
		if (!static::$instance) {
			static::$instance = new self();
		}

		return static::$instance;
	}

	protected static function &types() {
		if (!static::$types) {
			static::$types = static::$settings->item_types;
		}

		return static::$types;
	}


	/**
	 * Function to initialise the plugin when in the dashboard
	 */
	static function adminInit() {
		if (!static::$runAdminInit) {
			$me = static::instance();

			add_action('admin_enqueue_scripts', array(&$me, 'adminEnqueue'));
			add_action('admin_menu', array(&$me, 'adminMenuInit'));

			static::$runAdminInit = true;
		}
	}

	/**
	 * Function to initialise post types from the item types.
	 */
	static function init() {
		if (!static::$runInit) {
			static::$runInit = true;

			$me = static::instance();

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
									'edit_item' => __("Edit New $type[singular]",
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
									'trackbacks', 'comments', 'revisions', 'page-attributes'),
							/// @todo 'taxonomies' => array(),
							'has_archive' => true,
					));
				}
			}
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
				
				// Timings Box
				add_meta_box('timings', __("$type[singular] Running Times",
						'book_schedule'), array(&$me, 'printTimingMeta'), $type['slug'],
						'normal', 'high', array($type));
				
				// Cost Box
				add_meta_box('costs', __("$type[singular] Costs Options and Spaces "
						. 'Available', 'book_schedule'), array(&$me, 'printCostsMeta'),
						$type['slug'], 'normal', 'high', array($type));
				
				// Linked Booking Box
				add_meta_box('linkedBooking', __('Linked Bookings ',
						'book_schedule'), array(&$me, 'printLinkMeta'),
						$type['slug'], 'normal', 'high', array($type));
			}
		}
	}

	/**
	 * Enqueues scripts and stylesheets used by Gallery Hierarchy in the admin
	 * pages.
	 */
	static function adminEnqueue() {
		static::enqueue();
		wp_enqueue_script('wpsettings', 
				plugins_url('/lib/wp-settings/js/wpsettings.min.js', dirname(__FILE__)));
		/// @todo @see http://codex.wordpress.org/I18n_for_WordPress_Developers
		wp_enqueue_script('book-schedule', 
				plugins_url('/js/bookschedule.js', dirname(__FILE__)));
		/*wp_enqueue_style( 'dashicons' );
		wp_enqueue_style('ghierarchy',
				plugins_url('/css/ghierarchy.min.css', dirname(__FILE__)), array('dashicons'));
		wp_enqueue_script('jquery-ui-multiselect', 
				plugins_url('/lib/jquery-ui-multiselect/src/jquery.multiselect.min.js', dirname(__FILE__)),
				array('jquery', 'jquery-ui-core'));
		wp_enqueue_script('jquery-ui-multiselect-filter', 
				plugins_url('/lib/jquery-ui-multiselect/src/jquery.multiselect.filter.min.js', dirname(__FILE__)),
				array('jquery', 'jquery-ui-core', 'jquery-ui-multiselect'));
		wp_enqueue_style('jquery-ui-multiselect',
				plugins_url('/lib/jquery-ui-multiselect/jquery.multiselect.css', dirname(__FILE__)));
		wp_enqueue_style('jquery-ui-multiselect-filter',
				plugins_url('/lib/jquery-ui-multiselect/jquery.multiselect.filter.css', dirname(__FILE__)));
		wp_enqueue_script('media-upload');
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
				plugins_url('/css/jquery-ui/jquery-ui.theme.min.css', dirname(__FILE__)));*/
	}

	/**
	 * Enqueues scripts and stylesheets used by Gallery Hierarchy.
	 */
	static function enqueue() {
		/*wp_enqueue_script('moment',
				plugins_url('/lib/moment/moment.min.js', dirname(__FILE__)), array('jquery'));
		wp_enqueue_script('fullcalendar',
				plugins_url('/lib/fullcalendar/dist/fullcalendar.js', dirname(__FILE__)), array('jquery', 'moment'));
		wp_enqueue_style('fullcalendar',
				plugins_url('lib/fullcalendar/dist/fullcalendar.css', dirname(__FILE__)));*/
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
		echo '<div id="message" class="error">' . $message . '</div>';
	}

	protected function checkFunctions() {
		/*if (!function_exists('finfo_file')) {
			$this->echoError(__('The required Fileinfo Extension is not installed. Please install it',
					'book_schedule'));
			$this->disable = true;
		}*/
	}

	/**
	 * Prints the timings metabox in the post edit view.
	 *
	 * @param $post Object The object of the item that is being edited
	 * @param $type array The item type information.
	 */
	function printTimingMeta($post, $type) {
		$id = uniqid();
		echo '<div id="' . $id . '"></div>';
		echo '<script type="text/javascript">'
				. '</script>';
	}

	/**
	 * Prints the costs metabox in the post edit view.
	 *
	 * @param $post Object The object of the item that is being edited.
	 * @param $type array The item type information.
	 */
	function printCostsMeta($post, $type) {
		$id = uniqid();
		echo '<div id="' . $id . '"></div>';
		echo '<a class="button" onclick="bS.costs.add(\'' . $id . '\')">'
				. __('Add Option', 'book_schedule') . '</a>';
		echo '<script type="text/javascript">'
				. 'bS.costs.init(\'' . $id . '\');'
				. '</script>';
	}

	/**
	 * Prints the linked booking metabox in the post edit view.
	 *
	 * @param $post Object The object of the item that is being edited.
	 * @param $type array The item type information.
	 */
	function printLinkMeta($post, $type) {
		$id = uniqid();
		echo '<div id="' . $id . '"></div>';
		echo '<a class="button" onclick="bS.bookingLink.add(\'' . $id . '\')">'
				. __('Add Linked Booking', 'book_schedule') . '</a>';
		echo '<script type="text/javascript">'
				. 'bS.bookingLink.init(\'' . $id . '\');'
				. '</script>';
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
		global $wpdb;

		$me = static::instance();

		$html = '';

		// Fill out the attributes with the default
		switch ($tag) {
			case 'ghimage':
				$classO = 'gh_image_class';
				$classAO = 'gh_image_class_append';
				$caption = 'gh_image_description';
				break;
			case 'ghthumb':
				$classO = 'gh_thumb_class';
				$classAO = 'gh_thumb_class_append';
				$caption = 'gh_thumb_description';
				break;
			case 'ghalbum':
				$classO = 'gh_album_class';
				$classAO = 'gh_album_class_append';
				$caption = 'gh_album_description';
				break;
		}

		// `id="<id1>,<id2>,..."` - list of photos (some sort of query or list)
		// (`ghalbum` `ghthumbnail` `ghimage`)
		$parts = explode(',', $atts['id']);
		$ids = array();
		$idP = array();
		$folders = array();
		$taken = array();
		$query = array();

		foreach ($parts as $p => &$part) {
			if (strpos($part, '=') !== false) {
				$like = false;
				$part = explode('=',$part);
				if (isset($part[1]) && $part[1]) {
					switch($part[0]) {
						case 'rfolder':
							$like = true;
						case 'folder':
							$fids = explode('|', $part[1]);
							// Make sure fids are only numbers
							$f = 0;
							while ($f < count($fids)) {
								if (!gHisInt($fids[$f])) {
									array_splice($fids, $f, 1);
								} else {
									$f++;
								}
							}
							if ($fids && ($result = $wpdb->get_col('SELECT dir FROM '
									. $me->dirTable . ' WHERE id IN (' . join(',', $fids)
									. ')'))) {
								$folders = array_merge($folders, $result);
							}
							break;
						case 'taken':
							if (strpos($part[1], '|') !== false) {
								$part[1] = explode('|', $part[1]);

							// Check the dates are valid
							}
							break;
						case 'tags':
							$query[$part[0]] = $me->parseLogic($part[1], $part[0]
									. ' REGEXP \'(,|^)%s(,|$)\'', true);
							break;
						case 'title':
						case 'comment':
							$query[$part[0]] = $me->parseLogic($part[1], $part[0]
									. ' = \'%s\'');
							break;
						default:
							// Ignore as not valid
							continue;
					}
				} else {
					continue;
				}
			} else {
				if (is_numeric($part)) {
					$ids[] = $part;
					$idP[] = $p + 1;
				}
			}
		}

		$w = array();

		// Build Ids
		if ($ids) {
			$w[] = 'id IN (' . join(', ', $ids) . ')';
		}

		// Build Folders
		if ($folders) {
			$q = array();
			foreach ($folders as &$f) {
				$q[] = 'file LIKE (\'' . preg_replace('/([%\\\'])/', '\\\1', $f)
						. DIRECTORY_SEPARATOR . '%\')';
			}
			$query['folders'] = join(' OR ', $q);
		}

		if ($query) {
			$w[] = '((' . join(') AND (', array_values($query)) . ')' 
			. (isset($atts['include_excluded']) && $atts['include_excluded']
			? ' AND excluded=0' : '') . ')';
		}
		$q = 'SELECT * FROM ' . $me->imageTable 
				. ($w ? ' WHERE ' . join(' OR ', $w) : '');
		$images = $wpdb->get_results($q, OBJECT_K);

		// Rebuild array if based on ids @todo Implement attribute for this
		// Determine position of specified images based on positional weighting
		if ($ids) {
			$weight = 0;
			foreach ($idP as $i) {
				$weight += $i;
			}

			$weight = $weight/count($ids);

			$idImages = array();

			foreach ($ids as $i) {
				$idImages[$i] = $images[$i];
				unset($images[$i]);
			}

			$newImages = array();
			if ($weight <= (count($parts)/2)) {
				$images = array_merge($idImages, $images);
				/** @todo Remove
				foreach ($idImages as &$i) {
					$newImages[] = $i;
				}
				foreach ($images as &$i) {
					$newImages[] = $i;
				}*/
			} else {
				$images = array_merge($images, $idImages);
				/** @todo Remove
				foreach ($images as &$i) {
					$newImages[] = $i;
				}
				foreach ($idImages as &$i) {
					$newImages[] = $i;
				}*/
			}
		}

		// `group="<group1>"` - id for linking photos to scroll through with
		// lightbox (`ghthumbnail` `ghimage`)
		if (!isset($atts['group'])
				&& static::$settings->get_option('gh_group')) {
			$atts['group'] = 'group';
		}

		// `class="<class1> <class2> ...` - additional classes to put on the images
		// (`ghthumbnail` `ghimage`)
		if (!isset($atts['class'])
				|| static::$settings->get_option($classAO)) {
			if (!isset($atts['class'])) {
				$atts['class'] = '';
			}

			$atts['class'] .= ' ' . static::$settings->get_option($classO);
		}

		// `caption="(none|title|comment)"` - Type of caption to show. Default set
		// in plugin options (`ghalbum` `ghthumbnail` `ghimage`)
		$captionMap = array(
				'ghalbum' => 'gh_album_description',
				'ghthumb' => 'gh_thumb_description',
				'ghimage' => 'gh_image_description'
		);
		if (!isset($atts['caption'])) {
			$atts['caption'] = static::$settings->get_option($captionMap[$tag]);
		}

		// add_title
		$atts['add_title'] = static::$settings->get_option('gh_add_title');

		// `popup_caption="(none|title|comment)"` - Type of caption to show on
		//	popup. Default set in plugin options (`ghalbum` `ghthumbnail`
		// `ghimage`)
		if (!isset($atts['popup_caption'])) {
			$atts['popup_caption'] =
					static::$settings->get_option('gh_popup_description');
		}
		
		// `link="(none|popup|<url>)"` - URL link on image, by default it will be
		// the image url and will cause a lightbox popup
		/// @todo Make it a setting?
		if (!isset($atts['link'])) {
			$atts['link'] = 'popup';
		}

		switch ($tag) {
			case 'ghimage':
				// `size="(<width>x<height>)"` - size of image (`ghimage`)
				if (isset($atts['size']) && $atts['size']) {
					$atts['size'] = explode('x', $atts['size']);
					if (count($atts['size']) == 2 && gHisInt($atts['size'][0])
							&& gHisInt($atts['size'][1])) {
						$atts['size'] = array('width' => $atts['size'][0],
								'height' => $atts['size'][1]);
					} else {
						$atts['size'] = false;
					}
				} else {
					$atts['size'] = false;
				}

				$html = $me->printImage($images, $atts);
				break;
			case 'ghthumb':
				$atts['type'] = static::$settings->get_option('gh_thumb_album');
			case 'ghalbum':
				// `type="<type1>"` - of album (`ghalbum`)
				// Check we have a valid album, if not, use the thumbnail one
				$albums = static::getAlbums();
				if (!isset($atts['type']) || !isset($albums[$atts['type']])) {
					$atts['type'] = static::$settings->get_option('gh_thumb_album');
				}

				if (isset($atts['type']) && isset($albums[$atts['type']])) {
					$html = $albums[$atts['type']]['class']::printAlbum($images, $atts);
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
