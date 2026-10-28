# 🚗 Vehicle Maintenance Chain API

A robust, enterprise-grade backend REST API built with **NestJS**, **TypeORM**, and **PostgreSQL** designed to manage a vehicle maintenance service chain. It features strict business rule validation, secure role-based access control, automated vehicle state transitions, database seeding, and comprehensive **Swagger** documentation.

---

## 🛠️ Tech Stack & Tools

* **Framework:** [NestJS](https://nestjs.com/) (Node.js framework)
* **ORM:** TypeORM with PostgreSQL
* **Validation:** `class-validator` & `class-transformer`
* **Documentation:** OpenAPI / Swagger
* **Testing:** Jest (Unit & integration tests)
* **Language:** TypeScript

---

## 📦 Core Modules & Entities

1. **Workshops (`Workshop`)**: Manages physical workshop branches across the region with operational status controls.
2. **Cars (`Car`)**: Manages vehicle inventory, mileage, and operational status (`AVAILABLE`, `IN_MAINTENANCE`, `OUT_OF_SERVICE`).
3. **Mechanics (`Mechanichs`)**: Manages mechanics, specialties, contact details, and activity statuses while preserving historical records.
4. **Maintenances (`Maintenance`)**: Manages appointment scheduling, preventive/corrective service types, and full lifecycle state transitions.
5. **Users & Auth (`User`)**: Secure account management with role-based permissions (`ADMIN`, `TECHNICIAN`).

---

## ⚙️ Business Rules & Features

* **Uniqueness Constraints:** Unique vehicle registration plates and mechanic/user email addresses.
* **Historical Preservation:** Logical deletion / inactivation (`active: boolean` / `isActive: boolean`) is used across entities (Workshops, Cars, Mechanics) to prevent future assignments while fully preserving past maintenance histories.
* **Schedule Conflict Prevention:** 
  * A mechanic cannot have overlapping active maintenances (`SCHEDULED` or `IN_PROGRESS`) across any workshops.
  * A vehicle cannot be assigned to multiple overlapping active maintenances simultaneously.
* **Automatic State Transitions:**
  * When a maintenance transitions to **`IN_PROGRESS`**, the associated vehicle automatically updates to **`IN_MAINTENANCE`**.
  * When a maintenance is successfully **`COMPLETED`**, the vehicle updates back to **`AVAILABLE`**, and final mileage is updated.
* **Strict State Machine Rules:**
  * A **`COMPLETED`** maintenance cannot revert to a previous state.
  * A **`CANCELLED`** maintenance cannot later transition to `IN_PROGRESS` or `COMPLETED`.
  * Completing a maintenance requires mandatory closing info: work done, final cost, completion date, and final mileage.
* **Mileage Validation:** Maintenance mileage cannot be registered lower than the vehicle's current recorded mileage.

---

## 🚀 Getting Started

### Prerequisites
* Node.js (v18+ recommended)
* PostgreSQL database instance
* npm or yarn

### Installation & Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <project-folder>
Install dependencies:

Bash
npm install
Configure environment variables (.env):
Create a .env file in the root directory with the following configuration:

Fragmento de código
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=vehicle_maintenance_db
SEED_USER_PASSWORD=SeedSecret123
BCRYPT_ROUNDS=4
Run the application:

Bash
# Development mode (watch mode)
npm run start:dev

# Production build
npm run build
npm run start:prod
🌱 Database Seeding
The application includes an automated bootstrap seed service (SeedService) that populates initial mock data (workshops, cars, mechanics, and users with encrypted passwords) if the tables are empty. It automatically synchronizes database serial sequences to prevent ID collision errors.

🧪 Testing
Run unit tests and seed validations using Jest:

Bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Test code coverage
npm run test:cov
📖 API Documentation (Swagger)
Once the application is running, open your browser and navigate to the Swagger UI endpoint to explore, authorize, and test all endpoints interactively:

Plaintext
http://localhost:3000/api