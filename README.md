# 🚗 Roadify

<div align="center">

![.NET](https://img.shields.io/badge/.NET-10.0-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

_A modern vehicle listing and roadside assistance platform connecting drivers with automotive experts_

[Features](#-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Project Structure](#-project-structure)

</div>

---

## 📋 Overview

Roadify is a full-stack web application that enables users to list vehicles, connect with automotive experts, and manage roadside assistance services. Built with modern technologies and best practices, it features real-time messaging, comprehensive user authentication, and a sleek, responsive UI.

## ✨ Features

- 🔐 **Secure Authentication** - JWT-based auth with refresh tokens, email confirmation, and password recovery
- 🚗 **Vehicle Management** - Create, update, and browse vehicle listings with photo uploads
- 💬 **Real-time Chat** - Instant messaging powered by SignalR
- ⭐ **Review System** - Rate and review experts and services
- 👨‍🔧 **Expert Profiles** - Showcase expertise with document verification
- 📱 **Responsive Design** - Mobile-first UI built with Tailwind CSS and shadcn/ui
- 🔍 **Advanced Filtering** - Search and filter listings by multiple criteria
- 📊 **Health Monitoring** - Built-in health checks for system reliability

## 🛠️ Tech Stack

### Backend

- **Framework:** ASP.NET Core 10.0
- **Authentication:** ASP.NET Identity with JWT
- **Database:** PostgreSQL (primary), MongoDB (messaging)
- **Real-time:** SignalR
- **Validation:** FluentValidation
- **Documentation:** Swagger/OpenAPI

### Frontend

- **Framework:** Next.js 16 with React 19
- **Styling:** Tailwind CSS 4
- **UI Components:** shadcn/ui, Radix UI
- **State Management:** Zustand
- **Icons:** Lucide React, Remix Icon
- **Theme:** Dark/Light mode support

### Infrastructure

- **Containerization:** Docker & Docker Compose
- **Database Admin:** pgAdmin 4

## 🚀 Getting Started

### Prerequisites

- [Docker](https://www.docker.com/get-started) and Docker Compose
- [.NET 10.0 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org/)

### Installation

1. **Clone the repository**

    ```bash
    git clone <repository-url>
    cd Roadify
    ```

2. **Start the databases**

    ```bash
    docker-compose up -d
    ```

    - PostgreSQL: `localhost:5432`
    - pgAdmin: `http://localhost:5050` (admin@admin.com / root)

3. **Configure the backend**

    Update `backend/apiroot/appsettings.Development.json` with your settings:

    ```json
    {
        "ConnectionStrings": {
            "DefaultConnection": "Host=localhost;Database=roadify_db_v1;Username=postgres;Password=pass"
        },
        "JwtSettings": {
            "SecretKey": "your-secret-key",
            "Issuer": "your-issuer",
            "Audience": "your-audience"
        }
    }
    ```

4. **Run database migrations**

    ```bash
    cd backend/apiroot
    dotnet ef database update
    ```

5. **Start the backend**

    ```bash
    dotnet run
    ```

    API will be available at `https://localhost:7000` (or configured port)

6. **Install frontend dependencies**

    ```bash
    cd frontend
    npm install
    ```

7. **Start the frontend**
    ```bash
    npm run dev
    ```
    App will be available at `http://localhost:3000`

## 📁 Project Structure

```
Roadify/
├── backend/
│   └── apiroot/
│       ├── Controllers/      # API endpoints
│       ├── Services/         # Business logic
│       ├── Models/           # Data models
│       ├── DTOs/             # Data transfer objects
│       ├── Validators/       # Input validation
│       ├── Middleware/       # Custom middleware
│       ├── Hub/              # SignalR hubs
│       └── Data/             # Database contexts
├── frontend/
│   ├── app/                  # Next.js app router pages
│   ├── components/           # React components
│   ├── contexts/             # React contexts
│   ├── hooks/                # Custom hooks
│   ├── lib/                  # Utilities and API client
│   └── store/                # Zustand stores
└── docker-compose.yml        # Container orchestration
```

## 🔌 API Documentation

Once the backend is running, access the interactive API documentation at:

- **Swagger UI:** `https://localhost:7000/swagger`

Key endpoints include:

- `/api/auth` - Authentication & user management
- `/api/listings` - Vehicle listings
- `/api/vehicles` - Vehicle management
- `/api/reviews` - Review system
- `/api/messages` - Messaging
- `/api/expertise` - Expert profiles

---

**Built by:**

- Ayman Abid
- Mohamed Yassine Kallel
- Makki Aloulou
- Elyes Mlawah

Stars and contributions are welcome! 🚀
