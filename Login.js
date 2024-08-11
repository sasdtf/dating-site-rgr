import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Login() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  function handleSubmit(event) {
      event.preventDefault();
      axios.post('http://localhost:8081/login', { login, password })
          .then(res => {
              if (res.data.message === "Вход выполнен успешно") {
                  localStorage.setItem('token', res.data.token);
                  
                  navigate('/questionnaire');
              } else {
                  console.log(res.data);
              }
          })
          .catch(err => console.log(err));
  }

  return (
    <div>
                  Авторизация пользователя

      <div>
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor='login'>Login</label>
            <input type='login' placeholder='Enter Login'
              onChange={e => setLogin(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor='password'>Password</label>
            <input type='password' placeholder='Enter Password'
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <button type="submit">войти</button>
        </form>
      </div>
    </div>
  );
}

export default Login;
