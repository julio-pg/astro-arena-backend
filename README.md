# Astro-Arena-Backend

Welcome to the **Astro-Arena-Backend** repository! This is the server-side application built with **NestJS** that powers the Astro-Arena card game. The backend runs the AI model for the PC player, interacts with the frontend via **webhooks**, and uses **MongoDB** as the database to store game data, player information, and card collections. This repository works in collaboration with the [Astro-Arena Frontend](https://github.com/julio-pg/astro-arena-frontend).

> [!TIP]
> **Tip for Windows Users**: To avoid errors when running the AI model, it is recommended to use **Windows Subsystem for Linux (WSL)** for a smoother experience."

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Technologies Used](#technologies-used)
4. [Setup and Installation](#setup-and-installation)
5. [Running the Application](#running-the-application)
6. [AI Model Integration](#ai-model-integration)
7. [Webhooks and Frontend Interaction](#webhooks-and-frontend-interaction)
8. [Database](#database)
9. [Contributing](#contributing)
10. [License](#license)

---

## Overview

The Astro-Arena Backend is the backbone of the card game, handling game logic, player interactions, and AI-driven decisions for the PC player. It is built with **NestJS**, a progressive Node.js framework, and uses **MongoDB** for data storage. The backend also integrates an **AI model** to simulate the PC player's moves and communicates with the frontend via **webhooks** for real-time updates.

---

## Features

- **Game Logic**: Handles card battles, player turns, and game state management.
- **AI Model Integration**: Runs the AI model for the PC player's decision-making.
- **Webhook Support**: Enables real-time communication with the frontend.
- **Database Management**: Stores player data, card collections, and game history in MongoDB.
- **RESTful API**: Provides endpoints for frontend interactions.

---

## Technologies Used

- **Backend Framework**: NestJS
- **Database**: MongoDB
- **AI Model**: TensorFlow.js
- **API Communication**: Webhooks, REST API
- **Authentication**: JWT

---

## Setup and Installation

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/julio-pg/astro-arena-backend.git
   cd astro-arena-backend
   ```

2. **Install Dependencies**:

   ```bash
   pnpm install
   ```

3. **Set Up Environment Variables**:
   Create a `.env` file in the root directory and add the following variables:

   ```env
   DATABASE_URL=mongodb://your-mongodb-uri
   ```

4. **Run the Application**:
   ```bash
   pnpm run start
   ```

---

## Running the Application

- Start the development server:
  ```bash
  pnpm run start:dev
  ```
- The server will be running at `http://localhost:3000`.

---

## AI Model Integration

The backend runs an **AI model** to simulate the PC player's moves during battles. The model is integrated into the server and performs the following tasks:

- Analyzes the current game state.
- Predicts optimal moves based on card attributes and game rules.
- Sends the PC player's decisions back to the frontend via webhooks.

The AI model is loaded and executed on the server, ensuring low latency and seamless gameplay.

---

## Webhooks and Frontend Interaction

The backend communicates with the frontend using **webhooks** for real-time updates. Key interactions include:

- Receiving player moves and updating the game state.
- Sending battle results and game updates to the frontend.
- Triggering the AI model for the PC player's moves.

Ensure the frontend is configured to send and receive webhooks to/from the backend.

---

## Database

The backend uses **MongoDB** as the primary database to store:

- Player profiles and statistics.
- Card collections and attributes.
- Game history and battle logs.

The connection to MongoDB is configured using the `DATABASE_URL` environment variable.

---

## Contributing

We welcome contributions to the Astro-Arena-Backend! If you'd like to contribute, please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bugfix.
3. Commit your changes with clear and descriptive messages.
4. Submit a pull request.

Please ensure your code follows the project's coding standards and includes relevant tests.

---

## License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- Built with NestJS and MongoDB.
- Integrated with the [Astro-Arena Frontend](https://github.com/julio-pg/astro-arena-frontend).
- Special thanks to the open-source community for their invaluable tools and libraries.

---

Enjoy building and enhancing the Astro-Arena Backend! 🌌🚀
