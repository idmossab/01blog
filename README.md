# 01Blog

Full-stack blogging platform built with **Spring Boot** (backend) and **Angular** (frontend).

## Tech Stack
- Backend: Java 17, Spring Boot 4, Spring Security (JWT), Spring Data JPA, PostgreSQL
- Frontend: Angular 21, TypeScript, Bootstrap 5
- Build tools: Maven Wrapper, npm

## Features
- JWT authentication (register/login)
- Create, edit, delete blog posts
- Upload post media (images/videos)
- Like/unlike posts and comments
- Follow/unfollow users
- Report posts/users
- Notifications with read/unread support
- Admin dashboard for moderation

## Project Structure
- `src/main/java/...` Spring Boot backend (controllers, services, entities, security)
- `src/main/resources/application.properties` backend config
- `frontend/` Angular app
- `uploads/` local uploaded media files served at `/uploads/**`
- `Makefile` convenience commands for DB + backend

## Prerequisites
- Java 17+
- Node.js + npm (project uses `npm@10.8.2`)
- PostgreSQL 15+ (or Docker for the provided DB command)

## Configuration
Current backend config is in:
- `src/main/resources/application.properties`

Default values in this repo include:
- DB URL: `jdbc:postgresql://localhost:5432/blogdb`
- DB user: `midbenke`
- DB password: `123456`
- JWT secret: `change-this-secret-key-please-change-32chars-min`

Update these before production use.

## Run Locally

### 1. Start database
Option A: Docker via Makefile
```bash
make db
```

Option B: use your own PostgreSQL instance and match `application.properties`.

### 2. Start backend
```bash
./mvnw spring-boot:run
```
Backend runs on `http://localhost:8080`.

### 3. Start frontend
```bash
cd frontend
npm install
npm start
```
Frontend runs on `http://localhost:4200`.

## Build Commands

### Backend
```bash
./mvnw clean package
```

### Frontend
```bash
cd frontend
npm run build
```

## API Overview
Base URL: `http://localhost:8080`

### Public endpoints
- `POST /users/register`
- `POST /users/login`
- `GET /media/by-blog/{blogId}`
- `GET /media/first/{blogId}`
- `GET /uploads/**`

### Authenticated endpoints
- Users: `/users`, `/api/users/me`
- Blogs: `/blogs`, `/blogs/with-media`, `/api/blogs/feed`, `/api/blogs/me`
- Comments: `/comments/**`
- Likes: `/likes/**`
- Follows: `/api/follows/**`
- Reports: `/api/reports`
- Notifications: `/api/notifications/**`

### Admin only
- `/api/admin/dashboard/**`

## Auth Notes
- The frontend sends JWT using the `Authorization: Bearer <token>` header.
- Most endpoints require authentication unless explicitly allowed in `SecurityConfig`.

## CORS
CORS is configured to allow:
- `http://localhost:4200`

## Useful Makefile Commands
- `make db` - start Postgres container (`01blogdb`)
- `make start_db` - start existing DB container
- `make run` - run backend
- `make clean` - clean backend build

## License
No license file is currently defined in this repository.
