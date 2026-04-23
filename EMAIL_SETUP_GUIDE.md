# Email Configuration Setup Guide

## Problem Encountered

When testing "Forgot Password" feature, you see:

```
❌ Failed to send OTP email - Please check your email configuration or try again later
```

This means the email credentials in `.env` file are not configured correctly.

---

## Solution: Setup Gmail App Password

### Step 1: Enable 2-Factor Authentication on Gmail

1. Go to [Google Account](https://myaccount.google.com/)
2. Click **Security** in the left menu
3. Scroll down to **How you sign in to Google**
4. Enable **2-Step Verification** if not already enabled
5. Follow the prompts to verify your identity

### Step 2: Generate App Password

1. Go back to Google Account → **Security**
2. Scroll down to **App passwords**
3. You should see a dropdown for **Select app** and **Select device**
4. Choose:
   - App: **Mail**
   - Device: **Windows Computer** (or your device type)
5. Click **Generate**
6. Google will show a 16-character password
7. **Copy this password** (it will be shown only once)

### Step 3: Update .env File

Open `backend/.env` and update:

```
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=paste_the_16_char_password_here
FRONTEND_URL=http://localhost:5173
JWT_SECRET=default_secret_key_123
```

**Example:**

```
EMAIL_USER=myemail@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop
FRONTEND_URL=http://localhost:5173
JWT_SECRET=default_secret_key_123
```

> ⚠️ **Important**: Use your actual email and the app password, not your regular Gmail password!

### Step 4: Restart Backend Server

Stop the backend server and restart it:

```powershell
cd backend
npm start
```

---

## Testing Email Configuration

After setting up the credentials, test the forgot password flow:

1. Go to **Forgot Password** page
2. Enter a registered email (e.g., `test@example.com`)
3. Click **Send OTP**
4. Check your email inbox (and spam folder)
5. You should receive an email with the OTP

### Expected Email Content:

```
Subject: Password Reset OTP - Tourism Management System

Your password reset OTP is: 123456

This OTP is valid for 10 minutes only.

If you did not request this, please ignore this email.
```

---

## Troubleshooting

### Issue: Still getting email error

- ✅ Double-check the app password (16 characters)
- ✅ Make sure 2-FA is enabled on your Gmail account
- ✅ Restart the backend server after updating `.env`
- ✅ Check that `.env` file is in the `backend/` folder

### Issue: App Password option not showing

- ✅ 2-Step Verification must be enabled first
- ✅ You must be using a personal Google account (not a workspace account)
- ✅ Try again after waiting 30 minutes

### Issue: Email sent but not receiving

- ✅ Check spam/junk folder
- ✅ Check that `EMAIL_USER` matches your Gmail address
- ✅ Make sure you didn't add extra spaces in `.env`

---

## How Duplicate Email Check Works

### Registration Duplicate Email Check:

**Your code already includes this check:**

```javascript
const exitsuser = await Custmer.findOne({ email });
if (exitsuser) {
  return res.status(400).json({
    message: "Email already registered. Please login or use a different email",
  });
}
```

**Flow:**

1. User enters email during registration
2. Backend checks if email exists in database
3. If **email already exists** → Show error: ❌ "Email already registered. Please login or use a different email"
4. If **email is unique** → Continue with registration

**Test It:**

1. Register with `test@example.com` - ✅ Success
2. Try to register again with `test@example.com` - ❌ Gets error message

---

## Complete Authentication Flow

### 1. Registration

```
User fills form → Submit
↓
Backend validates ALL fields (email format, phone format, password length, etc.)
↓
Check if email already exists in database
↓
If YES → Error: "Email already registered"
If NO → Hash password → Save to database → Success!
```

### 2. Login

```
User enters email + password → Submit
↓
Backend searches for email in Custmer/Admin/Staff tables
↓
If NOT found → Error: "Email not found. Please register first"
If FOUND → Compare password
  ├─ Wrong password → Error: "Incorrect password"
  └─ Correct password → Generate JWT token → Success!
```

### 3. Forgot Password

```
User enters email → Submit
↓
Backend searches for email
↓
If NOT found → Error: "Email not found in our system"
If FOUND → Generate 6-digit OTP
  ├─ Save OTP to database (expires in 10 minutes)
  └─ Send OTP via email
      ├─ Email config error → Show error with details
      └─ Email sent → Success message
```

### 4. Reset Password

```
User enters email + OTP + new password → Submit
↓
Backend searches for email with matching OTP
↓
If NOT found or expired → Error: "Invalid OTP or OTP expired"
If FOUND and NOT expired → Hash new password → Update database → Success!
```

---

## Security Features Implemented

✅ **Email Validation**: Uses validator.js for email format check
✅ **Duplicate Prevention**: Checks if email already registered
✅ **Password Hashing**: Uses bcryptjs (10 salt rounds)
✅ **OTP Expiration**: OTP valid for only 10 minutes
✅ **JWT Tokens**: Secure authentication tokens (24-hour expiry)
✅ **Input Validation**: All fields validated before processing
✅ **Error Messages**: Clear but secure error messages

---

## Files Modified

1. `backend/.env` - Updated template with placeholders
2. `backend/controllers/authController.js` - Comprehensive validation
3. `frontend/src/pages/Register.jsx` - Better error display
4. `frontend/src/pages/ForgotPassword.jsx` - Enhanced UX

---

## Next Steps

1. **Set up Gmail app password** (follow steps above)
2. **Update `.env` file** with your credentials
3. **Restart backend server**
4. **Test the complete flow:**
   - Register with new email → ✅ Should work
   - Try registering with same email → ❌ Should show error
   - Try forgot password → ✅ Should receive OTP
   - Reset password with OTP → ✅ Should work

---

## Contact Support

If you encounter any issues:

1. Check that 2-FA is enabled on your Gmail
2. Verify app password was copied correctly
3. Ensure `.env` has no extra spaces
4. Restart the backend server
5. Check browser console for error details
