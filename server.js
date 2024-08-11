const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(cors());

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "123456",
    database: "rgr"
});

db.connect(err => {
    if (err) {
        console.error('Ошибка подключения к базе данных:', err);
        return;
    }
    console.log('Подключено к базе данных.');
});

const secretKey = 'your_secret_key';


// Функция для логирования запросов
const logRequest = (logMessage) => {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${logMessage}`;

    fs.appendFile('db_logs.txt', logEntry + '\n', (err) => {
        if (err) {
            console.error('Ошибка записи лога:', err);
        }
    });
};
//лог не нужен
app.post('/login', async (req, res) => {
    const { login, password } = req.body;
    

    const sql = "SELECT * FROM user WHERE login = ?";
    db.query(sql, [login], async (err, data) => {
        if (err) {
            console.error('Ошибка выполнения запроса:', err);
            return res.status(500).json("Не удалось войти");
        }
        if (data.length > 0) {
            const user = data[0];
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (isPasswordValid) {
                const userId = user.user_id;
                const token = jwt.sign({ userId: userId }, secretKey, { expiresIn: '1h' });
                
                // Логирование запроса
                //const logMessage = `Успешный вход пользователя ${login}`;
                //logRequest(logMessage);

                return res.json({ message: "Вход выполнен успешно", token: token });
            } else {
                return res.status(401).json("Неверный логин или пароль");
            }
        } else {
            return res.status(401).json("Неверный логин или пароль");
        }
    });
});

//лог сделан
app.post('/register', async (req, res) => {
    const { login, password } = req.body;
    const checkSql = "SELECT * FROM user WHERE login = ?";
    const insertSql = "INSERT INTO user (login, password) VALUES (?, ?)";

    try {
        db.query(checkSql, [login], async (checkErr, checkResult) => {
            if (checkErr) {
                console.error('Ошибка проверки логина:', checkErr);
                return res.json("Ошибка регистрации");
            }
            if (checkResult.length > 0) {
                return res.json({ message: "Логин уже занят" });
            }

            try {
                const hashedPassword = await bcrypt.hash(password, 10);
                db.query(insertSql, [login, hashedPassword], (insertErr, result) => {
                    if (insertErr) {
                        console.error('Ошибка создания пользователя:', insertErr);
                        return res.json("Ошибка регистрации");
                    }
                    console.log('Пользователь успешно создан');
                    //сюда лог 
                    const logMessage = `Успешное создание создание пользователя  ${login}`;
                    logRequest(logMessage);
                    return res.json({ message: "Пользователь успешно создан" });
                });
            } catch (hashError) {
                console.error('Ошибка хэширования пароля:', hashError);
                return res.json("Ошибка регистрации");
            }
        });
    } catch (dbError) {
        console.error('Ошибка выполнения запроса:', dbError);
        return res.json("Ошибка регистрации");
    }
});
//лог не нужен
app.post('/adm_login', (req, res) => {
    const sql = "SELECT * FROM admin WHERE admin_login = ? AND admin_password = ?";
    const { login, password } = req.body;
    const userIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    db.query(sql, [login, password], (err, data) => {
        if (err) {
            console.error('Ошибка выполнения запроса:', err);
            return res.json("Не удалось войти");
        }
        if (data.length > 0) {
            const adminId = data[0].admin_id; 
            if (adminId > 16) {
                return res.json({ message: "Перенаправление на главную страницу", redirect: "/" });
            }
            const token = jwt.sign({ adminId: adminId }, secretKey, { expiresIn: '1h' });
            return res.json({ message: "Вход выполнен успешно", token: token, userIp: userIp });
        } else {
            return res.json("Нет записи");
        }
    });
});

//лог не нужен
app.get('/questionnaire', (req, res) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: "Токен не предоставлен" });
    }

    jwt.verify(token.replace('Bearer ', ''), secretKey, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: "Неверный токен" });
        }

        const userId = decoded.userId;

        const sql = "SELECT * FROM questionnaire WHERE user_id = ?";
        db.query(sql, [userId], (err, data) => {
            if (err) {
                return res.status(500).json({ message: "Ошибка получения данных пользователя" });
            }
            if (data.length > 0) {
                return res.json(data[0]);
            } else {
                return res.status(404).json({ message: "Анкета не найдена" });
            }
        });
    });
});
//лог сделан
app.post('/questionnaire/update', (req, res) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: "Токен неs предоставлен" });
    }

    jwt.verify(token.replace('Bearer ', ''), secretKey, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: "Неверный токен" });
        }

        const userId = decoded.userId;
        const { name, age, gender, description } = req.body;

        const updateSql = "UPDATE questionnaire SET name = ?, age = ?, gender_id = ?, description = ? WHERE user_id = ?";
        db.query(updateSql, [name, age, gender, description, userId], (err, result) => {
            if (err) {
                console.error('Ошибка обновления анкеты:', err);
                return res.status(500).json({ message: "Ошибка обновления анкеты" });
            }
            //сюда лог 
            const logMessage = `Успешное обновление анкеты пользователя  ${userId} на следующие данные 
            ${name}  ${age}  ${gender}  ${description}`;
            logRequest(logMessage);
            return res.json({ message: "Анкета успешно обновлена", name, age, gender_id: gender, description });
        });
    });
});
//лог создан
app.post('/questionnaire', (req, res) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: "Токен не предоставлен" });
    }

    jwt.verify(token.replace('Bearer ', ''), secretKey, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: "Неверный токен" });
        }

        const userId = decoded.userId;
        const { name, age, gender, description } = req.body;

        const insertSql = "INSERT INTO questionnaire (user_id, name, age, gender_id, description) VALUES (?, ?, ?, ?, ?)";
        db.query(insertSql, [userId, name, age, gender, description], (err, result) => {
            if (err) {
                console.error('Ошибка создания анкеты:', err);
                return res.status(500).json({ message: "Ошибка создания анкеты" });
            }
            //сюда лог 
            const logMessage = `Успешное создание анкеты пользователя  ${userId} со следующими данными 
            ${name}  ${age}  ${gender}  ${description}`;
            logRequest(logMessage);
            return res.json({ message: "Анкета успешно создана", name, age, gender_id: gender, description });
        });
    });
});

//лог создан
app.post('/questionnaire/del', (req, res) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: "Токен не предоставлен" });
    }

    jwt.verify(token.replace('Bearer ', ''), secretKey, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: "Неверный токен" });
        }

        const userId = decoded.userId;

        // Удаление сообщений пользователя
        const deleteMessageSql = "DELETE FROM message WHERE messenger_id IN (SELECT messenger_id FROM messenger WHERE user_id_1 = ? OR user_id_2 = ?)";
        db.query(deleteMessageSql, [userId, userId], (err, result) => {
            if (err) {
                console.error('Ошибка при удалении сообщений:', err);
                return res.status(500).json({ message: "Ошибка при удалении сообщений" });
            }

            console.log('Удалены сообщения пользователя с ID:', userId);
                        //сюда лог 
                        const logMessage = `Удалены сообщения пользователя с ID: ${userId} после удаления анкеты самим пользователем`;
                        logRequest(logMessage);

            // Удаление диалогов пользователя
            const deleteMessengerSql = "DELETE FROM messenger WHERE user_id_1 = ? OR user_id_2 = ?";
            db.query(deleteMessengerSql, [userId, userId], (err, result) => {
                if (err) {
                    console.error('Ошибка при удалении диалогов:', err);
                    return res.status(500).json({ message: "Ошибка при удалении диалогов" });
                }

                console.log('Удалены диалоги пользователя с ID:', userId);
                //сюда лог 
                const logMessage = `Удалены диалоги пользователя с ID: ${userId}  после удаления анкеты самим пользователем`;
                logRequest(logMessage);

                // Удаление лайков пользователя
                const deleteLikesSql = "DELETE FROM likes WHERE from_id = ? OR to_id = ?";
                db.query(deleteLikesSql, [userId, userId], (err, result) => {
                    if (err) {
                        console.error('Ошибка при удалении лайков:', err);
                        return res.status(500).json({ message: "Ошибка при удалении лайков" });
                    }

                    console.log('Удалены лайки пользователя с ID:', userId);
                    //сюда лог 
                const logMessage = `Удалены лайки пользователя с ID: ${userId}  после удаления анкеты самим пользователем`;
                logRequest(logMessage);

                    // Удаление дизлайков пользователя
                    const deleteDislikesSql = "DELETE FROM dislike WHERE from_id = ? OR to_id = ?";
                    db.query(deleteDislikesSql, [userId, userId], (err, result) => {
                        if (err) {
                            console.error('Ошибка при удалении дизлайков:', err);
                            return res.status(500).json({ message: "Ошибка при удалении дизлайков" });
                        }

                        console.log('Удалены дизлайки пользователя с ID:', userId);
                        //сюда лог 
                const logMessage = `Удалены дизлайки пользователя с ID: ${userId}  после удаления анкеты самим пользователем`;
                logRequest(logMessage);

                        // Обновление статуса в таблице report
                        const updateReportSql = "UPDATE report SET report_condition = 'Анкету удалил пользователь' WHERE to_id_r = ?";
                        db.query(updateReportSql, [userId], (err, result) => {
                            if (err) {
                                console.error('Ошибка при обновлении статуса отчета:', err);
                                return res.status(500).json({ message: "Ошибка при обновлении статуса отчета" });
                            }

                            console.log('Статус отчета обновлен для пользователя с ID:', userId);
                            //сюда лог 
                const logMessage = `Статус отчета обновлен на анкета удалена пользователем для пользователя с ID, где to_id_r: ${userId}  после удаления анкеты самим пользователем`;
                logRequest(logMessage);

                            // Удаление анкеты пользователя
                            const deleteSql = "DELETE FROM questionnaire WHERE user_id = ?";
                            db.query(deleteSql, userId, (err, result) => {
                                if (err) {
                                    console.error('Ошибка при удалении анкеты:', err);
                                    return res.status(500).json({ message: "Ошибка при удалении анкеты" });
                                }

                                console.log('Удалена анкета пользователя с ID:', userId);
                                //сюда лог 
                const logMessage = `Удалена анкета пользователя с ID: ${userId}  после удаления анкеты самим пользователем`;
                logRequest(logMessage);


                                return res.json({ message: "Анкета и связанные данные успешно удалены" });
                            });
                        });
                    });
                });
            });
        });
    });
});

















//логи созданы
app.post('/like', (req, res) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: "Токен не предоставлен" });
    }

    jwt.verify(token.replace('Bearer ', ''), secretKey, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: "Неверный токен" });
        }

        const userId = decoded.userId;
        const to_id  = req.body;

        const insertSql = "INSERT INTO likes (from_id, to_id) VALUES (?, ?)";
        db.query(insertSql, [userId, req.body.to_id], (err, result) => {
            if (err) {
                console.error('Ошибка добавления лайка:', err);
                return res.status(500).json({ message: "Ошибка добавления лайка" });
            }
            //сюда лог 
            const logMessage = `успешное добавление лайка от ${userId} к ${req.body.to_id}`;
            logRequest(logMessage);
            return res.json({ message: "Лайк успешно добавлен" });
        });
    });
});
// логи созданы
app.post('/dislike', (req, res) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: "Токен не предоставлен" });
    }

    jwt.verify(token.replace('Bearer ', ''), secretKey, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: "Неверный токен" });
        }

        const userId = decoded.userId;
        

        const insertSql = "INSERT INTO dislike (from_id, to_id) VALUES (?, ?)";
        db.query(insertSql, [userId, req.body.to_id], (err, result) => {
            if (err) {
                console.error('Ошибка добавления дизлайка:', err);
                return res.status(500).json({ message: "Ошибка добавления дизлайка" });
            }
             //сюда лог 
             const logMessage = `успешное добавление дизлайка от ${userId} к ${req.body.to_id}`;
             logRequest(logMessage);
            return res.json({ message: "Дизлайк успешно добавлен" });
        });
    });
});
//лог не нужен
app.get('/rate', (req, res) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: "Токен не предоставлен" });
    }

    jwt.verify(token.replace('Bearer ', ''), secretKey, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: "Неверный токен" });
        }

        const userId = decoded.userId;
        const minAge = req.query.minAge || 18; // По умолчанию минимальный возраст 18
        const maxAge = req.query.maxAge || 100; // По умолчанию максимальный возраст 100

        const userGenderSql = "SELECT gender_id FROM questionnaire WHERE user_id = ?";
        db.query(userGenderSql, [userId], (err, userResult) => {
            if (err) {
                console.error('Ошибка получения данных пользователя:', err);
                return res.status(500).json({ message: "Ошибка получения данных пользователя" });
            }
            if (userResult.length === 0) {
                return res.status(404).json({ message: "Анкета пользователя не найдена" });
            }
            const userGender = userResult[0].gender_id;

            const sql = `
                SELECT q.name, q.age, q.description, q.gender_id, q.user_id 
                FROM questionnaire q
                WHERE q.gender_id <> ? 
                AND q.user_id <> ?
                AND q.user_id NOT IN (
                    SELECT to_id FROM likes WHERE from_id = ?
                    UNION
                    SELECT to_id FROM dislike WHERE from_id = ?
                )
                AND q.age >= ? AND q.age <= ?
            `;
            db.query(sql, [userGender, userId, userId, userId, minAge, maxAge], (err, data) => {
                if (err) {
                    console.error('Ошибка получения данных пользователей:', err);
                    return res.status(500).json({ message: "Ошибка получения данных пользователей" });
                }
                console.log('Данные пользователей успешно получены:', data);
                return res.json(data);
            });
        });
    });
});

//лог не нужен
app.get('/messenger', (req, res) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: "Токен не предоставлен" });
    }

    jwt.verify(token.replace('Bearer ', ''), secretKey, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: "Неверный токен" });
        }

        const userId = decoded.userId;

        const sql = `
            SELECT 
                m.messenger_id, 
                u1.user_id AS user1_id, 
                u2.user_id AS user2_id, 
                q1.name AS user1_name, 
                q2.name AS user2_name
            FROM messenger m
            JOIN user u1 ON m.user_id_1 = u1.user_id
            JOIN user u2 ON m.user_id_2 = u2.user_id
            JOIN questionnaire q1 ON u1.user_id = q1.user_id
            JOIN questionnaire q2 ON u2.user_id = q2.user_id
            WHERE m.user_id_1 = ? OR m.user_id_2 = ?
        `;
        db.query(sql, [userId, userId], (err, data) => {
            if (err) {
                console.error('Ошибка получения списка диалогов:', err);
                return res.status(500).json({ message: "Ошибка получения списка диалогов" });
            }
            console.log('Список диалогов успешно получен:', data);
            return res.json(data);
        });
    });
});

//лог не нужен
// Получение сообщений для выбранного диалога
app.get('/messenger/messages/:dialogId', (req, res) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: "Токен не предоставлен" });
    }

    jwt.verify(token.replace('Bearer ', ''), secretKey, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: "Неверный токен" });
        }

        const userId = decoded.userId;
        const dialogId = req.params.dialogId; // Извлекаем dialogId из параметров запроса

        const sql = `
        SELECT *,
               CASE
                   WHEN sender = ? THEN 'Вы'
                   ELSE 'Собеседник'
               END AS sender
        FROM message
        WHERE messenger_id = ?
    `;
    db.query(sql, [userId, dialogId], (err, data) => {
        if (err) {
            console.error('Ошибка получения сообщений:', err);
            return res.status(500).json({ message: "Ошибка получения сообщений" });
        }
        console.log('Сообщения успешно получены:', data);
        return res.json(data);
    });
    });
});


//лог есть
// Добавляем новый POST маршрут для отправки сообщений
app.post('/messenger/message', (req, res) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: "Токен не предоставлен" });
    }

    jwt.verify(token.replace('Bearer ', ''), secretKey, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: "Неверный токен" });
        }

        const userId = decoded.userId;
        const { messenger_id, message_text } = req.body;
        const message_time = new Date().toISOString().slice(0, 19).replace('T', ' '); // Текущее время в формате 'YYYY-MM-DD HH:MM:SS'

        const insertSql = "INSERT INTO message (messenger_id, message_text, message_time, sender) VALUES (?, ?, ?, ?)";
        db.query(insertSql, [messenger_id, message_text, message_time, userId], (err, result) => {
            if (err) {
                console.error('Ошибка отправки сообщения:', err);
                return res.status(500).json({ message: "Ошибка отправки сообщения" });
            }
            //сюда лог 
            const logMessage = `Сообщение успешно отправлено пользователем ${userId}  в диалог ${messenger_id} с текстом ${message_text} `;
            logRequest(logMessage);
            return res.json({ message: "Сообщение успешно отправлено" });
        });
    });
});


app.get('/user-id', (req, res) => {
    const token = req.headers.authorization;
  
    if (!token) {
      return res.status(401).json({ message: "Токен не предоставлен" });
    }
  
    jwt.verify(token.replace('Bearer ', ''), secretKey, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: "Неверный токен" });
      }
  
      const userId = decoded.userId;
      return res.json({ userId });
    });
  });
  //лог не нужен
  app.get('/messenger/messages/:dialogId', (req, res) => {
    const dialogId = req.params.dialogId;
    // Пример запроса к базе данных
    db.query('SELECT message_id, message_text, message_time, sender_id, sender_name FROM messages WHERE dialog_id = ?', [dialogId], (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Ошибка получения сообщений' });
      }
      res.json(results);
    });
  });
  


//лог сделан
  app.post('/report', (req, res) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: "Токен не предоставлен" });
    }

    jwt.verify(token.replace('Bearer ', ''), secretKey, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: "Неверный токен" });
        }

        const userId = decoded.userId;
        const { to_id_r, condition } = req.body;

        const insertSql = "INSERT INTO report (from_id_r, to_id_r, report_condition) VALUES (?, ?, ?)";
        db.query(insertSql, [userId, to_id_r, condition], (err, result) => {
            if (err) {
                console.error('Ошибка добавления отчета:', err);
                return res.status(500).json({ message: "Ошибка добавления отчета" });
            }
             //сюда лог 
             const logMessage = `успешное добавление репорта от ${userId} к ${req.body.to_id_r}`;
             logRequest(logMessage);
            return res.json({ message: "Отчет успешно отправлен" });
        });
    });
});


//лог не нужен
// Пример маршрута для получения отчетов с определенным статусом
app.get('/reports', (req, res) => {
    const { status, fromId, toId } = req.query;

    let sql = `
        SELECT r.*, q.name, q.age, q.gender_id, q.photo, q.description 
        FROM report r 
        LEFT JOIN questionnaire q ON r.to_id_r = q.user_id 
        WHERE 1=1
    `;

    const params = [];

    if (status) {
        sql += ' AND r.report_condition = ?';
        params.push(status);
    }

    if (fromId) {
        sql += ' AND r.from_id_r = ?';
        params.push(fromId);
    }

    if (toId) {
        sql += ' AND r.to_id_r = ?';
        params.push(toId);
    }

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error('Ошибка при получении отчетов:', err);
            return res.status(500).json({ message: 'Ошибка при получении отчетов' });
        }

        res.json(results);
    });
});


  //  лог есть
  // Пример маршрута для обновления статуса жалобы
  app.post('/review_report', (req, res) => {
    const { reportId } = req.body;
    const sql = "UPDATE report SET report_condition = 'Рассмотрено' WHERE id = ?";
    db.query(sql, [reportId], (err, data) => {
      if (err) {
        console.error('Ошибка выполнения запроса:', err);
        return res.status(500).json("Ошибка обновления статуса жалобы");
      }
      //сюда лог 
      const logMessage = `Статус жалобы изменён ${ req.body.reportId} на рассмотрено`;
      logRequest(logMessage);
      return res.json("Статус жалобы обновлен");
    });
  });
  //нужен лог
  // Пример маршрута для удаления анкеты пользователя
  app.post('/adm/del', (req, res) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: "Токен не предоставлен" });
    }

    jwt.verify(token.replace('Bearer ', ''), secretKey, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: "Неверный токен" });
        }

        const { toId } = req.body;
        const adminId = decoded.adminId;

        // Удаление сообщений пользователя
        const deleteMessageSql = "DELETE FROM message WHERE messenger_id IN (SELECT messenger_id FROM messenger WHERE user_id_1 = ? OR user_id_2 = ?)";
        db.query(deleteMessageSql, [toId, toId], (err, result) => {
            if (err) {
                console.error('Ошибка при удалении сообщений:', err);
                return res.status(500).json({ message: "Ошибка при удалении сообщений" });
            }
            const logMessage1 = `Удалены сообщения пользователя с ID ${toId} администратором ${adminId}`;
            logRequest(logMessage1);

            console.log('Удалены сообщения пользователя с ID:', toId);

            // Удаление диалогов пользователя
            const deleteMessengerSql = "DELETE FROM messenger WHERE user_id_1 = ? OR user_id_2 = ?";
            db.query(deleteMessengerSql, [toId, toId], (err, result) => {
                if (err) {
                    console.error('Ошибка при удалении диалогов:', err);
                    return res.status(500).json({ message: "Ошибка при удалении диалогов" });
                }
                const logMessage2 = `Удалены диалоги пользователя с ID ${toId} администратором ${adminId}`;
                logRequest(logMessage2);

                console.log('Удалены диалоги пользователя с ID:', toId);

                // Удаление лайков пользователя
                const deleteLikesSql = "DELETE FROM likes WHERE from_id = ? OR to_id = ?";
                db.query(deleteLikesSql, [toId, toId], (err, result) => {
                    if (err) {
                        console.error('Ошибка при удалении лайков:', err);
                        return res.status(500).json({ message: "Ошибка при удалении лайков" });
                    }
                    const logMessage3 = `Удалены лайки пользователя с ID ${toId} администратором ${adminId}`;
                    logRequest(logMessage3);

                    console.log('Удалены лайки пользователя с ID:', toId);

                    // Удаление дизлайков пользователя
                    const deleteDislikesSql = "DELETE FROM dislike WHERE from_id = ? OR to_id = ?";
                    db.query(deleteDislikesSql, [toId, toId], (err, result) => {
                        if (err) {
                            console.error('Ошибка при удалении дизлайков:', err);
                            return res.status(500).json({ message: "Ошибка при удалении дизлайков" });
                        }
                        const logMessage4 = `Удалены дизлайки пользователя с ID ${toId} администратором ${adminId}`;
                        logRequest(logMessage4);

                        console.log('Удалены дизлайки пользователя с ID:', toId);

                        // Удаление анкеты пользователя
                        const deleteSql = "DELETE FROM questionnaire WHERE user_id = ?";
                        db.query(deleteSql, [toId], (err, result) => {
                            if (err) {
                                console.error('Ошибка при удалении анкеты:', err);
                                return res.status(500).json({ message: "Ошибка при удалении анкеты" });
                            }
                            const logMessage5 = `Удалена анкета пользователя с ID ${toId} администратором ${adminId}`;
                            logRequest(logMessage5);

                            console.log('Удалена анкета пользователя с ID:', toId);

                            // Обновление состояния в таблице report
                            const updateReportSql = "UPDATE report SET report_condition = 'Анкета удалена' WHERE to_id_r = ?";
                            db.query(updateReportSql, [toId], (err, result) => {
                                if (err) {
                                    console.error('Ошибка при обновлении состояния отчета:', err);
                                    return res.status(500).json({ message: "Ошибка при обновлении состояния отчета" });
                                }
                                const logMessage6 = `Обновлено состояние репорта с ID ${toId} администратором ${adminId}`;
                                logRequest(logMessage6);

                                console.log('Обновлено состояние отчетов для пользователя с ID:', toId);

                                return res.json({ message: "Анкета и связанные данные успешно удалены, состояние отчетов обновлено" });
                            });
                        });
                    });
                });
            });
        });
    });
});






app.listen(8081, () => {
    console.log("Слушаем порт 8081...");
});
