// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDU54WCOBHTLNXVqavXqD3-7PlH-BN0JZg",
    authDomain: "fir-maquillaje.firebaseapp.com",
    projectId: "fir-maquillaje",
    storageBucket: "fir-maquillaje.firebasestorage.app",
    messagingSenderId: "125900379034",
    appId: "1:125900379034:web:b90c95edfd51b12032a023"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// El resto del código de admin que te proporcioné...