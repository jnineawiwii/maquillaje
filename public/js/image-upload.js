// Función para subir imagen a Firebase Storage
async function subirImagen(file, productoId) {
    try {
        // Crear referencia en Storage
        const storageRef = firebase.storage().ref();
        const imageRef = storageRef.child(`productos/${productoId}/${file.name}`);
        
        // Subir archivo
        const snapshot = await imageRef.put(file);
        
        // Obtener URL de descarga
        const downloadURL = await snapshot.ref.getDownloadURL();
        
        console.log("✅ Imagen subida:", downloadURL);
        return downloadURL;
        
    } catch (error) {
        console.error("❌ Error subiendo imagen:", error);
        return null;
    }
}

// Función para agregar producto con imagen
async function agregarProductoConImagen(productoData, imagenFile) {
    try {
        // Primero agregar el producto para obtener ID
        const docRef = await db.collection('products').add(productoData);
        console.log("✅ Producto agregado con ID:", docRef.id);
        
        // Si hay imagen, subirla
        if (imagenFile) {
            const imageURL = await subirImagen(imagenFile, docRef.id);
            
            // Actualizar producto con la URL de la imagen
            if (imageURL) {
                await db.collection('products').doc(docRef.id).update({
                    image: imageURL
                });
                console.log("✅ Imagen actualizada en producto");
            }
        }
        
        return docRef.id;
        
    } catch (error) {
        console.error("❌ Error agregando producto:", error);
    }
}