# 🔧 Change WAMP MySQL Port from 3306 to 3308

## Why Port 3308?
You're using **XAMPP on port 3306**, so WAMP needs to use a different port (3308) to avoid conflicts.

---

## ✅ Your Config Files Are Ready!

Your project files are **already configured for port 3308**:
- ✅ `vms_complete/config/db.php` - Set to port 3308
- ✅ `vms_complete/config/config.php` - Set to port 3308
- ✅ `vms_complete/test_connection.php` - Set to port 3308

**Now you just need to change WAMP's MySQL port to match!**

---

## 📋 Step-by-Step Instructions

### Step 1: Stop All WAMP Services ⏹️

1. **Left-click** the WAMP icon in your system tray (bottom-right corner)
2. Click **"Stop All Services"**
3. Wait for the icon to turn **white/gray**

![WAMP Icon Location](System Tray → Bottom Right)

---

### Step 2: Open MySQL Configuration File 📝

1. **Left-click** the WAMP icon again
2. Hover over **"MySQL"**
3. Hover over **"MySQL 8.x.x"** (or your MySQL version)
4. Click **"my.ini"**

**This will open the MySQL configuration file in Notepad**

```
WAMP Icon → MySQL → MySQL 8.x.x → my.ini
```

---

### Step 3: Find and Change the Port Number 🔍

In the Notepad window that opened:

1. **Press Ctrl+F** to open Find dialog
2. Type: `port=` and press Enter
3. **Look for these lines** (usually around line 27-30):

```ini
[mysqld]
port=3306
```

4. **Change `3306` to `3308`**:

```ini
[mysqld]
port=3308
```

5. **Find the second occurrence** (usually around line 54-60):

```ini
[client]
port=3306
```

6. **Change this one too**:

```ini
[client]
port=3308
```

**Important:** Change BOTH occurrences of port numbers!

---

### Step 4: Save the File 💾

1. **Press Ctrl+S** to save
2. **Close Notepad**

---

### Step 5: Restart WAMP Services 🔄

1. **Left-click** WAMP icon
2. Click **"Start All Services"**
3. Wait for icon to turn **GREEN** ✅

**If icon turns orange/yellow:**
- WAMP is partially working
- Click WAMP icon → "Restart All Services"
- Wait for it to turn green

---

### Step 6: Verify Port Change ✅

#### Method 1: Check in WAMP Tools
1. Left-click WAMP icon
2. Go to **Tools** → **Check Service Port Used**
3. Look for **MySQL port: 3308** ✅

#### Method 2: Check in phpMyAdmin
1. Open: `http://localhost/phpmyadmin/`
2. Look at the server info at the top
3. Should show: **Server: localhost via TCP/IP** and somewhere mention port 3308

---

## 🧪 Test Your Connection

Now test if everything works:

1. Open your browser
2. Go to: 
   ```
   http://localhost/uep_sports_management_geriane/vms_complete/test_connection.php
   ```

3. You should see:
   - ✅ **PDO MySQL Extension** - Loaded
   - ✅ **MySQL Connection** - Connected on port 3308
   - ✅ **Database Found** - uep_sports_management exists
   - ✅ **Required Tables** - All tables present

---

## ⚠️ Troubleshooting

### Problem: WAMP won't start (stays red/orange)

**Possible Cause:** Port 3308 is already in use

**Solution 1: Check if something is using port 3308**
1. Open Command Prompt (Win+R, type `cmd`, press Enter)
2. Type: `netstat -ano | findstr :3308`
3. If you see any results, another program is using port 3308

**Solution 2: Try a different port**
- Use port 3309 or 3310 instead
- Update the config files to match:
  - `vms_complete/config/db.php`
  - `vms_complete/config/config.php`
  - `vms_complete/test_connection.php`

### Problem: Can't connect to MySQL after port change

**Solution:** Double-check you changed BOTH port numbers in my.ini:
- One under `[mysqld]` section
- One under `[client]` section

### Problem: phpMyAdmin doesn't work

**Solution:** Edit phpMyAdmin config
1. WAMP icon → phpMyAdmin → config.inc.php
2. Find line: `$cfg['Servers'][$i]['port'] = '3306';`
3. Change to: `$cfg['Servers'][$i]['port'] = '3308';`
4. Save and restart WAMP

---

## 📊 Configuration Summary

### Before Change:
| Service | Port |
|---------|------|
| XAMPP MySQL | 3306 ✅ |
| WAMP MySQL | 3306 ❌ CONFLICT! |

### After Change:
| Service | Port |
|---------|------|
| XAMPP MySQL | 3306 ✅ |
| WAMP MySQL | 3308 ✅ NO CONFLICT! |

---

## ✅ Quick Checklist

- [ ] Stop WAMP services
- [ ] Open my.ini file
- [ ] Change port 3306 → 3308 (BOTH occurrences)
- [ ] Save file
- [ ] Start WAMP services
- [ ] WAMP icon is GREEN
- [ ] Test connection page shows success
- [ ] Access website successfully

---

## 🚀 Next Steps

After successfully changing the port:

1. **Create Database:**
   - Open: `http://localhost/phpmyadmin/`
   - Create database: `uep_sports_management`

2. **Import SQL File:**
   - Click on database
   - Import: `uep_sports_management (5).sql`

3. **Access Your Website:**
   ```
   http://localhost/uep_sports_management_geriane/vms_complete/
   ```

4. **Enjoy your beautiful blue & gold UEP Sports Management System!** 🏆

---

## 💡 Pro Tip

**Save these URLs for quick access:**

```
WAMP phpMyAdmin:
http://localhost/phpmyadmin/

Test Connection:
http://localhost/uep_sports_management_geriane/vms_complete/test_connection.php

Main Website:
http://localhost/uep_sports_management_geriane/vms_complete/

Login Page:
http://localhost/uep_sports_management_geriane/vms_complete/auth/login.php
```

---

## ✅ Success!

Once WAMP is running on port 3308 and you see green checkmarks on the test page, you're all set!

**Need more help?** Check `WAMP_SETUP_GUIDE.md` for additional troubleshooting.
