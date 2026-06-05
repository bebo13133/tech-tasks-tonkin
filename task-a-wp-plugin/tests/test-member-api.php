<?php
/**
 * Тестове за MABI Member API endpoint-а.
 *
 * @package MABI_Member_API
 */

class Test_MABI_Member_API extends WP_UnitTestCase {

	/**
	 * Инициализира REST сървъра и регистрира route-ите преди всеки тест.
	 */
	public function set_up() {
		parent::set_up();

		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		do_action( 'rest_api_init' );
	}

	/**
	 * Нелогнат потребител получава 401.
	 */
	public function test_unauthenticated_returns_401() {
		$user_id = self::factory()->user->create();
		wp_set_current_user( 0 );

		$response = rest_get_server()->dispatch(
			new WP_REST_Request( 'GET', '/mabi/v1/member/' . $user_id )
		);

		$this->assertSame( 401, $response->get_status() );
	}

	/**
	 * Логнат потребител получава своите данни (200) с очакваните полета.
	 */
	public function test_user_gets_own_data() {
		$user_id = self::factory()->user->create( array( 'role' => 'subscriber' ) );
		wp_set_current_user( $user_id );

		$response = rest_get_server()->dispatch(
			new WP_REST_Request( 'GET', '/mabi/v1/member/' . $user_id )
		);
		$data = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( $user_id, $data['user_id'] );
		$this->assertSame( 8, $data['courses_total'] );
		$this->assertArrayHasKey( 'membership_active', $data );
	}

	/**
	 * Не-admin, който иска чужди данни, получава 403.
	 */
	public function test_other_users_data_forbidden() {
		$owner    = self::factory()->user->create( array( 'role' => 'subscriber' ) );
		$attacker = self::factory()->user->create( array( 'role' => 'subscriber' ) );
		wp_set_current_user( $attacker );

		$response = rest_get_server()->dispatch(
			new WP_REST_Request( 'GET', '/mabi/v1/member/' . $owner )
		);

		$this->assertSame( 403, $response->get_status() );
	}

	/**
	 * Несъществуващ потребител връща 404.
	 */
	public function test_nonexistent_user_returns_404() {
		$admin = self::factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $admin );

		$response = rest_get_server()->dispatch(
			new WP_REST_Request( 'GET', '/mabi/v1/member/999999' )
		);

		$this->assertSame( 404, $response->get_status() );
	}
}
