<?php

/**
 * Plugin Name: Book and Schedule
 * Plugin URI: http://www.weldce.com/book-schedule
 * Description: Plugin to allow users to book and schedule events
 * Author: Weld Computer Engineering
 * Author URI: http://www.weldce.com
 * Version: 0.0.1
 */

if (!class_exists('BookSchedule')) {
	require_once('lib/BookSchedule.php');

	function bookScheduleSetup() {
		// Include so we have access to is_plugin_active
		//if (!is_admin()) {
			require_once( ABSPATH . 'wp-admin/includes/plugin.php');
		//}

		if (is_plugin_active('book-schedule/book-schedule.php')) {
			BookSchedule::checkVersion();
			// Shortcodes
			//add_shortcode('ghalbum', array('BookSchedule', 'doShortcode'));

			add_action('wp_enqueue_scripts', array('BookSchedule', 'enqueue'));
			add_action('admin_enqueue_scripts', array('BookSchedule', 'adminEnqueue'));

			add_action('wp_head', array('BookSchedule', 'head'));
			add_action('admin_head', array('BookSchedule', 'head'));

			add_action('get_footer', array('BookSchedule', 'printBookingPopup'));

			// Handle AJAX requests (from bookings)
			add_action('wp_ajax_bs_add', array('BookSchedule', 'ajaxAdd'));
			add_action('wp_ajax_nopriv_bs_add', array('BookSchedule', 'ajaxAdd'));

			add_action('init', array('BookSchedule', 'registerPostTypes'));
			add_action('init', array('BookSchedule', 'checkCookie'));
			if (is_admin()) {
				// Initialise
				add_action('init', array('BookSchedule', 'adminInit'));
				add_action('add_meta_boxes', array('BookSchedule',
						'registerMetaboxes'));
				add_action('save_post', array('BookSchedule', 'saveMetaboxes'));
			}
		}
	}

	// Add links to plugin meta
	add_filter( 'plugin_row_meta', array('BookSchedule', 'pluginMeta'), 10, 2);

	add_action('plugins_loaded', 'bookScheduleSetup');

	// Action for rescan job
	//add_action('gh_rescan', array('BookSchedule', 'scan'));

	/// @todo Add a hook for plugin deletion
	//register_activation_hook(__FILE__, array('BookSchedule', 'install'));
}
