# Admin File Upload System

This directory contains uploaded files for the admin interface.

## Directory Structure

```
admin/
├── hero/
│   ├── backgrounds/     # Hero background images
│   └── videos/         # Hero marketing videos
└── README.md
```

## File Upload Endpoints

### Hero Content Management

- **Upload Background Image**: `POST /api/hero/upload-background`
  - Accepts: PNG, JPG, JPEG, GIF, WEBP
  - Stores in: `admin/hero/backgrounds/`
  - Returns: File URL for database storage

- **Upload Marketing Video**: `POST /api/hero/upload-video`
  - Accepts: MP4, WEBM, OGG, MOV
  - Stores in: `admin/hero/videos/`
  - Returns: File URL for database storage

- **Update Hero Content**: `POST /api/hero/update-content`
  - Updates hero content in database
  - Includes uploaded file URLs

### File Serving

- **Background Images**: `GET /admin/hero/backgrounds/<filename>`
- **Videos**: `GET /admin/hero/videos/<filename>`

## Usage

1. Upload files using the admin interface
2. Files are automatically renamed with timestamps
3. URLs are returned for database storage
4. Files are served directly by the Flask application

## Security

- All upload endpoints require authentication (`@require_auth`)
- File type validation is enforced
- Files are stored in organized directories
- Unique filenames prevent conflicts
