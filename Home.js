// src/Pages/Home.js
import React, { Component } from 'react';
import { Link } from 'react-router-dom';

class Home extends Component {
  componentDidMount() {
    // Очищаем токен при монтировании компонента
    localStorage.removeItem('token');
  }

  render() {
    return (
      <div>
        <h1>Добро пожаловать на главную страницу!</h1>
        <div>
          <Link to="/register">
            <button>Регистрация</button>
          </Link>
          <Link to="/login">
            <button>Авторизация</button>
          </Link>
          <Link to="/Adm_login">
            <button>Администратор</button>
          </Link>
        </div>
      </div>
    );
  }
}

export default Home;
