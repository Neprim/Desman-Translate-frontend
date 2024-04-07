import Header from "./Header";
import Footer from "./Footer";
import { Link } from "react-router-dom";

import { useState } from "react"
// import { AuthContext } from "../AuthContext";
import { fetchProjects } from "../APIController";

import Row from "react-bootstrap/Row"
import Col from "react-bootstrap/Col"
import Container from "react-bootstrap/Container"
import placeholder from "../images/placeholder.png"

function Search() {
    // const { user } = useContext(AuthContext);

    const [projects, setProjects] = useState(null);

    // const link = useParams()

    async function FindProjects(project_name) {
        if (!project_name)
            return

        try {
            let projects = await fetchProjects({
                name: project_name
            })
            setProjects(projects)
        } catch (err) {
            console.log(err)
        }
    }

    return (
        <>
            <Header />
            <Container style={{ marginTop: 20, paddingRight: "5%" }}>
                <label htmlFor="settings-name" className="form-label" style={{ marginTop: '10px' }}>Название</label>
                <input type="text" className="form-control" id="settings-name" maxLength={100} onChange={(e) => {FindProjects(e.target.value)}} />
                { projects &&
                    <>
                    <h2 style={{ marginTop: 20 }}>Результаты поиска:</h2>
                    {projects.map((project, i) =>
                        <Container className="text-left" style={{ paddingBottom: 10 }} key={project.id}>
                            <Row className="border rounded py-3 align-items-center"
                                style={{ marginTop: 5 }}
                            >
                                <Col sm={2} xs={5}>
                                    <img
                                        width={60}
                                        height={60}
                                        src={placeholder}
                                        alt="thumbnail"
                                        style={{ marginRight: 10 }}
                                    />
                                </Col>
                                <Col className="text-left">
                                    <Link to={"/projects/" + project.handle} className="link-primary">
                                        {project.name}
                                    </Link>
                                    <br /> {project.description}
                                </Col>
                            </Row>
                        </Container>
                    )}
                    </>
                }
            </Container>
            <Footer />
        </>
    );
}

export default Search;