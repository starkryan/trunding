# Transaction Verification System - Updated Documentation

## 📋 Overview

The transaction verification system allows users to submit payment proof (UTR number + screenshot) for deposit transactions. Admins can then review and approve/reject these verifications.

## ✅ Key Features

### 🔐 **User Capabilities**
- **Submit Verification**: UTR number + screenshot for pending deposits
- **Resubmit Allowed**: After rejection or expiration (7 days)
- **No Time Limit**: Can submit verification for transactions of any age
- **Clear Status**: Real-time verification status tracking

### 👨‍💼 **Admin Capabilities**
- **Review Submissions**: View UTR and payment screenshots
- **Approve/Reject**: With notes and rejection reasons
- **Automatic Filtering**: Expired verifications hidden from admin queue
- **Audit Trail**: Complete history of all verification actions

### ⏰ **Expiration System**
- **7-Day Submission Expiration**: Individual verification submissions expire after 7 days
- **Automatic Reset**: Expired submissions automatically allow resubmission
- **Transaction Age Warning**: Alerts for transactions older than 30 days
- **Clean Resubmission**: Users can always submit new verification for pending transactions

## 🔄 **Verification Workflow**

### User Flow
1. **Transaction Created**: User makes deposit → Transaction with `PENDING` status
2. **Submit Verification**: User provides UTR + screenshot → Status becomes `PENDING_VERIFICATION`
3. **7-Day Timer**: Submission expires after 7 days if not reviewed
4. **Admin Review**: Admin approves/rejects → Status becomes `VERIFIED`/`REJECTED`
5. **Auto-Reset**: Expired/rejected verifications allow resubmission

### Admin Flow
1. **View Queue**: See all pending verifications (excluding expired ones)
2. **Review Details**: Check UTR, screenshot, user info, expiration dates
3. **Take Action**: Approve (credits wallet) or reject (requires reason)
4. **System Updates**: Automatically updates transaction and wallet balances

## 🛡️ **Security Features**

### **Input Validation**
- **UTR Format**: Exactly 12 digits required
- **File Upload**: Only images (JPEG/PNG/WebP), max 5MB
- **Duplicate Prevention**: UTR numbers must be unique

### **Atomic Transactions**
- **Wallet Updates**: Database transactions ensure data consistency
- **Rollback Protection**: Failed verifications don't affect wallet balance
- **Audit Logging**: Complete tracking of all changes

### **Expiration Management**
- **Automatic Cleanup**: Expired submissions reset automatically
- **Manual Cleanup**: Admin can trigger cleanup via API
- **Resubmission Tracking**: History of all submission attempts

## 📊 **Database Schema Updates**

```sql
-- Transaction model additions
ALTER TABLE Transaction
ADD COLUMN verificationExpiresAt TIMESTAMPTZ;

-- Verification status flow
NONE → PENDING_VERIFICATION → VERIFIED/REJECTED
     ↑                              ↓
     └───── (after 7 days) ←────────┘
```

## 🎯 **User Interface Updates**

### **Verification Form**
- **Status Badges**: Clear visual indicators (Not Submitted, Pending Review, Verified ✓, Rejected ✗)
- **Expiration Display**: Shows submission expiration date
- **Age Warnings**: Alerts for transactions older than 30 days
- **Resubmission Support**: Seamless flow for expired/rejected verifications

### **Admin Review Interface**
- **User Avatars**: React Icons-based fallback avatars
- **Expiration Alerts**: Orange warnings for expiring verifications
- **Detailed View**: Complete transaction and user information
- **Bulk Actions**: Efficient approval/rejection workflow

## 🔧 **API Endpoints**

### **User Endpoints**
- `POST /api/payments/verify` - Submit verification
- `GET /api/payments/verify?transactionId=X` - Get verification status

### **Admin Endpoints**
- `POST /api/admin/transactions/verify` - Approve/reject verification
- `GET /api/admin/transactions/verify` - Get pending verifications
- `POST /api/admin/verifications/cleanup` - Manual cleanup
- `GET /api/admin/verifications/cleanup` - Get expiration statistics

## 🚀 **Recent Improvements**

### **✅ Fixed Issues**
1. **Avatar Placeholders**: Replaced missing images with React Icons avatars
2. **Old Transaction Support**: Users can now submit verification for transactions of any age
3. **Smart Expiration**: Only verification submissions expire, not transactions
4. **Better UX**: Clear status indicators and warnings

### **🔒 Enhanced Security**
1. **Resubmission Tracking**: Complete history of verification attempts
2. **Atomic Operations**: Database transactions for wallet updates
3. **Audit Trails**: Comprehensive logging of all actions
4. **Input Validation**: Strict UTR and file validation

### **📈 Improved Admin Tools**
1. **Expiration Monitoring**: Real-time statistics and cleanup tools
2. **Visual Warnings**: Orange alerts for expiring verifications
3. **Better Filtering**: Automatic exclusion of expired submissions
4. **User Context**: Enhanced user information display

## 🎯 **Best Practices**

### **For Users**
- Submit verification promptly after payment
- Keep payment screenshots and UTR numbers handy
- Check expiration dates (7 days from submission)
- Resubmit if verification expires or gets rejected

### **For Admins**
- Review verifications promptly before expiration
- Use admin notes for important context
- Check transaction age for very old submissions
- Monitor expiration statistics regularly

### **For Developers**
- Use the cleanup API for maintenance (cron job recommended)
- Monitor verification expiration statistics
- Check transaction metadata for submission history
- Follow the atomic transaction pattern for wallet updates

---

**Last Updated**: October 18, 2025
**Version**: 2.0
**Status**: Production Ready ✅