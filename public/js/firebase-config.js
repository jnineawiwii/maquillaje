// js/firebase-config.js
console.log("🔥 Cargando configuración de Firebase...");

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDU54WCOBHTLNXVqavXqD3-7PlH-BN0JZg",
    authDomain: "fir-maquillaje.firebaseapp.com",
    projectId: "fir-maquillaje",
    storageBucket: "fir-maquillaje.firebasestorage.app",
    messagingSenderId: "125900379034",
    appId: "1:125900379034:web:b90c95edfd51b12032a023",
    measurementId: "G-BB8FL9XJXS"
};

// Verificar que Firebase SDK esté cargado
if (typeof firebase === 'undefined') {
    console.error('❌ Firebase SDK no está cargado. Asegúrate de incluir los scripts de Firebase.');
} else {
    // Inicializar Firebase solo si no está inicializado
    if (!firebase.apps.length) {
        try {
            firebase.initializeApp(firebaseConfig);
            console.log("✅ Firebase inicializado correctamente");
        } catch (error) {
            console.error('❌ Error inicializando Firebase:', error);
        }
    } else {
        console.log("ℹ️ Firebase ya estaba inicializado");
        firebase.app(); // Usar la app existente
    }
}

// Inicializar servicios - disponibles globalmente
let db, auth, storage;
if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
    try {
        db = firebase.firestore();
        auth = firebase.auth();
        if (typeof firebase.storage !== 'undefined') {
            storage = firebase.storage();
        }
        console.log("✅ Servicios de Firebase inicializados");
    } catch (error) {
        console.error('❌ Error inicializando servicios de Firebase:', error);
    }
} else {
    console.error('❌ Firebase no está disponible para inicializar servicios');
}