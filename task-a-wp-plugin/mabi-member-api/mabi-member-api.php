<?php
/**
 * Plugin Name:  MABI Member API
 * Description:  REST endpoint за обобщени данни на член: GET /wp-json/mabi/v1/member/{user_id}.
 * Version:      1.0.0
 * Author:       Борислав Илиев
 * License:      GPL-2.0-or-later
 *
 * @package MABI_Member_API
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Без директен достъп.
}

/**
 * Регистрира REST route-а: GET /wp-json/mabi/v1/member/{user_id}.
 */
function mabi_member_api_register_routes() {
	register_rest_route(
		'mabi/v1',
		'/member/(?P<user_id>\d+)',
		array(
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => 'mabi_member_api_get_member',
			'permission_callback' => 'mabi_member_api_permission_check',
			'args'                => array(
				'user_id' => array(
					'validate_callback' => static function ( $param ) {
						return is_numeric( $param );
					},
				),
			),
		)
	);
}
add_action( 'rest_api_init', 'mabi_member_api_register_routes' );

/**
 * Достъп: нелогнат → 401; логнат, но чужд user_id и не е admin → 403.
 *
 * @param WP_REST_Request $request Заявката.
 * @return true|WP_Error
 */
function mabi_member_api_permission_check( WP_REST_Request $request ) {
	if ( ! is_user_logged_in() ) {
		return new WP_Error(
			'mabi_not_authenticated',
			'Необходима е автентикация.',
			array( 'status' => 401 )
		);
	}

	$requested_id = (int) $request['user_id'];

	// Admin (manage_options) вижда всички; останалите — само себе си.
	if ( get_current_user_id() !== $requested_id && ! current_user_can( 'manage_options' ) ) {
		return new WP_Error(
			'mabi_forbidden',
			'Нямате достъп до данните на този потребител.',
			array( 'status' => 403 )
		);
	}

	return true;
}

/**
 * Callback: връща данните за члена (или 404, ако не съществува).
 *
 * @param WP_REST_Request $request Заявката.
 * @return WP_REST_Response|WP_Error
 */
function mabi_member_api_get_member( WP_REST_Request $request ) {
	$user_id = (int) $request['user_id'];

	$user = get_userdata( $user_id );
	if ( ! $user ) {
		return new WP_Error(
			'mabi_user_not_found',
			'Потребител с този ID не съществува.',
			array( 'status' => 404 )
		);
	}

	// Бонус: кеширане с transient за 5 минути.
	$cache_key = 'mabi_member_' . $user_id;
	$cached    = get_transient( $cache_key );
	if ( false !== $cached ) {
		return rest_ensure_response( $cached );
	}

	$data = mabi_member_api_build_payload( $user );
	set_transient( $cache_key, $data, 5 * MINUTE_IN_SECONDS );

	return rest_ensure_response( $data );
}

/**
 * Сглобява JSON отговора. Полетата, които иначе изискват реална LMS логика,
 * са mock (usermeta с fallback стойност), както допуска заданието.
 *
 * @param WP_User $user Потребителят.
 * @return array
 */
function mabi_member_api_build_payload( WP_User $user ) {
	$registered  = strtotime( $user->user_registered );
	$days_member = (int) floor( ( time() - $registered ) / DAY_IN_SECONDS );

	return array(
		'user_id'            => (int) $user->ID,
		'display_name'       => $user->display_name,
		'membership_active'  => (bool) mabi_member_api_meta( $user->ID, 'mabi_membership_active', true ),
		'membership_level'   => (string) mabi_member_api_meta( $user->ID, 'mabi_membership_level', 'level_2' ),
		'membership_expires' => (string) mabi_member_api_meta( $user->ID, 'mabi_membership_expires', '2026-12-31' ),
		'courses_completed'  => (int) mabi_member_api_meta( $user->ID, 'mabi_courses_completed', 4 ),
		'courses_total'      => 8,
		'last_login'         => (string) mabi_member_api_meta( $user->ID, 'mabi_last_login', '2026-05-28T14:32:00' ),
		'days_member'        => $days_member,
	);
}

/**
 * Чете usermeta стойност с fallback default, ако липсва.
 *
 * @param int    $user_id ID на потребителя.
 * @param string $key     Meta ключ.
 * @param mixed  $default Стойност по подразбиране.
 * @return mixed
 */
function mabi_member_api_meta( $user_id, $key, $default ) {
	$value = get_user_meta( $user_id, $key, true );
	return ( '' === $value ) ? $default : $value;
}
