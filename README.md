
  # Digital Time Capsule App

  This is a code bundle for Digital Time Capsule App. The original project is available at https://www.figma.com/design/H7IarVQ6e6J1VPqsUpuF8M/Digital-Time-Capsule-App.

  ## Environment Setup

  Before running the application, you need to configure your environment variables:

  1. Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```

  2. Update the `.env` file with your Supabase credentials:
     ```
     VITE_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
     VITE_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
     VITE_PUBLIC_PROJECT_ID=YOUR_PROJECT_ID
     ```

  **Note:** The `.env` file is listed in `.gitignore` to keep your secrets safe. Never commit it to version control.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.
  