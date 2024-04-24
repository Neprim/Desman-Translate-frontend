import { Link, useParams, useNavigate } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import placeholder from "../images/placeholder.png";
import Col from "react-bootstrap/Col"
import Row from "react-bootstrap/Row"
import Button from "react-bootstrap/Button"
import Tab from "react-bootstrap/Tab"
import Tabs from "react-bootstrap/Tabs"
import Container from "react-bootstrap/Container"

import { useEffect, useState, useContext } from "react"
import { AuthContext } from "../AuthContext";
import { fetchUser, fetchSomeAPI } from "../APIController";


export default function User() {

    const { gotUser, ReAuth } = useContext(AuthContext)
    const cur_user = useContext(AuthContext).user;
    console.log("cur_user")
    console.log(cur_user)

    const [flagCurrentUser, setFlagCurrentUser] = useState(false)
    const [projects, setProjects] = useState([]);
    const [user, setUser] = useState(null);
    const link = useParams()

    let navigate = useNavigate();
    const routeChange = () => {
        let path = '/create';
        navigate(path);
    }

    async function GetProjects() {
        if (!user)
            return

        try {
            console.log("user:")
            console.log(user)
            let projects = (await fetchUser(user.id, true)).projects
            setProjects(projects)
            console.log(projects)
            for (let project of projects) {
                project.user_role = (await fetchSomeAPI(`/api/projects/${project.id}/members/${user.id}`)).role_name
            }
            setProjects([...projects])
        } catch (err) {
            console.log(err)
        }
    }

    async function GetUserInfo() {
        try {
            let user = await fetchUser(link["user_id"])
            if (user.about == undefined) {
                user.about = "Описание отсутствует."
            }
            setUser(user)
        } catch (err) {
            if (err.status == 404) {
                window.location.href = "/404"
                return
            }
            if (err.status == 403) {
                window.location.href = "/403"
            }
            console.log(err)
        }
    }

    async function SubmitChanges() {
        try {
            const user = await fetchSomeAPI("/api/users", "PATCH", {
                about: document.getElementById("settings-user-about").value,
                gender: document.getElementById("settings-user-gender").value,
            })

            await ReAuth()
            setUser(user)
        } catch (err) {
            console.log(err)
        }
    }

    useEffect(() => {
        GetUserInfo()
    }, []);
    
    useEffect(() => {
        GetProjects();
    }, [user])

    useEffect(() => {
        setFlagCurrentUser(cur_user && cur_user?.id === user?.id)
    }, [cur_user, user])

    return (
        <>
            <Header />

            <Container className="container mt-5">
                <h1 className="my-4">{user?.username}</h1>

                <Tabs
                    defaultActiveKey="user"
                    id="project-id-tabs"
                    className="mb-3">
                    <Tab eventKey="user" title="Пользователь">

                        <Row>
                            <Col md={5} className="border rounded ms-2 p-2">
                                <img src={placeholder} height={200} alt="project cover" style={{ float: 'left'}} className="border rounded me-3 p-2" />
                                <h2>{user?.username}</h2>
                                {gotUser &&
                                    <h4>{flagCurrentUser ? "О вас" : "О пользователе"}</h4>
                                }
                                <p>{user?.about}</p>
                            </Col>
                            <Col className="p-3 mx-3">
                                <h2 style={{ marginBottom: '20px' }}>Участие в проектах</h2>
                                { flagCurrentUser &&
                                    <Button variant="primary" style={{ marginTop: '0px', marginBottom: '5px' }} onClick={routeChange}>Создать проект</Button>
                                }
                                <div className="container text-left" style={{ paddingBottom: '10px' }}>
                                    {projects.map((project, i) =>
                                        <Row className="border rounded py-3 align-items-center" style={{ marginTop: '5px' }} key={project.id}>
                                        <Col className="text-left">
                                            <strong>
                                                <Link className="link-primary" to={"/projects/" + project.id}>{project.name}</Link>
                                            </strong>
                                            <br /> Роль: {project.user_role}
                                        </Col>
                                    </Row>
                                    )}
                                </div>
                            </Col>
                        </Row>
                    </Tab>
                    { flagCurrentUser &&
                    <Tab eventKey="settings" title="Настройки">
                        <h3 style={{ marginTop: '20px', marginBottom: '20px' }}>Настройки пользователя</h3>
                        <div id="settings-user" className="border rounded py-3" style={{ padding: '0px 20px', marginBottom: '10px' }}>
                            <form className="row">
                                {/* <label htmlFor="settings-user-id" className="form-label">Уникальный хэндл</label>
                                <div className="col-auto">
                                    <input type="text" className="form-control" id="settings-user-id" minLength={4} maxLength={100} defaultValue={cur_user.username} />
                                    <div className="valid-feedback">Можно использовать!</div>
                                    <div className="invalid-feedback">Такая ссылка уже занята!</div>
                                </div> */}
                                {/* <div className="col">
                                    <button className="btn btn-primary" type="submit">Применить</button>
                                </div> */}
                            </form>
                            <form>
                                {/* <label htmlFor="settings-user-name" className="form-label">Имя пользователя</label>
                                <input type="text" className="form-control" id="settings-user-name" defaultValue="Ленивая выхухоль" minLength={4} maxLength={100} /> */}
                                <label htmlFor="settings-user-about" className="form-label" style={{ marginTop: '10px' }}>Описание</label>
                                <textarea className="form-control" aria-label="With textarea" id="settings-user-about" maxLength={1000} placeholder="Напишите здесь все, что хотели бы рассказать о себе: род деятельности, любимые жанры, какими языками вы владеете..." defaultValue={cur_user.about} />
                                {/* <label htmlFor="settings-user-avatar" className="form-label" style={{ marginTop: '10px' }}>Сменить аватар</label>
                                <input type="file" className="form-control" id="settings-user-avatar" accept="image/png, image/jpeg" aria-describedby="logo-desc" />
                                <div id="logo-desc" className="form-text">
                                    Принимаются картинки в формате .png и .jpeg
                                </div> */}
                                <label htmlFor="settings-user-gender" className="form-label" style={{ marginTop: '10px' }}>Пол</label>
                                <select className="form-select" defaultValue={cur_user.gender || "hidden"} id="settings-user-gender">
                                    <option value="hidden">Не скажу</option>
                                    <option value="male">Мужской</option>
                                    <option value="female">Женский</option>
                                </select>
                                {/* <label htmlFor="settings-user-access" className="form-label" style={{ marginTop: '10px' }}>Доступ к аккаунту</label>
                                <div className="form-check">
                                    <input type="radio" name="radios" className="form-check-input" id="settings-account-private" defaultValue="private" defaultChecked />
                                    <label className="form-check-label" htmlFor="settings-account-private">Открытый</label>
                                </div>
                                <div className="form-check">
                                    <input type="radio" name="radios" className="form-check-input" id="settings-account-public" defaultValue="public" />
                                    <label className="form-check-label" htmlFor="settings-account-public">Закрытый</label>
                                </div> */}
                            </form>
                            <button className="btn btn-primary" type="submit" style={{ marginTop: '20px' }} onClick={SubmitChanges}>Применить</button>
                        </div>
                    </Tab>
                    }
                </Tabs>



                {/* настройки. */}


            </Container>

            <Footer />
        </>
    );
}