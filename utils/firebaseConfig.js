// Import the functions you need from the Firebase SDK
const { initializeApp } = require('firebase/app');
const { getStorage } = require('firebase/storage');

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: 'AIzaSyDfNjPerjKYWE_jStD7xOpHBk8WX09beD0',
    authDomain: 'blockworkcloud.firebaseapp.com',
    projectId: 'blockworkcloud',
    storageBucket: 'blockworkcloud.appspot.com',
    messagingSenderId: '782440803834',
    appId: '1:782440803834:web:4a9c521bfb0a13b3574843',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Storage
const storage = getStorage(app);

module.exports = storage;
