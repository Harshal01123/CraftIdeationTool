import React from 'react'
import { NavLink } from 'react-router-dom'

const Sidebar = () => {
  const linkStyle = {
    display: 'block',
    padding: '15px 25px',
    border: '1px solid #ddd',
    textDecoration: 'none',
    color: 'black',
    marginBottom: '10px'
  }

  return (
    <div style={{
      width: '220px',
      minHeight: 'calc(100vh - 70px)',
      borderRight: '1px solid #ddd',
      padding: '30px 20px'
    }}>
      <NavLink to='/add' style={linkStyle}>Add Product</NavLink>
      <NavLink to='/list' style={linkStyle}>Product List</NavLink>
      <NavLink to='/orders' style={linkStyle}>Orders</NavLink>
    </div>
  )
}

export default Sidebar