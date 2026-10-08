import axiosInstance from "../utils/axiosInstance.js";
import {API_PATHS} from "../utils/apiPath.js";
import axios from "axios";

const getQuizzesForDocument = async (documentId) => {
   try {
       const response = await axiosInstance.get(API_PATHS.QUIZZERS.GET_QUIZZES_FOR_DOC(documentId));
       return response.data;
   } catch (error) {
       throw error.response?.data || {message: "Failed to fetch quizzes"};
   }
};

const getQuizById = async (quizId) => {
    try {
        const response = await axiosInstance.get(API_PATHS.QUIZZERS.GET_QUIZ_BY_ID(quizId));
        return response.data;
    } catch (error) {
        throw error.response?.data || {message: "Failed to fetch quiz"};
    }
};

const submitQuiz = async (quizId, answers) => {
    try {
        const response = await axiosInstance.post(API_PATHS.QUIZZERS.SUBMIT_QUIZ(quizId), {answers});
        return response.data;
    } catch (error) {
        throw error.response?.data || {message: "Failed to submit quiz"};
    }
};

const getQuizResults = async (quizzId) => {
    try {
        const response = await axiosInstance.get(API_PATHS.QUIZZERS.GET_QUIZ_RESULTS(quizzId));
        return response.data;
    } catch (error) {
        throw error.response?.data || {message: "Failed to fetch quiz results"};
    }
};

const deleteQuiz = async (quizId) => {
    try {
        const response = await axiosInstance.delete(API_PATHS.QUIZZERS.DELETE_QUIZ(quizId));
        return response.data;
    } catch(error) {
        throw error.response?.data || {message: "Failed to delete quiz"};
    }
};

const quizService = {
    getQuizzesForDocument,
    getQuizById,
    submitQuiz,
    getQuizResults,
    deleteQuiz,
};

export default quizService;
