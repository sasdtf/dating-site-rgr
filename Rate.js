import React, { Component } from 'react';
import axios from 'axios';
import Header from '../components/Header';

class Rate extends Component {
  constructor(props) {
    super(props);
    this.state = {
      minAge: 18,
      maxAge: 100,
      profiles: [],
      currentProfileIndex: 0,
      error: null,
      newMinAge: 18,
      newMaxAge: 100,
    };
  }

  componentDidMount() {
    this.fetchProfiles();
  }

  fetchProfiles = () => {
    const token = localStorage.getItem('token');
    const { minAge, maxAge } = this.state;

    axios.get('http://localhost:8081/rate', {
      headers: { Authorization: `Bearer ${token}` },
      params: { minAge, maxAge }
    })
    .then(res => {
      const ownProfileId = localStorage.getItem('userId');
      const filteredProfiles = res.data.filter(profile => profile.user_id !== parseInt(ownProfileId, 10));
      this.setState({ profiles: filteredProfiles });
    })
    .catch(err => {
      this.setState({ error: 'Создайте свою анкету' });
      console.error(err);
    });
  };

  handleReport = () => {
    const token = localStorage.getItem('token');
    const { profiles, currentProfileIndex } = this.state;
    const toId = profiles[currentProfileIndex].user_id;

    axios.post('http://localhost:8081/report', { to_id_r: toId, condition: 'Создано' }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(() => {
      alert('Отчет успешно отправлен');
      this.handleDislike();
    })
    .catch(err => {
      console.error('Ошибка при отправке отчета:', err);
    });
  };

  handleLike = () => {
    const token = localStorage.getItem('token');
    const { profiles, currentProfileIndex } = this.state;
    const toId = profiles[currentProfileIndex].user_id;

    axios.post('http://localhost:8081/like', { to_id: toId }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(() => {
      this.setState(prevState => ({ currentProfileIndex: prevState.currentProfileIndex + 1 }), this.loadNextProfile);
    })
    .catch(err => {
      console.error('Ошибка при добавлении лайка:', err);
    });
  };

  handleDislike = () => {
    const token = localStorage.getItem('token');
    const { profiles, currentProfileIndex } = this.state;
    const toId = profiles[currentProfileIndex].user_id;

    axios.post('http://localhost:8081/dislike', { to_id: toId }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(() => {
      this.setState(prevState => ({ currentProfileIndex: prevState.currentProfileIndex + 1 }), this.loadNextProfile);
    })
    .catch(err => {
      console.error('Ошибка при добавлении дизлайка:', err);
    });
  };

  loadNextProfile = () => {
    const { profiles, currentProfileIndex } = this.state;
    if (currentProfileIndex >= profiles.length) {
      this.setState({ error: 'Нет доступных анкет для оценки' });
      return;
    }
  };

  handleMinAgeChange = (event) => {
    const newMinAge = parseInt(event.target.value, 10);
    this.setState({ newMinAge });
  };

  handleMaxAgeChange = (event) => {
    const newMaxAge = parseInt(event.target.value, 10);
    this.setState({ newMaxAge });
  };

  applyAgeFilters = () => {
    this.setState(
      prevState => ({
        minAge: prevState.newMinAge,
        maxAge: prevState.newMaxAge,
        currentProfileIndex: 0, // Reset index to start from the beginning
        error: null, // Reset any previous error
      }),
      this.fetchProfiles
    );
  };

  render() {
    const { profiles, currentProfileIndex, error, minAge, maxAge, newMinAge, newMaxAge } = this.state;

    if (error) {
      return (
        <div>
          <Header />
          <div>{error}</div>
          <div>
            <label>Минимальный возраст:</label>
            <input type="number" value={newMinAge} onChange={this.handleMinAgeChange} />
          </div>
          <div>
            <label>Максимальный возраст:</label>
            <input type="number" value={newMaxAge} onChange={this.handleMaxAgeChange} />
          </div>
          <button onClick={this.applyAgeFilters}>Применить фильтры</button>
        </div>
      );
    }

    if (profiles.length === 0 || currentProfileIndex >= profiles.length) {
      return (
        <div>
          <Header />
          Нет доступных анкет для оценки
          <div>
            <label>Минимальный возраст:</label>
            <input type="number" value={newMinAge} onChange={this.handleMinAgeChange} />
          </div>
          <div>
            <label>Максимальный возраст:</label>
            <input type="number" value={newMaxAge} onChange={this.handleMaxAgeChange} />
          </div>
          <button onClick={this.applyAgeFilters}>Применить фильтры</button>
        </div>
      );
    }

    const currentProfile = profiles[currentProfileIndex];
    if (!currentProfile || !currentProfile.name) {
      return (
        <div>
          <Header />
          <div>Ошибка: неверный формат анкеты</div>
        </div>
      );
    }

    return (
      <div>
        <Header />
        <div>
          <h1>Оценка анкеты</h1>
          <p><strong>id:</strong> {currentProfile.user_id}</p>
          <p><strong>Имя:</strong> {currentProfile.name}</p>
          <p><strong>Возраст:</strong> {currentProfile.age}</p>
          <p><strong>Описание:</strong> {currentProfile.description}</p>
          <p><strong>Пол:</strong> {currentProfile.gender_id === 1 ? 'Мужчина' : 'Женщина'}</p>
          <button onClick={this.handleLike}>Лайк</button>
          <button onClick={this.handleDislike}>Дизлайк</button>
        </div>
        <button onClick={this.handleReport}>Отправить репорт</button>
        <div>
          <label>Минимальный возраст:</label>
          <input type="number" value={newMinAge} onChange={this.handleMinAgeChange} />
        </div>
        <div>
          <label>Максимальный возраст:</label>
          <input type="number" value={newMaxAge} onChange={this.handleMaxAgeChange} />
        </div>
        <button onClick={this.applyAgeFilters}>Применить фильтры</button>
      </div>
    );
  }
}

export default Rate;
