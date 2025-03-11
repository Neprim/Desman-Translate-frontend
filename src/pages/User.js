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
import { getLoc } from "../Translation";


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
            let projects = (await fetchUser(user.id, true)).projects || []
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
            if (!user.about) {
                user.about = getLoc("userpage_about_nothing")
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
                avatar_url: document.getElementById("settings-user-avatar").value,
            })

            await ReAuth()
            setUser(user)

            window.location.reload()
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
            <title>{user?.username || getLoc("userpage_title")}</title>

            <Container className="container mt-5">
                <h1 className="my-4">{user?.username}</h1>

                <Tabs
                    defaultActiveKey="user"
                    id="project-id-tabs"
                    className="mb-3">
                    <Tab eventKey="user" title={getLoc("userpage_user_tab")}>

                        <Row>
                            <Col md={5} className="border rounded ms-2 p-2">
                                <img src={user?.avatar_url || placeholder} height={200} width={200} alt="project cover" style={{ float: 'left'}} className="border rounded me-3 p-2" />
                                <h2>{user?.username}</h2>
                                {gotUser &&
                                    <h4>{flagCurrentUser ? getLoc("userpage_about_you") : getLoc("userpage_about_user")}</h4>
                                }
                                <p>{user?.about}</p>
                            </Col>
                            <Col className="p-3 mx-3">
                                <h2 style={{ marginBottom: '20px' }}>{getLoc("userpage_user_projects")}</h2>
                                { flagCurrentUser &&
                                    <Button variant="primary" style={{ marginTop: '0px', marginBottom: '5px' }} onClick={routeChange}>{getLoc("userpage_create_project")}</Button>
                                }
                                <div className="container text-left" style={{ paddingBottom: '10px' }}>
                                    {projects.map((project, i) =>
                                        <Row className="border rounded py-3 align-items-center" style={{ marginTop: '5px' }} key={project.id}>
                                        <Col className="text-left">
                                            <strong>
                                                <Link className="link-primary" to={"/projects/" + project.id}>{project.name}</Link>
                                            </strong>
                                            <br /> {getLoc("userpage_project_role")}: {project.user_role && getLoc("role_" + project.user_role)}
                                        </Col>
                                    </Row>
                                    )}
                                </div>
                            </Col>
                        </Row>
                    </Tab>
                    { flagCurrentUser &&
                    <Tab eventKey="settings" title={getLoc("userpage_settings_tab")}>
                        <h3 style={{ marginTop: '20px', marginBottom: '20px' }}>{getLoc("userpage_user_settings")}</h3>
                        <div id="settings-user" className="border rounded py-3" style={{ padding: '0px 20px', marginBottom: '10px' }}>
                            <form className="row">
                            </form>
                            <form>
                                <label htmlFor="settings-user-about" className="form-label" style={{ marginTop: '10px' }}>{getLoc("userpage_description")}</label>
                                <textarea className="form-control" aria-label="With textarea" id="settings-user-about" maxLength={1000} placeholder={getLoc("userpage_desc_placeholder")} defaultValue={cur_user.about} />
                                <label htmlFor="settings-user-avatar" className="form-label" style={{ marginTop: '10px' }}>{getLoc("userpage_avatar_link")}</label>
                                <input type="text" className="form-control" id="settings-user-avatar" defaultValue={cur_user?.avatar_url} maxLength={1000} />
                                <label htmlFor="settings-user-gender" className="form-label" style={{ marginTop: '10px' }}>{getLoc("userpage_gender")}</label>
                                <select className="form-select" defaultValue={cur_user.gender || "hidden"} id="settings-user-gender">
                                    <option value="hidden">{getLoc("userpage_gender_hidden")}</option>
                                    <option value="male">{getLoc("userpage_gender_male")}</option>
                                    <option value="female">{getLoc("userpage_gender_female")}</option>
                                </select>
                            </form>
                            <button className="btn btn-primary" type="submit" style={{ marginTop: '20px' }} onClick={SubmitChanges}>{getLoc("userpage_save")}</button>
                        </div>
                    </Tab>
                    }
                </Tabs>
            </Container>
            <Footer />
        </>
    );
}