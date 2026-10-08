# AI Learning Assistant

An intelligent, full-stack educational web application designed to enhance the learning experience. By leveraging the power of Google's Gemini AI, this platform allows users to upload PDF documents and automatically generates interactive study materials, making learning faster, easier, and more engaging.

## 🚀 Features

- **Document Management**: Securely upload and manage your educational PDF materials.
- **AI-Powered Flashcards**: Automatically generate flashcards with varying difficulty levels based on document context. Includes features like marking cards for review and starring important concepts.
- **Automated Quizzes**: Generate multiple-choice quizzes to test your comprehension. The system provides immediate feedback and explanations for the correct answers.
- **Document Summarization**: Instantly extract key concepts and main ideas from lengthy texts.
- **Contextual AI Chat**: Ask questions directly related to the uploaded document, and the AI will provide answers based *only* on the provided context.
- **Concept Explanation**: Select a complex concept from the text and get a simplified, educational explanation.
- **Dashboard & Progress Tracking**: Keep track of your learning streak, reviewed flashcards, quiz scores, and recent activities.

## 🎯 Target Audience

This application is built for:
- **Students** looking to prepare for exams efficiently and automate their study workflows.
- **Educators** who want to quickly generate study materials, flashcards, and quizzes for their classes.
- **Professionals** needing to rapidly digest long reports, documentation, or technical manuals.
- **Lifelong Learners** who want to maximize their comprehension and retention of new subjects.

## 💻 Technologies Used

### Frontend
- **React.js** - UI Library for building the interactive interfaces
- **Tailwind CSS** - Modern, utility-first CSS framework for responsive design
- **React Router** - Client-side routing and navigation
- **Lucide React** - Clean and consistent iconography
- **Axios** - HTTP client for API requests
- **React Hot Toast** - Beautiful, customizable toast notifications

### Backend
- **Node.js & NestJS** - Fast and scalable RESTful API server
- **PostgreSQL & Prisma** - Relational database and modern ORM
- **Google Generative AI (Gemini 1.5 Flash)** - Core AI engine for generating educational content
- **JWT (JSON Web Tokens)** - Secure, stateless user authentication
- **Multer** - Middleware for handling multipart/form-data and PDF file uploads
- **Custom Text Chunker & PDF Parser** - Utilities for extracting and chunking text from uploaded files to provide accurate AI context

### Testing
- **Mocha** - Feature-rich test framework for Node.js
- **Chai** - BDD / TDD assertion library for clear and readable tests
- **Sinon.JS** - Standalone test spies, stubs, and mocks
- **Supertest** - High-level abstraction for testing Node.js HTTP servers

## 🧪 Backend API Testing

The backend is equipped with a comprehensive suite of integration and unit tests to ensure API reliability and correctness. These tests are built using **Mocha**, **Chai**, and **Supertest**.

### Running the Tests

To run the test suite locally, navigate to the `backend` directory and execute the following command:

```bash
npm test
```

This command will run all test files located in the `backend/test` directory.

### Continuous Integration

All tests are automatically executed on every `push` and `pull request` to the main branches using **GitHub Actions**. This CI pipeline ensures that new changes do not break existing functionality and maintains the overall quality of the codebase.

## 🛠️ Getting Started

### Prerequisites
- Node.js (v16+)
- PostgreSQL instance (local or cloud-based)
- Google Gemini API Key
- **Docker & Docker Compose** (Optional, for containerized setup)

### 🐳 Running with Docker (Recommended)

The easiest way to run the entire application stack is using Docker Compose.

1. **Setup Environment Variables:**
   - Create a `.env` file in the `backend` folder containing your `GEMINI_API_KEY` and `JWT_SECRET`.
   - Create a `db.env` file in the root folder with your PostgreSQL credentials (if required by your configuration).
2. **Start the application:**
   - From the root directory of the project, run:
     ```bash
     docker-compose up -d --build
     ```
3. **Access the application:**
   - Frontend: `http://localhost:3000` (or `http://localhost:5173` depending on your Vite/React config)
   - Backend API: `http://localhost:8000`

### 💻 Manual Installation

1. **Clone the repository**
2. **Setup Backend:**
   - Navigate to the `backend` directory.
   - Run `npm install`.
   - Create a `.env` file with your `DATABASE_URL`, `JWT_SECRET`, `PORT`, and `GEMINI_API_KEY`.
   - Start the server using `npm run dev` or `npm start`.
3. **Setup Frontend:**
   - Navigate to the frontend directory (`frontend/ai-learning-assistant`).
   - Run `npm install`.
   - Start the development server using `npm run dev`.

---
*Built as a modern solution for AI-assisted learning.*