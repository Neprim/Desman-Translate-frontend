import Header from "./Header"
import Footer from "./Footer"
import Container from "react-bootstrap/Container"
import Form from "react-bootstrap/Form"
import Button from "react-bootstrap/Button"

import React, { useState } from "react"
import { getLoc } from "../Translation"

const errors_to_message = {
    email: {
        "not email": getLoc("signup_error_not_email"),
        "required": getLoc("signup_error_email_required"),
        "not unique": getLoc("signup_error_not_unique_email"),
    },
    username: {
        "required": getLoc("signup_error_username_required"),
        "not unique": getLoc("signup_error_not_unique_username"),
        "minlength": getLoc("signup_error_short_username"),
        "maxlength": getLoc("signup_error_long_username"),
        "illegal symbols": getLoc("signup_error_illegal_symbols_username"),
    },
    password: {
        "required": getLoc("signup_error_password_required"),
        "minlength": getLoc("signup_error_short_password"),
        "illegal symbols": getLoc("signup_error_illegal_symbols_password"),
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
                        setEmailError(errors_to_message.email[error.kind] || getLoc("some_error"))
                        break;
                    case "username":
                        setUsernameError(errors_to_message.username[error.kind] || getLoc("some_error"))
                        break;
                    case "password":
                        setPasswordError(errors_to_message.password[error.kind] || getLoc("some_error"))
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
                <h1 className="mb-3">{getLoc("signup_signup")}</h1>
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label htmlFor="inputEmail">
                            {getLoc("signup_email")}
                        </Form.Label>
                        <Form.Control type="email" value={inputMail} id="inputEmail" onChange={mailChange} aria-describedby="emailError" />
                        {emailError && <Form.Text id="emailError" className="form-text">{emailError}</Form.Text>}
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label htmlFor="inputLogin">
                            {getLoc("signup_login")}
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
                            {getLoc("signup_password")}
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
                        {getLoc("signup_register")}
                    </Button>
                </Form>
            </Container>
            <Footer />
        </>
    );
}