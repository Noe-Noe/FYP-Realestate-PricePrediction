# Deployment Guide

This guide covers deploying the FYP App to Render (backend) and Vercel (frontend).

## Prerequisites

- GitHub repository with your code
- Render account (for backend)
- Vercel account (for frontend)
- PostgreSQL database (Render provides free tier)

---

## Backend Deployment on Render

### Step 1: Create a New Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select the repository and branch

### Step 2: Configure Build Settings

- **Name**: `fyp-app-backend` (or your preferred name)
- **Environment**: `Python 3`
- **Build Command**: `pip install -r backend/requirements.txt`
- **Start Command**: `cd backend && gunicorn app:app --bind 0.0.0.0:$PORT --workers 4 --timeout 120`
- **Root Directory**: Leave blank (or set to `backend` if deploying from subdirectory)

### Step 3: Set Environment Variables

Add the following environment variables in the Render dashboard:

#### Required Variables:
- `DATABASE_URL`: Your PostgreSQL connection string (from Render database)
- `SECRET_KEY`: A random secret key for Flask sessions (generate with: `python -c "import secrets; print(secrets.token_hex(32))"`)
- `JWT_SECRET_KEY`: A random secret key for JWT tokens (generate similarly)
- `FLASK_ENV`: `production`
- `MAIL_USERNAME`: Your Gmail address for sending emails
- `MAIL_PASSWORD`: Your Gmail app password (not your regular password)

#### Optional Variables:
- `PORT`: Automatically set by Render (don't override)

### Step 4: Create PostgreSQL Database

1. In Render dashboard, click "New +" → "PostgreSQL"
2. Name it: `fyp-app-db`
3. Copy the **Internal Database URL** (for your web service)
4. Copy the **External Database URL** (for local development)

### Step 5: Deploy

1. Click "Create Web Service"
2. Render will automatically build and deploy
3. Note the URL: `https://your-app-name.onrender.com`

---

## Frontend Deployment on Vercel

### Step 1: Create a New Project on Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your GitHub repository

### Step 2: Configure Build Settings

- **Framework Preset**: `Create React App`
- **Root Directory**: `frontend`
- **Build Command**: `npm run build` (or `npm ci && npm run build`)
- **Output Directory**: `build`
- **Install Command**: `npm install` (or `npm ci`)

### Step 3: Set Environment Variables

Add the following environment variable:

- `REACT_APP_BACKEND_ORIGIN`: Your Render backend URL (e.g., `https://your-app-name.onrender.com`)

**Important**: Make sure to include the protocol (`https://`) and no trailing slash.

### Step 4: Deploy

1. Click "Deploy"
2. Vercel will automatically build and deploy
3. Your app will be available at: `https://your-project.vercel.app`

---

## Post-Deployment Setup

### Database Migration

After deploying the backend, you may need to initialize the database:

1. The Flask app will automatically create tables on first run (via `db.create_all()`)
2. If you need to run migrations manually, you can use Render's Shell feature

### CORS Configuration

The backend is already configured to accept requests from any origin. If you want to restrict it:

1. Update `backend/app.py` line 34:
   ```python
   resources={r"/api/*": {"origins": ["https://your-frontend.vercel.app"]}},
   ```

### Testing the Deployment

1. **Backend Health Check**: 
   - Visit: `https://your-backend.onrender.com/health`
   - Should return: `{"status": "healthy", "message": "Server is running"}`

2. **Frontend**:
   - Visit your Vercel URL
   - Check browser console for API connection errors
   - Try logging in or making an API call

---

## Troubleshooting

### Backend Issues

- **Build fails**: Check that all dependencies are in `requirements.txt`
- **Database connection errors**: Verify `DATABASE_URL` is set correctly
- **Port errors**: Don't override `PORT` variable - Render sets it automatically
- **Timeout errors**: Increase timeout in Procfile or use Render's settings

### Frontend Issues

- **API calls fail**: 
  - Verify `REACT_APP_BACKEND_ORIGIN` is set correctly
  - Check CORS settings in backend
  - Ensure backend URL is accessible (not sleeping)
- **Build fails**: Check Node.js version compatibility

### Render Free Tier Notes

- Services on free tier **spin down after 15 minutes** of inactivity
- First request after spin-down may take 30-60 seconds
- Consider upgrading to paid tier for production use

---

## Environment Variables Summary

### Backend (Render)
```
DATABASE_URL=postgresql://user:pass@host:port/dbname
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
FLASK_ENV=production
```

### Frontend (Vercel)
```
REACT_APP_BACKEND_ORIGIN=https://your-backend.onrender.com
```

---

## Additional Resources

- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Flask Deployment Guide](https://flask.palletsprojects.com/en/latest/deploying/)
- [Create React App Deployment](https://create-react-app.dev/docs/deployment/)

