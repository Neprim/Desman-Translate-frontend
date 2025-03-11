import Link from "react-router-dom"
import Header from "./Header"
import Footer from "./Footer"
import Button from "react-bootstrap/Button"
import Container from "react-bootstrap/Container"
import Form from "react-bootstrap/Form"
import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { getLoc } from "../Translation"

export default function Login() {
    const navigate = useNavigate();

    const [inputMail, setInputMail] = useState("");
    const [inputPass, setInputPass] = useState("");

    const mailChange = event => setInputMail(event.target.value);

    const passChange = event => setInputPass(event.target.value);

    const [errorVisibility, setErrorVisibility] = useState(false);

    function toggle() {
        setErrorVisibility((errorVisibility) => "true");
    }

    async function Submit(event) {
        event.preventDefault()
        await fetch("/api/login",
            {
                method: "POST",
                body: JSON.stringify({
                    "username": inputMail,
                    "password": inputPass,
                    "remember": document.getElementById("rememberCheck").checked
                }),
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8',
                },
                credentials: "include",

            }).then(response => {
                if (!response.ok) {
                    toggle()
                }
                else return response.json()
            }).then(data => {
                if (typeof (data) != "undefined") {
                    console.log(typeof (data))
                    console.log(data)
                    navigate("../")
                    window.location.reload()
                }
            })
    }




    return (
        <>
            <Header />
            <title>{getLoc("signin_title")}</title>
            <Container
                className="text-left mt-5 mx-auto"
                style={{
                    width: "20%",
                    minWidth: 300
                }}
            >
                <h1 className="mb-3">{getLoc("signin_signin")}</h1>
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label htmlFor="inputEmailLogin">
                            {getLoc("signin_username_email")}
                        </Form.Label>
                        <Form.Control id="inputEmailLogin" onChange={mailChange} />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label htmlFor="inputPasswordLogin">
                            {getLoc("signin_password")}
                        </Form.Label>
                        <Form.Control
                            onChange={passChange}
                            type="password"
                            id="inputPasswordLogin"
                            aria-describedby="forgotPassword"
                        />
                        <Form.Text id="forgotPassword">
                            <details>
                                <summary>{getLoc("signin_forgot_password")}</summary>
                                <strike>{getLoc("signin_sad_for_you")}</strike> {getLoc("signin_password_restore")} 
                            </details>
                        </Form.Text>
                    </Form.Group>
                    <Form.Check className="mb-3">
                        <input type="checkbox" className="form-check-input" id="rememberCheck" />
                        <Form.Check.Label className="form-check-label" htmlFor="rememberCheck">
                            {getLoc("signin_remember_me")}
                        </Form.Check.Label><br/>
                        <Form.Text>
                            {getLoc("signin_remember_me_note")}
                        </Form.Text>
                    </Form.Check>
                    {errorVisibility && <div id="error" className="my-1">{getLoc("signin_error_bad_login_password")}</div>}
                    <Button type="submit" variant="primary" onClick={Submit}>
                        {getLoc("signin_login")}
                    </Button>
                </Form>
            </Container>
            <Footer />
        </>
    );
}