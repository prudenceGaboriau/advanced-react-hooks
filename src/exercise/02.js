// useCallback: custom hooks
// http://localhost:3000/isolated/exercise/02.js

import * as React from 'react'
import {
  fetchPokemon,
  PokemonForm,
  PokemonDataView,
  PokemonInfoFallback,
  PokemonErrorBoundary,
} from '../pokemon'

// we can use a custom hook to reuse safe dispatch methods
function useSafeDispatch(dispatch) {
  const mountedRef = React.useRef(false);

  React.useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    } 
  }, [])

  return React.useCallback((...arg) => {
    if (mountedRef.current) {
      dispatch(...arg)
    }
  }, [dispatch]) // react can not track our initial dispatch function, we need to add it in the dependencies array
}

function asyncReducer(state, action) {
  switch (action.type) {
    case 'pending': {
      return {status: 'pending', data: null, error: null}
    }
    case 'resolved': {
      return {status: 'resolved', data: action.data, error: null}
    }
    case 'rejected': {
      return {status: 'rejected', data: null, error: action.error}
    }
    default: {
      throw new Error(`Unhandled action type: ${action.type}`)
    }
  }
}

function useAsync(initialState) {
  const [state, unsafeDispatch] = React.useReducer(asyncReducer, initialState);
  const mountedRef = React.useRef(false);

  React.useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    } 
  }, [])

  const dispatch = React.useCallback((...arg) => {
    if (mountedRef.current) {
      unsafeDispatch(...arg)
    }
  }, []) // empty because useReducer dispatch function is stable
    
  const run = React.useCallback((promise) => {
    dispatch({type: 'pending'})
    promise.then(
      data => {
        console.log('data', data)
        dispatch({type: 'resolved', data})
      },
      error => {
        dispatch({type: 'rejected', error})
      },
    )
  }, [dispatch])
  // usually we don't need to pass dispatch in dependencies array because it's never change, dispatch is stable, but in this case we are using the memoized version and not true dispatch function, so React doesn't understand

  return  {...state, run}

}

function PokemonInfo({pokemonName}) {
  const {data: pokemon, status, error, run} = useAsync({ status: pokemonName ? 'pending' : 'idle', data: null, error: null})
  console.log(status, pokemon)

  React.useEffect(() => {
    if (!pokemonName) {
      return
    }
    const pokemonPromise = fetchPokemon(pokemonName)
    return run(pokemonPromise)
  }, [pokemonName, run]) // we put in the depedencies array the memoized run function

  switch (status) {
    case 'idle':
      return <span>Submit a pokemon</span>
    case 'pending':
      return <PokemonInfoFallback name={pokemonName} />
    case 'rejected':
      throw error
    case 'resolved':
      return <PokemonDataView pokemon={pokemon} />
    default:
      throw new Error('This should be impossible')
  }
}

function App() {
  const [pokemonName, setPokemonName] = React.useState('')

  function handleSubmit(newPokemonName) {
    setPokemonName(newPokemonName)
  }

  function handleReset() {
    setPokemonName('')
  }

  return (
    <div className="pokemon-info-app">
      <PokemonForm pokemonName={pokemonName} onSubmit={handleSubmit} />
      <hr />
      <div className="pokemon-info">
        <PokemonErrorBoundary onReset={handleReset} resetKeys={[pokemonName]}>
          <PokemonInfo pokemonName={pokemonName} />
        </PokemonErrorBoundary>
      </div>
    </div>
  )
}

function AppWithUnmountCheckbox() {
  const [mountApp, setMountApp] = React.useState(true)
  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={mountApp}
          onChange={e => setMountApp(e.target.checked)}
        />{' '}
        Mount Component
      </label>
      <hr />
      {mountApp ? <App /> : null}
    </div>
  )
}

export default AppWithUnmountCheckbox
