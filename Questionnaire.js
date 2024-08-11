import React, { Component } from 'react';
import axios from 'axios';
import Header from '../components/Header';

class Questionnaire extends Component {
  constructor(props) {
    super(props);
    this.state = {
      userData: null,
      error: null,
      creatingQuestionnaire: false,
      editingQuestionnaire: false,
      name: '',
      age: '',
      gender: '',
      description: '',
      formError: ''
    };
  }

  componentDidMount() {
    const token = localStorage.getItem('token');
    console.log("Токен в localStorage:", token); // Логируем токен для проверки

    axios.get('http://localhost:8081/questionnaire', {
      headers: { Authorization: token }
    })
    .then(res => {
      this.setState({ userData: res.data });
    })
    .catch(err => {
      if (err.response && err.response.status === 401) {
        this.setState({ error: 'Ошибка авторизации. Проверьте токен.' });
      } else if (err.response && err.response.status === 404) {
        this.setState({ error: 'Анкеты нет' });
      }
      console.error(err);
    });
  }

  handleCreateClick = () => {
    console.log('Нажата кнопка создания анкеты');
    this.setState({ creatingQuestionnaire: true, editingQuestionnaire: false, formError: '' });
  };

  handleEditClick = () => {
    const { userData } = this.state;
    this.setState({
      editingQuestionnaire: true,
      creatingQuestionnaire: false,
      name: userData.name,
      age: userData.age,
      gender: userData.gender_id === 1 ? 'male' : 'female',
      description: userData.description,
      formError: ''
    });
  };

  handleInputChange = (event) => {
    const { name, value } = event.target;
    this.setState({ [name]: value });
  };

  handleFormSubmit = (event) => {
    event.preventDefault();
    const { name, age, gender, description, creatingQuestionnaire } = this.state;

    if (!name || !age || !gender || !description) {
      this.setState({ formError: 'Все поля должны быть заполнены' });
      return;
    }

    if (age < 18) {
      this.setState({ formError: 'Возраст должен быть больше 18' });
      return;
    }

    const token = localStorage.getItem('token');
    const endpoint = creatingQuestionnaire ? 'http://localhost:8081/questionnaire' : 'http://localhost:8081/questionnaire/update';
    axios.post(endpoint, {
      name,
      age,
      gender: gender === 'male' ? 1 : 2,
      description
    }, {
      headers: { Authorization: token }
    })
    .then(res => {
      this.setState({ userData: res.data, creatingQuestionnaire: false, editingQuestionnaire: false, formError: null }, () => {
        window.location.reload(); // Обновляем страницу после создания/редактирования анкеты
      });
    })
    .catch(err => {
      this.setState({ formError: 'Ошибка при создании/редактировании анкеты' });
      console.error(err);
    });
  };

  handleDeleteClick = () => {
    const token = localStorage.getItem('token');
    axios.post('http://localhost:8081/questionnaire/del', null, {
        headers: { Authorization: token }
    })
    .then(res => {
        this.setState({ userData: null }, () => {
          window.location.reload();
        });
    })
    .catch(err => {
        console.error('Ошибка при удалении анкеты:', err);
    });
  };

  render() {
    const { userData, error, creatingQuestionnaire, editingQuestionnaire, name, age, gender, description, formError } = this.state;

    console.log('Текущее состояние:', this.state); // Лог текущего состояния для отладки

    if (creatingQuestionnaire || editingQuestionnaire) {
      console.log('Отображение формы создания/редактирования анкеты');
      return (
        <div>
          <Header />
          <h1>{creatingQuestionnaire ? 'Создание анкеты' : 'Редактирование анкеты'}</h1>
          <form onSubmit={this.handleFormSubmit}>
            <div>
              <label htmlFor="name">Имя:</label>
              <input type="text" id="name" name="name" value={name} onChange={this.handleInputChange} />
            </div>
            <div>
              <label htmlFor="age">Возраст:</label>
              <input type="number" id="age" name="age" value={age} onChange={this.handleInputChange} />
            </div>
            <div>
              <label htmlFor="gender">Пол:</label>
              <select id="gender" name="gender" value={gender} onChange={this.handleInputChange}>
                <option value="">Выберите пол</option>
                <option value="male">Мужчина</option>
                <option value="female">Женщина</option>
              </select>
            </div>
            <div>
              <label htmlFor="description">Описание:</label>
              <textarea id="description" name="description" value={description} onChange={this.handleInputChange} />
            </div>
            {formError && <div style={{ color: 'red' }}>{formError}</div>}
            <button type="submit">{creatingQuestionnaire ? 'Завершить создание' : 'Сохранить изменения'}</button>
          </form>
        </div>
      );
    }

    if (error) {
      return (
        <div>
          <Header />
          <div>{error}</div>
          {error === 'Анкеты нет' && (
            <button onClick={this.handleCreateClick}>Создать анкету</button>
          )}
        </div>
      );
    }

    if (!userData) {
      return (
        <div>
          <Header />
          <div>Загрузка...</div>
        </div>
      );
    }

    return (
      <div>
        <Header />
        <div>
          <h1>Моя анкета</h1>
          <p><strong>Имя:</strong> {userData.name}</p>
          <p><strong>Возраст:</strong> {userData.age}</p>
          <p><strong>Описание:</strong> {userData.description}</p>
          <p><strong>Пол:</strong> {userData.gender_id === 1 ? 'Мужчина' : 'Женщина'}</p>
          <button onClick={this.handleEditClick}>Редактировать анкету</button>
          <button onClick={this.handleDeleteClick}>Удалить анкету</button>
        </div>
      </div>
    );
  }
}

export default Questionnaire;
