import React, { useState } from 'react'
import axios from 'axios'

const Login = ({ setToken }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const onSubmitHandler = async (e) => {
    e.preventDefault()

    try {
      const response = await axios.post('http://localhost:4000/api/user/admin', {
        email,
        password
      })

      if (response.data.success) {
        localStorage.setItem('token', response.data.token)
        setToken(response.data.token)
      } else {
        alert(response.data.message)
      }
    } catch (error) {
      alert(error.message)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <form onSubmit={onSubmitHandler} style={{
        width: '350px',
        padding: '30px',
        border: '1px solid #ddd'
      }}>
        <h2 style={{ marginBottom: '25px' }}>Admin Login</h2>

        <input
          type='email'
          placeholder='Email'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />

        <input
          type='password'
          placeholder='Password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />

        <button style={{
          width: '100%',
          padding: '12px',
          background: 'black',
          color: 'white',
          border: 'none',
          cursor: 'pointer'
        }}>
          Login
        </button>
      </form>
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: '12px',
  marginBottom: '15px',
  border: '1px solid #ccc',
  outline: 'none'
}

export default Login