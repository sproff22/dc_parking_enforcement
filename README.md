# CSE6242 DVA Group 103

This repository contains the dashboard frontend and data processing for our DC
parking enforcement project. **This is a draft** – we are currently working on
data collection, cleanup, and modeling and the UI is powered by mock data.

## Running the application

The user interface lives in the `ui/` directory and is built with Vite + React.
To run it locally:

```bash
cd ui
npm install        # install dependencies (requires Node.js/npm)
npm run start       # or `npm run dev`
```

The development server will start (usually at http://localhost:5173) and
automatically reload as you edit source files.

The Python/analysis code for loading and cleaning parking violations is in the
root and `data/` package, but at the moment it operates on placeholder data.
Once the real dataset is available we’ll update those scripts accordingly.

---

Feel free to update this README as the project evolves.
