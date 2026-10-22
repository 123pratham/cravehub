# cravehub
# 🍔 CraveHub — Food Discovery & Delivery Platform

CraveHub is a modern, responsive food discovery and delivery web application built with the **MERN stack**. It brings restaurant discovery, menu browsing, cart management, checkout, and order management into one user-friendly experience.

The project focuses on full-stack development, REST API integration, database persistence, authentication, responsive UI design, and secure backend practices.

> **Project status:** Under development. Refer to `IMPLEMENTATION_PLAN.md` for implementation progress. Payment functionality is simulated for local development and does not process real transactions.

## ✨ Features

- **Restaurant Discovery** — Explore restaurants, cuisines, and popular dishes.
- **Search & Filtering** — Find restaurants and food using supported search and filtering options.
- **Restaurant Menus** — Browse menu items, descriptions, prices, and availability.
- **User Authentication** — Registration, login, password hashing, and session management.
- **Shopping Cart** — Add items, update quantities, and calculate order totals.
- **Checkout & Orders** — Create orders and view saved order information.
- **MongoDB Persistence** — Store application data in a database.
- **Responsive UI** — Designed for desktop and mobile devices.
- **Development Seed Data** — Populate the database with sample restaurants and food items.

Some modules are still under development. Check the implementation plan before relying on individual features.

## 🛠️ Tech Stack

**Frontend**
- React and TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack Query
- Axios
- Framer Motion
- React Hook Form and Zod
- Lucide React

**Backend**
- Node.js
- Express.js
- TypeScript
- MongoDB and Mongoose
- Zod validation
- bcrypt password hashing
- JWT and session-cookie authentication
- Helmet and CORS

**Development & Testing**
- npm
- Docker Compose (optional)
- Vitest / other configured test tools

## 📁 Project Structure

```text
CraveHub/
├── frontend/               # React + TypeScript application
│   ├── src/
│   ├── .env.example
│   └── package.json
├── backend/                # Express REST API
│   ├── src/
│   ├── .env.example
│   └── package.json
├── docker-compose.yml      # Optional MongoDB setup
├── IMPLEMENTATION_PLAN.md  # Progress and remaining work
├── README.md
└── package.json            # Root scripts, if configured
```

## 🚀 Getting Started

### Prerequisites

Install:

- [Node.js](https://nodejs.org/) — version 20 or later recommended
- npm
- [MongoDB Community Server](https://www.mongodb.com/try/download/community) or [Docker Desktop](https://www.docker.com/products/docker-desktop/)

Verify your installation:

```bash
node --version
npm --version
```

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/CraveHub.git
cd CraveHub
```

Replace `YOUR_USERNAME` with your GitHub username.

### 2. Install dependencies

From the project root:

```bash
npm install
```

### 3. Configure environment variables

Create local environment files using the provided examples.

**Windows PowerShell:**

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

**macOS / Linux:**

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Configure `backend/.env`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/cravehub
FRONTEND_URL=http://localhost:5173
JWT_SECRET=replace_with_a_long_random_secret
COOKIE_SECRET=replace_with_a_long_random_secret
```

Configure `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Use unique, randomly generated secrets for local development. Never commit actual `.env` files or production credentials.

### 4. Start MongoDB

**Option A: Local MongoDB**

Start your local MongoDB service and ensure it is accessible at:

```text
mongodb://127.0.0.1:27017
```

**Option B: Docker Compose**

```bash
docker compose up -d
```

### 5. Seed sample data

If the backend seed script is configured as an npm workspace command:

```bash
npm run seed -w backend
```

Run this after MongoDB is available. Seed scripts should be restricted to development environments.

### 6. Start the application

Open two terminals from the project root.

**Terminal 1 — Backend**

```bash
npm run dev -w backend
```

**Terminal 2 — Frontend**

```bash
npm run dev -w frontend
```

If workspace scripts are not configured, use the equivalent scripts defined in the respective `package.json` files.

## 🌐 Local URLs

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend health check | http://localhost:5000/api/health |
| API base URL | http://localhost:5000/api |
| API documentation | http://localhost:5000/api-docs, if configured |

## 🧪 Testing and Build

Run the scripts available in your package configuration:

```bash
npm run test
npm run lint
npm run build
```

For workspace-specific builds, if configured:

```bash
npm run build -w frontend
npm run build -w backend
```

Always check the terminal output to confirm whether the tests and builds pass.

## 🔐 Security

- Hash passwords instead of storing plaintext passwords.
- Validate user input on the backend.
- Protect private routes and enforce resource ownership.
- Keep secrets in environment variables.
- Configure CORS, secure cookies, rate limiting, and HTTPS appropriately before deployment.
- Never store payment card numbers or CVVs.
- Treat simulated payments as demonstrations only.

## 🐛 Troubleshooting

**MongoDB connection failed**
- Ensure MongoDB is running.
- Verify `MONGODB_URI` in `backend/.env`.
- Check whether port `27017` is available.

**Frontend cannot reach the backend**
- Confirm the backend is running on port `5000`.
- Check `VITE_API_BASE_URL`.
- Verify the configured frontend origin in `FRONTEND_URL`.

**Port already in use**
- Stop the conflicting process or configure another port.

**Missing dependencies**
- Run `npm install` in the root directory or affected package directory.
- Review installation errors and verify your Node.js version.

## 🗺️ Roadmap

- Complete and verify the customer ordering journey.
- Expand automated API and frontend tests.
- Complete restaurant-owner and administrator dashboards.
- Finish favorites, reviews, and coupon workflows.
- Improve order status updates.
- Prepare secure production deployment.
- Integrate a real payment provider only when explicitly configured.

Track current progress in [`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md).

## 🤝 Contributing

Contributions are welcome.

1. Fork this repository.
2. Create a feature branch.
3. Implement and test your changes.
4. Open a pull request with a clear description.

## 📄 License

No license has been specified yet. Add a `LICENSE` file before distributing the project for reuse.

---

**CraveHub** — Built with React, TypeScript, Node.js, Express, and MongoDB.
