import { useState } from 'react'
import Upload from './components/Upload'
function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Upload/>
    </>
  )
}

export default App
