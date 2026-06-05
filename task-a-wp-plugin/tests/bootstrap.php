<?php
/**
 * PHPUnit bootstrap — зарежда WordPress тестовата среда и плъгина.
 *
 * @package MABI_Member_API
 */

$_tests_dir = getenv( 'WP_TESTS_DIR' );
if ( ! $_tests_dir ) {
	$_tests_dir = rtrim( sys_get_temp_dir(), '/\\' ) . '/wordpress-tests-lib';
}

require_once $_tests_dir . '/includes/functions.php';

/**
 * Зарежда плъгина ръчно преди тестовете.
 */
function _manually_load_plugin() {
	require dirname( __DIR__ ) . '/mabi-member-api/mabi-member-api.php';
}
tests_add_filter( 'muplugins_loaded', '_manually_load_plugin' );

require $_tests_dir . '/includes/bootstrap.php';
