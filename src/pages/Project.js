import { Link, useParams } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import Button from "react-bootstrap/Button";
import placeholder from "../images/placeholder.png";

import { useEffect, useState, useContext } from "react"
import { AuthContext } from "../AuthContext";
import { fetchProject, fetchSections, fetchSomeAPI, fetchUser, fetchMembers, fetchProjectInvites } from "../APIController";
import { ProgressBar } from "react-bootstrap";
import { FaRegTrashAlt } from "react-icons/fa"

function Project(props) {

    const { user } = useContext(AuthContext);

    const [project, setProject] = useState(null);
    const [members, setMembers] = useState([]);
    const [sections, setSections] = useState([]);
    const [roles, setRoles] = useState([]);
    const [invites, setInvites] = useState([]);
    const [userRole, setUserRole] = useState(null);

    const [fieldInviteUser, setFieldInviteUser] = useState([]);

    const fieldInviteUserChange = event => setFieldInviteUser(event.target.value);

    const link = useParams()

    async function GetProject() {
        try {
            let project = await fetchProject(link["project_id"], true, true, true)
            project.statistics.completeness = project.statistics.strings_amount ? project.statistics.translated_strings_amount / project.statistics.strings_amount * 100 : 0
            project.statistics.completeness = Math.floor(project.statistics.completeness * 100) / 100
            setProject(project)
            setMembers(project.members)
            setRoles(project.roles)
        } catch (err) {
            console.log(err)
            if (err.status == 404) {
                window.location.href = "/404"
            }
        }
    }

    async function GetSections() {
        try {
            let sections = await fetchSections(link["project_id"], true)
            for (let sec of sections) {
                sec.statistics.completeness = sec.statistics.strings_amount ? sec.statistics.translated_strings_amount / sec.statistics.strings_amount * 100 : 0
                sec.statistics.completeness = Math.floor(sec.statistics.completeness * 100) / 100
            }
            setSections(sections)
        } catch (err) {

        }
    }

    async function GetUserRole() {
        if (!user)
            return
        if (!members)
            return

        const member = members.find(member => member.user.id == user.id)
        if (!member) {
            setUserRole(null)
            return
        }

        setUserRole(roles[member.role_id])
    }

    async function SendInvite() {
        if (fieldInviteUser == "")
            return
        
        try {
            const user = await fetchUser(fieldInviteUser)
            await fetchSomeAPI(`/api/projects/${project.id}/invites`, "POST", { user_id: user.id })
            await GetInvites()
        } catch (err) {
            // TODO
            // В зависимости от типа ошибки выводить то-то то-то на экране
            console.log(err)
        }
    }

    async function KickMember(user_id) {
        try {
            await fetchSomeAPI(`/api/projects/${link["project_id"]}/members/${user_id}`, "DELETE")
            const members = await fetchMembers(link["project_id"])
            setMembers(members)
        } catch (err) {
            console.log(err)
            // По идее, тут ошибок со стороны сервера быть не должно.
        }
    }

    async function DeleteInvite(invite_id) {
        try {
            await fetchSomeAPI(`/api/projects/${link["project_id"]}/invites/${invite_id}`, "DELETE")
            await GetInvites()
        } catch (err) {
            console.log(err)
        }
    }

    async function GetInvites() {
        if (!project)
            return

        if (!userRole?.permissions?.can_manage_members)
            return

        try {
            const invites = await fetchProjectInvites(project.id)
            setInvites(invites)
        } catch (err) {
            console.log(err)
        }
    }

    useEffect(() => {
        GetProject();
    }, []);

    useEffect(() => {
        GetUserRole();
    }, [project, user]);

    useEffect(() => {
        GetSections();
    }, []);

    useEffect(() => {
        GetInvites();
    }, [userRole, project]);

    // TODO
    // Поменять всё на ref вместо getElementById
    async function SubmitChanges() {
        try {
            await fetchSomeAPI(`/api/projects/${project.id}`, "PATCH", {
                name:           document.getElementById("settings-name").value,
                handle:         document.getElementById("settings-handle").value,
                description:    document.getElementById("settings-description").value,
                source_lang:    document.getElementById("settings-source-lang").value,
                target_lang:    document.getElementById("settings-target-lang").value,
            })
            GetProject()
        } catch (err) {
            console.log(err)
        }
    }

    async function AddChapter() {
        try {
            await fetchSomeAPI(`/api/projects/${project.id}/sections`, "POST", {
                name: document.getElementById("inputSectionName").value
            })
            GetSections()
            document.getElementById('divAddChapter').hidden = true
        } catch (err) {
            console.log(err)
        }
    }

    async function DeleteSection(section_id) {
        try {
            await fetchSomeAPI(`/api/projects/${project.id}/sections/${section_id}`, "DELETE")
            GetSections()
        } catch (err) {
            console.log(err)
        }
    }
    
    return (
        <>
            <Navbar />
            <div className="container" style={{ marginTop: 50 }}>
                <h1 style={{ marginTop: '20px', marginBottom: '20px' }}>{project?.name}</h1>
                <Tabs
                    defaultActiveKey="project"
                    id="project-id-tabs"
                    className="mb-3"
                >
                    <Tab eventKey="project" title="Проект">
                        <div className="row">
                            <div className="col-7">
                                <img src={placeholder} height={250} alt="project cover" style={{ float: 'left', padding: '10px', margin: '10px 10px 0px 0px' }} className="border rounded" />
                                <h3>Описание проекта</h3>
                                <p>{project?.description}</p>
                            </div>
                            {project &&
                                <div className="col border-top border-start rounded py-3" style={{ marginTop: '5px', marginLeft: '0px', marginRight: '20px', paddingLeft: '20px' }}>
                                    <h3 className="py-2 border-bottom" style={{ marginTop: '-10px' }}>Информация</h3>
                                    <div className="py-2 border-bottom" style={{ marginTop: '-8px' }}><b>Язык оригинала:</b> {project?.source_lang}</div>
                                    <div className="py-2 border-bottom" style={{ marginTop: '-8px' }}><b>Язык перевода:</b> {project?.target_lang}</div>
                                    <div className="py-2 border-bottom"><b>Дата создания:</b> {project?.created_at?.toLocaleString()}</div>
                                    <div className="py-2 border-bottom"><b>Статус:</b> {project?.status}</div>
                                    <div className="py-2 border-bottom"><b>Прогресс: {project.statistics.completeness}%</b>
                                        <div className="progress-stacked" style={{ margin: '10px 0px 5px 0px' }}>
                                            {/* <ProgressBar className="progress" style={{ width: '100%' }} aria-valuenow={100} aria-valuemin={0} aria-valuemax={100}>
                                                <div className="progress-bar progress-bar-striped progress-bar-animated bg-success">40%</div>
                                            </ProgressBar> */}
                                            <ProgressBar className="progress" striped animated label={`${project.statistics.completeness}%`} style={{ width: project.statistics.completeness + '%' }} aria-valuenow={project.statistics.completeness} aria-valuemin={0} aria-valuemax={100}/>
                                        </div>
                                    </div>
                                    { userRole &&
                                    <div className="py-2 border-bottom"><b>Ваша роль:</b> {userRole?.name}</div>
                                    }
                                </div>
                            }
                        </div>
                        <h2>Разделы</h2>
                        {userRole?.permissions?.can_manage_sections && 
                        <Button type="submit" variant="primary" onClick={(e) => document.getElementById('divAddChapter').hidden = false} >Добавить раздел</Button>
                        }
                        <table className="table table-striped">
                            <thead>
                                <tr>
                                    <th scope="col">№</th>
                                    <th scope="col">Название</th>
                                    <th scope="col">Прогресс</th>
                                    <th scope="col">Скачать</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sections.map((section, index) =>
                                    <tr key={section.id}>
                                        <th scope="row">{index + 1}</th>
                                        <td>
                                            <Link to={`/projects/${project.id}/sections/${section.id}/editor`} className="link-primary">
                                                {section.name}
                                            </Link>
                                        </td>
                                        {section.statistics.strings_amount > 0
                                            ?   <td>{section.statistics.translated_strings_amount} / {section.statistics.strings_amount} ({section.statistics.completeness}%)</td>
                                            :   <td>
                                                    <Link to={`/projects/${project.id}/sections/${section.id}/load`} className="link-primary">
                                                        Загрузить строки
                                                    </Link>
                                                </td>
                                        }
                                        <td>Оригинал / Переведено</td>
                                        {userRole?.permissions?.can_manage_sections && 
                                            <td><Button variant="danger" style={{ marginLeft: "10px" }} onClick={(e) => DeleteSection(section.id)}><FaRegTrashAlt style={{ marginBottom: "3px" }} /></Button></td>
                                        }
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        <div className="mb-3" id="divAddChapter" hidden>
                            <input
                                type="text"
                                className="form-control"
                                id="inputSectionName"
                                placeholder="Название главы"
                            />
                            <Button type="submit" variant="primary" onClick={AddChapter}>
                                Добавить
                            </Button>
                            <Button type="cancel" variant="outline-secondary" onClick={(e) => e.target.closest("div").hidden = true}>
                                Отмена
                            </Button>
                        </div>
                    </Tab>
                    <Tab eventKey="members" title="Участники">
                        <div className="row">
                            <div className="col-8">
                                <h2>Участники перевода</h2>
                                <table className="table table-striped align-items-center">
                                    <thead>
                                        <tr>
                                            <th scope="col">№</th>
                                            <th scope="col">Пользователь</th>
                                            <th scope="col">Роль</th>
                                            <th scope="col">Рейтинг</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {members.map((member, index) =>
                                            <tr key={member.user.id}>
                                                <th scope="row">{index + 1}</th>
                                                <td>{member.user.username}</td>
                                                <td>{roles[member.role_id].name}</td>
                                                <td>0</td>
                                                {!roles[member.role_id].permissions.can_manage_members && userRole?.permissions?.can_manage_members &&
                                                    <td style={{ display: 'inline-flexbox' }}><button type="button" className="btn btn-outline-danger" style={{ padding: '0px 5px' }} onClick={ function (e) { KickMember(member.user.id) } }>Исключить</button></td>
                                                }
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                                {invites.length > 0 &&
                                <>
                                    <h2>Приглашённые</h2>
                                    <table className="table table-striped align-items-center">
                                        <thead>
                                            <tr>
                                                <th scope="col">№</th>
                                                <th scope="col">Пользователь</th>
                                                <th scope="col">Приглашён</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                        {invites.map((invite, index) =>
                                            // Соня, сделай список приглашений красиво
                                            <tr key={invite.user.id}>
                                                <th scope="row">{index + 1}</th>
                                                <td>{invite.user.username}</td>
                                                <td>{invite.inviter.username}</td>
                                                {userRole?.permissions?.can_manage_members &&
                                                    <td style={{ display: 'inline-flexbox' }}><button type="button" className="btn btn-outline-danger" style={{ padding: '0px 5px' }} onClick={ function (e) { DeleteInvite(invite.id) } }>Отменить</button></td>
                                                }
                                            </tr>
                                            )
                                        }
                                        </tbody>
                                    </table>
                                </>
                                }
                            </div>
                            {userRole?.permissions?.can_manage_members &&
                            <div className="col border-top border-start rounded py-3" style={{ marginTop: '5px', marginLeft: '0px', marginRight: '20px', paddingLeft: '20px' }}>
                                <h3 className="py-2 border-bottom" style={{ marginTop: '-5px' }}>Пригласить участника</h3>
                                <form style={{ marginTop: '10px' }}>
                                    <input className="form-control" placeholder="Введите ник пользователя" aria-label="Invite" onChange={fieldInviteUserChange} />
                                </form>
                                <button type="button" className="btn btn-primary" style={{ marginTop: '10px', marginBottom: '5px' }} onClick={function (e) { SendInvite() }}>Пригласить</button>
                            </div>
                            }
                        </div>
                    </Tab>
                    {userRole?.permissions?.can_manage_project &&
                        <Tab eventKey="settings" title="Настройки">
                            <h2 style={{ marginTop: '20px', marginBottom: '20px' }}>Настройки проекта</h2>
                            <div className="row">
                                <div className="border rounded py-3" style={{ padding: '0px 20px', margin: '0px 20px' }}>
                                    <form className="row">
                                        <label htmlFor="settings-handle" className="form-label">Уникальная ссылка</label>
                                        <div className="col-3">
                                            <input type="text" className="form-control" id="settings-handle" minLength={4} maxLength={100} defaultValue={project.handle}/>
                                        </div>
                                        {/* <div className="col">
                                            <button className="btn btn-primary" type="submit">Применить</button>
                                        </div> */}
                                    </form>
                                    <form>
                                        <label htmlFor="settings-name" className="form-label" style={{ marginTop: '10px' }}>Название проекта</label>
                                        <input type="text" className="form-control" id="settings-name" defaultValue={project.name} minLength={4} maxLength={100} />
                                        <label htmlFor="settings-description" className="form-label" style={{ marginTop: '10px' }}>Описание проекта</label>
                                        <textarea className="form-control" aria-label="With textarea" id="settings-description" maxLength={1000} defaultValue={project.description} />
                                        {/* <label htmlFor="settings-logo" className="form-label" style={{ marginTop: '10px' }}>Сменить обложку</label>
                                        <input type="file" className="form-control" id="settings-logo" accept="image/png, image/jpeg" aria-describedby="logo-desc" />
                                        <div id="logo-desc" className="form-text">Принимаются картинки в формате png и jpeg.</div> */}
                                        {/* <label htmlFor="settings-author" className="form-label" style={{ marginTop: '10px' }}>Владелец проекта</label>
                                        <input type="text" className="form-control" id="settings-author" defaultValue="Нынешний владелец" /> */}
                                        <label htmlFor="settings-source-lang" className="form-label" style={{ marginTop: '10px' }}>Язык оригинала</label>
                                        <select className="form-select" defaultValue={project.source_lang} id="settings-source-lang">
                                            <option value="ru">русский</option>
                                            <option value="en">английский</option>
                                            <option value="de">немецкий</option>
                                            <option value="fr">французский</option>
                                        </select>
                                        <label htmlFor="settings-target-lang" className="form-label" style={{ marginTop: '10px' }}>Язык перевода</label>
                                        <select className="form-select" defaultValue={project.target_lang} id="settings-target-lang">
                                            <option value="ru">русский</option>
                                            <option value="en">английский</option>
                                            <option value="de">немецкий</option>
                                            <option value="fr">французский</option>
                                        </select>
                                        { // Надо сделать нормальные рабочие кнопочки выбора
                                        /* <label htmlFor="settings-access" className="form-label" style={{ marginTop: '10px' }}>Видимость проекта</label>
                                        <div className="form-check">
                                            <input type="radio" name="radios" className="form-check-input" id="settings-access-private" value="private" defaultChecked />
                                            <label className="form-check-label" htmlFor="settings-access-private">Приватный проект</label>
                                        </div>
                                        <div className="form-check">
                                            <input type="radio" name="radios" className="form-check-input" id="settings-access-public" value="public" />
                                            <label className="form-check-label" htmlFor="settings-access-public">Публичный проект</label>
                                        </div> */}
                                        {/* <label htmlFor="settings-category" className="form-label" style={{ marginTop: '10px' }}>Категория</label>
                                        <select className="form-select" defaultValue="none" id="settings-category" aria-describedby="category-desc">
                                            <option value="none">Не выбрано</option>
                                            <option value="movie">Фильмы</option>
                                            <option value="text">Тексты</option>
                                            <option value="program">Программы</option>
                                        </select>
                                        <div id="category-desc" className="form-text">* Если вы выбрали категорию, и ваш проект публичный,
                                            он будет отображаться в соответствующей категории во вкладке "Публичные переводы".
                                            Приватные проекты не будут отображаться в этой вкладке вне зависимости от категории.
                                        </div>
                                        <label htmlFor="settings-status" className="form-label" style={{ marginTop: '10px' }}>Статус</label>
                                        <div className="form-check">
                                            <input type="radio" name="radios" className="form-check-input" id="settings-status-opened" defaultValue="opened" defaultChecked />
                                            <label className="form-check-label" htmlFor="settings-status-opened">Проект открыт</label>
                                        </div>
                                        <div className="form-check">
                                            <input type="radio" name="radios" className="form-check-input" id="settings-status-frozen" defaultValue="frozen" />
                                            <label className="form-check-label" htmlFor="settings-status-frozen">Проект заморожен</label>
                                        </div>
                                        <div className="form-check">
                                            <input type="radio" name="radios" className="form-check-input" id="settings-status-closed" defaultValue="closed" />
                                            <label className="form-check-label" htmlFor="settings-status-closed">Проект закрыт</label>
                                        </div>
                                        <div id="status-desc" className="form-text">* Статус проекта отображается на странице проекта. Вы можете пометить проект как замороженный, чтобы обозначить,
                                            что временно не будете над ним работать, или как закрытый, если работа завершена и не будет продолжаться.
                                        </div> */}
                                    </form>
                                    <button className="btn btn-primary" type="submit" style={{ marginTop: '20px' }} onClick={SubmitChanges}>Применить</button>
                                </div>
                            </div>
                        </Tab>
                    }
                </Tabs>
            </div>
            <Footer />
        </>
    );
}

export default Project;
