# Vercel Deployment Guide for OrderFlow

## Prerequisites

1. GitHub account
2. Vercel account
3. PostgreSQL database (Neon, Vercel Postgres, or similar)

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository named "OrderFlow"
3. **Important**: Don't initialize with README, .gitignore, or license

## Step 2: Push Code to GitHub

Replace `YOUR_USERNAME` with your GitHub username:

```bash
git remote add origin https://github.com/YOUR_USERNAME/OrderFlow.git
git push -u origin main
```

## Step 3: Deploy to Vercel

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure the following:

### Build & Development Settings:

- **Framework Preset**: Vite
- **Root Directory**: `./` (leave as is)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Environment Variables:

Add these environment variables in Vercel:

```
DATABASE_URL=your_postgresql_connection_string
SESSION_SECRET=your_random_session_secret
JWT_SECRET=your_random_jwt_secret
FRONTEND_URL=https://your-app-name.vercel.app
EMAIL_API_KEY=your_brevo_api_key
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
EMAIL_FROM_NAME=Delivery Order System
```

## Step 4: Database Setup

If using Neon:

1. Create a new database at https://neon.tech
2. Copy the connection string
3. Add it as DATABASE_URL in Vercel

## Step 5: Post-Deployment Setup

After deployment, run these commands using the Vercel CLI or create setup scripts:

1. Create session table:

```bash
npm run setup:sessions
```

2. Create admin user:

```bash
npm run setup:admin
```

3. Setup parties:

```bash
npm run setup:parties
```

## Important Notes:

### Environment Variables Details:

- `DATABASE_URL`: PostgreSQL connection string (must support SSL)
- `SESSION_SECRET`: Generate with `openssl rand -base64 32`
- `JWT_SECRET`: Generate with `openssl rand -base64 32`
- `FRONTEND_URL`: Your Vercel app URL (update after first deployment)
- `EMAIL_API_KEY`: Get from https://app.brevo.com
- `EMAIL_FROM_ADDRESS`: Verified email address in Brevo
- `EMAIL_FROM_NAME`: Display name for emails

### Database Migrations:

The app uses Drizzle ORM. Database schema will be automatically pushed on first run.

### Default Admin Credentials:

- Username: admin
- Password: changeme123

**Important**: Change the admin password immediately after first login!

## Troubleshooting:

### Build Errors:

- Ensure all dependencies are in package.json (not devDependencies)
- Check Node.js version compatibility

### Database Connection:

- Ensure DATABASE_URL includes SSL parameters
- For Neon: Connection string should end with `?sslmode=require`

### Email Issues:

- Verify Brevo API key is correct
- Ensure sender email is verified in Brevo
- Check Brevo account has sufficient credits

## Security Checklist:

- [ ] Change default admin password
- [ ] Set strong SESSION_SECRET and JWT_SECRET
- [ ] Enable Vercel environment variable encryption
- [ ] Set up proper CORS if needed
- [ ] Review and update security headers

## Next Steps:

1. Create additional users through the Role Creator interface
2. Set up monitoring (Vercel Analytics recommended)
3. Configure custom domain if needed
4. Set up database backups
