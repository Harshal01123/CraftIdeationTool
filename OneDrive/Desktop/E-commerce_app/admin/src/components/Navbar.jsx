import React from 'react'

const Navbar = ({ setToken }) => {
  return (
    <div style={{
      height: '70px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0 40px',
      borderBottom: '1px solid #ddd'
    }}>
      <h1>FOREVER Admin</h1>

      <button
        onClick={() => {
          localStorage.removeItem('token')
          setToken('')
        }}
        style={{
          background: 'black',
          color: 'white',
          border: 'none',
          padding: '10px 25px',
          cursor: 'pointer'
        }}
      >
        Logout
      </button>
    </div>
  )
}

export default Navbar