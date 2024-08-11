import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Register() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  function handleSubmit(event) {
    event.preventDefault();
    
    // Проверка на длину логина и пароля
    if (login.length < 8 || login.length > 20) {
      setMessage('Логин должен содержать от 8 до 20 символов');
      return;
    }
    if (password.length < 8 || password.length > 20) {
      setMessage('Пароль должен содержать от 8 до 20 символов');
      return;
    }

    axios.post('http://localhost:8081/register', { login, password })
      .then(res => {
        if (res.data.message === "Пользователь успешно создан") {
          setMessage('Пользователь успешно создан');
          // Через 2 секунды перенаправляем пользователя на главную страницу
          setTimeout(() => {
            navigate('/');
          }, 2000);
        } else {
          console.log(res.data);
        }
      })
      .catch(err => console.log(err));
  }

  return (
    <div>
      страница регистрации
      <div>
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor='login'>Login</label>
            <input type='text' placeholder='Enter Login'
              value={login}
              onChange={e => setLogin(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor='password'>Password</label>
            <input type='password' placeholder='Enter Password'
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <button type="submit">завершить регистрацию</button>
        </form>
      </div>
      {message && <p>{message}</p>}
    </div>
  );
}

export default Register;
