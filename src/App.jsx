import './App.css'
import React, { useState, useEffect } from 'react';
import { database } from '../../torneosquash/firebaseConfig';
import { ref, onValue } from 'firebase/database';
import RegistroJugadores from './components/RegistroJugadores';
import ListaJugadores from './components/ListaJugadores';
import AdminControls from './components/AdminControls';
import TorneoBracket from './components/TorneoBracket';

const App = () => {
  const [torneoIniciado, setTorneoIniciado] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const torneoRef = ref(database, 'torneo');
    const unsubscribe = onValue(torneoRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setTorneoIniciado(data.estado === 'en curso');
      } else {
        setTorneoIniciado(false);
      }
      setCargando(false);
    });

    return () => unsubscribe();
  }, []);

  if (cargando) {
    return <div>Cargando...</div>;
  }

  return (
    <div>
      <h1>Torneo de Squash</h1>
      {!torneoIniciado ? (
        <>
          <RegistroJugadores />
          <ListaJugadores />
          <AdminControls onIniciarTorneo={() => setTorneoIniciado(true)} />
        </>
      ) : (
        <TorneoBracket />
      )}
    </div>
  );
};

export default App;