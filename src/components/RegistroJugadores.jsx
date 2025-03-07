import React, { useState } from "react";
import { database } from '../../firebaseConfig';
import { ref, set } from "firebase/database";

const RegistroJugadores = () => {
  const [nombre, setNombre] = useState("");

  const handleRegistro = async () => {
    if (nombre.trim() === "") {
      alert("Por favor, ingresa un nombre.");
      return;
    }

    const jugadorId = Date.now(); // ID único basado en timestamp
    const jugadorRef = ref(database, `jugadores/${jugadorId}`);

    try {
      await set(jugadorRef, {
        nombre,
        listo: false,
      });
      alert("¡Registro exitoso!");
      setNombre("");
    } catch (error) {
      console.error("Error al registrar:", error);
      alert("Hubo un error. Intenta de nuevo.");
    }
  };

  return (
    <div>
      <h1>Registro de Jugadores</h1>
      <input
        type="text"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="Ingresa tu nombre"
      />
      <button onClick={handleRegistro}>Registrarse</button>
    </div>
  );
};

export default RegistroJugadores;
