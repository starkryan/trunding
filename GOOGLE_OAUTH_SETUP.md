# Google OAuth Setup for Montra

## Overview

This guide explains how to set up Google OAuth authentication for the Montra investment platform using Better Auth.

## Prerequisites

- Node.js and npm installed
- Google Cloud Console account
- Montra project set up locally

## Step 1: Google Cloud Console Setup

### 1.1 Create a Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "NEW PROJECT"
4. Enter a project name (e.g., "Montra Authentication")
5. Click "CREATE"

### 1.2 Enable Required APIs

1. In the navigation menu, go to "APIs & Services" > "Library"
2. Enable the following APIs:
   - **Google+ API**
   - **People API**
   - **OAuth 2.0 API**

### 1.3 Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Select "External" for User Type
3. Click "CREATE"
4. Fill in the required information:
   - **App name**: Montra
   - **User support email**: your-email@example.com
   - **Developer contact information**: your-email@example.com
5. Click "SAVE AND CONTINUE"
6. Skip the "Scopes" section for now
7. Add test users if needed for development
8. Click "SAVE AND CONTINUE" then "BACK TO DASHBOARD"

### 1.4 Create OAuth Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "+ CREATE CREDENTIALS" > "OAuth client ID"
3. Select "Web application" as Application type
4. Enter a name (e.g., "Montra Web Client")
5. Under "Authorized JavaScript origins", add:
   - `http://localhost:3000` (development)
   - `https://yourdomain.com` (production)
6. Under "Authorized redirect URIs", add:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)
7. Click "CREATE"

### 1.5 Copy Your Credentials

After creating the OAuth client, you'll see:
- **Client ID**: Copy this value
- **Client Secret**: Click "SHOW" and copy this value

## Step 2: Update Environment Variables

Add your Google OAuth credentials to your `.env` file:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Existing Better Auth configuration
BETTER_AUTH_SECRET=SpCTp0hd8qU6DOKXSXjUlciSyDtke5hv
BETTER_AUTH_URL=http://localhost:3000
DATABASE_URL="postgresql://stark:Laudalega@localhost:5432/montra"
RESEND_API_KEY=re_gHaBMKWh_4iwHGhgSJRynYB25uAfoTDes
EMAIL_FROM=noreply@r15game.com
```

## Step 3: Code Implementation

The Google OAuth implementation is already included in your codebase:

### 3.1 Better Auth Configuration (`src/lib/auth.ts`)

The Google OAuth implementation now follows OAuth 2.1 security best practices:

```typescript
export const auth = betterAuth({
  // ... existing configuration
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectURI: `${process.env.BETTER_AUTH_URL}/api/auth/callback/google`,
      scopes: ["openid", "email", "profile"],
      // Security: PKCE (Proof Key for Code Exchange) for enhanced security
      pkce: true,
      // Security: State parameter to prevent CSRF attacks
      state: true,
      // Security: Nonce for replay attack prevention
      nonce: true,
      async getUserProfile(profile: any) {
        // Security: Validate the OAuth response
        const validation = oauthSecurity.validateOAuthResponse(profile);
        if (!validation.isValid) {
          throw new Error(validation.error);
        }

        // Security: Sanitize user data
        const sanitizedProfile = oauthSecurity.sanitizeUserData(profile);

        return {
          id: sanitizedProfile.id,
          email: sanitizedProfile.email,
          name: sanitizedProfile.name,
          image: sanitizedProfile.image,
          emailVerified: sanitizedProfile.emailVerified,
        };
      },
      // Security: Enhanced user creation validation
      async onUserCreate(user: any, account: any) {
        // Account linking validation
        if (account && account.providerAccountId) {
          if (!account.userId || account.userId !== user.id) {
            throw new Error("Account linking validation failed");
          }
        }

        // Security: Mark email as verified for Google OAuth users
        if (!user.emailVerified && user.email) {
          user.emailVerified = true;
        }

        // Set default role
        user.role = user.role || "USER";

        return user;
      },
      // Security: Enhanced sign-in validation
      async onSignIn(user: any, account: any) {
        // Session validation to prevent session fixation
        if (account && account.session) {
          const sessionToken = account.session.token;
          if (!sessionToken || sessionToken.length < 32) {
            throw new Error("Invalid session token");
          }
        }

        return user;
      },
      // Security: Proper error handling
      onError(error: any) {
        console.error("Google OAuth error:", {
          error: error.message,
          code: error.code,
          timestamp: new Date().toISOString(),
        });

        throw new Error("Authentication failed. Please try again.");
      },
    },
  },
  // ... existing plugins
});
```

### 3.2 Security Features Implemented

The Google OAuth implementation includes several security enhancements:

1. **PKCE (Proof Key for Code Exchange)**: Prevents authorization code interception attacks
2. **State Parameter**: Prevents CSRF attacks during the OAuth flow
3. **Nonce**: Prevents replay attacks
4. **Enhanced Profile Validation**: Validates Google's OAuth response including issuer, audience, and token expiration
5. **Account Linking Validation**: Ensures proper linking between OAuth accounts and user records
6. **Session Security**: Validates session tokens to prevent session fixation
7. **Automatic Email Verification**: Google-verified emails are automatically marked as verified
8. **Error Handling**: Secure error logging without exposing sensitive information

### 3.2 Google Sign-In Button (`src/components/auth/google-signin-button.tsx`)

A reusable Google Sign-In button component is available for use in your sign-in and sign-up pages.

### 3.3 Updated Authentication Pages

Both sign-in (`/signin`) and sign-up (`/signup`) pages now include Google OAuth options.

## Step 4: Testing the Implementation

### 4.1 Development Testing

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Navigate to the sign-in page**:
   - Open `http://localhost:3000/signin`
   - You should see a "Continue with Google" button

3. **Test Google OAuth flow**:
   - Click the "Continue with Google" button
   - You should be redirected to Google's OAuth consent screen
   - Sign in with your Google account
   - You should be redirected back to your application

### 4.2 Verify Database Records

After successful Google OAuth sign-in:

1. **Check the User table**:
   ```sql
   SELECT * FROM "user" WHERE email = 'your-google-email@gmail.com';
   ```

2. **Check the Account table**:
   ```sql
   SELECT * FROM account WHERE provider = 'google' AND provider_account_id = 'your-google-sub-id';
   ```

## Step 5: Production Deployment

### 5.1 Update Production Environment Variables

In your production environment (Dokploy), update the environment variables:

```env
GOOGLE_CLIENT_ID=your_production_google_client_id
GOOGLE_CLIENT_SECRET=your_production_google_client_secret
BETTER_AUTH_URL=https://yourdomain.com
```

### 5.2 Update Google Cloud Console for Production

1. Go back to Google Cloud Console
2. Add your production domain to authorized JavaScript origins:
   - `https://yourdomain.com`
3. Add your production redirect URI:
   - `https://yourdomain.com/api/auth/callback/google`

### 5.3 Domain Verification (Optional but Recommended)

For production deployment, consider:

1. **Domain verification** in Google Search Console
2. **Custom branding** for the OAuth consent screen
3. **Verified domain** status in Google Cloud Console

## Step 6: Security Considerations

### 6.1 Protect Your Client Secret

- Never commit `GOOGLE_CLIENT_SECRET` to version control
- Use secure environment variable management
- Rotate client secrets periodically

### 6.2 Redirect URI Security

- Always use HTTPS in production
- Only add authorized redirect URIs
- Validate redirect URIs in your application

### 6.3 User Data Handling

- Google OAuth provides `email_verified` status
- You can trust verified email addresses from Google
- Consider implementing additional verification if needed

## Step 7: Troubleshooting

### 7.1 Common Issues

**Error: redirect_uri_mismatch**
- Verify the redirect URI in Google Cloud Console matches your application
- Check that `BETTER_AUTH_URL` is set correctly

**Error: access_denied**
- Verify your OAuth consent screen is configured
- Check that your Google account is added as a test user (if in testing mode)

**Error: invalid_client**
- Verify your Client ID and Client Secret are correct
- Check that the OAuth client is enabled

### 7.2 Debug Steps

1. **Check environment variables**:
   ```bash
   echo $GOOGLE_CLIENT_ID
   echo $GOOGLE_CLIENT_SECRET
   ```

2. **Verify network connectivity**:
   ```bash
   curl https://accounts.google.com/.well-known/openid-configuration
   ```

3. **Check application logs**:
   ```bash
   npm run dev
   # Look for OAuth-related error messages
   ```

## Step 8: Advanced Configuration

### 8.1 Custom Scopes

You can request additional Google OAuth scopes:

```typescript
socialProviders: {
  google: {
    // ... existing config
    scopes: ["email", "profile", "openid"],
  },
},
```

### 8.2 Custom User Profile Handling

You can customize how Google user data is processed:

```typescript
async getUserProfile(profile: any) {
  return {
    id: profile.sub,
    email: profile.email,
    name: profile.name,
    image: profile.picture,
    emailVerified: profile.email_verified,
    // Add custom fields
    role: "USER", // Default role for Google OAuth users
    // ... other custom fields
  };
},
```

### 8.3 Error Handling

The Google Sign-In button component includes error handling and user feedback.

## Conclusion

Google OAuth is now integrated into your Montra application. Users can sign in using their Google accounts alongside the existing email/password authentication method.

The implementation follows security best practices and provides a seamless user experience across both development and production environments.