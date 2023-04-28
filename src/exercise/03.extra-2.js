// useContext: Caching response data in context
// 💯 caching in a context provider (exercise)
// http://localhost:3000/isolated/exercise/03.extra-2.js

// you can edit this here and look at the isolated page or you can copy/paste
// this in the regular exercise file.

import * as React from 'react'
import {
  fetchPokemon,
  PokemonForm,
  PokemonDataView,
  PokemonInfoFallback,
  PokemonErrorBoundary,
} from '../pokemon'
import {useAsync} from '../utils'

const PokemonCacheContext = React.createContext();

function usePokemonCache() {
  const context = React.useContext(PokemonCacheContext);
  if (!context) {
    throw new Error('usePokemonCache may only be used from within a (child of a) PokemonCacheProvider.')
  }

  return context;
}

function PokemonCacheProvider(props) {
  const [cache, dispatch] = React.useReducer(pokemonCacheReducer, {})

  return <PokemonCacheContext.Provider value={[cache, dispatch]} children={props.children} />
} 

function pokemonCacheReducer(state, action) {
  switch (action.type) {
    case 'ADD_POKEMON': {
      return {...state, [action.pokemonName]: action.pokemonData}
    }
    default: {
      throw new Error(`Unhandled action type: ${action.type}`)
    }
  }
}

function PokemonInfo({pokemonName}) {
  const [cache, dispatch] = usePokemonCache();

  const {data: pokemon, status, error, run, setData} = useAsync()

  React.useEffect(() => {
    if (!pokemonName) {
      return
    } else if (cache[pokemonName]) {
      setData(cache[pokemonName])
    } else {
      run(
        fetchPokemon(pokemonName).then(pokemonData => {
          dispatch({type: 'ADD_POKEMON', pokemonName, pokemonData})
          return pokemonData
        }),
      )
    }
  }, [cache, pokemonName, run, setData, dispatch]) // we need to put the dispatch function because even if it's stable it's comming from a custom hook and not directly from the useReducer hook

  if (status === 'idle') {
    return 'Submit a pokemon'
  } else if (status === 'pending') {
    return <PokemonInfoFallback name={pokemonName} />
  } else if (status === 'rejected') {
    throw error
  } else if (status === 'resolved') {
    return <PokemonDataView pokemon={pokemon} />
  }
}

function PreviousPokemon({onSelect}) {
  const [cache] = usePokemonCache();
  return (
      <div>
        Previous Pokemon
        <ul style={{listStyle: 'none', paddingLeft: 0}}>
          {Object.keys(cache).map(pokemonName => (
            <li key={pokemonName} style={{margin: '4px auto'}}>
              <button
                style={{width: '100%'}}
                onClick={() => onSelect(pokemonName)}
                >
                {pokemonName}
              </button>
            </li>
          ))}
        </ul>
      </div>
  )
}

function PokemonSection({onSelect, pokemonName}) {
  return (
    <div style={{display: 'flex'}}>
        <PreviousPokemon onSelect={onSelect} />
      <div className="pokemon-info" style={{marginLeft: 10}}>
        <PokemonErrorBoundary
          onReset={() => onSelect('')}
          resetKeys={[pokemonName]}
        >
            <PokemonInfo pokemonName={pokemonName} />
        </PokemonErrorBoundary>
      </div>
    </div>
  )
}

function App() {
  const [pokemonName, setPokemonName] = React.useState(null)

  function handleSubmit(newPokemonName) {
    setPokemonName(newPokemonName)
  }

  function handleSelect(newPokemonName) {
    setPokemonName(newPokemonName)
  }

  return (
    <div className="pokemon-info-app">
      <PokemonForm pokemonName={pokemonName} onSubmit={handleSubmit} />
      <hr />
      <PokemonCacheProvider>
      <PokemonSection onSelect={handleSelect} pokemonName={pokemonName} />

      </PokemonCacheProvider>
    </div>
  )
}

export default App
