import React, { useState, useEffect } from 'react';
import { database } from '../../firebaseConfig';
import { ref, onValue, update } from 'firebase/database';

const ListaJugadores = () => {
  const [jugadores, setJugadores] = useState([]);

  useEffect(() => {
    const jugadoresRef = ref(database, 'jugadores');
    onValue(jugadoresRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const jugadoresList = Object.entries(data).map(([id, jugador]) => ({
          id,
          ...jugador,
        }));
        setJugadores(jugadoresList);
      } else {
        setJugadores([]);
      }
    });
  }, []);

  const handleListo = async (id) => {
    const jugadorRef = ref(database, `jugadores/${id}`);
    try {
      await update(jugadorRef, { listo: true });
    } catch (error) {
      console.error('Error al actualizar:', error);
    }
  };

  return (
    <div>
      <h2>Jugadores Inscritos</h2>
      <ul>
        {jugadores.map((jugador) => (
          <li key={jugador.id}>
            {jugador.nombre} - {jugador.listo ? 'Listo' : 'No listo'}
            {!jugador.listo && (
              <button onClick={() => handleListo(jugador.id)}>Estoy listo</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ListaJugadores;