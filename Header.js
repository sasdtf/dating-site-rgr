// src/components/Header.js
import React from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import logo from './logo192.png';
import { NavLink } from 'react-router-dom';

class Header extends React.Component {
  render() {
    return (
      <Navbar fixed='top' collapseOnSelect expand='md' bg='dark' variant='dark'>
        <Container>
          <Navbar.Brand>
            <img
              src={logo}
              height='30'
              width='30'
              className='d-inline-block align-top'
              alt='Logo'
            /> Сайт знакомств
          </Navbar.Brand>
          <Navbar.Toggle aria-controls='responsive-navbar-nav' />
          <Navbar.Collapse id='responsive-navbar-nav'>
            <Nav className='mr-auto'>
              <Nav.Link as={NavLink} to='/rate'>Оценивать</Nav.Link>
              <Nav.Link as={NavLink} to='/messenger'>Диалоги</Nav.Link>
              <Nav.Link as={NavLink} to='/questionnaire'>Моя анкета</Nav.Link>
              <Nav.Link as={NavLink} to='/'>Выход</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    );
  }
}

export default Header;
