# Stusil Backend Setup Guide

The Stusil backend is a Node.js API built using Express and Prisma.

## Setup Instructions

1.  **Database Connection:**
    Configure your PostgreSQL database URL in the `d:\stusilwebapp\backend\.env` file.
    Example: `DATABASE_URL="postgresql://user:password@hostname:5432/stusil?schema=public"`

2.  **Generate Database Schema:**
    Run migrations and generate the Prisma Client using:
    ```bash
    cd backend
    npx prisma migrate dev --name init
    npx prisma generate
    ```

3.  **Start the Server:**
    Run the server in development mode:
    ```bash
    npm run dev
    ```
    Or in production mode:
    ```bash
    npm start
    ```

## Features Summary

*   **Auth (JWT & Bcrypt)** - Basic authentication for user registration/login.
*   **Projects Management** - Create, view, update, and manage public and private student projects.
*   **Collaborations System** - Endpoints for requesting to join projects, accepting, and rejecting requests.
*   **Startup Ideas** - Publish startup ideas, indicating if a team is needed.
*   **Realtime Sockets** - Sockets configured with Socket.io for notifications, personal messaging, and project communication.
*   **Modular Routing** - Cleanly separated controllers and routers for maintainability.
