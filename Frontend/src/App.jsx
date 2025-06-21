import { useState } from 'react'
import Upload from './components/Upload'
import Frames from './components/Frames'
function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Upload/>
      <Frames/>
    </>
  )
}

export default App
