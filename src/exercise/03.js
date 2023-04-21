// useContext: simple Counter
// http://localhost:3000/isolated/exercise/03.js

import * as React from 'react'

const CountContext = React.createContext();


function useCount() {
  const countContext = React.useContext(CountContext);
  if (!countContext) {
    throw new Error('useCount may only be used from within a (child of a) CountProvider.')
  } 
  return countContext
}

function CountProvider(props) {
  const [count, setCount] = React.useState(0);
  const value = [count, setCount]

  return <CountContext.Provider value={value} {...props} />
}

function CountDisplay() {
  const [count] = useCount();
  
  return <div>{`The current count is ${count}`}</div>
}

function Counter() {
  const [, setCount] = useCount();
  const increment = () => setCount(c => c + 1)

  return <button onClick={increment}>Increment count</button>
}

function App() {
  return (
    <div>
      <CountProvider>
        <CountDisplay />
        <Counter />
      </CountProvider>
    </div>
  )
}

export default App
