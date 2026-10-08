import axiosInstance from "../utils/axiosInstance.js";
import {API_PATHS} from "../utils/apiPath.js";

const generateFlashcards = async (documentId, options) => {
    try {
        const response = await axiosInstance.post(API_PATHS.AI.GENERATE_FLASHCARDS, {documentId, ...options});
        return response.data;
    } catch (error) {
        throw error.response?.data || {message: "Failed to generate flashcards"};
    }
};

const generateQuiz = async (documentId, options) => {
    try {
        const response = await axiosInstance.post(API_PATHS.AI.GENERATE_QUIZ, {documentId, ...options});
        return response.data;
    } catch (error) {
        throw error.response?.data || {message: "Failed to generate quiz"};
    }
};

const generateSummary = async (documentId) => {
    try {
        const response = await axiosInstance.post(API_PATHS.AI.GENERATE_SUMMARY, {documentId});
        return response.data?.data;
    } catch(error) {
        throw error.response?.data || {mesage: "Failed to generate summary"};
    }
};

const chat = async (documentId, messages) => {
    try {
        const response = await axiosInstance.post(API_PATHS.AI.CHAT, {documentId, question: messages});
        return response.data;
    } catch (error) {
        throw error.response?.data || {message: "Failed to chat with AI"};
    }
};

const explainConcept = async (documentId, concept) => {
    try {
        const response = await axiosInstance.post(API_PATHS.AI.EXPLAIN_CONCEPT, {documentId, concept});
        return response.data;
    } catch(error) {
        throw error.response?.data || {message: "Failed to explain concept"};
    }
};

const getChatHistory = async (documentId) => {
    try {
        const response = await axiosInstance.post(API_PATHS.AI.GET_CHAT_HISTORY(documentId));
        return response.data;
    } catch(error) {
        throw error.response?.data || {message: "Failed to get chat history"};
    }
};

const aiServices = {
    generateFlashcards,
    generateQuiz,
    generateSummary,
    chat,
    explainConcept,
    getChatHistory,
};

export default aiServices;