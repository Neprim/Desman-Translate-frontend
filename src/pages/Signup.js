import Header from "./Header"
import Footer from "./Footer"
import Container from "react-bootstrap/Container"
import Form from "react-bootstrap/Form"
import Button from "react-bootstrap/Button"

import React, { useState } from "react"

const errors_to_message = {
    email: {
        "not email": "Введённое значение не является адресом электронной почты",
        "required": "Поле электронной почты должно быть заполнено",
        "not unique": "Поле электронной почты должно быть уникально",
    },
    username: {
        "required": "Поле имени пользователя должно быть заполнено",
        "not unique": "Поле имени пользователя должно быть уникально",
        "minlength": "Имя пользователя слишком короткое",
        "maxlength": "Имя пользователя слишком длинное",
        "illegal symbols": "Имя пользователя должно состоять только из строчных букв латинского алфавита, цифр и знака подчёркивания, а также не начинаться с цифры",
    },
    password: {
        "required": "Поле пароля должно быть заполнено",
        "minlength": "Пароль слишком короткий",
        "illegal symbols": "Пароль содержит недопустимые символы",
    }
}

export default function Signup() {

    const [inputMail, setInputMail] = useState("");
    const [inputLogin, setInputLogin] = useState("");
    const [inputPass, setInputPass] = useState("");
    const [usernameError, setUsernameError] = useState("");
    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");

    async function Submit(event) {
        event.preventDefault()

        event.target.disabled = true

        const response = await fetch("/api/register",
            {
                method: "POST",
                body: JSON.stringify({
                    "username": inputLogin,
                    "email": inputMail,
                    "password": inputPass
                }),
                headers: {
                    'Content-Type': 'application/json',
                }

            })

        setUsernameError("")
        setEmailError("")
        setPasswordError("")

        const resp_json = await response.json()
        if (!response.ok) {
            event.target.disabled = false
            const errors = resp_json.errors
            for (const error of errors) {
                switch (error.key) {
                    case "email":
                        setEmailError(errors_to_message.email[error.kind] || "Какая-то ошибка")
                        break;
                    case "username":
                        setUsernameError(errors_to_message.username[error.kind] || "Какая-то ошибка")
                        break;
                    case "password":
                        setPasswordError(errors_to_message.password[error.kind] || "Какая-то ошибка")
                        break;
                }
            }
            console.log(errors)
        } else {
            window.location.href = "/login"
        }
    }


    const mailChange = event => setInputMail(event.target.value);
    const loginChange = event => setInputLogin(event.target.value);
    const passChange = event => setInputPass(event.target.value);

    return (
        <>
            <Header />
            <Container
                className="text-left mt-5 mx-auto"
                style={{
                    width: "20%",
                    minWidth: 300
                }}
            >
                <h1 className="mb-3">Регистрация</h1>
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label htmlFor="inputEmail">
                            Электронная почта
                        </Form.Label>
                        <Form.Control type="email" value={inputMail} id="inputEmail" onChange={mailChange} aria-describedby="emailError" />
                        {emailError && <Form.Text id="emailError" className="form-text">{emailError}</Form.Text>}
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label htmlFor="inputLogin">
                            Логин
                        </Form.Label>
                        <Form.Control
                            type="text"
                            value={inputLogin}
                            onChange={loginChange}
                            id="inputLogin"
                            aria-describedby="usernameError"
                        />
                        {usernameError && <Form.Text id="usernameError" className="form-text">{usernameError}</Form.Text>}
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label htmlFor="inputPassword">
                            Пароль
                        </Form.Label>
                        <Form.Control type="password" value={inputPass} onChange={passChange} id="inputPassword" aria-describedby="passwordError" />
                        {passwordError && <Form.Text id="passwordError" className="form-text">{passwordError}</Form.Text>
                        }
                    </Form.Group>
                    {/* <div className="mb-3">
                    <label htmlFor="repeatPassword" className="form-label">
                        Повторите пароль
                    </label>
                    <input type="password" value={inputRepeatPass} onChange={repeatPassChange} className="form-control" id="repeatPassword" />
                    </div> */}
                    <Button type="submit" id="submit-button" className="btn-primary" onClick={Submit}>
                        Зарегистрироваться
                    </Button>
                </Form>
            </Container>
            <Footer />
        </>
    );
}