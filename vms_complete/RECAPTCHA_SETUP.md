# 🔒 Google reCAPTCHA Setup Guide
## UEP Sports Management System

This guide will help you set up Google reCAPTCHA v2 for your login system to protect against automated attacks and spam.

---

## 📋 What is reCAPTCHA?

Google reCAPTCHA is a free service that protects your website from spam and abuse. It uses advanced risk analysis to distinguish humans from bots.

**Benefits:**
- ✅ Prevents automated login attempts
- ✅ Protects against brute force attacks
- ✅ Blocks spam and bots
- ✅ Free to use
- ✅ Easy to implement

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Get Your reCAPTCHA Keys

1. **Visit Google reCAPTCHA Admin Console:**
   ```
   https://www.google.com/recaptcha/admin/create
   ```

2. **Sign in** with your Google account

3. **Register a new site:**
   - **Label**: Enter a name (e.g., "UEP Sports Management")
   - **reCAPTCHA type**: Select **"reCAPTCHA v2"** → **"I'm not a robot" Checkbox**
   - **Domains**: Add your domains:
     - `localhost` (for local testing)
     - `yourdomain.com` (for production)
     - `www.yourdomain.com` (if using www)
   - **Accept** the reCAPTCHA Terms of Service
   - Click **Submit**

4. **Copy Your Keys:**
   - **Site Key** (Public Key) - Used in HTML
   - **Secret Key** (Private Key) - Used for server verification
   - ⚠️ **Keep these keys secure!**

---

### Step 2: Configure Your Application

1. **Open the reCAPTCHA config file:**
   ```
   vms_complete/config/recaptcha.php
   ```

2. **Update the keys:**
   ```php
   define('RECAPTCHA_SITE_KEY', 'YOUR_SITE_KEY_HERE');
   define('RECAPTCHA_SECRET_KEY', 'YOUR_SECRET_KEY_HERE');
   ```

3. **Save the file**

---

### Step 3: Test Your Setup

1. **Visit your login page:**
   ```
   http://localhost/uep_sports_management_geriane/vms_complete/auth/login.php
   ```

2. **You should see:**
   - ✅ A reCAPTCHA checkbox below the password field
   - ✅ "I'm not a robot" checkbox

3. **Test login:**
   - Enter username and password
   - Check the reCAPTCHA box
   - Click Login
   - ✅ Login should work normally

---

## 🧪 Testing with Google's Test Keys

For **local development and testing**, Google provides test keys that always pass:

**Test Site Key:**
```
6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
```

**Test Secret Key:**
```
6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe
```

⚠️ **Note:** These test keys are already configured in your `recaptcha.php` file. They work for testing but should be replaced with your own keys before going to production.

---

## ⚙️ Configuration Options

### Enable/Disable reCAPTCHA

In `config/recaptcha.php`, you can temporarily disable reCAPTCHA:

```php
define('RECAPTCHA_ENABLED', false); // Disable reCAPTCHA
```

This is useful for:
- Testing without reCAPTCHA
- Troubleshooting login issues
- Development environments

---

## 🔧 Troubleshooting

### Problem 1: reCAPTCHA Not Showing

**Possible Causes:**
- JavaScript is disabled
- Internet connection issue (reCAPTCHA needs Google's servers)
- Site key is incorrect

**Solutions:**
1. Check browser console for errors (F12)
2. Verify Site Key in `config/recaptcha.php`
3. Ensure you have internet connection
4. Check if domain matches the one registered in Google reCAPTCHA

---

### Problem 2: "reCAPTCHA verification failed"

**Possible Causes:**
- Secret Key is incorrect
- Domain mismatch
- Network timeout

**Solutions:**
1. Verify Secret Key in `config/recaptcha.php`
2. Check that your domain is registered in Google reCAPTCHA admin
3. Check server error logs for detailed error messages
4. Ensure PHP cURL extension is enabled

---

### Problem 3: Login Works Without Checking reCAPTCHA

**Check:**
1. Is `RECAPTCHA_ENABLED` set to `true`?
2. Is the reCAPTCHA widget visible on the form?
3. Check browser console for JavaScript errors

---

## 📁 Files Modified

The following files have been updated to support reCAPTCHA:

1. **`config/recaptcha.php`** - Configuration and verification function
2. **`auth/login.php`** - Login form with reCAPTCHA widget and verification

---

## 🔐 Security Best Practices

1. **Keep Secret Key Private:**
   - Never commit Secret Key to public repositories
   - Store in environment variables for production
   - Use different keys for development and production

2. **Domain Restrictions:**
   - Only add trusted domains in Google reCAPTCHA admin
   - Remove test domains before production

3. **Monitor Usage:**
   - Check Google reCAPTCHA admin dashboard regularly
   - Review failed verification attempts
   - Set up alerts for suspicious activity

4. **Regular Updates:**
   - Keep reCAPTCHA library updated
   - Review Google's security updates

---

## 📊 How It Works

1. **User visits login page:**
   - reCAPTCHA widget loads from Google's servers
   - Widget displays "I'm not a robot" checkbox

2. **User submits form:**
   - User checks the reCAPTCHA box
   - Google generates a response token
   - Token is sent with form data

3. **Server verification:**
   - Server receives the token
   - Sends token to Google's verification API
   - Google verifies the token and responds
   - Server allows or denies login based on verification

---

## 🌐 Production Deployment

Before deploying to production:

1. ✅ **Create production reCAPTCHA keys** (separate from test keys)
2. ✅ **Add your production domain** to Google reCAPTCHA admin
3. ✅ **Update `recaptcha.php`** with production keys
4. ✅ **Test thoroughly** on production domain
5. ✅ **Monitor** reCAPTCHA analytics in Google admin

---

## 📞 Support

If you encounter issues:

1. Check Google reCAPTCHA documentation:
   ```
   https://developers.google.com/recaptcha/docs/display
   ```

2. Review server error logs:
   ```
   C:\wamp64\logs\apache_error.log
   ```

3. Check PHP error logs:
   ```
   C:\wamp64\logs\php_error.log
   ```

---

## ✅ Checklist

- [ ] Created Google reCAPTCHA account
- [ ] Registered site in Google reCAPTCHA admin
- [ ] Added domains (localhost + production domain)
- [ ] Copied Site Key and Secret Key
- [ ] Updated `config/recaptcha.php` with keys
- [ ] Tested login with reCAPTCHA
- [ ] Verified reCAPTCHA widget appears
- [ ] Confirmed login works after checking reCAPTCHA
- [ ] Tested error handling (login without checking reCAPTCHA)
- [ ] Ready for production deployment

---

**🎉 Congratulations!** Your login system is now protected with Google reCAPTCHA!

For questions or issues, refer to the troubleshooting section above or check Google's official documentation.
