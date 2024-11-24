import { Link } from "react-router-dom"
import Header from "./Header"
import Footer from "./Footer"
import placeholder from "../images/placeholder.png"
import { useEffect, useState, useContext } from "react"
import { AuthContext } from "../AuthContext"
import Button from "react-bootstrap/Button"
import Container from "react-bootstrap/Container"
import Row from "react-bootstrap/Row"
import Col from "react-bootstrap/Col"
import Stack from "react-bootstrap/Stack"
import { useNavigate } from "react-router-dom"

import api_link from "../App"
import { fetchProjects, fetchUser } from "../APIController"

function Home() {

    const { user } = useContext(AuthContext);

    const [recentProjects, setRecentProjects] = useState([]);

    const [popularProjects, setPopularProjects] = useState([]);

    async function GetRecentProjects() {
        if (!user)
            return

        try {
            let projects = (await fetchUser(user.id, true)).projects || []
            projects.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            setRecentProjects(projects)
        } catch (err) {
            console.log(err)
        }
    }


    async function GetPopularProjects() {
        try {
            let projects = await fetchProjects(4)
            projects.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            setPopularProjects(projects)
        } catch (err) {
            console.log(err)
        }
    }


    useEffect(() => {
        GetRecentProjects();
    }, [user]);

    useEffect(() => {
        GetPopularProjects();
    }, []);


    let navigate = useNavigate();
    const routeChange = () => {
        let path = '/create';
        navigate(path);
    }

    return (
        <>
            <Header />
            <Container className="mt-5">
                <Row>
                    <Col sm={6} className="text-left pe-5">
                        <h2 className="mb-4">Недавние проекты:</h2>
                        {recentProjects.map((project, i) =>
                            <Container className="text-left pb-2" key={project.id}>
                                <Stack direction="horizontal" gap="10" className="border rounded p-3 mt-1">
                                    <img
                                        width={60}
                                        height={60}
                                        src={project?.cover_url || placeholder}
                                        alt="thumbnail"
                                    />
                                    <Container className="text-left text-break">
                                        <Link to={"/projects/" + project.handle} className="link-primary">
                                            {project.name}
                                        </Link>
                                        <br /> {project.description}
                                    </Container>
                                </Stack>
                            </Container>
                        )}

                        <h2 className="my-4">Популярные проекты:</h2>
                        {popularProjects.map((project, i) =>
                            <Container className="text-left pb-2" key={project.id}>
                                <Stack direction="horizontal" gap="10" className="border rounded p-3 mt-1">
                                    <img
                                        width={60}
                                        height={60}
                                        src={project?.cover_url || placeholder}
                                        alt="thumbnail"/>
                                    <Container className="text-left text-break">
                                        <Link to={"/projects/" + project.handle} className="link-primary">
                                            {project.name}
                                        </Link>
                                        <br /> {project.description}
                                    </Container>
                                </Stack>
                            </Container>
                        )}


                    </Col>
                    <Col className="border-top border-start rounded py-1 mt-3 ps-3">
                        <h5 className="py-2 border-bottom" >
                            Что такое Desman Translate?
                        </h5>
                        <p>
                            Добро пожаловать в веб-сервис для коллективных переводов! Desman Translate предназначен для совместных переводов книг, программ, субтитров и всего на свете, что имеет форму текста.
                        </p>
                        <h5 className="py-2 border-bottom">
                            Как это работает?
                        </h5>
                        <p>
                            Когда вы загружаете текст для работы, он разбивается на небольшие отрывки: строки, абзацы, отдельные субтитры — вы можете выбрать способ самостоятельно. Каждый пользователь может предложить свой вариант перевода для отрывка, а лучший вариант определяется голосованием.
                        </p>
                        {/* <p>
                            Присоединяйтесь к командам переводчиков, создавайте собственные проекты, приглашайте других пользователей присоединиться, переводите книги, программы и субтитры, оттачивайте свои навыки и создавайте лучший перевод любого текста.
                        </p> */}
                        <p>Have a lot of fun...</p>
                        {user && 
                            <Button variant="primary"
                                onClick={routeChange}>
                                Создать проект
                            </Button>
                        }
                    </Col>
                </Row>
            </Container>
            <Footer />
        </>
    );
}

export default Home;