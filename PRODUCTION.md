# Yaroo Production Notice

This file is the production handoff checklist for Yaroo. Do not commit real secrets or API keys to this repository.

## Required Environment Variables

Set these on the backend hosting platform:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_random_32_plus_character_secret
FRONTEND_URL=https://your-app-domain.com
PASSWORD_RESET_URL=https://your-app-domain.com
```

Set these when password reset emails should be delivered through Resend:

```env
EMAIL_PROVIDER=resend
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM="Yaroo <noreply@yourdomain.com>"
```

Set these for image upload support:

```env
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

## Important Notices

- Revoke any API key that was shared in chat, screenshots, commits, logs, or tickets. Create a fresh Resend key before deploying.
- Use a verified Resend domain for production email. `onboarding@resend.dev` is only suitable for quick testing.
- Keep `JWT_SECRET` private and at least 32 characters in production.
- Keep `.env` files out of git. Use the hosting provider's environment variable settings.
- `PASSWORD_RESET_URL` must point to the live frontend domain, not localhost.
- `FRONTEND_URL` must match the live frontend origin so cookies and CORS work correctly.
- Use MongoDB Atlas or another managed MongoDB service with IP/network access configured for the backend host.

## Deploy Steps

1. Create a fresh Resend API key and set it as `RESEND_API_KEY`.
2. Verify the sender domain in Resend and set `EMAIL_FROM`.
3. Set all backend environment variables listed above.
4. Run the production build:

```bash
npm run build
```

5. Start the backend:

```bash
npm start
```

6. Check health:

```bash
curl https://your-backend-domain.com/health
```

7. Test these flows after deploy:

- Signup
- Login
- Forgot password email
- Reset password
- Search users by username
- Send message while both users are online
- Send message after one user reconnects
- Image upload

## Production Behavior

- Password reset links are emailed when Resend or SMTP is configured.
- In development only, reset links may be logged/returned for testing.
- In production, missing email provider config fails password reset email delivery instead of exposing reset links.
- Messages are saved in MongoDB first, then delivered over WebSocket with client acknowledgement and reconnect backfill.
