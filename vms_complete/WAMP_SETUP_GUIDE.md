# 🚀 WAMP Server Setup Guide
## UEP Sports Management System

This guide will help you set up and run the UEP Sports Management System on WAMP server with port 3308.

---

## 📋 Prerequisites

1. **WAMP Server** installed (Download from: https://www.wampserver.com/)
2. **Project files** in the correct directory
3. **MySQL** running on port **3308**

---

## 🔧 Step-by-Step Setup

### Step 1: Install WAMP Server

1. Download WAMP Server from https://www.wampserver.com/
2. Install it (default location: `C:\wamp64\` or `C:\wamp\`)
3. Launch WAMP Server
4. Wait for the icon to turn **GREEN** in the system tray (bottom right)

---

### Step 2: Move Project to WAMP Directory

1. **Copy** the `uep_sports_management_geriane` folder
2. **Paste** it into WAMP's `www` directory:
   ```
   C:\wamp64\www\
   ```
   OR
   ```
   C:\wamp\www\
   ```

3. Your project path should be:
   ```
   C:\wamp64\www\uep_sports_management_geriane\vms_complete\
   ```

---

### Step 3: Verify MySQL Port 3308

#### Option A: Check Current Port
1. Left-click the **WAMP icon** in system tray
2. Go to **Tools** → **Check Service Port Used**
3. Check if MySQL is using port **3308**

#### Option B: Change MySQL Port to 3308 (if needed)

1. Left-click **WAMP icon** → **MySQL** → **my.ini**
2. Find the line: `port=3306`
3. Change it to: `port=3308`
4. Save the file
5. **Restart WAMP** (Left-click icon → **Restart All Services**)

---

### Step 4: Configure Database Connection

Your database configuration is **already set to port 3308**! 

**Check** `vms_complete/config/db.php`:

```php
$host = "localhost";
$port = "3308";  // ✅ Already configured!
$dbname = "uep_sports_management";
$user = "root";
$pass = "garinbellyjoe2004";  // ⚠️ Change if needed
```

#### 🔐 IMPORTANT: Set MySQL Root Password

If you haven't set a password for MySQL root user, you need to either:

**Option A: Use Empty Password (Default WAMP)**
```php
$pass = "";  // Empty password (WAMP default)
```

**Option B: Set Password in WAMP**
1. Open phpMyAdmin: `http://localhost/phpmyadmin/`
2. Click **User accounts**
3. Click **Edit privileges** for `root@localhost`
4. Click **Change password**
5. Set password to: `garinbellyjoe2004` (or update config file with new password)

---

### Step 5: Import Database

1. **Start WAMP Server** (icon should be GREEN)

2. **Open phpMyAdmin**:
   ```
   http://localhost/phpmyadmin/
   ```
   OR if using port 3308:
   ```
   http://localhost:3308/phpmyadmin/
   ```

3. **Create Database**:
   - Click **New** in left sidebar
   - Database name: `uep_sports_management`
   - Collation: `utf8mb4_general_ci`
   - Click **Create**

4. **Import SQL File**:
   - Click on `uep_sports_management` database
   - Click **Import** tab at the top
   - Click **Choose File**
   - Select: `uep_sports_management_geriane\vms_complete\uep_sports_management (5).sql`
   - Click **Go** at the bottom
   - Wait for "Import has been successfully finished" message

---

### Step 6: Access Your Application

1. **Open your web browser** (Chrome, Firefox, Edge)

2. **Navigate to**:
   ```
   http://localhost/uep_sports_management_geriane/vms_complete/
   ```
   OR
   ```
   http://localhost/uep_sports_management_geriane/vms_complete/index.php
   ```

3. **You should see** the UEP Sports Management landing page with blue and gold design! 🎉

---

## 🔑 Default Login Credentials

After importing the database, you can log in with these default accounts:

### System Administrator
- **Username**: `admin` (check your database for actual username)
- **Password**: Check the database `tbl_users` table

### Finding Login Credentials
1. Open phpMyAdmin: `http://localhost/phpmyadmin/`
2. Select `uep_sports_management` database
3. Click on `tbl_users` table
4. View usernames and roles
5. Passwords are hashed - you may need to create a new admin account

---

## 🔧 Troubleshooting

### Problem 1: "Connection Failed" Error

**Solution**: Check database credentials
1. Open `vms_complete/config/db.php`
2. Verify:
   - Port is `3308`
   - Username is `root`
   - Password matches your MySQL root password (default is empty `""`)

### Problem 2: WAMP Icon is Orange/Yellow

**Solution**: 
- Port conflict - Another program is using port 80 or 3308
- Check if Skype, IIS, or other services are running
- Change Apache port to 8080 or stop conflicting services

### Problem 3: "Database not found" Error

**Solution**: Import the database
1. Make sure you created the database in phpMyAdmin
2. Import the SQL file: `uep_sports_management (5).sql`

### Problem 4: "404 Not Found" Error

**Solution**: Check your URL and file path
- Correct URL: `http://localhost/uep_sports_management_geriane/vms_complete/`
- Make sure files are in: `C:\wamp64\www\uep_sports_management_geriane\`

### Problem 5: CSS/Styles Not Loading

**Solution**: Check BASE_URL in config
1. Open `vms_complete/config/config.php`
2. Verify: `define('BASE_URL', '/uep_sports_management_geriane/vms_complete');`
3. The path should match your actual folder structure

### Problem 6: Cannot Access phpMyAdmin

**Solution**: Use correct port
- If MySQL is on port 3308, phpMyAdmin might need port in URL
- Try: `http://localhost/phpmyadmin/`
- Or check WAMP settings for phpMyAdmin port

---

## ⚙️ WAMP Configuration Summary

| Component | Port | Default Access |
|-----------|------|----------------|
| **Apache** | 80 | http://localhost/ |
| **MySQL** | 3308 | Internal only |
| **phpMyAdmin** | 80 | http://localhost/phpmyadmin/ |
| **Your Project** | 80 | http://localhost/uep_sports_management_geriane/vms_complete/ |

---

## 📁 Project Structure in WAMP

```
C:\wamp64\www\
└── uep_sports_management_geriane\
    └── vms_complete\
        ├── assets\
        │   ├── css\
        │   │   └── uep-theme.css
        │   └── images\
        ├── athlete\
        ├── auth\
        │   └── login.php
        ├── coach\
        ├── config\
        │   ├── config.php
        │   ├── db.php
        │   └── session_config.php
        ├── index.php
        ├── system_administrator\
        ├── tournament_manager\
        └── [other folders...]
```

---

## 🎯 Quick Start Checklist

- [ ] WAMP installed and running (GREEN icon)
- [ ] MySQL port set to 3308
- [ ] Project files in `C:\wamp64\www\uep_sports_management_geriane\`
- [ ] Database `uep_sports_management` created
- [ ] SQL file imported successfully
- [ ] Database password configured correctly in `db.php`
- [ ] Accessed website: `http://localhost/uep_sports_management_geriane/vms_complete/`
- [ ] Login page loads with blue/gold design
- [ ] Successfully logged in

---

## 🎨 Verify Design Theme

After accessing the website, you should see:

✅ **Landing Page**
- Blue and gold header
- Blue gradient hero section with UEP logo colors
- Gold "Login" button
- Professional blue cards with hover effects

✅ **Login Page**
- Animated blue gradient background
- White card with gold border
- Gold login button
- Professional, clean design

✅ **Dashboard** (after login)
- Blue gradient sidebar
- Gold accents throughout
- Modern, professional appearance
- UEP branding colors

---

## 💡 Tips

1. **Always start WAMP** before accessing the website
2. **Green icon** = All services running correctly
3. **Check phpMyAdmin** to verify database structure
4. **Use localhost** not 127.0.0.1 in configuration
5. **Clear browser cache** if CSS changes don't appear

---

## 🆘 Need Help?

If you encounter issues:

1. Check WAMP Apache and MySQL logs:
   - WAMP icon → Apache → Apache error log
   - WAMP icon → MySQL → MySQL log

2. Verify PHP version compatibility:
   - Project requires PHP 7.4 or higher
   - WAMP icon → PHP → Version (select 7.4 or higher)

3. Test database connection separately:
   - Create a test file: `test_db.php`
   ```php
   <?php
   $pdo = new PDO("mysql:host=localhost;port=3308;dbname=uep_sports_management", "root", "garinbellyjoe2004");
   echo "Connected successfully!";
   ?>
   ```

---

## ✅ Success!

Once everything is set up correctly, you should be able to:
- Access the professional blue/gold landing page
- Log in through the redesigned login page
- Use all dashboard features with the new UEP theme
- Enjoy a clean, user-friendly, professional sports management system!

**Happy Managing! 🏆**
