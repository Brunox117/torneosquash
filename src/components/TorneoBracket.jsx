import React, { useEffect, useState } from 'react';
import { database } from '../../firebaseConfig'; // Asegúrate de que la ruta sea correcta
import { ref, onValue, set, update } from 'firebase/database';
import '../styles/TorneoBracket.css';

const TorneoBracket = () => {
  const [jugadores, setJugadores] = useState([]);
  const [bracket, setBracket] = useState(null);
  const [adminCode, setAdminCode] = useState('admin123');

  // Cargar jugadores y bracket desde Firebase
  useEffect(() => {
    const jugadoresRef = ref(database, 'jugadores');
    const bracketRef = ref(database, 'bracket');

    onValue(jugadoresRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const jugadoresList = Object.entries(data).map(([id, jugador]) => ({
          id,
          ...jugador,
        }));
        setJugadores(jugadoresList);
      }
    });

    onValue(bracketRef, (snapshot) => {
      const bracketData = snapshot.val();
      setBracket(bracketData);
    });
  }, []);

  // Generar bracket con bracket-generator
  const generarBracket = () => {
    if (adminCode !== 'admin123') {
      alert('Código de admin incorrecto');
      return;
    }
    
    // Verificar que tengamos suficientes jugadores
    if (!jugadores.length || jugadores.length < 4) {
      alert('Se necesitan al menos 4 jugadores para generar un bracket');
      return;
    }
    
    // Mezclar aleatoriamente los jugadores
    const jugadoresMezclados = [...jugadores].sort(() => Math.random() - 0.5);
    
    // Calcular el número de rondas necesarias basado en la cantidad de jugadores
    const totalJugadores = jugadoresMezclados.length;
    const numRondas = Math.ceil(Math.log2(totalJugadores));
    
    // Crear la estructura del bracket
    const nuevoBracket = {
      winners: {
        rondas: []
      },
      losers: {
        rondas: []
      },
      configuracion: {
        finalAlMejorDe: 5,
        partidasAlMejorDe: 3
      }
    };
    
    // Generar la primera ronda del winners bracket
    const primeraRonda = [];
    
    // Crear los emparejamientos iniciales
    for (let i = 0; i < totalJugadores; i += 2) {
      if (i + 1 < totalJugadores) {
        // Crear un partido con dos jugadores
        primeraRonda.push({
          id: `w_r1_m${i/2 + 1}`,
          jugador1: {
            id: jugadoresMezclados[i].id,
            nombre: jugadoresMezclados[i].nombre
          },
          jugador2: {
            id: jugadoresMezclados[i + 1].id,
            nombre: jugadoresMezclados[i + 1].nombre
          },
          resultado: {
            jugador1: 0,
            jugador2: 0,
            ganador: null,
            completado: false
          }
        });
      } else {
        // Si hay un número impar de jugadores, el último recibe un bye
        primeraRonda.push({
          id: `w_r1_m${i/2 + 1}`,
          jugador1: {
            id: jugadoresMezclados[i].id,
            nombre: jugadoresMezclados[i].nombre
          },
          jugador2: {
            id: 'bye',
            nombre: 'Bye'
          },
          resultado: {
            jugador1: 2,
            jugador2: 0,
            ganador: jugadoresMezclados[i].id,
            completado: true
          }
        });
      }
    }
    
    nuevoBracket.winners.rondas.push(primeraRonda);
    
    // Generar las siguientes rondas del winners bracket (vacías)
    for (let r = 1; r < numRondas; r++) {
      const ronda = [];
      const numPartidos = Math.max(1, Math.pow(2, numRondas - r - 1));
      
      for (let m = 0; m < numPartidos; m++) {
        ronda.push({
          id: `w_r${r+1}_m${m+1}`,
          jugador1: {
            id: null,
            nombre: 'Por determinar'
          },
          jugador2: {
            id: null,
            nombre: 'Por determinar'
          },
          resultado: {
            jugador1: 0,
            jugador2: 0,
            ganador: null,
            completado: false
          }
        });
      }
      nuevoBracket.winners.rondas.push(ronda);
    }
    
    // Configurar el losers bracket con rondas vacías
    // El número de rondas del losers bracket es aproximadamente el doble del winners bracket
    const numRondasLosers = numRondas * 2 - 1;
    
    for (let r = 0; r < numRondasLosers; r++) {
      const ronda = [];
      // El número de partidos varía según la ronda en el losers bracket
      let numPartidos;
      
      if (r % 2 === 0) {
        // Rondas pares: reciben a los perdedores del winners bracket
        numPartidos = Math.max(1, Math.pow(2, Math.floor((numRondas - r/2) - 1)));
      } else {
        // Rondas impares: enfrentamientos entre los ganadores de la ronda anterior
        numPartidos = Math.max(1, Math.pow(2, Math.floor((numRondas - (r+1)/2) - 1)));
      }
      
      for (let m = 0; m < numPartidos; m++) {
        ronda.push({
          id: `l_r${r+1}_m${m+1}`,
          jugador1: {
            id: null,
            nombre: 'Por determinar'
          },
          jugador2: {
            id: null,
            nombre: 'Por determinar'
          },
          resultado: {
            jugador1: 0,
            jugador2: 0,
            ganador: null,
            completado: false
          }
        });
      }
      nuevoBracket.losers.rondas.push(ronda);
    }
    
    // Agregar la gran final (al mejor de 5)
    nuevoBracket.final = {
      id: 'final',
      jugador1: {
        id: null,
        nombre: 'Ganador Winners Bracket'
      },
      jugador2: {
        id: null,
        nombre: 'Ganador Losers Bracket'
      },
      resultado: {
        jugador1: 0,
        jugador2: 0,
        ganador: null,
        completado: false
      },
      alMejorDe: 5
    };

    const bracketRef = ref(database, 'bracket');
    set(bracketRef, nuevoBracket)
      .then(() => alert('Bracket generado exitosamente'))
      .catch(error => console.error('Error al guardar bracket:', error));
  };

  // Función para actualizar el resultado de un partido
  const actualizarResultado = (tipo, rondaIndex, partidoId, resultado) => {
    if (adminCode !== 'admin123') {
      alert('Código de admin incorrecto para actualizar resultados');
      return;
    }
    
    if (!bracket) return;
    
    const bracketActualizado = { ...bracket };
    let partido;
    
    // Encontrar y actualizar el partido correspondiente
    if (tipo === 'winners') {
      partido = bracketActualizado.winners.rondas[rondaIndex].find(p => p.id === partidoId);
    } else if (tipo === 'losers') {
      partido = bracketActualizado.losers.rondas[rondaIndex].find(p => p.id === partidoId);
    } else if (tipo === 'final') {
      partido = bracketActualizado.final;
    }
    
    if (!partido) return;
    
    // Actualizar el resultado
    partido.resultado = resultado;
    
    // Si el partido está completado, actualizar los siguientes partidos
    if (resultado.completado) {
      actualizarSiguientesPartidos(bracketActualizado, tipo, rondaIndex, partidoId, resultado.ganador);
    }
    
    // Guardar en Firebase
    const bracketRef = ref(database, 'bracket');
    update(bracketRef, bracketActualizado)
      .then(() => alert('Resultado actualizado exitosamente'))
      .catch(error => console.error('Error al actualizar resultado:', error));
  };
  
    const actualizarSiguientesPartidos = (bracket, tipo, rondaIndex, partidoId, ganadorId) => {
    let jugadorGanador;
    
    if (tipo === 'winners') {
      const partido = bracket.winners.rondas[rondaIndex].find(p => p.id === partidoId);
      jugadorGanador = partido.resultado.ganador === partido.jugador1.id ? 
        partido.jugador1 : partido.jugador2;

      // Actualizar siguiente partido en winners
      if (rondaIndex < bracket.winners.rondas.length - 1) {
        const nextRonda = bracket.winners.rondas[rondaIndex + 1];
        const matchNumber = parseInt(partidoId.split('_m')[1]);
        const nextMatchIndex = Math.floor((matchNumber - 1) / 2);
        
        if (nextRonda[nextMatchIndex]) {
          if (matchNumber % 2 === 1) {
            nextRonda[nextMatchIndex].jugador1 = jugadorGanador;
          } else {
            nextRonda[nextMatchIndex].jugador2 = jugadorGanador;
          }
        }
      }

      // Actualizar losers bracket
      const perdedor = partido.resultado.ganador === partido.jugador1.id ? 
        partido.jugador2 : partido.jugador1;
      
      const loserRondaIndex = rondaIndex === 0 ? 0 : rondaIndex * 2 - 1;
      if (bracket.losers.rondas[loserRondaIndex]) {
        const loserMatchIndex = Math.floor((parseInt(partidoId.split('_m')[1]) - 1) / 2);
        
        if (bracket.losers.rondas[loserRondaIndex][loserMatchIndex]) {
          const loserPartido = bracket.losers.rondas[loserRondaIndex][loserMatchIndex];
          
          if (!loserPartido.jugador1.id || loserPartido.jugador1.id === 'bye') {
            loserPartido.jugador1 = perdedor;
          } else {
            loserPartido.jugador2 = perdedor;
          }
        }
      }
    } 
    else if (tipo === 'losers') {
      const partido = bracket.losers.rondas[rondaIndex].find(p => p.id === partidoId);
      jugadorGanador = partido.resultado.ganador === partido.jugador1.id ? 
        partido.jugador1 : partido.jugador2;

      // Calcular siguiente ronda en losers
      const nextRondaIndex = rondaIndex + 1;
      if (nextRondaIndex < bracket.losers.rondas.length) {
        const nextMatchIndex = Math.floor((parseInt(partidoId.split('_m')[1]) - 1) / 2);
        
        if (bracket.losers.rondas[nextRondaIndex][nextMatchIndex]) {
          const nextPartido = bracket.losers.rondas[nextRondaIndex][nextMatchIndex];
          
          if (rondaIndex % 2 === 0) {
            nextPartido.jugador1 = jugadorGanador;
          } else {
            if (nextMatchIndex % 2 === 0) {
              nextPartido.jugador1 = jugadorGanador;
            } else {
              nextPartido.jugador2 = jugadorGanador;
            }
          }
        }
      }
    }
  };

  // Componente para los controles de admin
  const AdminControls = ({ partido, adminCode, actualizarResultado, tipo, rondaIndex }) => {
    const [puntosJ1, setPuntosJ1] = useState(partido.resultado.jugador1);
    const [puntosJ2, setPuntosJ2] = useState(partido.resultado.jugador2);
    const [mostrarControles, setMostrarControles] = useState(false);
    
    const guardarResultado = () => {
      const mejorDe = tipo === 'final' ? 5 : 3;
      const puntosParaGanar = Math.ceil(mejorDe / 2);
      
      // Validar que alguno haya alcanzado los puntos para ganar
      if (puntosJ1 < puntosParaGanar && puntosJ2 < puntosParaGanar) {
        alert(`Un jugador debe alcanzar al menos ${puntosParaGanar} puntos para ganar`);
        return;
      }
      
      // Validar que no ambos tengan suficientes puntos
      if (puntosJ1 >= puntosParaGanar && puntosJ2 >= puntosParaGanar) {
        alert('Ambos jugadores no pueden ganar');
        return;
      }
      
      // Determinar el ganador
      const ganadorId = puntosJ1 > puntosJ2 ? partido.jugador1.id : partido.jugador2.id;
      
      // Crear objeto de resultado
      const nuevoResultado = {
        jugador1: puntosJ1,
        jugador2: puntosJ2,
        ganador: ganadorId,
        completado: true
      };
      
      // Actualizar en la base de datos
      actualizarResultado(tipo, rondaIndex, partido.id, nuevoResultado);
    };
    
    if (!mostrarControles) {
      return (
        <button onClick={() => setMostrarControles(true)}>
          Actualizar Resultado
        </button>
      );
    }
    
    return (
      <div className="admin-controls">
        <div>
          <label>
            {partido.jugador1.nombre}:
            <input
              type="number"
              min="0"
              max={tipo === 'final' ? '3' : '2'}
              value={puntosJ1}
              onChange={e => setPuntosJ1(parseInt(e.target.value))}
            />
          </label>
          <label>
            {partido.jugador2.nombre}:
            <input
              type="number"
              min="0"
              max={tipo === 'final' ? '3' : '2'}
              value={puntosJ2}
              onChange={e => setPuntosJ2(parseInt(e.target.value))}
            />
          </label>
        </div>
        <div className="admin-buttons">
          <button onClick={guardarResultado}>Guardar</button>
          <button onClick={() => setMostrarControles(false)}>Cancelar</button>
        </div>
      </div>
    );
  };

  return (
    <div className="torneo-bracket" style={{ padding: '20px' }}>
      <h1>Bracket del Torneo de Squash</h1>

      {/* Sección de Admin */}
      {!bracket && (
        <div className="admin-controls">
          <h2>Iniciar torneo</h2>
          <input
            type="password"
            value={adminCode}
            onChange={(e) => setAdminCode(e.target.value)}
            placeholder="Código de admin"
          />
          <button onClick={generarBracket}>Generar Bracket</button>
        </div>
      )}

      {/* Mostrar Bracket */}
      {bracket && (
        <div>
          <div className="winners-bracket">
            <h2>Bracket de Ganadores</h2>
            <div className="bracket-container">
              {bracket.winners.rondas.map((ronda, rondaIndex) => (
                <div key={`w-ronda-${rondaIndex}`} className="ronda">
                  <h3>Ronda {rondaIndex + 1}</h3>
                  <div className="partidos">
                    {ronda.map((partido) => (
                      <div key={partido.id} className="partido">
                        <div className="match-card">
                          <div className={`jugador ${partido.resultado.ganador === partido.jugador1.id ? 'ganador' : ''}`}>
                            <span>{partido.jugador1.nombre || 'TBD'}</span>
                            <span className="score">{partido.resultado.jugador1}</span>
                          </div>
                          <div className={`jugador ${partido.resultado.ganador === partido.jugador2.id ? 'ganador' : ''}`}>
                            <span>{partido.jugador2.nombre || 'TBD'}</span>
                            <span className="score">{partido.resultado.jugador2}</span>
                          </div>
                          {partido.resultado.completado ? (
                            <div className="resultado-final">
                              Ganador: {partido.resultado.ganador === partido.jugador1.id 
                                ? partido.jugador1.nombre 
                                : partido.jugador2.nombre}
                            </div>
                          ) : (
                            <AdminControls 
                              partido={partido} 
                              adminCode={adminCode} 
                              actualizarResultado={actualizarResultado}
                              tipo="winners"
                              rondaIndex={rondaIndex}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="losers-bracket">
            <h2>Bracket de Perdedores</h2>
            <div className="bracket-container">
              {bracket.losers.rondas.map((ronda, rondaIndex) => (
                <div key={`l-ronda-${rondaIndex}`} className="ronda">
                  <h3>Ronda {rondaIndex + 1}</h3>
                  <div className="partidos">
                    {ronda.map((partido) => (
                      <div key={partido.id} className="partido">
                        <div className="match-card">
                          <div className={`jugador ${partido.resultado.ganador === partido.jugador1.id ? 'ganador' : ''}`}>
                            <span>{partido.jugador1.nombre || 'TBD'}</span>
                            <span className="score">{partido.resultado.jugador1}</span>
                          </div>
                          <div className={`jugador ${partido.resultado.ganador === partido.jugador2.id ? 'ganador' : ''}`}>
                            <span>{partido.jugador2.nombre || 'TBD'}</span>
                            <span className="score">{partido.resultado.jugador2}</span>
                          </div>
                          {partido.resultado.completado ? (
                            <div className="resultado-final">
                              Ganador: {partido.resultado.ganador === partido.jugador1.id 
                                ? partido.jugador1.nombre 
                                : partido.jugador2.nombre}
                            </div>
                          ) : (
                            <AdminControls 
                              partido={partido} 
                              adminCode={adminCode} 
                              actualizarResultado={actualizarResultado}
                              tipo="losers"
                              rondaIndex={rondaIndex}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Gran Final */}
          <div className="gran-final">
            <h2>Gran Final (Al mejor de 5)</h2>
            <div className="partido final">
              <div className="match-card">
                <div className={`jugador ${bracket.final.resultado.ganador === bracket.final.jugador1.id ? 'ganador' : ''}`}>
                  <span>{bracket.final.jugador1.nombre}</span>
                  <span className="score">{bracket.final.resultado.jugador1}</span>
                </div>
                <div className={`jugador ${bracket.final.resultado.ganador === bracket.final.jugador2.id ? 'ganador' : ''}`}>
                  <span>{bracket.final.jugador2.nombre}</span>
                  <span className="score">{bracket.final.resultado.jugador2}</span>
                </div>
                {bracket.final.resultado.completado ? (
                  <div className="resultado-final">
                    Campeón: {bracket.final.resultado.ganador === bracket.final.jugador1.id 
                      ? bracket.final.jugador1.nombre 
                      : bracket.final.jugador2.nombre}
                  </div>
                ) : (
                  <AdminControls 
                    partido={bracket.final} 
                    adminCode={adminCode} 
                    actualizarResultado={actualizarResultado}
                    tipo="final"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TorneoBracket;