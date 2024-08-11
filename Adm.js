import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

function Adm() {
  const [reports, setReports] = useState([]);
  const [status, setStatus] = useState('Создано');
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken = jwtDecode(token);
      const userId = decodedToken.userId;
      if (userId > 16) {
        navigate('/');
      }
    } else {
      navigate('/');
    }
    fetchReports();
  }, [status]);

  const fetchReports = () => {
    axios.get('http://localhost:8081/reports', {
      params: { status, fromId, toId }
    })
      .then(res => {
        setReports(res.data);
      })
      .catch(err => console.log(err));
  };

  const handleStatusChange = (event) => {
    setStatus(event.target.value);
  };

  const handleReview = (reportId) => {
    axios.post('http://localhost:8081/review_report', { reportId })
      .then(res => {
        fetchReports(); // Refresh reports
      })
      .catch(err => console.log(err));
  };

  const handleDelete = (toId) => {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken = jwtDecode(token);
      const userId = decodedToken.userId;
      if (userId > 16) {
        navigate('/');
        return;
      }

      axios.post('http://localhost:8081/adm/del', { toId }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        fetchReports(); // Refresh reports
      })
      .catch(err => console.log(err));
    } else {
      navigate('/');
    }
  };

  return (
    <div>
      <h1>Добро пожаловать на страницу администратора</h1>
      <Link to="/Home"><button type="submit">Выход</button></Link>

      <div>
        <label htmlFor="status">Выберите статус:</label>
        <select id="status" value={status} onChange={handleStatusChange}>
          <option value="Создано">Создано</option>
          <option value="Рассмотрено">Рассмотрено</option>
          <option value="Анкета удалена">Анкета удалена</option>
          <option value="Анкету удалил пользователь">Анкету удалил пользователь</option>
        </select>
      </div>

      <div>
        <label htmlFor="fromId">ID Отправителя:</label>
        <input type="number" id="fromId" value={fromId} onChange={(e) => setFromId(e.target.value)} />
        
        <label htmlFor="toId">ID Получателя:</label>
        <input type="number" id="toId" value={toId} onChange={(e) => setToId(e.target.value)} />
        
        <button onClick={fetchReports}>Поиск</button>
      </div>

      <div>
        {reports.map(report => (
          <div key={report.id} style={{ borderBottom: '1px solid #ccc', padding: '10px 0' }}>
            <p>Отправитель: {report.from_id_r}</p>
            <p>Получатель: {report.to_id_r}</p>
            {report.name && <p>Имя: {report.name}</p>}
            {report.age && <p>Возраст: {report.age}</p>}
            {report.gender_id && <p>Пол: {report.gender_id}</p>}
            {report.description && <p>Описание: {report.description}</p>}
            {report.photo && <img src={`data:image/jpeg;base64,${Buffer.from(report.photo).toString('base64')}`} alt="Фото" />}
            {status === 'Создано' && (
              <>
                <button onClick={() => handleReview(report.id)}>Рассмотрено</button>
                <button onClick={() => handleDelete(report.to_id_r)}>Удалить анкету</button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Adm;
