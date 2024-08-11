import React, { Component } from 'react';
import axios from 'axios';

class Messenger extends Component {
  state = {
    dialogs: [],
    selectedDialog: null,
    messages: [],
    newMessageText: '',
    userId: null
  };

  componentDidMount() {
    this.fetchDialogs();
    this.fetchUserId();
  }

  fetchUserId = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    axios.get('http://localhost:8081/user-id', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    .then(response => {
      this.setState({ userId: response.data.userId });
    })
    .catch(error => {
      console.error('Ошибка получения ID пользователя:', error);
    });
  }

  fetchDialogs = () => {
    axios.get('http://localhost:8081/messenger', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })
    .then(response => {
      this.setState({ dialogs: response.data });
    })
    .catch(error => {
      console.error('Ошибка получения списка диалогов:', error);
    });
  }

  fetchMessages = (dialogId) => {
    axios.get(`http://localhost:8081/messenger/messages/${dialogId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })
    .then(response => {
      this.setState({ messages: response.data });
    })
    .catch(error => {
      console.error('Ошибка получения сообщений:', error);
    });
  }

  handleDialogClick = (dialog) => {
    this.setState({ selectedDialog: dialog }, () => {
      this.fetchMessages(dialog.messenger_id);
    });
  }

  handleInputChange = (event) => {
    this.setState({ newMessageText: event.target.value });
  }

  sendMessage = () => {
    const { newMessageText, selectedDialog } = this.state;
    const token = localStorage.getItem('token');

    if (!newMessageText || !selectedDialog || !token) {
      return;
    }

    const messageData = {
      messenger_id: selectedDialog.messenger_id,
      message_text: newMessageText
    };

    axios.post('http://localhost:8081/messenger/message', messageData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    .then(response => {
      console.log('Сообщение успешно отправлено:', response.data);
      this.setState({ newMessageText: '' });
      this.fetchMessages(selectedDialog.messenger_id);
    })
    .catch(error => {
      console.error('Ошибка отправки сообщения:', error);
    });
  }

  render() {
    const { dialogs, selectedDialog, messages, newMessageText, userId } = this.state;

    return (
      <div>
        <div style={{ display: 'flex' }}>
          <div>
            <h2>Диалоги</h2>
            <ul>
              {dialogs.map(dialog => (
                <li key={dialog.messenger_id} onClick={() => this.handleDialogClick(dialog)}>
                  {userId === dialog.user1_id ? dialog.user2_name : dialog.user1_name}
                </li>
              ))}
            </ul>
          </div>
          {selectedDialog && (
            <div>
              <h2>Сообщения</h2>
              <ul>
              {messages.map(message => (
  <li key={message.message_id}>
    <div>
      <strong>Отправитель:</strong> {message.sender === 'Вы' ? 'Вы' : 'Собеседник'}
    </div>
    <div>
      <strong>Сообщение:</strong> {message.message_text}
    </div>
    <div>
      <strong>Время отправки:</strong> {new Date(message.message_time).toLocaleString()}
    </div>
  </li>
))}
              </ul>
              <div>
                <textarea
                  value={newMessageText}
                  onChange={this.handleInputChange}
                  placeholder="Введите сообщение..."
                />
                <button onClick={this.sendMessage}>Отправить</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default Messenger;
