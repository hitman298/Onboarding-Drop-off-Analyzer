# Onboarding Drop-off Analyzer

A clean, simple dashboard to help you understand where users leave your onboarding process and how to improve it with data-driven insights.

## What It Does

- Shows exactly where users drop off during onboarding with **interactive 3D and 2D funnel charts**.
- Analyzes user feedback using AI-powered sentiment analysis for a quick view of user experience.
- Provides key metrics like biggest drop-off step, conversion rates, and total users.
- Lets you upload your own onboarding data (CSV or JSON) from popular analytics tools or spreadsheets.
- Enables downloading detailed reports for sharing or further analysis.
- All features are accessible via a sidebar with sections for Dashboard, Funnels, Sessions, Reports, and Settings.
- 
## Live Demo

Check out the deployed app here:  

https://onboarding-drop-off-analyzer.onrender.com/

## How To Use

1. **Upload your data**  
   Click on "Upload Data" and select your exported CSV or JSON file from tools like Mixpanel or PostHog, or use sample files.

2. **Explore insights**  
   See where user drop-offs happen in the funnel, view sentiment of user feedback, and get conversion metrics.

3. **Switch between sections**  
   Use the sidebar to navigate without page reloads to Funnels, Sessions (with user feedback), Reports (for downloads), or Settings (for configurations).

4. **Download reports**  
   Export your funnel and sentiment analysis results as CSV files for reports or presentations.

5. **Clear or reset data**  
   You can clear uploaded data anytime, and your data persists even if you refresh the browser.

6. **Interact with 3D funnel**  
   Rotate by dragging, zoom with scroll, pan by holding CTRL and dragging to explore your onboarding funnel from all angles.

## Getting Your Data

- Export onboarding funnel data from analytics platforms like Mixpanel or PostHog in CSV or JSON format.
- Alternatively, create your own CSV/JSON files in Excel or any spreadsheet tool according to the sample format.
- Use the upload feature to test and analyze your data in the dashboard instantly.

## Technologies Used

| Feature                  | Tech/Library                         |
|--------------------------|------------------------------------|
| Frontend Framework       | React                              |
| 3D Visualization         | Three.js, @react-three/fiber, drei |
| Charts                   | Chart.js, react-chartjs-2          |
| Sentiment Analysis       | Hugging Face Inference API         |
| State Management         | React hooks (useState, useEffect) |
| Deployment               | Vercel                            |


## Screenshots

- Main Dashboard overview showing KPIs, 3D funnel, and sentiment panel.
- <img width="1919" height="894" alt="image" src="https://github.com/user-attachments/assets/8eea9528-55a1-4d0f-99b4-a1d126b2e7f2" />

- Funnel section with full 3D visualization.

  <img width="1880" height="880" alt="image" src="https://github.com/user-attachments/assets/d001a37c-c1da-4d41-bfd2-56b456a36858" />

- Reports section displaying download options and historical comparison tables.

- <img width="1884" height="889" alt="image" src="https://github.com/user-attachments/assets/97bbeb22-025a-4d25-8882-e85407638d01" />


This concise README provides a clear overview and easy-to-follow instructions to get started quickly, helping users and reviewers understand your project’s value effortlessly.
