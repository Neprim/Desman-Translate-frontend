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
import { getLoc } from "../Translation";

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
            for (let project of projects) {
                if (project.stats) {
                    project.stats.completeness = project.stats.strings_amount ? project.stats.strings_translated / project.stats.strings_amount * 100 : 0
                    project.stats.completeness = Math.floor(project.stats.completeness * 100) / 100
                }
            }
            setProjects(projects)
        } catch (err) {
            console.log(err)
        }
    }

    return (
        <>
            <Header />
            <title>{getLoc("search_title")}</title>
            <Container style={{ marginTop: 20, paddingRight: "5%" }}>
                <label htmlFor="settings-name" className="form-label" style={{ marginTop: '10px' }}>{getLoc("search_name")}</label>
                <input type="text" className="form-control" id="settings-name" maxLength={100} onChange={(e) => {FindProjects(e.target.value)}} />
                { projects &&
                    <>
                    <h2 style={{ marginTop: 20 }}>{getLoc("search_results")}:</h2>
                    {projects.map((project, i) =>
                        <Container className="text-left" style={{ paddingBottom: 10 }} key={project.id}>
                            <Row className="border rounded py-3 align-items-center"
                                style={{ marginTop: 5 }}
                            >
                                <Col sm={2} xs={5}>
                                    <img
                                        width={60}
                                        height={60}
                                        src={project?.cover_url || placeholder}
                                        alt="thumbnail"
                                        style={{ marginRight: 10 }}
                                    />
                                </Col>
                                <Col className="text-left">
                                    <Link to={"/projects/" + project.handle} className="link-primary">
                                        {project.name}
                                    </Link>
                                    <br /> {project.description}
                                    {project.stats &&
                                        <div><b>{getLoc("project_project_completeness")}: {project?.stats?.completeness}%</b></div>
                                    }
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