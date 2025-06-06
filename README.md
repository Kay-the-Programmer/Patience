# Online File Tracking System (OFTS)

The Online File Tracking System (OFTS) is a web application designed to help organizations digitally track the movement and status of physical files or documents within various offices or departments. It provides features for user authentication, role-based access, file registration, tracking file movements, and an administrative panel for system management.

## Features

*   User Authentication (Login/Logout)
*   Role-Based Access Control (Admin, Office User)
*   Dashboard for a quick overview.
*   File Registration and Tracking.
*   Detailed File View.
*   Admin Panel:
    *   User Management (Add, Edit, Delete Users)
    *   Office/Department Management
    *   Workflow Configuration for file movements
    *   Audit Trail / File Activity Logging
    *   Reporting and Analytics
*   Snackbar notifications for user actions.
*   Responsive UI.

## Prerequisites

Before you begin, ensure you have the following installed:

*   **Node.js**: We recommend using a recent LTS version, for example, v18.x or v20.x. You can download it from [nodejs.org](https://nodejs.org/).
*   **npm**: npm (Node Package Manager) is included with Node.js. This project uses npm for package management (as indicated by the `package-lock.json` file).

## Getting Started

Follow these steps to get a local copy of the project up and running.

1.  **Clone the repository:**
    Replace `<repository-url>` with the actual URL of the repository.
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Install dependencies:**
    This command will install all the necessary project dependencies as defined in `package.json` and `package-lock.json`.
    ```bash
    npm install
    ```

3.  **Set up environment variables (Optional):**
    The application uses Vite, which supports environment variables through `.env` files (e.g., `.env.local`).
    *   A `GEMINI_API_KEY` is mentioned in `vite.config.ts`. This API key is likely for an optional feature (e.g., AI-powered suggestions or analysis) and is not required for the core file tracking and user authentication functionalities to work.
    *   If you intend to use features requiring this key, create a `.env.local` file in the project root and add your key:
        ```env
        VITE_GEMINI_API_KEY=YOUR_API_KEY_HERE
        ```
    *   For basic operation of the application, this step can be skipped.

4.  **Run the development server:**
    This command starts the development server, typically on `http://localhost:5173` (this is the default port for Vite, but it might use the next available port if 5173 is busy). Look for a message in your terminal like `➜ Local: http://localhost:5173/`.
    ```bash
    npm run dev
    ```
    The application will automatically reload if you make changes to the source files.

5.  **Build for production:**
    This command compiles the application and bundles all static assets into a `dist` directory, optimized for production deployment.
    ```bash
    npm run build
    ```

6.  **Preview production build:**
    After building the project, you can preview the production build locally. This command starts a local static web server that serves the files from the `dist` directory.
    ```bash
    npm run preview
    ```
    This is useful for checking if the production build works as expected before deploying it.

## Available Scripts

In the project directory, you can run the following scripts using `npm`:

*   **`npm run dev`**
    *   Runs the app in development mode.
    *   Open [http://localhost:5173](http://localhost:5173) (or the port shown in your terminal, as Vite will automatically pick the next available one if 5173 is in use) to view it in your browser.
    *   The page will automatically reload if you make edits to the source code, and you will see any lint errors in the console.

*   **`npm run build`**
    *   Builds the app for production to the `dist` folder.
    *   It correctly bundles React in production mode and optimizes the build for the best performance. The build is minified, and filenames include hashes for long-term caching.

*   **`npm run preview`**
    *   Serves the production build from the `dist` folder locally.
    *   This command is useful for verifying that the production build is working correctly before deploying it to a live server. It's not a production server itself but a way to test the static files.

## Project Structure

This project follows a standard Vite + React project structure:

*   `public/`: Contains static assets that are served directly by the web server (e.g., `index.html` shell, favicons, some images).
*   `src/`: Contains all the source code for the application.
    *   `components/`: Contains reusable React components.
        *   `common/`: Basic, general-purpose UI elements like `Button.tsx`, `Modal.tsx`, `Input.tsx`, `Select.tsx`.
        *   `dashboard/`: Components specific to the dashboard feature.
        *   `file/`: Components related to file display and interaction (e.g., `FileListItem.tsx`).
        *   `notifications/`: Components for handling user notifications (e.g., `NotificationBell.tsx`).
        *   `charts/`: Components used for displaying charts (e.g., `SimpleBarChart.tsx`).
        *   `Layout.tsx`: The main layout component including Navbar and Sidebar.
        *   `Navbar.tsx`: The top navigation bar.
        *   `Sidebar.tsx`: The sidebar navigation menu.
        *   `ProtectedRoute.tsx`: Component to protect routes based on authentication and roles.
    *   `contexts/`: Contains global state management logic using React's Context API.
        *   `AuthContext.tsx`: Manages authentication, current user, and user management functions.
        *   `DataContext.tsx`: Manages core application data like files, offices, movements, etc.
        *   `SnackbarContext.tsx`: Manages UI snackbar notifications.
    *   `hooks/`: Contains custom React Hooks for reusable stateful logic (e.g., `useLocalStorage.ts`).
    *   `pages/`: Contains top-level components that represent different pages or views of the application.
        *   `Admin/`: Contains pages specific to the admin section of the application.
            *   `AuditLogPage.tsx`
            *   `OfficeManagementPage.tsx`
            *   `ReportingPage.tsx`
            *   `UserManagementPage.tsx`
            *   `WorkflowManagementPage.tsx`
        *   `DashboardPage.tsx`
        *   `FileDetailsPage.tsx`
        *   `LoginPage.tsx`
        *   `RegisterFilePage.tsx`
    *   `constants.ts`: Defines application-wide constants, including mock data, enum-like structures, and configuration values.
    *   `types.ts`: Contains TypeScript type definitions, interfaces, and enums used throughout the project.
    *   `App.tsx`: The root React component of the application. It sets up routing and global context providers.
    *   `index.tsx`: The main entry point of the application, responsible for rendering the `App` component into the DOM.
*   `.gitignore`: Specifies intentionally untracked files that Git should ignore.
*   `index.html`: The main HTML page that serves as the entry point for the Vite application.
*   `package.json`: Lists project dependencies, scripts, and other metadata.
*   `package-lock.json`: Records the exact versions of dependencies used.
*   `README.md`: This file, providing information about the project.
*   `tsconfig.json`: Configuration file for the TypeScript compiler.
*   `vite.config.ts`: Configuration file for Vite, the build tool and development server.

## Key Components and Contexts

Understanding these core parts of the application will help in navigating the codebase:

*   **`App.tsx`**: The main application component. It initializes `HashRouter` for client-side routing, wraps the application with global context providers (`AuthProvider`, `DataProvider`, `SnackbarProvider`), and establishes the primary `Layout` structure.

*   **`components/Layout.tsx`**: This component provides a consistent page structure for most views. It typically integrates the `Navbar` for top navigation and a `Sidebar` for main menu navigation, ensuring a unified user experience.

*   **`components/ProtectedRoute.tsx`**: A crucial component for access control. It wraps routes that require authentication, redirecting unauthenticated users to the login page. It also supports role-based authorization, ensuring that users can only access routes permitted by their assigned role (e.g., admin-only sections).

*   **Contexts (`src/contexts/` directory):**
    *   **`AuthContext.tsx`**: Centralizes all authentication-related logic. It manages the `currentUser` state, provides `login` and `logout` functions, and also holds the list of all `users` and functions for user management by administrators (`addUser`, `updateUser`, `deleteUser`).
    *   **`DataContext.tsx`**: Serves as a store for core application data. This includes managing lists of files, offices, file movement logs, and workflow templates. It provides functions to fetch, add, and update this data throughout the application.
    *   **`SnackbarContext.tsx`**: Offers a global mechanism for displaying temporary messages (snackbars or toasts) to the user. This is used for providing immediate feedback on actions, such as success confirmations or error alerts.

*   **Pages (`src/pages/` directory):**
    *   **`LoginPage.tsx`**: The page where users can authenticate themselves to access the application.
    *   **`DashboardPage.tsx`**: The primary landing page shown to users after they log in, typically displaying an overview or key information.
    *   **`RegisterFilePage.tsx`**: A form-based page allowing authenticated users to register new files into the system.
    *   **`FileDetailsPage.tsx`**: Displays comprehensive information about a single file, including its history, status, and associated metadata.
    *   **Admin Pages (`src/pages/Admin/`)**: This suite of pages provides administrative functionalities:
        *   **`UserManagementPage.tsx`**: Allows administrators to create, view, edit, and delete user accounts and manage their roles and office assignments.
        *   **`OfficeManagementPage.tsx`**: Enables administrators to manage the list of offices within the organization.
        *   **`AuditLogPage.tsx` (File Activity Log)**: Provides a log of significant activities and movements related to files within the system, crucial for tracking and auditing.
        *   **`ReportingPage.tsx`**: Offers tools for administrators to generate and view various reports based on system data.
        *   **`WorkflowManagementPage.tsx`**: Allows administrators to define and manage workflow templates that dictate how files move between offices or users for different processes.

## Admin Panel

The application includes a comprehensive admin panel accessible to users with the 'ADMIN' role. It provides tools for managing various aspects of the system, ensuring smooth operation and oversight. Access to these features is restricted via `ProtectedRoute` to ensure only authorized administrators can make changes or view sensitive information.

The admin panel consists of the following key sections:

*   **User Management (`/admin/users`):**
    *   View a list of all registered users in the system.
    *   Add new users, specifying their name, role (e.g., Admin, Office User), and assigning them to an office if applicable.
    *   Edit existing user details, including their name, role, and office assignment.
    *   Delete users from the system.

*   **Office Management (`/admin/offices`):**
    *   Manage the list of organizational offices or departments (e.g., IT Department, Human Resources, Finance Department, Records Unit).
    *   This section allows administrators to add new offices, update details of existing ones, and remove offices that are no longer needed. *(Functionality inferred from typical management pages)*

*   **Workflow Management (`/admin/workflows`):**
    *   Configure and manage predefined workflow templates for file movements.
    *   This involves defining sequences of offices or steps that a file should pass through for specific processes, streamlining routing and approvals. *(Functionality inferred from typical workflow management)*

*   **File Activity Log (`/admin/audit-log`):**
    *   Provides a detailed log of significant activities and events within the system.
    *   This includes tracking file registrations, movements between offices, status changes, and potentially other auditable user actions, which is crucial for transparency and accountability.

*   **Reports & Analytics (`/admin/reports`):**
    *   Generate and view various reports related to file tracking, user activity, office workloads, or other system metrics.
    *   These reports can help in monitoring system efficiency, identifying bottlenecks, and making data-driven decisions. *(Functionality inferred from typical reporting pages)*

```
