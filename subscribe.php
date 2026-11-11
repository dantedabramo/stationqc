<?php
/**
 * StationQC TestFlight beta sign-up.
 *
 * Emails each request (full name + email) to TO_EMAIL and keeps a copy in a CSV file,
 * so a sign-up is never lost if email delivery fails.
 *
 * Requirements: a host that runs PHP 7.0 or newer (tested on PHP 8.4).
 * Static hosts such as GitHub Pages cannot run this file.
 *
 * Health check: open subscribe.php?check=1 in a browser to see whether email and storage work.
 */

const TO_EMAIL     = 'dantesprograms@gmail.com';
const MAX_PER_HOUR = 5;     // requests per connection per hour
const MIN_SECONDS  = 2.5;   // faster than this after the page loaded is a bot

// Never let a notice or warning leak into the response: it would break the JSON the page reads.
ini_set('display_errors', '0');
error_reporting(E_ALL);
ob_start();

$wantsJson = isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false;

function respond($ok, $error = '', $status = 200, $extra = array())
{
    global $wantsJson;
    while (ob_get_level() > 0) {
        ob_end_clean();
    }
    if (!headers_sent()) {
        header('X-Content-Type-Options: nosniff');
        header('Referrer-Policy: same-origin');
        header('Cache-Control: no-store');
    }
    if ($wantsJson) {
        if (!headers_sent()) {
            http_response_code($status);
            header('Content-Type: application/json; charset=utf-8');
        }
        $body = $ok ? array('ok' => true) : array('ok' => false, 'error' => $error);
        echo json_encode(array_merge($body, $extra));
    } elseif (!headers_sent()) {
        // Works without JavaScript: return to the form with the result.
        header('Location: index.html?beta=' . ($ok ? 'ok' : rawurlencode($error)) . '#beta', true, 303);
    }
    exit;
}

function clean_text($value, $max)
{
    $value = is_string($value) ? $value : '';
    $value = preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $value); // removes CR/LF, so no header injection
    if ($value === null) {
        return '';
    }
    $value = trim((string) preg_replace('/\s+/u', ' ', $value));
    return function_exists('mb_substr') ? mb_substr($value, 0, $max, 'UTF-8') : substr($value, 0, $max);
}

function text_length($value)
{
    return function_exists('mb_strlen') ? mb_strlen($value, 'UTF-8') : strlen($value);
}

function csv_cell($value)
{
    // Stops spreadsheet apps from running a value as a formula.
    return preg_match('/^[=+\-@\t\r]/', $value) ? "'" . $value : $value;
}

function storage_dir()
{
    // Private storage: outside the public folder when the host allows it.
    $dir = dirname(__DIR__) . '/stationqc-private';
    if (!is_dir($dir)) {
        @mkdir($dir, 0750, true);
    }
    if (!is_dir($dir) || !is_writable($dir)) {
        $dir = __DIR__ . '/data'; // protected by data/.htaccess on Apache
        if (!is_dir($dir)) {
            @mkdir($dir, 0750, true);
        }
    }
    return (is_dir($dir) && is_writable($dir)) ? $dir : '';
}

function can_mail()
{
    $disabled = array_map('trim', explode(',', (string) ini_get('disable_functions')));
    return function_exists('mail') && !in_array('mail', $disabled, true);
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET' && isset($_GET['check'])) {
    $wantsJson = true;
    respond(true, '', 200, array(
        'php'     => PHP_VERSION,
        'mail'    => can_mail(),
        'storage' => storage_dir() !== '',
    ));
}

if ($method !== 'POST') {
    if (!headers_sent()) {
        header('Allow: POST');
    }
    respond(false, 'method', 405);
}

// Only accept posts from this site when the browser says where they came from.
$host = preg_replace('/:\d+$/', '', (string) ($_SERVER['HTTP_HOST'] ?? ''));
foreach (array('HTTP_ORIGIN', 'HTTP_REFERER') as $header) {
    if (!empty($_SERVER[$header])) {
        $from = parse_url((string) $_SERVER[$header], PHP_URL_HOST);
        if ($from && $host !== '' && strcasecmp($from, $host) !== 0) {
            respond(false, 'origin', 403);
        }
        break;
    }
}

// Bots fill the hidden field or submit instantly. Pretend it worked so they move on.
if (!empty($_POST['website'])) {
    respond(true);
}
$shownAt = isset($_POST['t']) ? (float) $_POST['t'] : 0.0;
if ($shownAt > 0 && (microtime(true) * 1000 - $shownAt) < MIN_SECONDS * 1000) {
    respond(true);
}

$name  = clean_text($_POST['name'] ?? '', 120);
$email = clean_text($_POST['email'] ?? '', 190);
$lang  = (($_POST['lang'] ?? 'en') === 'fr') ? 'fr' : 'en';

if (text_length($name) < 2) {
    respond(false, 'name', 422);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(false, 'email', 422);
}

$dir = storage_dir();

// Rate limit by a hash of the IP address.
if ($dir !== '') {
    $now = time();
    $rateHandle = @fopen($dir . '/rate.json', 'c+');
    if ($rateHandle) {
        flock($rateHandle, LOCK_EX);
        $raw = stream_get_contents($rateHandle);
        $rates = $raw ? json_decode($raw, true) : array();
        if (!is_array($rates)) {
            $rates = array();
        }
        $key = hash('sha256', (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
        $recent = array();
        foreach ((isset($rates[$key]) && is_array($rates[$key])) ? $rates[$key] : array() as $stamp) {
            if ((int) $stamp > $now - 3600) {
                $recent[] = (int) $stamp;
            }
        }
        if (count($recent) >= MAX_PER_HOUR) {
            flock($rateHandle, LOCK_UN);
            fclose($rateHandle);
            respond(false, 'rate', 429);
        }
        foreach ($rates as $k => $list) {
            if (!is_array($list) || !$list || max($list) < $now - 3600) {
                unset($rates[$k]);
            }
        }
        $recent[] = $now;
        $rates[$key] = $recent;
        ftruncate($rateHandle, 0);
        rewind($rateHandle);
        fwrite($rateHandle, json_encode($rates));
        fflush($rateHandle);
        flock($rateHandle, LOCK_UN);
        fclose($rateHandle);
    }
}

// Keep a copy of every sign-up.
$saved = false;
if ($dir !== '') {
    $csvPath = $dir . '/beta-signups.csv';
    $isNew = !file_exists($csvPath);
    $csv = @fopen($csvPath, 'a');
    if ($csv) {
        flock($csv, LOCK_EX);
        // All five arguments: PHP 8.4 warns when the escape character is left to its default.
        if ($isNew) {
            fputcsv($csv, array('date_utc', 'full_name', 'email', 'language'), ',', '"', '\\');
        }
        fputcsv($csv, array(gmdate('Y-m-d H:i:s'), csv_cell($name), csv_cell($email), $lang), ',', '"', '\\');
        flock($csv, LOCK_UN);
        fclose($csv);
        $saved = true;
    }
}

// Email the request.
$sent = false;
if (can_mail()) {
    $domain = preg_replace('/[^a-z0-9.\-]/i', '', $host);
    if ($domain === '' || $domain === null) {
        $domain = 'localhost';
    }
    $subject = 'StationQC beta sign-up: ' . $name;
    $subject = function_exists('mb_encode_mimeheader')
        ? mb_encode_mimeheader($subject, 'UTF-8', 'B', "\r\n")
        : '=?UTF-8?B?' . base64_encode($subject) . '?=';
    $body = "New TestFlight beta request\n\n"
        . "Full name: " . $name . "\n"
        . "Email: " . $email . "\n"
        . "Language: " . strtoupper($lang) . "\n"
        . "Date: " . gmdate('Y-m-d H:i') . " UTC\n\n"
        . "To invite: App Store Connect > TestFlight > External Testing > add this email.\n";
    $headers = implode("\r\n", array(
        'From: StationQC <no-reply@' . $domain . '>',
        'Reply-To: ' . $email,
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
    ));
    $sent = (bool) @mail(TO_EMAIL, $subject, $body, $headers);
}

if (!$sent && !$saved) {
    respond(false, 'server', 500);
}
respond(true);
