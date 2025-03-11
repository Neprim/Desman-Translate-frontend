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
import { ProgressBar } from "react-bootstrap";

import api_link from "../App"
import { fetchProjects, fetchUser } from "../APIController"
import { getLoc } from "../Translation"

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
            for (let project of projects) {
                if (project.stats) {
                    project.stats.completeness = project.stats.strings_amount ? project.stats.strings_translated / project.stats.strings_amount * 100 : 0
                    project.stats.completeness = Math.floor(project.stats.completeness * 100) / 100
                }
            }
            setRecentProjects(projects)
        } catch (err) {
            console.log(err)
        }
    }


    async function GetPopularProjects() {
        try {
            let projects = await fetchProjects(4)
            projects.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            for (let project of projects) {
                if (project.stats) {
                    project.stats.completeness = project.stats.strings_amount ? project.stats.strings_translated / project.stats.strings_amount * 100 : 0
                    project.stats.completeness = Math.floor(project.stats.completeness * 100) / 100
                }
            }
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
            <title>{getLoc("homepage_title")}</title>
            <Container className="mt-5">
                <Row>
                    <Col sm={6} className="text-left pe-5">
                        <h2 className="mb-4">{getLoc("homepage_recent_projects")}</h2>
                        {recentProjects.map((project, i) =>
                            <Container className="text-left pb-2" key={project.id}>
                                <Stack direction="horizontal" gap="10" className="border rounded p-3 mt-1">
                                    <Link to={"/projects/" + project?.handle} className="link-primary">
                                    <img
                                        width={60}
                                        height={60}
                                        src={project?.cover_url || placeholder}
                                        alt="thumbnail"
                                    />
                                    </Link>
                                    <Container className="text-left text-break">
                                        <Link to={"/projects/" + project.handle} className="link-primary">
                                            {project.name}
                                        </Link>
                                        <br /> {project.description}
                                        {project.stats &&
                                            <div><b>{getLoc("project_project_completeness")}: {project?.stats?.completeness}%</b></div>
                                        }
                                    </Container>
                                </Stack>
                            </Container>
                        )}

                        <h2 className="my-4">{getLoc("homepage_popular_projects")}</h2>
                        {popularProjects.map((project, i) =>
                            <Container className="text-left pb-2" key={project.id}>
                                <Stack direction="horizontal" gap="10" className="border rounded p-3 mt-1">
                                    <Link to={"/projects/" + project?.handle} className="link-primary">
                                    <img
                                        width={60}
                                        height={60}
                                        src={project?.cover_url || placeholder}
                                        alt="thumbnail"/>
                                    </Link>
                                    <Container className="text-left text-break">
                                        <Link to={"/projects/" + project.handle} className="link-primary">
                                            {project.name}
                                        </Link>
                                        <br /> {project.description}
                                        {project.stats &&
                                            <div><b>{getLoc("project_project_completeness")}: {project?.stats?.completeness}%</b></div>
                                        }
                                    </Container>
                                </Stack>
                            </Container>
                        )}


                    </Col>
                    <Col className="border-top border-start rounded py-1 mt-3 ps-3">
                        <h5 className="py-2 border-bottom" >
                            {getLoc("homepage_about_1")}
                        </h5>
                        <p>
                            {getLoc("homepage_about_2")}
                        </p>
                        <h5 className="py-2 border-bottom">
                            {getLoc("homepage_about_3")}
                        </h5>
                        <p>
                            {getLoc("homepage_about_4")}
                        </p>
                        {/* <p>
                            Присоединяйтесь к командам переводчиков, создавайте собственные проекты, приглашайте других пользователей присоединиться, переводите книги, программы и субтитры, оттачивайте свои навыки и создавайте лучший перевод любого текста.
                        </p> */}
                        <p>{getLoc("homepage_about_5")}</p>
                        {user && 
                            <Button variant="primary"
                                onClick={routeChange}>
                                {getLoc("homepage_create_project")}
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