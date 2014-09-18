<?php

if (!class_exists('Currency')) {
	class CurrencyException extends Exception {
	}

	class Currency {
		protected static $me = null;
		protected static $storeFile;
		protected $data = null;
		protected static $apiUrl = 'http://www.freecurrencyconverterapi.com/api/v2/';

		protected function __construct() {
			static::$storeFile = plugin_dir_path(__FILE__) . 'currencies.json';
			if (is_file(static::$storeFile)) {
				if (!is_writable(static::$storeFile)) {
					throw new CurrencyException('Currency store file ('
							. static::$storeFile . ') is not writable');
				}

				$this->data = file_get_contents(static::$storeFile);
				$this->data = json_decode($this->data, true);

				// Roughly check data is valid
				if (isset($this->data['currenciesDate'])
						&& isset($this->data['currencies'])) {
					return;
				}
			} else {
				$dir = dirname(static::$storeFile);
				if (!is_dir($dir)) {
					throw new CurrencyException('Directory for currency store file ('
							. $dir . ') does not exist');
				}
				if (!is_writable($dir)) {
					throw new CurrencyException('Cannot write to directory ('
							. $dir . ') to store currency data');
				}
			}

			$this->data = array(
				'ratesUpdate' => 60*24,
				'base' => 'USD'
			);

			// Get the list of currencies
			if (($currencies = $this->curl('currencies'))
					&& isset($currencies['results'])) {
				$this->data['currencies'] = $currencies['results'];
				$this->data['currenciesDate'] = time();
			} else {
				echo 'get fail';
				$this->data = null;
				return;
			}
		}

		function __destruct() {
			if (!is_null($this->data)) {
				if (file_put_contents(static::$storeFile, json_encode($this->data)) === false) {
					// Failure
					throw new CurrencyException('Could not write to currency store file ('
							. static::$storeFile . ')');
				}
			}
		}

		protected function curl($query) {
			$url = static::$apiUrl . $query;

			$curl = curl_init();

			curl_setopt_array($curl, array(
					CURLOPT_HEADER => 0, 
					CURLOPT_URL => $url, 
					CURLOPT_FRESH_CONNECT => 1, 
					CURLOPT_RETURNTRANSFER => 1, 
					CURLOPT_FORBID_REUSE => 1, 
					CURLOPT_TIMEOUT => 4,
			));

			if(!$result = curl_exec($curl)) {
				return null;
			}

			if ($result = json_decode($result, true)) {
				return $result;
			} else {
				return null;
			}
		}

		protected static function &me() {
			if (!function_exists('curl_init')) {
				throw new CurrencyException('cURL does not seem to be installed');
			}
			
			if (is_null(static::$me)) {
				static::$me = new self();
			}

			return static::$me;
		}

		static function getCurrencies($full = false) {
			if (!($me = static::me()) || is_null($me->data)) {
				return null;
			}

			if ($full) { 
				return $me->data['currencies'];
			}

			if (isset($me->data['selectedCurrencies'])) {
				return $me->data['selectedCurrencies'];
			} else {
				return null;
			}
		}

		static function haveSelectedCurrencies() {
			if (!($me = static::me()) || is_null($me->data)) {
				return null;
			}

			if (isset($me->data['selectedCurrencies'])) {
				return true;
			} else {
				return false;
			}
		}

		protected function updateRates() {
			if (!isset($this->data['base'])
					|| !isset($this->data['selectedCurrencies'])) {
				if (isset($me->data['rates'])) {
					unset($me->data['rates']);
					unset($me->data['ratesDate']);
				}
				return false;
			}

			$query = array();

			$base =& $this->data['base'];

			foreach ($this->data['selectedCurrencies'] as $c => &$currency) {
				array_push($query, $base . '_' . $c);
			}

			$query = 'convert?q=' . join(',', $query);

			if (($result = $this->curl($query)) && isset($result['results'])) {
				$rates = array();

				foreach ($result['results'] as $c => &$rate) {
					$rates[$rate['to']] = $rate['val'];
				}
				
				$me->data['rates'] = $rates;
				$me->data['ratesDate'] = time();

				return true;
			}

			return false;
		}

		static function getRates($base = null) {
			if (!($me = static::me()) || is_null($me->data)) {
				return null;
			}

			if (!isset($me->data['selectedCurrencies'])) {
				return false;
			}

			// Check to see if the rates are up to date
			if (!isset($me->data['rates'])
					|| ($me->data['ratesDate'] + $me->data['ratesUpdate']) < time()) {
				if (!$me->updateRates()) {
					return false;
				}
			}

			if (is_null($base) || $me->data['base'] === $base) {
				return $me->data['rates'];
			} else {
				// Error if not a valid base rate
				if (!isset($me->data['rates'][$base])) {
					return false;
				}
				$baseRate = $me->data['rates'][$base];

				$rates = array();

				foreach ($me->data['rates'] as $c => $rate) {
					$rates[$c] = $rate * $baseRate;
				}

				return $rates;
			}
		}

		static function setBase($base) {
			if (!($me = static::me()) || is_null($me->data)) {
				return null;
			}

			if (!isset($me->data['currencies'][$base])) {
				return false;
			}

			$me->data['base'] = $base;

			return true;
		}

		static function getBase() {
			if (!($me = static::me()) || is_null($me->data)) {
				return null;
			}

			if (isset($me->data['base'])) {
				return $me->data['base'];
			}

			return false;
		}

		static function setUpdateRate($rate) {
			if (!($me = static::me()) || is_null($me->data)) {
				return null;
			}

			if (!($rate = intval($rate))) {
				throw new CurrencyException('Interval ' . $rate . ' not a number');
			}

			if ($rate < 30) {
				$me->data['ratesUpdate'] = 30;

				return false;
			}

			$me->data['ratesUpdate'] = $rate;

			return true;
		}

		static function setSelectedCurrencies(array $currencies, $throw = true) {
			if (!($me = static::me()) || is_null($me->data)) {
				return null;
			}

			if (count($currencies)) {
				$selectedCurrencies = array();

				// Check currencies are valid
				foreach ($currencies as $c) {
					if (!isset($me->data['currencies'][$c])) {
						if ($throw) {
							throw new CurrencyError('Currency ' . $c . ' unknown');
						}
					} else {
						$selectedCurrencies[$c] = $me->data['currencies'][$c];
					}
				}

				if (count($selectedCurrencies)) {
					$me->data['selectedCurrencies'] = $selectedCurrencies;

					// Get rates
					$me->updateRates();

					return true;
				}
			}

			if (isset($me->data['selectedCurrencies'])) {
				unset($me->data['selectedCurrencies']);
				unset($me->data['rates']);
			}
			
			return false;
		}

		static function updateCurrencies() {
			if (!($me = static::me()) || is_null($me->data)) {
				return null;
			}

			if ($currencies = $this->curl('currencies')
					&& isset($currencies['results'])) {
				$this->data['currencies'] = $currencies['results'];
				$this->data['currenciesDate'] = time();

				return true;
			}

			return false;
		}
	}
}
