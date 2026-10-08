import React from 'react';
import {BrowserRouter as Router , Routes, Route, Navigate} from 'react-router-dom';
import LoginPage from "./pages/Auth/LoginPage.tsx";
import RegisterPage from "./pages/Auth/RegisterPage.tsx";
import NotFoundPage from "./pages/NotFoundPage.tsx";
import DashboardPage from "./pages/Dashboard/DashboardPage.tsx";
import DocumentListPage from "./pages/Documents/DocumentListPage.tsx";
import DocumentDetailPage from "./pages/Documents/DocumentDetailPage.tsx";
import FlashCardListPage from "./pages/FlashCards/FlashCardListPage.tsx";
import FlashcardPage from "./pages/FlashCards/FlashcardPage.tsx";
import QuizTakePage from "./pages/Quizzes/QuizTakePage.tsx";
import QuizResultPage from "./pages/Quizzes/QuizResultPage.tsx";
import ProfilePage from "./pages/Profile/ProfilePage.tsx";
import ProtectedRoute from "./components/auth/ProtectedRoute.tsx";
import {useAuth} from "./context/AuthContext.tsx";
function App(props) {
    const {isAuthenticated,loading} = useAuth();

    if(loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p>Loading...</p>
            </div>
        );
    }
    return (
        <Router>
            <Routes>
                <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace/> : <Navigate to="/login" replace />} />

                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/*Protected Routes*/}
                <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/documents" element={<DocumentListPage />} />
                    <Route path="/documents/:id" element={<DocumentDetailPage />} />
                    <Route path="/flashcards" element={<FlashCardListPage />} />
                    <Route path="/documents/:id/flashcards" element={<FlashcardPage />} />
                    <Route path="/quizzes/:quizId" element={<QuizTakePage />} />
                    <Route path="/quizzes/:quizId/results" element={<QuizResultPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                </Route>

                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </Router>
    );
}

export default App;