# 🔧 How to Change MySQL Port in WAMP Server

## Current Status

✅ **Your config files are now set to use WAMP defaults:**
- **Port**: 3306 (default)
- **Password**: Empty/blank (default)

You can use your project right away with these settings!

---

## Option 1: Keep WAMP Default (RECOMMENDED) ✅

**No changes needed!** Your files are already configured correctly.

Just access your project:
```
http://localhost/uep_sports_management_geriane/vms_complete/test_connection.php
```

---

## Option 2: Change WAMP MySQL Port to 3308 (Optional)

If you specifically want to use port 3308, follow these steps:

### Step 1: Stop WAMP Services
1. **Left-click** WAMP icon in system tray
2. Click **"Stop All Services"**
3. Wait for icon to turn gray/white

### Step 2: Edit MySQL Configuration
1. **Left-click** WAMP icon
2. Hover over **MySQL**
3. Hover over **MySQL Settings** (or **my.ini**)
4. Click **my.ini** (this opens the MySQL config file in Notepad)

### Step 3: Change Port Number
1. **Find this line** (usually around line 27-30):
   ```ini
   port=3306
   ```

2. **Change it to**:
   ```ini
   port=3308
   ```

3. **Save the file** (Ctrl+S)
4. **Close Notepad**

### Step 4: Restart WAMP
1. **Left-click** WAMP icon
2. Click **"Start All Services"**
3. Wait for icon to turn **GREEN**

### Step 5: Update Your Config Files
After changing WAMP port to 3308, update your project files:

**File 1: `vms_complete/config/db.php`**
```php
$port = "3308"; // Changed from 3306 to 3308
```

**File 2: `vms_complete/config/config.php`**
```php
define('DB_PORT', '3308'); // Changed from 3306 to 3308
```

---

## ⚠️ Important Notes About Passwords

### WAMP Default Password
By default, WAMP MySQL root user has **NO PASSWORD** (empty string).

Your config is now set to empty password:
```php
$pass = ""; // Empty password
```

### If You Want to Set a Password

**Option A: Set Password in phpMyAdmin**
1. Open: `http://localhost/phpmyadmin/`
2. Click **User accounts** tab
3. Find **root@localhost**
4. Click **Edit privileges**
5. Click **Change password**
6. Enter your password: `garinbellyjoe2004`
7. Click **Go**

**Then update config files:**
```php
$pass = "garinbellyjoe2004"; // Your password
```

---

## 🧪 Test Your Connection

After making any changes, test the connection:

1. Open your browser
2. Go to: `http://localhost/uep_sports_management_geriane/vms_complete/test_connection.php`
3. You should see:
   - ✅ PDO MySQL Extension loaded
   - ✅ MySQL Connection successful
   - ✅ Database found
   - ✅ Required tables present

---

## 🔍 Check Current MySQL Port

Not sure what port MySQL is using? Check it:

### Method 1: WAMP Tools
1. Left-click WAMP icon
2. Go to **Tools** → **Check Service Port Used**
3. Look for MySQL port number

### Method 2: phpMyAdmin
1. Open: `http://localhost/phpmyadmin/`
2. Look at the top of the page
3. You'll see: "Server: localhost:XXXX" (XXXX is the port)

### Method 3: Check my.ini File
1. WAMP icon → MySQL → my.ini
2. Search for "port="
3. The number after "port=" is your MySQL port

---

## 📋 Quick Reference

| Configuration | Port 3306 (Default) | Port 3308 (Custom) |
|---------------|---------------------|---------------------|
| **WAMP Setting** | No change needed | Edit my.ini |
| **db.php** | `$port = "3306";` | `$port = "3308";` |
| **config.php** | `'3306'` | `'3308'` |
| **Common Use** | Standard WAMP | Multiple MySQL instances |

---

## ✅ Current Configuration Summary

**Your files are NOW configured for:**
- ✅ Port: **3306** (WAMP default)
- ✅ Password: **Empty** (WAMP default)
- ✅ Host: localhost
- ✅ User: root
- ✅ Database: uep_sports_management

**This should work immediately with a fresh WAMP installation!**

---

## 🚀 Next Steps

1. Make sure WAMP is running (GREEN icon)
2. Create database in phpMyAdmin
3. Import SQL file
4. Test connection
5. Access your website!

**Need help?** Check the `WAMP_SETUP_GUIDE.md` file for detailed instructions.
