import React, { useState } from 'react';
import { database } from '../../firebaseConfig';
import { ref, set } from 'firebase/database';

const AdminControls = () => {
  const [codigoAdmin, setCodigoAdmin] = useState('');

  const iniciarSorteo = async () => {
    if (codigoAdmin !== 'admin123') { // Código secreto simple
      alert('Código de admin incorrecto.');
      return;
    }

    const torneoRef = ref(database, 'torneo');
    try {
      await set(torneoRef, { estado: 'en curso' });
      alert('Sorteo iniciado.');
    } catch (error) {
      console.error('Error al iniciar sorteo:', error);
    }
  };

  return (
    <div>
      <h2>Controles de Admin</h2>
      <input
        type="password"
        value={codigoAdmin}
        onChange={(e) => setCodigoAdmin(e.target.value)}
        placeholder="Código de admin"
      />
      <button onClick={iniciarSorteo}>Iniciar Sorteo</button>
    </div>
  );
};

export default AdminControls;