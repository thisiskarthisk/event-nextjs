# Events

The event management process includes setting up an event, defining related activities, and registering delegates via QR code scanning. First, the event is created with details like name and date. Next, various activities are added for participants. Delegates then check in by scanning a QR code using a web camera. Finally, attendance is tracked based on successful QR code scans.


## 🚀 Project Overview

| Detail | Description |
| --- | --- |
| Application Framework | Next.js v15.5.4 — using the **App Router** architecture |
| Port | 42413 |
| Primary UI Framework | AdminLTE — extracted and placed under `public/assets` |

## 📁 Folder Structure

| Path | Description |
| --- | --- |
| `src/app/api` | Backend API routes |
| `src/app/*` | Application pages (other than API routes) |
| `src/components` | Reusable UI components |
| `src/db` | Database configuration and query files |
| `src/helper` | Utility and helper functions |
| `src/i18n` | Translations and localization files |
| `src/constants.js` | Global constants |

## Development Setup

1. Clone the repository and install dependencies:

    ```
    npm install
    ```

2. Create an environment file and add credentials:

    ```
    cp sample.env .env.dev
    ```

3. Start the development server:

    ```
    npm run dev
    ```

## Deployment Setup

1. Install **PM2** (Process Manager for Node.js):

    ```
    npm install -g pm2
    ```

2. Create a production environment file:

    ```
    cp sample.env .env.production
    ```

3. Build the project:

    ```
    npm run build
    ```

4. Start the application using PM2:

    ```
    pm2 start npm --name dwm -- start
    ```

5. Enable auto-start on server boot and save the configuration:

    ```
    pm2 startup
    pm2 save
    ```
