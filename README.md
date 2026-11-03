# BlogSpace – Full Stack Blog Application

BlogSpace is a full-stack web application that allows users to create, manage, and share blog posts. It provides user authentication, blog management, and a responsive interface for a smooth blogging experience.

## Features

### Authentication
- User registration and login.
- Secure password hashing using bcryptjs.
- JWT access token authentication.
- Refresh token authentication using HTTP-only cookies.
- Protected API routes.

### Blog Management
- Create blog posts.
- View recent blog posts.
- Preview blog content.
- Update existing blog posts.
- Delete blog posts.
- Manage user-specific blog content.

### User Interface
- Responsive user interface.
- User dashboard.
- Blog preview modal.
- Form validation.
- Login and registration pages.

## Technologies Used

### Frontend
- HTML5
- CSS3
- JavaScript

### Backend
- Node.js
- Express.js
- REST API
- JSON Web Token (JWT)
- bcryptjs
- Cookie-parser

### Database
- Supabase
- PostgreSQL

### Deployment and Development Tools
- Vercel
- Render
- Docker
- Git and GitHub
- Postman

## Project Structure

```text
Blog/
│
├── Frontend/
│   ├── index.html
│   ├── pages/
│   │   ├── login.html
│   │   ├── register.html
│   │   ├── dashboard.html
│   │   └── create-blog.html
│   ├── css/
│   ├── js/
│   │   ├── auth.js
│   │   └── ...
│   └── assets/
│
├── Backend/
│   └── Blog-Application/
│       ├── config/
│       ├── controllers/
│       │   ├── authController.js
│       │   └── createBlogController.js
│       ├── middleware/
│       ├── routes/
│       │   ├── authRoutes.js
│       │   └── createBlogRoutes.js
│       ├── supabase/
│       │   └── migrations/
│       │       └── 001_initial_schema.sql
│       ├── .env
│       ├── .env.example
│       ├── .gitignore
│       ├── package.json
│       └── server.js
│
├── .gitignore
└── README.md
```

*Note: This is the proposed project structure. Adjust directory and filenames to match the actual repository.*

## Installation and Setup

### 1. Clone the Repository

```bash
git clone git@github.com:Yoskie066/Blog.git
cd Blog
```

### 2. Install Backend Dependencies

Navigate to the backend application:

```bash
cd Backend/Blog-Application
```

Install dependencies:

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file inside the backend directory.

```env
PORT=3000

SUPABASE_URL=your_supabase_url
SUPABASE_SECRET_KEY=your_supabase_secret_key

JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret

ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

FRONTEND_URL=http://127.0.0.1:5500

NODE_ENV=development
```

Replace the placeholder values with your actual credentials.

**Security:** Never upload `.env` to GitHub. Use `.env.example` to document required environment variables without exposing sensitive credentials.

### 4. Run the Backend

Start the development server:

```bash
npm run dev
```

The backend runs locally at:

```text
http://localhost:3000
```

### 5. Run the Frontend

Open the frontend using Visual Studio Code Live Server or another local development server.

Make sure the frontend API configuration points to the correct backend URL.

## API Features

BlogSpace provides REST API functionality for authentication and blog management.

| Method | Description |
|---|---|
| POST | User Registration |
| POST | User Login |
| POST | Refresh Access Token |
| POST | Create Blog |
| GET | Retrieve User Blogs |
| PUT | Update Blog |
| DELETE | Delete Blog |

Refer to the backend route files for the exact API endpoint paths.

## Deployment

BlogSpace uses the following deployment services:

| Component | Platform |
|---|---|
| Frontend | Vercel |
| Backend | Render |
| Database | Supabase PostgreSQL |

### Frontend Deployment – Vercel

1. Connect the GitHub repository to Vercel.
2. Configure the frontend project settings.
3. Set the correct frontend deployment configuration.
4. Deploy the application.
5. Verify the connection to the backend API.

### Backend Deployment – Render

1. Connect the GitHub repository to Render.
2. Create a new Web Service.
3. Configure the backend root directory.
4. Set the build and start commands.
5. Configure environment variables.
6. Deploy the backend.
7. Test the API endpoints.

### Database – Supabase

Supabase PostgreSQL handles the application's database operations.

- Stores user information.
- Stores blog content.
- Provides database connectivity.
- Supports the application's backend operations.

## Security Considerations

- Keep credentials in environment variables.
- Never expose Supabase secret keys.
- Hash passwords before storing them.
- Use JWT for authentication.
- Protect private API endpoints.
- Validate incoming requests.
- Configure CORS for authorized frontend origins.
- Use secure cookie settings in production.

## Future Improvements

- Blog search and filtering.
- Categories and tags.
- User profile management.
- Improved blog discovery experience.
- Additional UI enhancements.

## Author

**Einon Cris O. Alcantara**

Full-Stack Web Developer

- GitHub: https://github.com/Yoskie066
- Portfolio: https://yoskie.vercel.app/