import { Link } from "react-router-dom"
import Header from "./Header"
import Footer from "./Footer"
import Tab from 'react-bootstrap/Tab'
import Tabs from 'react-bootstrap/Tabs'
import placeholder from "../images/placeholder.png"
import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button'

import { useEffect, useState, useContext } from "react"
import { AuthContext } from "../AuthContext";
import { fetchSomeAPI, fetchUser, fetchUserInvites, fetchProject } from "../APIController"
import { openConnection } from "../WSController"
import { getLoc } from "../Translation"

function Projects() {

    const { user } = useContext(AuthContext);

    const [projects, setProjects] = useState([]);
    const [invites, setInvites] = useState([]);

    async function GetProjects() {
        if (!user)
            return

        try {
            let projects = (await fetchUser(user.id, true)).projects || []
            setProjects(projects)
            for (let project of projects) {
                project.user_role = getLoc("role_" + (await fetchSomeAPI(`/api/projects/${project.id}/members/${user.id}`)).role_name)
            }
            setProjects([...projects])
        } catch (err) {
            console.log(err)
        }
    }

    async function GetInvites() {
        try {
            let invites = await fetchUserInvites() || []
            setInvites(invites)
        } catch (err) {
            console.log(err)
        }
    }

    async function ProcessInvitation(invite_id, is_accepted) {
        try {
            await fetchSomeAPI(`/api/invites/${invite_id}`, "POST", { "accept": is_accepted })
            await GetInvites()
            GetProjects()
        } catch (err) {
            console.log(err)
        }
    }

    // тут нужные штуки для всплывающего окна.
    const [show, setShow] = useState(false);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);  

    useEffect(() => {
        openConnection("/projects", async (mes) => {
            if (mes.type == "new_invite") {
                console.log(mes.data)
                // toast(`Приглашение от пользователя ${mes.data.inviter.username} в проект ${mes.data.project.name}`);
                // return (
                //       <Modal show={show} onHide={handleClose}>
                //         <Modal.Header closeButton>
                //           <Modal.Title>Приглашение</Modal.Title>
                //         </Modal.Header>
                //         <Modal.Body>Приглашение от пользователя ${mes.data.inviter.username} в проект ${mes.data.project.name}</Modal.Body>
                //         <Modal.Footer>
                //           <Button variant="secondary" onClick={handleClose}>
                //             Закрыть
                //           </Button>
                //           <Button variant="primary" onClick={handleClose}>
                //             Принять приглашение
                //           </Button>
                //         </Modal.Footer>
                //       </Modal>
                //   );
            }
        })
    }, [])

    useEffect(() => {
        GetProjects()
    }, [user]);

    useEffect(() => {
        GetInvites()
    }, [user]);

    return (
        <>
            <Header />

            <div className="container" style={{ marginTop: 50 }}>

                <Tabs
                    defaultActiveKey="my-projects"
                    id="projects-tabs"
                    className="mb-3"
                >
                    <Tab eventKey="my-projects" title={getLoc("my_projects_my_projects_tab")}>
                        <div className="row">
                            <div className="col-6">
                                <h2 style={{ marginBottom: 20 }}>{getLoc("my_projects_my_projects")}</h2>
                                <Link to="/create" 
                                    className="btn btn-primary"
                                    style={{ marginTop: 0, marginBottom: 5 }}>
                                    {getLoc("my_projects_create_project")}
                                </Link>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-6">
                                <div className="container text-left" style={{ paddingBottom: 10 }}>
                                    {projects.map((project, i) =>
                                        <div
                                            className="row border rounded py-3 align-items-center"
                                            style={{ marginTop: 5 }} 
                                            key={project.id}>
                                            <div className="col-auto">
                                                <img
                                                    width={60}
                                                    height={60}
                                                    src={project?.cover_url || placeholder}
                                                    alt="thumbnail"
                                                    style={{ marginRight: 10 }}
                                                />
                                            </div>
                                            <div className="col text-left">
                                                <b>
                                                    <a className="text-primary" href={"projects/" + project.handle}>
                                                        {project.name}
                                                    </a>
                                                </b>
                                                <br /> {project.user_role}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Tab>
                    <Tab eventKey="invitations" title={getLoc("my_projects_invites_tab")}>
                        <h2 style={{ marginBottom: 20 }}>{getLoc("my_projects_invites")}</h2>
                        <div className="row">
                            <div className="col-6">
                                {invites.map((invite, i) => 
                                    <div className="container text-left" style={{ paddingBottom: 10 }} key={invite.id}>
                                        <div
                                            className="row border rounded py-3 align-items-center"
                                            style={{ marginTop: 5 }}
                                        >
                                            <div className="col-auto">
                                                <img
                                                    width={60}
                                                    height={60}
                                                    src={invite.project?.cover_url || placeholder}
                                                    alt="thumbnail"
                                                    style={{ marginRight: 10 }}
                                                />
                                            </div>
                                            <div className="col text-left">
                                                <a>
                                                    <b />
                                                </a>
                                                <b>
                                                    <a className="text-primary" href={`/projects/${invite.project.handle}`}>
                                                        {invite.project.name}
                                                    </a>
                                                </b>{" "}
                                                <br /> 
                                                {invite.inviter.id == invite.user.id
                                                    ? <>
                                                        {getLoc("my_projects_you_requested")}
                                                    </>
                                                    : <>
                                                        {getLoc("my_projects_you_invited")}{" "}
                                                        <a className="text-primary" href={`/users/${invite.inviter.id}`}>
                                                            {invite.inviter.username}
                                                        </a>
                                                        .
                                                    </>
                                                }
                                            </div>
                                            <div className="col-auto">
                                                {invite.inviter.id == invite.user.id
                                                    ? <>
                                                        <button
                                                            type="button"
                                                            className="btn btn-danger"
                                                            style={{
                                                                padding: 5,
                                                                margin: 2,
                                                                marginLeft: 0,
                                                                width: "100%"
                                                            }}
                                                            onClick={function (e) { ProcessInvitation(invite.id, false) }}
                                                        >
                                                            {getLoc("my_projects_cancel")}
                                                        </button>
                                                    </>
                                                    : <>
                                                        <button
                                                            type="button"
                                                            className="btn btn-success"
                                                            style={{
                                                                padding: 5,
                                                                margin: 2,
                                                                marginLeft: 0,
                                                                width: "100%"
                                                            }}
                                                            onClick={function (e) { ProcessInvitation(invite.id, true) }}
                                                        >
                                                            {getLoc("my_projects_accept")}
                                                        </button>
                                                        <br />
                                                        <button
                                                            type="button"
                                                            className="btn btn-danger"
                                                            style={{
                                                                padding: 5,
                                                                margin: 2,
                                                                marginLeft: 0,
                                                                width: "100%"
                                                            }}
                                                            onClick={function (e) { ProcessInvitation(invite.id, false) }}
                                                        >
                                                            {getLoc("my_projects_cancel")}
                                                        </button>
                                                    </>
                                                }
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Tab>
                </Tabs>
            </div>
            <Footer />
        </>
    );
}

export default Projects;