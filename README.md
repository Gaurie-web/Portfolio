# Portfolio

An interactive 3D portfolio website, modeled in Blender and built with JavaScript.

🔗 **Live site:** https://gauriesharma.com

<img width="2048" height="2048" alt="Portfolio" src="https://github.com/user-attachments/assets/77dae95f-dd0e-4728-85d5-88261f099a2d" />


## About

This is my interactive 3D portfolio: a room I modeled in Blender and brought to life with Three.js and React. Instead of scrolling through a traditional page, visitors can explore the scene and click on objects to learn about me, see my experience and projects, open my resume, or get in touch. A few objects, like the cat and the piano, play sounds when clicked.


## Features

- Fully 3D environment you can explore in the browser
- Model exported from Blender as a Draco-compressed `.glb` to keep load times low
- Clickable interactive elements throughout the scene:
  - **About Me**: learn more about me
  - **My Resume**: view my resume
  - **My Projects**: browse my work
  - **Experience** and **Achievements**: timeline of my background and accomplishments
  - **LinkedIn** and **Gmail** logos: links to connect with me
- Sound interactions: click the **cat** and the **piano** to hear them play
- Responsive layout built with CSS Flexbox, so the site adapts to phones, tablets, and desktops
- Touch-friendly controls: drag to rotate and pinch to zoom on mobile
## Built With

- **Blender**: 3D modeling [and texturing/animation]
- **JavaScript**
- **glTF/GLB**: web-optimized 3D model format exported from Blender
- **Three.js**: 3D rendering in the browser
- **Vite**: development server and build tool
- **Netlify**: hosting

## Getting Started

To run the project locally:

```bash

# Create a production build
npm run build

# Preview the build locally
npm run preview
```

Then open `http://localhost:5173` (or whichever port your terminal shows).

## Project Structure

## Project Structure

```
portfolio/
├── public/
│   ├── draco/         # Draco decoder files for compressed models
│   ├── images/
│   ├── models/        # Blender scene exported as .glb
│   ├── sounds/
│   ├── textures/
│   └── resume.pdf
├── src/
│   ├── utils/
│   │   ├── calendarTexture.js   # Generates the calendar texture
│   │   └── OrbitControls.js     # Camera controls
│   ├── app.jsx
│   ├── main.jsx       # Entry point
│   ├── style.scss
│   ├── timeline.css
│   └── timeline.jsx   # Timeline component
├── index.html
├── package.json
└── Portfolio.svg
```

## What I Learned

- **Learning Blender from scratch:** I had never modeled in Blender before this project. I taught myself the workflow and went on to model detailed, intricate objects for the scene.
- **Three.js fundamentals:** I learned how Three.js works, from loading a Blender model into the browser to rendering the scene and handling user interaction.
- **Designing for intuition:** I experimented with color and object placement so visitors can tell what's clickable and find their way around without instructions.
- **Project management:** I planned and organized the work from start to finish, breaking the project into stages and seeing it through to a live, published site.

## Credits

- Youtube Tutorial: https://www.youtube.com/watch?v=AB6sulUMRGE&t=24676s
