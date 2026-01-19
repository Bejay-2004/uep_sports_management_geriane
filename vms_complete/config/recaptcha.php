<?php
// config/recaptcha.php - Google reCAPTCHA Configuration

// ==========================================
// GOOGLE reCAPTCHA v2 CONFIGURATION
// ==========================================
// 
// To get your reCAPTCHA keys:
// 1. Go to https://www.google.com/recaptcha/admin/create
// 2. Register a new site
// 3. Choose "reCAPTCHA v2" → "I'm not a robot" Checkbox
// 4. Add your domain (e.g., localhost, yourdomain.com)
// 5. Copy the Site Key and Secret Key below
//
// For localhost testing, you can use:
// - Site Key: 6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI (Google's test key)
// - Secret Key: 6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe (Google's test key)
//
// ⚠️ IMPORTANT: Replace these with your own keys before production!

define('RECAPTCHA_SITE_KEY', '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'); // Your Site Key
define('RECAPTCHA_SECRET_KEY', '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe'); // Your Secret Key
define('RECAPTCHA_ENABLED', true); // Set to false to disable reCAPTCHA temporarily

// reCAPTCHA API endpoint
define('RECAPTCHA_VERIFY_URL', 'https://www.google.com/recaptcha/api/siteverify');

/**
 * Verify reCAPTCHA response
 * 
 * @param string $recaptcha_response The g-recaptcha-response token from the form
 * @param string $remote_ip Optional: User's IP address
 * @return array ['success' => bool, 'error' => string|null]
 */
function verify_recaptcha($recaptcha_response, $remote_ip = null) {
    // If reCAPTCHA is disabled, skip verification
    if (!RECAPTCHA_ENABLED) {
        return ['success' => true, 'error' => null];
    }
    
    // If no response token provided, fail
    if (empty($recaptcha_response)) {
        return ['success' => false, 'error' => 'reCAPTCHA verification failed. Please complete the reCAPTCHA challenge.'];
    }
    
    // Get user's IP if not provided
    if ($remote_ip === null) {
        $remote_ip = $_SERVER['REMOTE_ADDR'] ?? '';
    }
    
    // Prepare POST data
    $post_data = [
        'secret' => RECAPTCHA_SECRET_KEY,
        'response' => $recaptcha_response,
        'remoteip' => $remote_ip
    ];
    
    // Initialize cURL
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, RECAPTCHA_VERIFY_URL);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($post_data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    
    // Execute request
    $response = curl_exec($ch);
    $curl_error = curl_error($ch);
    curl_close($ch);
    
    // Handle cURL errors
    if ($curl_error) {
        error_log("reCAPTCHA cURL Error: " . $curl_error);
        return ['success' => false, 'error' => 'Unable to verify reCAPTCHA. Please try again.'];
    }
    
    // Parse JSON response
    $result = json_decode($response, true);
    
    // Check if verification was successful
    if (isset($result['success']) && $result['success'] === true) {
        return ['success' => true, 'error' => null];
    } else {
        $error_codes = $result['error-codes'] ?? ['unknown-error'];
        error_log("reCAPTCHA Verification Failed: " . implode(', ', $error_codes));
        return ['success' => false, 'error' => 'reCAPTCHA verification failed. Please try again.'];
    }
}
